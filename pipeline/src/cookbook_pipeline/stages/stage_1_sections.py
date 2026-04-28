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

# Canonical cooking chapters for *India Cookbook* (Pushpesh Pant, Phaidon 2010).
# OCR-detected names are fuzzy-matched against this list; non-matches are
# dropped as OCR noise (publisher imprints, author names, recipe titles
# the regex caught, etc.) OR as paratext (Introduction, Glossary, Directory,
# Index — handled by Stage 2 for the Introduction prose and Stage 11 for the
# Glossary; Directory and Index are dropped per the design spec, since the
# website's search and ingredients pages replace the printed Index).
CANONICAL_CHAPTERS: list[str] = [
    "Spice Mixtures and Pastes",
    "Pickles, Chutneys and Raitas",
    "Snacks and Appetizers",
    "Main Dishes",
    "Pulses",
    "Breads",
    "Rice",
    "Desserts",
    "Drinks",
]

# Paratext chapter names that the footer regex still matches but which we do
# NOT emit as cooking sections. Stage 11 reads the Glossary range; the
# Introduction is handled by Stage 2's FRONT_MATTER_RANGES; Directory and
# Index are dropped entirely. Kept here so Stage 1 can still emit page-range
# metadata for downstream stages that need to know "this page is paratext,
# don't try to segment recipes from it".
PARATEXT_CHAPTERS: list[str] = [
    "Introduction",
    "Glossary",
    "Directory",
    "Index",
]

_CANONICAL_THRESHOLD = 0.7

_ALL_KNOWN = CANONICAL_CHAPTERS + PARATEXT_CHAPTERS


def _canonicalize(detected: str) -> str | None:
    """Map a detected name to a canonical cooking chapter, or None.

    Paratext names (Introduction, Glossary, Directory, Index) are intentionally
    excluded — Stage 1 emits cooking sections only. Paratext page ranges are
    reported separately by `detect_paratext_ranges` for the downstream stages
    that need them (Stage 3 to skip segmentation, Stage 11 to extract the
    Glossary).
    """
    detected_low = detected.lower()
    best_ratio = 0.0
    best_match: str | None = None
    for canonical in CANONICAL_CHAPTERS:
        r = SequenceMatcher(None, detected_low, canonical.lower()).ratio()
        if r > best_ratio:
            best_ratio = r
            best_match = canonical
    return best_match if best_ratio >= _CANONICAL_THRESHOLD else None


def _canonicalize_any(detected: str) -> str | None:
    """Map a detected name to ANY known chapter (cooking or paratext), or None."""
    detected_low = detected.lower()
    best_ratio = 0.0
    best_match: str | None = None
    for canonical in _ALL_KNOWN:
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


def detect_paratext_ranges(pages_dir: Path) -> dict[str, tuple[int, int]]:
    """Return a {paratext_id: (start_page, end_page)} map.

    Paratext = Introduction / Glossary / Directory / Index. The footer regex
    catches their ALL-CAPS chapter names just like real cooking chapters; we
    fuzzy-match against PARATEXT_CHAPTERS and merge consecutive runs.

    Used by Stage 11 (Glossary extraction) and Stage 3 (skip segmentation
    of paratext pages).
    """
    page_files = sorted(pages_dir.glob("page-*.txt"))
    runs: list[dict] = []
    current: dict | None = None
    for pf in page_files:
        page_num = int(pf.stem.split("-")[1])
        section = extract_section_name(pf.read_text())
        if section is None:
            if current is not None:
                runs.append(current)
                current = None
            continue
        canonical_any = _canonicalize_any(section)
        if canonical_any is None or canonical_any not in PARATEXT_CHAPTERS:
            if current is not None:
                runs.append(current)
                current = None
            continue
        if current is not None and current["name"] == canonical_any:
            current["end"] = page_num
        else:
            if current is not None:
                runs.append(current)
            current = {"name": canonical_any, "start": page_num, "end": page_num}
    if current is not None:
        runs.append(current)

    out: dict[str, tuple[int, int]] = {}
    for r in runs:
        pid = slugify(r["name"])
        if pid in out:
            out[pid] = (min(out[pid][0], r["start"]), max(out[pid][1], r["end"]))
        else:
            out[pid] = (r["start"], r["end"])
    return out


def write_sections_raw(pages_dir: Path, output_path: Path) -> None:
    """Run section detection and write to disk."""
    sections = detect_sections(pages_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(sections, indent=2))
