"""Canonical paths used throughout the pipeline.

Resolves relative to the project root, NOT the CWD, so the pipeline can be
run from anywhere.
"""

from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parents[2]  # pipeline/
PROJECT_ROOT = PIPELINE_DIR.parent

SOURCE_PDF = PROJECT_ROOT / "source" / "india-cookbook.pdf"
DATA_DIR = PROJECT_ROOT / "data"
DATA_IMAGES = DATA_DIR / "images"

BUILD_DIR = PIPELINE_DIR / "build"
BUILD_PAGES = BUILD_DIR / "pages"
BUILD_PAGE_IMAGES = BUILD_DIR / "page-images"

# Intermediate artifacts
SECTIONS_RAW = BUILD_DIR / "sections.raw.json"
RECIPES_RAW = BUILD_DIR / "recipes.raw.json"
RECIPES_CLEANED = BUILD_DIR / "recipes.cleaned.json"
FRONT_MATTER_RAW = BUILD_DIR / "front-matter.raw.json"
FAILURES = BUILD_DIR / "failures.json"
REPORT = BUILD_DIR / "report.json"

# Final outputs
RECIPES_JSON = DATA_DIR / "recipes.json"
SECTIONS_JSON = DATA_DIR / "sections.json"
REGIONS_JSON = DATA_DIR / "regions.json"
INGREDIENTS_JSON = DATA_DIR / "ingredients.json"
TAGS_JSON = DATA_DIR / "tags.json"
GRAPH_JSON = DATA_DIR / "graph.json"
FRONT_MATTER_JSON = DATA_DIR / "front-matter.json"
GLOSSARY_JSON = DATA_DIR / "glossary.json"

# Image sourcing (Stage 9 — internet fetcher)
IMAGE_OVERRIDES = PIPELINE_DIR / "data" / "image-overrides.yml"
IMAGE_PROVENANCE = DATA_IMAGES / "_provenance.json"
IMAGE_FETCH_FAILURES = BUILD_DIR / "image-fetch-failures.json"


def ensure_build_dirs() -> None:
    for d in (BUILD_DIR, BUILD_PAGES, BUILD_PAGE_IMAGES, DATA_DIR, DATA_IMAGES):
        d.mkdir(parents=True, exist_ok=True)
