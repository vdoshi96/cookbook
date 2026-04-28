"""Validation tests for Stage 2 — front-matter extraction.

These tests don't run the live LLM extraction (that's exercised end-to-end
by the pilot/full runs). They validate two things:

1. Static configuration: the FRONT_MATTER_RANGES constant is internally
   consistent (no overlapping pages, no missing/duplicate keys).

2. Output shape: when data/front-matter.json exists, its content matches
   what the page ranges promise — regions_overview really does describe
   regions, ayurveda really does describe Ayurveda, and so on.

Test #2 is a regression guard. The first full run produced a
regions_overview section whose title was "Ayurveda and Indian Food" because
the original FRONT_MATTER_RANGES were off by several pages for the Phaidon
2010 edition.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from cookbook_pipeline.stages.stage_2_front_matter import FRONT_MATTER_RANGES


# ----- Static validation of the FRONT_MATTER_RANGES constant -----


def test_front_matter_ranges_have_unique_keys():
    keys = [key for _, _, key in FRONT_MATTER_RANGES]
    assert len(keys) == len(set(keys)), f"duplicate keys in FRONT_MATTER_RANGES: {keys}"


def test_front_matter_ranges_pages_dont_overlap():
    """No page may belong to more than one front-matter section."""
    seen: dict[int, str] = {}
    for start, end, key in FRONT_MATTER_RANGES:
        assert start <= end, f"{key}: range {start}-{end} is inverted"
        for p in range(start, end + 1):
            assert p not in seen, (
                f"page {p} is in both '{seen[p]}' and '{key}' — front-matter ranges must be disjoint"
            )
            seen[p] = key


def test_front_matter_ranges_match_schema_keys():
    """Every key emitted by Stage 2 must be a field on FrontMatterFile."""
    from cookbook_pipeline.schema import FrontMatterFile

    schema_keys = set(FrontMatterFile.model_fields.keys()) - {"schema_version"}
    range_keys = {key for _, _, key in FRONT_MATTER_RANGES}
    extra = range_keys - schema_keys
    assert not extra, (
        f"FRONT_MATTER_RANGES emits keys {extra} that are not declared on FrontMatterFile"
    )


# ----- Output content validation (skips if data not present) -----


def _front_matter_data() -> dict | None:
    path = Path(__file__).resolve().parents[2] / "data" / "front-matter.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def test_regions_overview_describes_regions_not_ayurveda():
    """regions_overview must describe Indian regions, not Ayurveda.

    Regression guard: in the first full run the page ranges were misaligned
    for this edition, and pages of Ayurveda content ended up tagged as
    regions_overview. The title field came back as "Ayurveda and Indian Food".
    """
    fm = _front_matter_data()
    if fm is None:
        pytest.skip("data/front-matter.json not present")

    ro = fm.get("regions_overview")
    assert ro is not None, "regions_overview missing from front-matter.json"

    title = (ro.get("title") or "").lower()
    assert "ayurveda" not in title, (
        f"regions_overview.title is Ayurveda-themed: {title!r}. "
        "Page ranges in stage_2_front_matter.FRONT_MATTER_RANGES are misaligned."
    )

    md = (ro.get("markdown") or "").lower()
    region_keywords = ("punjab", "kashmir", "bengal", "tamil", "kerala", "rajasthan", "gujarat", "awadh")
    matches = sum(1 for kw in region_keywords if kw in md)
    assert matches >= 3, (
        f"regions_overview.markdown only mentions {matches} of {len(region_keywords)} expected "
        f"region keywords — it doesn't look like a regions overview."
    )


def test_ayurveda_describes_ayurveda():
    """ayurveda must mention Ayurveda by name."""
    fm = _front_matter_data()
    if fm is None:
        pytest.skip("data/front-matter.json not present")

    ay = fm.get("ayurveda")
    assert ay is not None, "ayurveda missing from front-matter.json"

    body = ((ay.get("title") or "") + " " + (ay.get("markdown") or "")).lower()
    assert "ayurveda" in body, "ayurveda section does not mention Ayurveda"
