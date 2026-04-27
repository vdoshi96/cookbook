"""Stage 6 — extract the prose intro on each chapter-opener page.

A chapter opener is a page whose footer matches a section name but whose body
contains no recipe-block markers (no "Origin "). For each such page, run the
same intro_user_message prompt as Stage 2.
"""

from __future__ import annotations

import base64
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import INTRO_EXTRACTION_SYSTEM, intro_user_message
from cookbook_pipeline.stages.stage_3_segment import segment_page


def extract_section_intros(
    sections: list[dict],
    pages_dir: Path,
    page_images_dir: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> dict[str, str]:
    """Return {section_id: intro_markdown}. Skips sections with no opener page."""
    client = client or get_client()
    intros: dict[str, str] = {}
    for sec in sections:
        lo = sec["page_range"][0]
        # Check the single candidate page `lo - 1` (or `lo` when the section
        # starts on page 1). A chapter opener is a page whose section
        # detection matched but which has no recipe blocks.
        candidate = lo - 1 if lo > 1 else lo
        text_path = pages_dir / f"page-{candidate:04d}.txt"
        img_path = page_images_dir / f"page-{candidate:04d}.png"
        if not text_path.exists() or not img_path.exists():
            continue
        text = text_path.read_text()
        if segment_page(text, candidate):
            continue  # not an opener
        img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        parsed = call_with_retry(
            client,
            model=model,
            system=INTRO_EXTRACTION_SYSTEM,
            messages=intro_user_message(text, img_b64),
            max_tokens=4096,
        )
        intros[sec["id"]] = parsed["markdown"]
    return intros


def extract_region_intros(
    front_matter: dict, regions: list[str]
) -> dict[str, str]:
    """Slice region intros out of the front_matter `regions_overview.markdown`.

    The regions overview is a single Markdown blob with H2/H3 headers per
    region. We split on `## RegionName` headers.
    """
    body = front_matter["regions_overview"]["markdown"]
    intros: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []
    for line in body.splitlines():
        m = line.strip()
        if m.startswith("## "):
            if current:
                intros[current] = "\n".join(buf).strip()
            current = m.removeprefix("## ").strip()
            buf = []
        else:
            buf.append(line)
    if current:
        intros[current] = "\n".join(buf).strip()
    # Filter to only regions we care about
    return {k: v for k, v in intros.items() if k in regions}
