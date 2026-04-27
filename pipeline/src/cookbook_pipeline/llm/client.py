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

import anthropic
from anthropic import Anthropic
from dotenv import load_dotenv

# Anthropic status codes worth retrying. 429 is handled separately via
# RateLimitError. 500/503/529 are transient server-side conditions.
_TRANSIENT_STATUS_CODES = frozenset({500, 503, 529})

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def get_client() -> Anthropic:
    """Return an Anthropic client. Reads ANTHROPIC_API_KEY from env or pipeline/.env."""
    # Idempotent — repeated calls don't reread or override existing env vars.
    load_dotenv()
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
    model: str = DEFAULT_MODEL,
    system: str,
    messages: list[dict],
    max_attempts: int = 5,
    cache_system: bool = True,
    max_tokens: int = 2048,
) -> Any:
    """Call the Claude API and return the parsed JSON response.

    Retries on:
    - rate-limit errors (429) with exponential backoff (1, 2, 4, 8, ... seconds)
    - transient server errors (500/503/529) with exponential backoff
    - invalid JSON with linear backoff

    Non-retriable APIStatusErrors (auth, 4xx) propagate immediately.
    On exhaustion of JSON-parse retries, raises ValueError with the last response.
    On exhaustion of API-error retries, raises ValueError chained from the last error.
    """
    last_error: Exception | None = None
    last_text: str = ""
    system_block = (
        [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]
        if cache_system
        else system
    )
    for attempt in range(max_attempts):
        try:
            msg = client.messages.create(
                model=model,
                system=system_block,
                messages=messages,
                max_tokens=max_tokens,
            )
        except anthropic.RateLimitError as e:
            last_error = e
            time.sleep(2 ** attempt)
            continue
        except anthropic.APIStatusError as e:
            if e.status_code in _TRANSIENT_STATUS_CODES:
                last_error = e
                time.sleep(2 ** attempt)
                continue
            raise
        last_text = "".join(getattr(b, "text", "") for b in msg.content)
        try:
            return parse_json_response(last_text)
        except (ValueError, json.JSONDecodeError) as e:
            last_error = e
            time.sleep(0.5 * (attempt + 1))
    raise ValueError(
        f"Failed after {max_attempts} attempts. Last error: {last_error}. "
        f"Last response: {last_text[:300]}"
    ) from last_error
