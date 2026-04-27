"""Tests for Stage 0: PDF page text + image dump.

We build a tiny fixture PDF the first time we run, by extracting 2 pages
from the real source. The fixture is regenerated if missing.
"""

import subprocess
from pathlib import Path

import pytest

from cookbook_pipeline.stages.stage_0_extract import extract_pages


@pytest.fixture
def tiny_pdf(fixtures_dir: Path) -> Path:
    out = fixtures_dir / "tiny.pdf"
    if not out.exists():
        # Build from the real source; skip if not present (CI without source)
        project_root = Path(__file__).resolve().parents[2]
        candidates = list(project_root.glob("*.pdf")) + [
            project_root / "source" / "india-cookbook.pdf"
        ]
        src = next((p for p in candidates if p.exists()), None)
        if src is None:
            pytest.skip("No source PDF available for tiny.pdf fixture")
        subprocess.run(
            ["qpdf", str(src), "--pages", ".", "96-97", "--", str(out)],
            check=False,
        )
        if not out.exists():
            # qpdf not installed — fall back to PyMuPDF
            import fitz  # type: ignore
            doc = fitz.open(str(src))
            new = fitz.open()
            new.insert_pdf(doc, from_page=95, to_page=96)
            new.save(str(out))
            new.close()
            doc.close()
    return out


def test_extract_pages_writes_text_and_images(tiny_pdf: Path, tmp_path: Path):
    pages_dir = tmp_path / "pages"
    images_dir = tmp_path / "page-images"
    n = extract_pages(tiny_pdf, pages_dir, images_dir)
    assert n == 2
    page_files = sorted(pages_dir.glob("page-*.txt"))
    assert len(page_files) == 2
    # OCR text should mention a recipe title from page 96/97
    combined = "\n".join(p.read_text() for p in page_files)
    assert "Nargisi Seekh Kebab" in combined or "Pakoras" in combined
    image_files = sorted(images_dir.glob("page-*.png"))
    assert len(image_files) == 2


def test_extract_pages_idempotent(tiny_pdf: Path, tmp_path: Path):
    pages_dir = tmp_path / "pages"
    images_dir = tmp_path / "page-images"
    extract_pages(tiny_pdf, pages_dir, images_dir)
    files_before = sorted((pages_dir / f).stat().st_mtime for f in pages_dir.iterdir())
    extract_pages(tiny_pdf, pages_dir, images_dir)
    files_after = sorted((pages_dir / f).stat().st_mtime for f in pages_dir.iterdir())
    # Idempotent: re-running doesn't rewrite files unnecessarily
    assert files_before == files_after


def test_extract_pages_rewrites_zero_byte_text(tmp_path: Path):
    """A zero-byte text file from a crashed prior run must be re-extracted.

    Without the fix, `text_path.exists()` returns True for the empty file, so
    extract_pages skips it and Stage 1 silently consumes truncated text.
    """
    import fitz

    pdf_path = tmp_path / "tiny.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "REGRESSION_MARKER recipe content")
    doc.save(str(pdf_path))
    doc.close()

    pages_dir = tmp_path / "pages"
    images_dir = tmp_path / "page-images"
    pages_dir.mkdir()
    images_dir.mkdir()

    (pages_dir / "page-0001.txt").write_text("")

    extract_pages(pdf_path, pages_dir, images_dir)

    text = (pages_dir / "page-0001.txt").read_text()
    assert text != ""
    assert "REGRESSION_MARKER" in text
