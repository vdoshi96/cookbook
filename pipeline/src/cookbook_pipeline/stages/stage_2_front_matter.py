"""Stage 2 — extract introduction, history, ayurveda, regions overview, and notes.

These live in a fixed page range at the front of the book. The exact ranges are
captured here as constants. When running on a slightly different edition,
update the ranges.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import INTRO_EXTRACTION_SYSTEM, intro_user_message

# (start_page, end_page, key)
FRONT_MATTER_RANGES: list[tuple[int, int, str]] = [
    (9, 9, "introduction"),
    (10, 11, "history"),
    (12, 13, "ayurveda"),
    (14, 17, "regions_overview"),
    (18, 19, "notes_on_recipes"),
]


def extract_front_matter(
    pages_dir: Path,
    page_images_dir: Path,
    output_path: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> dict:
    client = client or get_client()
    out: dict = {"schema_version": 1}
    for start, end, key in FRONT_MATTER_RANGES:
        text = "\n\n".join(
            (pages_dir / f"page-{p:04d}.txt").read_text() for p in range(start, end + 1)
        )
        # Use the first page's image as the visual reference
        img_path = page_images_dir / f"page-{start:04d}.png"
        img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        parsed = call_with_retry(
            client,
            model=model,
            system=INTRO_EXTRACTION_SYSTEM,
            messages=intro_user_message(text, img_b64),
            max_tokens=4096,
        )
        section = {"title": parsed["title"], "markdown": parsed["markdown"]}
        if key == "regions_overview":
            section["map_image"] = None
        out[key] = section
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(out, indent=2))
    return out
