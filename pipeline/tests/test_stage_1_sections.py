# pipeline/tests/test_stage_1_sections.py
from pathlib import Path

import pytest

from cookbook_pipeline.stages.stage_1_sections import (
    extract_section_name,
    detect_sections,
)


def test_extract_section_name_from_footer(fixtures_dir: Path):
    text = (fixtures_dir / "page-096.txt").read_text()
    assert extract_section_name(text) == "Snacks and Appetizers"


def test_extract_section_name_returns_none_when_missing():
    assert extract_section_name("just some text\n96\n") is None


def test_detect_sections_groups_consecutive_pages(tmp_path: Path):
    # Synthesize 4 pages with footers
    pages = tmp_path
    for i, footer in enumerate(
        ["SNACKS AND APPETIZERS", "SNACKS AND APPETIZERS", "VEGETABLES", "VEGETABLES"],
        start=10,
    ):
        (pages / f"page-{i:04d}.txt").write_text(f"body text\n\n{footer}\n{i}\n")
    result = detect_sections(pages)
    assert result == [
        {"id": "snacks-and-appetizers", "name": "Snacks and Appetizers", "page_range": (10, 11)},
        {"id": "vegetables", "name": "Vegetables", "page_range": (12, 13)},
    ]
