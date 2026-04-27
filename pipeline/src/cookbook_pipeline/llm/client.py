"""Thin wrapper over the Anthropic SDK.

Adds:
- prompt caching on the system message (5-minute TTL is enough for a single
  pipeline run)
- JSON response parsing with markdown fence stripping
- retry on invalid JSON
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any

from anthropic import Anthropic

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def get_client() -> Anthropic:
    """Return an Anthropic client. Reads ANTHROPIC_API_KEY from env."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY not set. Put it in pipeline/.env or export it."
        )
    return Anthropic(api_key=key)


def parse_json_response(text: str) -> Any:
    """Extract a JSON object from a model response.

    Accepts: bare JSON, JSON inside a ```json fence, JSON inside a generic ```
    fence, or JSON preceded/followed by prose.
    """
    text = text.strip()
    # ```json ... ``` fence
    fence = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.DOTALL)
    if fence:
        return json.loads(fence.group(1))
    # First top-level object/array
    if text.startswith("{") or text.startswith("["):
        return json.loads(text)
    # Try to find the first { ... } in the string with brace matching
    start = text.find("{")
    if start == -1:
        raise ValueError(f"No JSON found in response: {text[:200]}")
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError(f"Unterminated JSON in response: {text[:200]}")


def call_with_retry(
    client: Anthropic,
    *,
    model: str,
    system: str,
    messages: list[dict],
    max_attempts: int = 3,
    cache_system: bool = True,
    max_tokens: int = 2048,
) -> Any:
    """Call the Claude API and return the parsed JSON response.

    Retries on invalid JSON up to `max_attempts` times. On final failure
    raises ValueError with the last raw response.
    """
    last_error: Exception | None = None
    last_text: str = ""
    system_block = (
        [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]
        if cache_system
        else system
    )
    for attempt in range(max_attempts):
        msg = client.messages.create(
            model=model,
            system=system_block,
            messages=messages,
            max_tokens=max_tokens,
        )
        last_text = "".join(getattr(b, "text", "") for b in msg.content)
        try:
            return parse_json_response(last_text)
        except (ValueError, json.JSONDecodeError) as e:
            last_error = e
            time.sleep(0.5 * (attempt + 1))
    raise ValueError(
        f"Failed to get valid JSON after {max_attempts} attempts. "
        f"Last response: {last_text[:300]}"
    ) from last_error
