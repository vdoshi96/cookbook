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
    # check raw_text rather than title_line for the recipe names.
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
