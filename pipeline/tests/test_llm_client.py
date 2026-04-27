import json
from unittest.mock import MagicMock, patch

import anthropic
import httpx
import pytest

from cookbook_pipeline.llm.client import call_with_retry, parse_json_response


def _fake_message(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    msg.stop_reason = "end_turn"
    return msg


def _api_error(cls, status_code: int):
    """Build an anthropic API error with the given status code."""
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    response = httpx.Response(status_code, request=request)
    return cls(f"{cls.__name__}", response=response, body=None)


def test_parse_json_response_extracts_inline_json():
    raw = 'Here is the result:\n```json\n{"a": 1}\n```\nDone.'
    assert parse_json_response(raw) == {"a": 1}


def test_parse_json_response_bare_object():
    raw = '{"a": 1, "b": 2}'
    assert parse_json_response(raw) == {"a": 1, "b": 2}


def test_parse_json_response_invalid_raises():
    with pytest.raises(ValueError):
        parse_json_response("not json")


def test_call_with_retry_returns_on_success():
    client = MagicMock()
    client.messages.create.return_value = _fake_message('{"ok": true}')
    result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=3)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 1


def test_call_with_retry_retries_invalid_json_then_succeeds():
    client = MagicMock()
    client.messages.create.side_effect = [
        _fake_message("garbage"),
        _fake_message('{"ok": true}'),
    ]
    result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=3)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 2


def test_call_with_retry_gives_up():
    client = MagicMock()
    client.messages.create.return_value = _fake_message("garbage")
    with pytest.raises(ValueError):
        call_with_retry(client, model="m", system="s", messages=[], max_attempts=2)
    assert client.messages.create.call_count == 2


def test_call_with_retry_retries_on_rate_limit_then_succeeds():
    client = MagicMock()
    client.messages.create.side_effect = [
        _api_error(anthropic.RateLimitError, 429),
        _api_error(anthropic.RateLimitError, 429),
        _fake_message('{"ok": true}'),
    ]
    with patch("cookbook_pipeline.llm.client.time.sleep") as sleep:
        result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=5)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 3
    # Backoff is exponential: 1s, 2s before the successful third call.
    assert [c.args[0] for c in sleep.call_args_list] == [1, 2]


def test_call_with_retry_retries_on_transient_api_status_error():
    client = MagicMock()
    client.messages.create.side_effect = [
        _api_error(anthropic.APIStatusError, 529),  # overloaded
        _fake_message('{"ok": true}'),
    ]
    with patch("cookbook_pipeline.llm.client.time.sleep"):
        result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=5)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 2


def test_call_with_retry_does_not_retry_on_auth_error():
    client = MagicMock()
    auth_err = _api_error(anthropic.APIStatusError, 401)
    client.messages.create.side_effect = auth_err
    with patch("cookbook_pipeline.llm.client.time.sleep"):
        with pytest.raises(anthropic.APIStatusError):
            call_with_retry(client, model="m", system="s", messages=[], max_attempts=5)
    assert client.messages.create.call_count == 1


def test_call_with_retry_exhausts_rate_limit_retries():
    client = MagicMock()
    client.messages.create.side_effect = _api_error(anthropic.RateLimitError, 429)
    with patch("cookbook_pipeline.llm.client.time.sleep"):
        with pytest.raises(ValueError):
            call_with_retry(client, model="m", system="s", messages=[], max_attempts=3)
    assert client.messages.create.call_count == 3


def test_call_with_retry_default_max_attempts_is_at_least_5():
    """Exponential backoff needs room; default should be >=5."""
    import inspect

    sig = inspect.signature(call_with_retry)
    assert sig.parameters["max_attempts"].default >= 5
