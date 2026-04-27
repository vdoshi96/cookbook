"""Stage 1 — detect chapter boundaries from page footers.

Each non-front-matter page in the book has a footer of the form:

    <SECTION NAME IN ALL CAPS>
    <page number>

We walk the page text dumps in order and group consecutive pages by section.
"""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

from cookbook_pipeline.utils.text import slugify

# Canonical chapter names for *India Cookbook* (Pushpesh Pant, Phaidon 2010).
# OCR-detected names are fuzzy-matched against this list; non-matches are
# dropped as OCR noise (publisher imprints, author names, recipe titles
# the regex caught, etc.).
CANONICAL_CHAPTERS: list[str] = [
    "Introduction",
    "Spice Mixtures and Pastes",
    "Pickles, Chutneys and Raitas",
    "Snacks and Appetizers",
    "Main Dishes",
    "Pulses",
    "Breads",
    "Rice",
    "Desserts",
    "Drinks",
    "Guest Chefs",
    "Glossary",
    "Directory",
    "Index",
]

_CANONICAL_THRESHOLD = 0.7


def _canonicalize(detected: str) -> str | None:
    """Map a detected section name to its canonical form, or None on no match."""
    detected_low = detected.lower()
    best_ratio = 0.0
    best_match: str | None = None
    for canonical in CANONICAL_CHAPTERS:
        r = SequenceMatcher(None, detected_low, canonical.lower()).ratio()
        if r > best_ratio:
            best_ratio = r
            best_match = canonical
    return best_match if best_ratio >= _CANONICAL_THRESHOLD else None

# A section-name footer: ALL CAPS line of letters and ampersands, length 4..40
# Leading whitespace is allowed because pdftotext -layout may indent the footer.
_FOOTER_LINE = re.compile(r"^\s*([A-Z][A-Z &,]{2,40}[A-Z])[.,:;!?]?\s*$", re.MULTILINE)


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
    """Group consecutive pages with the same section into ranges.

    Pages with no detectable footer (front matter, chapter openers) are skipped
    without splitting the surrounding section. Adjacent runs with the same id
    are merged.
    """
    page_files = sorted(pages_dir.glob("page-*.txt"))
    raw: list[dict] = []
    current: dict | None = None
    for pf in page_files:
        page_num = int(pf.stem.split("-")[1])
        section = extract_section_name(pf.read_text())
        if section is None:
            if current is not None:
                raw.append(current)
                current = None
            continue
        if current is not None and current["name"] == section:
            current["page_range"] = (current["page_range"][0], page_num)
        else:
            if current is not None:
                raw.append(current)
            current = {
                "id": slugify(section),
                "name": section,
                "page_range": (page_num, page_num),
            }
    if current is not None:
        raw.append(current)

    # Merge adjacent runs that share the same id (chapter opener gaps)
    merged: list[dict] = []
    for entry in raw:
        if merged and merged[-1]["id"] == entry["id"]:
            merged[-1]["page_range"] = (
                merged[-1]["page_range"][0],
                entry["page_range"][1],
            )
        else:
            merged.append(entry)

    # Second-pass merge: also collapse consecutive entries whose case-folded
    # name matches (handles OCR variants like "SNACKS AND APPETIZERS" vs
    # "SNACKS AND. APPETIZERS"). Slug-based dedup misses these because the
    # punctuation produces a different slug.
    def _normalize_for_dedup(name: str) -> str:
        return name.lower().strip().rstrip(".,:;!?")

    deduped: list[dict] = []
    for entry in merged:
        if deduped and _normalize_for_dedup(deduped[-1]["name"]) == _normalize_for_dedup(entry["name"]):
            # Merge into prior entry
            deduped[-1]["page_range"] = (
                deduped[-1]["page_range"][0],
                entry["page_range"][1],
            )
        else:
            deduped.append(entry)

    # Canonicalize: map each detected name to a known chapter, drop non-matches
    # (OCR garbage like publisher names, author names, recipe titles in caps).
    canonicalized: list[dict] = []
    for entry in deduped:
        canonical_name = _canonicalize(entry["name"])
        if canonical_name is None:
            continue  # garbage / non-chapter detection
        canonicalized.append({
            "id": slugify(canonical_name),
            "name": canonical_name,
            "page_range": entry["page_range"],
        })

    # Re-merge consecutive same-id runs (now that canonicalization may have
    # made non-adjacent same-chapter runs adjacent).
    final: list[dict] = []
    for entry in canonicalized:
        if final and final[-1]["id"] == entry["id"]:
            final[-1]["page_range"] = (
                final[-1]["page_range"][0],
                entry["page_range"][1],
            )
        else:
            final.append(entry)
    return final


def write_sections_raw(pages_dir: Path, output_path: Path) -> None:
    """Run section detection and write to disk."""
    sections = detect_sections(pages_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(sections, indent=2))
