"""Stage 0 — dump per-page text (via pdftotext -layout) and PNG images.

Idempotent: skips pages that are already extracted.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import fitz  # PyMuPDF


def extract_pages(pdf_path: Path, pages_dir: Path, images_dir: Path) -> int:
    """Extract per-page text and 200dpi PNG images from `pdf_path`.

    Returns the total page count of the PDF (not the number of newly-written pages).
    """
    pages_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    with fitz.open(str(pdf_path)) as doc:
        n = doc.page_count
        for i in range(n):
            page_num = i + 1  # 1-indexed
            text_path = pages_dir / f"page-{page_num:04d}.txt"
            image_path = images_dir / f"page-{page_num:04d}.png"
            if not text_path.exists() or text_path.stat().st_size == 0:
                text = _pdftotext_layout(pdf_path, page_num)
                tmp = text_path.with_suffix(text_path.suffix + ".tmp")
                tmp.write_text(text)
                tmp.rename(text_path)
            if not image_path.exists() or image_path.stat().st_size == 0:
                page = doc.load_page(i)
                pix = page.get_pixmap(dpi=200)
                tmp = image_path.with_suffix(image_path.suffix + ".tmp")
                pix.save(str(tmp), output="png")
                tmp.rename(image_path)
    return n


def _pdftotext_layout(pdf_path: Path, page_num: int) -> str:
    """Run `pdftotext -layout` on a single page and return its text."""
    try:
        result = subprocess.run(
            [
                "pdftotext",
                "-layout",
                "-f", str(page_num),
                "-l", str(page_num),
                str(pdf_path),
                "-",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as e:
        raise RuntimeError(
            "pdftotext not found in PATH. Install poppler-utils "
            "(macOS: `brew install poppler`; Debian/Ubuntu: `apt install poppler-utils`)."
        ) from e
    return result.stdout
