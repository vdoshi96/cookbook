# pipeline/tests/test_stage_3_segment.py
from pathlib import Path

from cookbook_pipeline.stages.stage_3_segment import segment_page


def test_segment_page_two_recipes(fixtures_dir: Path):
    text = (fixtures_dir / "page-096.txt").read_text()
    blocks = segment_page(text, page_num=96)
    # Page 96 actually has two recipes: Subz ke Kakori and Jaipuri Subz Seekh
    # (plan named Nargisi Seekh Kebab / Khumb Shabnam — those are on a different page)
    assert len(blocks) == 2
    # pdftotext -layout produces a two-column page; recipe names may appear in
    # the right column of a line whose left column has ingredient text, so we
    # check raw_text rather than title_hint for the recipe names.
    raw_texts = [b["raw_text"] for b in blocks]
    assert any("Kakori" in r or "Subz ke" in r for r in raw_texts)
    assert any("Jaipuri" in r for r in raw_texts)
    for b in blocks:
        assert b["page_num"] == 96
        assert "Origin" in b["raw_text"]
        assert "Preparation time" in b["raw_text"]


def test_segment_page_skips_chapter_opener(tmp_path: Path):
    # Pure prose, no Origin/Preparation markers — yields no blocks
    text = "Across India, snacks and appetizers...\n\nIntroduction to this chapter."
    assert segment_page(text, page_num=89) == []


def test_segment_page_short_format_makes_only():
    """A paste-style recipe with 'Makes' (no Serves, no Cooking time) must segment.

    Pastes, masalas, pickles, and chutneys use 'Makes <quantity>' instead of
    'Serves <count>' and frequently lack a 'Cooking time' line entirely.
    The previous segmenter rejected them; the relaxed heuristic accepts them.
    """
    text = (
        "Garlic Paste\n"
        "Origin Delhi\n"
        "Preparation time 5 minutes\n"
        "Makes 100g / 3.5oz\n"
        "\n"
        "10 cloves garlic\n"
        "2 tablespoons water\n"
        "\n"
        "Crush the garlic and water together to make a smooth paste.\n"
    )
    blocks = segment_page(text, page_num=57)
    assert len(blocks) == 1
    assert "Garlic Paste" in blocks[0]["raw_text"]
    assert "Makes" in blocks[0]["raw_text"]
    assert "Cooking time" not in blocks[0]["raw_text"]


def test_segment_page_rejects_origin_without_yield(tmp_path: Path):
    """A page with 'Origin' and 'Preparation time' but no yield marker must NOT segment.

    Region descriptions and chapter prose can incidentally contain those phrases
    without being recipes. The yield marker (Serves or Makes) is the safety
    check that distinguishes a recipe block from prose.
    """
    text = (
        "Awadh\n"
        "Origin of the dum cooking technique is Awadh.\n"
        "Preparation time-honored traditions abound in this cuisine.\n"
        "\n"
        "Awadhi food evolved in the courts of Lucknow.\n"
    )
    assert segment_page(text, page_num=21) == []


def test_segment_page_paste_real_fixture(fixtures_dir: Path):
    """Real Stage 0 output from page 35 (Garam Masala paste page).

    The page has 4 paste recipes laid out in two columns. Two-column
    contamination limits the segmenter to one block per Origin LINE
    (~3 blocks) rather than per Origin WORD (4 blocks), but each block
    must contain Origin + Preparation time + Makes.
    """
    text = (fixtures_dir / "page-035.txt").read_text()
    blocks = segment_page(text, page_num=35)
    assert len(blocks) >= 2, f"expected ≥2 paste blocks, got {len(blocks)}"
    for b in blocks:
        assert b["page_num"] == 35
        assert "Origin" in b["raw_text"]
        assert "Preparation time" in b["raw_text"]
        assert "Makes" in b["raw_text"]


def test_segment_page_pickle_real_fixture(fixtures_dir: Path):
    """Real Stage 0 output from page 67 (chutneys).

    The page has 2 chutney recipes. Both use 'Makes' and lack 'Cooking time'.
    """
    text = (fixtures_dir / "page-067.txt").read_text()
    blocks = segment_page(text, page_num=67)
    assert len(blocks) >= 1
    for b in blocks:
        assert b["page_num"] == 67
        assert "Origin" in b["raw_text"]
        assert "Preparation time" in b["raw_text"]
        assert "Makes" in b["raw_text"]
