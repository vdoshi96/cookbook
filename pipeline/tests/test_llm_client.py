import json
from unittest.mock import MagicMock

import pytest

from cookbook_pipeline.llm.client import call_with_retry, parse_json_response


def _fake_message(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    msg.stop_reason = "end_turn"
    return msg


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
