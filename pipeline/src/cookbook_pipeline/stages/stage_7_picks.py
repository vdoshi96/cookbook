"""Stage 7 — curated "start here" picks per section, via Haiku."""

from __future__ import annotations

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import PICKS_SYSTEM, picks_user_message


def pick_starters_for_section(
    section_name: str,
    intro_markdown: str,
    section_recipes: list[dict],
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> list[dict]:
    """Return a list of {id, rationale} dicts (3–5 items)."""
    if len(section_recipes) <= 5:
        # Don't ask the model to "curate" tiny sections — return all recipes.
        return [
            {"id": r["id"], "rationale": "Featured in this short section."}
            for r in section_recipes
        ]
    client = client or get_client()
    parsed = call_with_retry(
        client,
        model=model,
        system=PICKS_SYSTEM,
        messages=picks_user_message(section_name, intro_markdown, section_recipes),
        max_tokens=1024,
    )
    valid_ids = {r["id"] for r in section_recipes}
    return [p for p in parsed["picks"] if p["id"] in valid_ids][:5]
