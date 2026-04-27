"""Stage 3 — split a page into recipe blocks.

Anchor heuristic: each recipe contains the literal substring "Origin " somewhere
near its top, followed by "Preparation time", "Cooking time", "Serves". A page
typically has two recipes side-by-side. We split at "Origin" markers and
attach the preceding 1–2 lines as the title/subtitle.

Known limitation — two-column contamination:
    `pdftotext -layout` produces interleaved column text. The simple "walk back
    to the nearest blank line" heuristic in `_block_start` will sometimes return
    a position that is several lines INSIDE the previous (left-column) recipe.
    The right-column block ends up with a few leading lines of left-column
    content, and `title_hint` may be a left-column ingredient instead of the
    recipe title. This is acceptable: Stage 4 (LLM cleanup) reads `raw_text`
    and is robust to leading junk; it identifies the recipe by its "Origin"
    marker and structured header, not by `title_hint`. If pilot extraction
    quality is poor, revisit with column-aware segmentation (split lines on
    a column-position threshold, or use PyMuPDF's text-with-coordinates API).
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_ORIGIN_MARKER = re.compile(r"^.*\bOrigin\b\s+\S", re.MULTILINE)
_RECIPE_REQUIRED = ("Preparation time", "Cooking time", "Serves")


def segment_page(page_text: str, page_num: int) -> list[dict]:
    """Return a list of recipe blocks found on the page.

    Each block: {"page_num": int, "title_hint": str, "raw_text": str}
    """
    matches = list(_ORIGIN_MARKER.finditer(page_text))
    if not matches:
        return []

    blocks: list[dict] = []
    starts = [_block_start(page_text, m.start()) for m in matches]
    starts.append(len(page_text))  # sentinel for slicing

    for i, m in enumerate(matches):
        start = starts[i]
        end = starts[i + 1]
        raw = page_text[start:end].strip()
        if not all(req in raw for req in _RECIPE_REQUIRED):
            continue
        blocks.append({"page_num": page_num, "title_hint": _extract_title(raw), "raw_text": raw})
    return blocks


def _block_start(text: str, origin_pos: int) -> int:
    """Return the position of the first character of the block containing `origin_pos`.

    Walks backward from `origin_pos` to the nearest blank line (`\\n\\n`).
    """
    pos = origin_pos
    while pos > 0:
        pos -= 1
        if text[pos] == "\n" and pos > 0 and text[pos - 1] == "\n":
            return pos + 1
    return 0


def _extract_title(block: str) -> str:
    """Pull the first non-empty line of a block as a title hint."""
    for line in block.splitlines():
        s = line.strip()
        if s:
            return s
    return ""


def write_recipes_raw(
    pages_dir: Path, sections: list[dict], output_path: Path
) -> int:
    """Segment every page that belongs to a section and write the raw blocks."""
    blocks: list[dict] = []
    page_to_section = {}
    for sec in sections:
        lo, hi = sec["page_range"]
        for p in range(lo, hi + 1):
            page_to_section[p] = sec
    for pf in sorted(pages_dir.glob("page-*.txt")):
        page_num = int(pf.stem.split("-")[1])
        sec = page_to_section.get(page_num)
        if sec is None:
            continue
        for b in segment_page(pf.read_text(), page_num):
            b["section_id"] = sec["id"]
            b["section_name"] = sec["name"]
            blocks.append(b)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(blocks, indent=2))
    return len(blocks)
