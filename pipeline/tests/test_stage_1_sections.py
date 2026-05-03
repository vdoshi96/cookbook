# pipeline/tests/test_stage_1_sections.py
from pathlib import Path


from cookbook_pipeline.stages.stage_1_sections import (
    extract_section_name,
    detect_sections,
    detect_paratext_ranges,
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
        ["SNACKS AND APPETIZERS", "SNACKS AND APPETIZERS", "MAIN DISHES", "MAIN DISHES"],
        start=10,
    ):
        (pages / f"page-{i:04d}.txt").write_text(f"body text\n\n{footer}\n{i}\n")
    result = detect_sections(pages)
    assert result == [
        {"id": "snacks-and-appetizers", "name": "Snacks and Appetizers", "page_range": (10, 11)},
        {"id": "main-dishes", "name": "Main Dishes", "page_range": (12, 13)},
    ]


def test_detect_sections_merges_across_chapter_opener_gap(tmp_path: Path):
    """A chapter-opener page in the middle of a section should not split it."""
    pages = tmp_path
    (pages / "page-0010.txt").write_text("body\n\nSNACKS AND APPETIZERS\n10\n")
    (pages / "page-0011.txt").write_text("body\n\nSNACKS AND APPETIZERS\n11\n")
    (pages / "page-0012.txt").write_text("just a chapter opener with no footer\n")
    (pages / "page-0013.txt").write_text("body\n\nSNACKS AND APPETIZERS\n13\n")
    (pages / "page-0014.txt").write_text("body\n\nMAIN DISHES\n14\n")
    result = detect_sections(pages)
    assert result == [
        {"id": "snacks-and-appetizers", "name": "Snacks and Appetizers", "page_range": (10, 13)},
        {"id": "main-dishes", "name": "Main Dishes", "page_range": (14, 14)},
    ]


def test_extract_section_name_handles_comma():
    """Chapter names with commas (e.g. 'PICKLES, CHUTNEYS & RAITAS') must match."""
    text = "body text\n\n               PICKLES, CHUTNEYS & RAITAS\n42\n"
    assert extract_section_name(text) == "Pickles, Chutneys & Raitas"


def test_detect_sections_collapses_ocr_punctuation_variants(tmp_path: Path):
    """OCR sometimes adds trailing punctuation to footers; same chapter must merge."""
    pages = tmp_path
    (pages / "page-0010.txt").write_text("body\n\n  SNACKS AND APPETIZERS\n10\n")
    (pages / "page-0011.txt").write_text("body\n\n  SNACKS AND APPETIZERS.\n11\n")  # OCR variant
    (pages / "page-0012.txt").write_text("body\n\n  SNACKS AND APPETIZERS,\n12\n")  # OCR variant
    (pages / "page-0013.txt").write_text("body\n\n  MAIN DISHES\n13\n")
    result = detect_sections(pages)
    # All three Snacks pages should merge into ONE entry
    assert len(result) == 2
    assert result[0]["name"].lower().startswith("snacks")
    assert result[0]["page_range"] == (10, 12)
    assert result[1]["name"] == "Main Dishes"


def test_detect_sections_canonicalizes_ocr_variants(tmp_path: Path):
    """OCR variants like 'Snacks An Appetizers' must canonicalize to 'Snacks and Appetizers'."""
    pages = tmp_path
    (pages / "page-0010.txt").write_text("body\n\n  SNACKS AND APPETIZERS\n10\n")
    (pages / "page-0011.txt").write_text("body\n\n  SNACKS AN APPETIZERS\n11\n")  # OCR garbled
    (pages / "page-0012.txt").write_text("body\n\n  SN AC KS AND APPET ZERS\n12\n")  # heavily garbled but recognizable
    (pages / "page-0013.txt").write_text("body\n\n  MAIN DISHES\n13\n")
    result = detect_sections(pages)
    # All three Snacks variants should canonicalize and merge
    assert len(result) == 2
    assert result[0]["name"] == "Snacks and Appetizers"
    assert result[0]["id"] == "snacks-and-appetizers"
    assert result[0]["page_range"] == (10, 12)
    assert result[1]["name"] == "Main Dishes"


def test_detect_sections_drops_paratext_chapters(tmp_path: Path):
    """Introduction / Glossary / Directory / Index footers must NOT emit as sections."""
    pages = tmp_path
    (pages / "page-0012.txt").write_text("body\n\n  INTRODUCTION\n12\n")
    (pages / "page-0035.txt").write_text("body\n\n  SPICE MIXTURES AND PASTES\n35\n")
    (pages / "page-0780.txt").write_text("body\n\n  GLOSSARY\n780\n")
    (pages / "page-0801.txt").write_text("body\n\n  DIRECTORY\n801\n")
    (pages / "page-0804.txt").write_text("body\n\n  INDEX\n804\n")
    result = detect_sections(pages)
    # Only the cooking chapter survives — paratext is reported by
    # detect_paratext_ranges, not detect_sections.
    assert [s["name"] for s in result] == ["Spice Mixtures and Pastes"]


def test_detect_paratext_ranges_groups_introduction_glossary_directory_index(tmp_path: Path):
    pages = tmp_path
    (pages / "page-0012.txt").write_text("body\n\n  INTRODUCTION\n12\n")
    (pages / "page-0013.txt").write_text("body\n\n  INTRODUCTION\n13\n")
    (pages / "page-0035.txt").write_text("body\n\n  SPICE MIXTURES AND PASTES\n35\n")
    (pages / "page-0780.txt").write_text("body\n\n  GLOSSARY\n780\n")
    (pages / "page-0797.txt").write_text("body\n\n  GLOSSARY\n797\n")
    (pages / "page-0801.txt").write_text("body\n\n  DIRECTORY\n801\n")
    (pages / "page-0804.txt").write_text("body\n\n  INDEX\n804\n")
    (pages / "page-0819.txt").write_text("body\n\n  INDEX\n819\n")
    ranges = detect_paratext_ranges(pages)
    assert ranges == {
        "introduction": (12, 13),
        "glossary": (780, 797),
        "directory": (801, 801),
        "index": (804, 819),
    }


def test_detect_sections_drops_non_canonical_garbage(tmp_path: Path):
    """One-page detections of non-chapter all-caps lines (publisher, author, etc.) drop."""
    pages = tmp_path
    (pages / "page-0001.txt").write_text("body\n\n  PHAIDON\n1\n")  # publisher
    (pages / "page-0007.txt").write_text("body\n\n  PUSHPESH PANT\n7\n")  # author
    (pages / "page-0010.txt").write_text("body\n\n  KARNATAKA\n10\n")  # region label
    (pages / "page-0035.txt").write_text("body\n\n  SPICE MIXTURES AND PASTES\n35\n")  # real chapter
    (pages / "page-0095.txt").write_text("body\n\n  SNACKS AND APPETIZERS\n95\n")  # real chapter
    result = detect_sections(pages)
    # Only the two real chapters survive
    assert len(result) == 2
    assert result[0]["name"] == "Spice Mixtures and Pastes"
    assert result[1]["name"] == "Snacks and Appetizers"
