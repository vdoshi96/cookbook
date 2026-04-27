"""Stage 1 — detect chapter boundaries from page footers.

Each non-front-matter page in the book has a footer of the form:

    <SECTION NAME IN ALL CAPS>
    <page number>

We walk the page text dumps in order and group consecutive pages by section.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from cookbook_pipeline.utils.text import slugify

# A section-name footer: ALL CAPS line of letters and ampersands, length 4..40
# Leading whitespace is allowed because pdftotext -layout may indent the footer.
_FOOTER_LINE = re.compile(r"^\s*([A-Z][A-Z &]{2,40}[A-Z])\s*$", re.MULTILINE)


def extract_section_name(page_text: str) -> str | None:
    """Return the section name from a page's footer in title case, or None."""
    candidates = _FOOTER_LINE.findall(page_text)
    if not candidates:
        return None
    # The footer is always near the bottom; pick the LAST match.
    raw = candidates[-1]
    # Title-case, but keep "and" lowercase
    words = raw.lower().split()
    fixed = [w if w in ("and", "&") else w.capitalize() for w in words]
    return " ".join(fixed).replace(" And ", " and ")


def detect_sections(pages_dir: Path) -> list[dict]:
    """Group consecutive pages with the same section into ranges."""
    page_files = sorted(pages_dir.glob("page-*.txt"))
    out: list[dict] = []
    current: dict | None = None
    for pf in page_files:
        page_num = int(pf.stem.split("-")[1])
        section = extract_section_name(pf.read_text())
        if section is None:
            # Front matter or chapter opener; close any current run.
            if current is not None:
                out.append(current)
                current = None
            continue
        if current is not None and current["name"] == section:
            current["page_range"] = (current["page_range"][0], page_num)
        else:
            if current is not None:
                out.append(current)
            current = {
                "id": slugify(section),
                "name": section,
                "page_range": (page_num, page_num),
            }
    if current is not None:
        out.append(current)
    return out


def write_sections_raw(pages_dir: Path, output_path: Path) -> None:
    """Run section detection and write to disk."""
    sections = detect_sections(pages_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(sections, indent=2))
