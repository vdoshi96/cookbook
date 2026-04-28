"""Stage 2 — extract introduction, history, ayurveda, regions overview, and notes.

These live in a fixed page range at the front of the book. Page numbers vary
edition-to-edition; the constants below are calibrated to the Phaidon 2010
hardcover (ISBN 9780714859026) — verify by reading the actual pages and
checking that page N's content matches its assigned key.

The plan's original ranges (9, 10-11, 12-13, 14-17, 18-19) were off by
several pages for this edition: page 9 was a blank/imprint, the actual
Introduction starts at page 12, and Ayurveda content (one page, p14)
was being misclassified as regions_overview. These were corrected after
the first full run revealed the misalignment.
"""

from __future__ import annotations

import json
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.images import encode_image_for_api
from cookbook_pipeline.llm.prompts import INTRO_EXTRACTION_SYSTEM, intro_user_message

# (start_page, end_page, key)
#
# Calibrated to Phaidon 2010 hardcover. Pages 5-11 are imprint, TOC, and
# decorative spreads (mostly blank in pdftotext output). Page 30 is "How to
# Eat an Indian Meal" — useful prose but not currently in the FrontMatterFile
# schema, so we skip it. Page 32 is a chapter-end blank.
FRONT_MATTER_RANGES: list[tuple[int, int, str]] = [
    (12, 12, "introduction"),
    (13, 13, "history"),
    (14, 14, "ayurveda"),
    (15, 29, "regions_overview"),
    (31, 31, "notes_on_recipes"),
]

# Wide page ranges (regions_overview spans 15 pages) cannot fit in a single
# call's output token budget — the dense regional prose easily exceeds 8192
# tokens of output. We process each page individually and concatenate the
# resulting markdown blocks. The first page's title becomes the section title.
_PAGES_PER_CHUNK = 2  # process 1–2 pages per LLM call
_PAGE_MAX_TOKENS = 4096


def _extract_page_chunk(
    client: Anthropic,
    model: str,
    pages_dir: Path,
    page_images_dir: Path,
    chunk: list[int],
) -> dict:
    """Run the intro-extraction prompt on a small page chunk and return its parsed JSON."""
    text = "\n\n".join((pages_dir / f"page-{p:04d}.txt").read_text() for p in chunk)
    img_path = page_images_dir / f"page-{chunk[0]:04d}.png"
    media_type, img_b64 = encode_image_for_api(img_path)
    return call_with_retry(
        client,
        model=model,
        system=INTRO_EXTRACTION_SYSTEM,
        messages=intro_user_message(text, img_b64, media_type=media_type),
        max_tokens=_PAGE_MAX_TOKENS,
    )


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
        # Split the range into small chunks so no single call has to emit
        # more than ~4096 tokens of output. For typical 1-page ranges this
        # is just one call; for the 15-page regions_overview it's 7-8 calls.
        chunks: list[list[int]] = []
        cursor = start
        while cursor <= end:
            chunk_end = min(cursor + _PAGES_PER_CHUNK - 1, end)
            chunks.append(list(range(cursor, chunk_end + 1)))
            cursor = chunk_end + 1

        first_title: str | None = None
        markdown_pieces: list[str] = []
        for chunk in chunks:
            parsed = _extract_page_chunk(client, model, pages_dir, page_images_dir, chunk)
            piece = (parsed.get("markdown") or "").strip()
            if piece:
                markdown_pieces.append(piece)
            if first_title is None:
                first_title = parsed.get("title") or ""

        section: dict = {
            "title": first_title or "",
            "markdown": "\n\n".join(markdown_pieces),
        }
        if key == "regions_overview":
            section["map_image"] = None
        out[key] = section

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(out, indent=2))
    return out
