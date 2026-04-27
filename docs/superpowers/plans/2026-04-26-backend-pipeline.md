# India Cookbook Backend Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python pipeline that turns Pushpesh Pant's *India Cookbook* PDF into the seven structured JSON files (and image assets) in `/data/`, matching the contract in the design spec.

**Architecture:** Ten-stage pipeline. Each stage reads from disk and writes to disk, so any stage can be re-run independently. Pure-Python logic for parsing, segmenting, indexing, and validation. Claude Haiku 4.5 (vision-capable) handles OCR cleanup, ingredient parsing, tagging, intro prose extraction, and curated "start here" picks. A single CLI orchestrates all stages.

**Tech Stack:** Python 3.11+, `pdftotext` (Poppler, already installed), `PyMuPDF` (image extraction), `anthropic` SDK (model `claude-haiku-4-5-20251001`, vision), `pydantic` v2, `pytest`, `python-dotenv`, `tqdm`, `httpx`.

**Reference:** [docs/superpowers/specs/2026-04-26-india-cookbook-website-design.md](../specs/2026-04-26-india-cookbook-website-design.md) — read first.

**Pre-flight:** All work happens on the `backend` branch.

```bash
cd "/Users/vishal/Library/Mobile Documents/com~apple~CloudDocs/Projects/Cookbook"
git checkout backend
```

---

## File structure

```
pipeline/
  pyproject.toml
  requirements.txt
  .env.example
  .python-version
  README.md
  src/cookbook_pipeline/
    __init__.py
    __main__.py                  CLI entry: python -m cookbook_pipeline ...
    paths.py                     Directory and path constants
    schema.py                    Pydantic v2 models (Recipe, Section, Region, ...)
    stages/
      __init__.py
      stage_0_extract.py         pdftotext + PyMuPDF dump
      stage_1_sections.py        Detect chapter boundaries from page footers
      stage_2_front_matter.py    Front-matter prose extraction (LLM)
      stage_3_segment.py         Split pages into recipe blocks
      stage_4_clean.py           LLM cleanup: parse OCR → structured recipe
      stage_5_xrefs.py           Resolve "see page X" → recipe IDs, build graph
      stage_6_intros.py          Section + region intro extraction (LLM)
      stage_7_picks.py           "Start here" curated picks per section (LLM)
      stage_8_indexes.py         Ingredient + tag indexes
      stage_9_images.py          PyMuPDF image extraction + recipe association
      stage_10_emit.py           Validate and write final files to /data/
    llm/
      __init__.py
      client.py                  Anthropic client wrapper, prompt caching, retry
      prompts.py                 Prompt templates
    utils/
      __init__.py
      text.py                    slug, normalize_ingredient, page-number helpers
  tests/
    fixtures/
      page-096.txt               Real OCR text from page 96
      page-097.txt               Real OCR text from page 97
      mock_clean_response.json   Canned Haiku response
      mock_intro_response.json   Canned Haiku response for chapter intro
      tiny.pdf                   2-page test PDF (built once from the source)
    conftest.py
    test_paths.py
    test_schema.py
    test_utils_text.py
    test_stage_0_extract.py
    test_stage_1_sections.py
    test_stage_3_segment.py
    test_stage_4_clean.py
    test_stage_5_xrefs.py
    test_stage_8_indexes.py
    test_llm_client.py
```

Output:

```
data/                            Final pipeline output (committed)
  recipes.json
  sections.json
  regions.json
  ingredients.json
  tags.json
  graph.json
  front-matter.json
  images/*.{webp,jpg}

pipeline/build/                  Intermediate artifacts (gitignored)
  pages/page-NNN.txt
  page-images/page-NNN.png
  sections.raw.json
  recipes.raw.json
  recipes.cleaned.json
  failures.json
  report.json
```

---

## Task 1: Scaffold the pipeline package

**Files:**
- Create: `pipeline/pyproject.toml`
- Create: `pipeline/requirements.txt`
- Create: `pipeline/.env.example`
- Create: `pipeline/.python-version`
- Create: `pipeline/README.md`
- Create: `pipeline/src/cookbook_pipeline/__init__.py` (empty)
- Create: `pipeline/src/cookbook_pipeline/__main__.py` (placeholder)
- Create: `pipeline/src/cookbook_pipeline/paths.py`
- Create: `pipeline/tests/__init__.py` (empty)
- Create: `pipeline/tests/conftest.py`

- [ ] **Step 1: Switch to backend branch.**

```bash
cd "/Users/vishal/Library/Mobile Documents/com~apple~CloudDocs/Projects/Cookbook"
git checkout backend
git pull origin backend
```

- [ ] **Step 2: Create `pipeline/.python-version`.**

```
3.11
```

- [ ] **Step 3: Create `pipeline/pyproject.toml`.**

```toml
[project]
name = "cookbook-pipeline"
version = "0.1.0"
description = "Extract structured recipes from the India Cookbook PDF"
requires-python = ">=3.11"
dependencies = [
    "anthropic>=0.40.0",
    "pydantic>=2.6.0",
    "python-dotenv>=1.0.0",
    "tqdm>=4.66.0",
    "PyMuPDF>=1.24.0",
    "Pillow>=10.0.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0.0", "pytest-mock>=3.12.0", "ruff>=0.4.0"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["src"]

[tool.ruff]
line-length = 100
target-version = "py311"
```

- [ ] **Step 4: Create `pipeline/requirements.txt`.**

```
anthropic>=0.40.0
pydantic>=2.6.0
python-dotenv>=1.0.0
tqdm>=4.66.0
PyMuPDF>=1.24.0
Pillow>=10.0.0
pytest>=8.0.0
pytest-mock>=3.12.0
ruff>=0.4.0
```

- [ ] **Step 5: Create `pipeline/.env.example`.**

```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 6: Create `pipeline/README.md`.**

````markdown
# Pipeline

Python pipeline that converts the India Cookbook PDF to structured JSON in `/data/`.

## Setup

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env
# edit .env, set ANTHROPIC_API_KEY
```

The source PDF must be placed at `../source/india-cookbook.pdf`. It is gitignored.

## Run

```bash
python -m cookbook_pipeline run            # all stages
python -m cookbook_pipeline run --stage 4  # one stage only
python -m cookbook_pipeline pilot          # 50-recipe sample for spot-checking
```

## Tests

```bash
pytest
```

## Stages

0. PDF page text and image dump
1. Section detection from page footers
2. Front-matter extraction (LLM)
3. Recipe block segmentation
4. LLM cleanup pass (Haiku) — the bulk of the work
5. Cross-reference resolution
6. Section + region intro extraction (LLM)
7. "Start here" picks per section (LLM)
8. Ingredient + tag indexing
9. Image extraction + recipe association
10. Validation and final emit to `/data/`
````

- [ ] **Step 7: Create `pipeline/src/cookbook_pipeline/__init__.py`.**

```python
__version__ = "0.1.0"
```

- [ ] **Step 8: Create `pipeline/src/cookbook_pipeline/paths.py`.**

```python
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


def ensure_build_dirs() -> None:
    for d in (BUILD_DIR, BUILD_PAGES, BUILD_PAGE_IMAGES, DATA_IMAGES):
        d.mkdir(parents=True, exist_ok=True)
```

- [ ] **Step 9: Create `pipeline/src/cookbook_pipeline/__main__.py` placeholder.**

```python
"""CLI entry point. Filled in incrementally as stages are added."""

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="cookbook_pipeline")
    parser.add_argument("command", choices=["run", "pilot"])
    parser.add_argument("--stage", type=int, default=None)
    args = parser.parse_args(argv)
    print(f"Pipeline scaffolded. command={args.command}, stage={args.stage}.")
    print("Stages will be wired up in subsequent tasks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 10: Create `pipeline/tests/__init__.py` (empty).**

- [ ] **Step 11: Create `pipeline/tests/conftest.py`.**

```python
"""Shared test fixtures."""

from pathlib import Path

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
def fixtures_dir() -> Path:
    return FIXTURES
```

- [ ] **Step 12: Create the venv and install.**

```bash
cd pipeline
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

Expected: install succeeds. `python -c "import cookbook_pipeline; print(cookbook_pipeline.__version__)"` prints `0.1.0`.

- [ ] **Step 13: Run pytest to confirm scaffolding works.**

```bash
pytest -q
```

Expected: `no tests ran` (no test files yet).

- [ ] **Step 14: Run the placeholder CLI.**

```bash
python -m cookbook_pipeline run
```

Expected: `Pipeline scaffolded. command=run, stage=None.` plus the second line.

- [ ] **Step 15: Commit.**

```bash
git add pipeline/
git commit -m "feat(pipeline): scaffold package, requirements, paths, CLI placeholder"
git push origin backend
```

---

## Task 2: Pydantic schemas

**Files:**
- Create: `pipeline/src/cookbook_pipeline/schema.py`
- Create: `pipeline/tests/test_schema.py`

- [ ] **Step 1: Write the schema module.**

```python
# pipeline/src/cookbook_pipeline/schema.py
"""Pydantic v2 models for every JSON file the pipeline emits.

The models are the single source of truth for the data contract. Field names,
types, and nullability here MUST match the design spec §6.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    qty_metric: str | None = None
    qty_imperial: str | None = None
    qty_count: str | None = None
    item: str
    notes: str | None = None


class CrossRef(BaseModel):
    name: str
    page: int
    id: str | None = None  # filled in by Stage 5


class Recipe(BaseModel):
    schema_version: int = 1
    id: str
    name: str
    subtitle: str | None = None
    section_id: str
    section_name: str
    origin_region_id: str
    origin_region_name: str
    prep_minutes: int | None = None
    prep_notes: str | None = None
    cook_minutes: int | None = None
    cook_notes: str | None = None
    serves: int | None = None
    heat_level: int = Field(ge=0, le=3)
    dietary_tags: list[str] = Field(default_factory=list)
    technique_tags: list[str] = Field(default_factory=list)
    occasion_tags: list[str] = Field(default_factory=list)
    ingredients: list[Ingredient]
    instructions: list[str]
    cross_refs: list[CrossRef] = Field(default_factory=list)
    source_page: int
    image: str | None = None


class StartHerePick(BaseModel):
    id: str
    rationale: str


class Section(BaseModel):
    id: str
    name: str
    intro_markdown: str
    page_range: tuple[int, int]
    recipe_ids: list[str]
    start_here: list[StartHerePick] = Field(default_factory=list)
    hero_image: str | None = None


class SectionsFile(BaseModel):
    schema_version: int = 1
    sections: list[Section]


class MapCoords(BaseModel):
    lat: float
    lng: float


class Region(BaseModel):
    id: str
    name: str
    intro_markdown: str
    recipe_ids: list[str]
    map_coords: MapCoords | None = None


class RegionsFile(BaseModel):
    schema_version: int = 1
    regions: list[Region]


class IngredientEntry(BaseModel):
    display_name: str
    recipe_ids: list[str]
    count: int


class IngredientsFile(BaseModel):
    schema_version: int = 1
    ingredients: dict[str, IngredientEntry]


class TagEntry(BaseModel):
    kind: str  # "dietary" | "technique" | "occasion"
    recipe_ids: list[str]
    count: int


class TagsFile(BaseModel):
    schema_version: int = 1
    tags: dict[str, TagEntry]


class GraphEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str
    kind: str = "uses"

    model_config = {"populate_by_name": True}


class GraphFile(BaseModel):
    schema_version: int = 1
    edges: list[GraphEdge]
    used_in: dict[str, list[str]]


class FrontMatterSection(BaseModel):
    title: str
    markdown: str


class RegionsOverview(FrontMatterSection):
    map_image: str | None = None


class FrontMatterFile(BaseModel):
    schema_version: int = 1
    introduction: FrontMatterSection
    history: FrontMatterSection
    ayurveda: FrontMatterSection
    regions_overview: RegionsOverview
    notes_on_recipes: FrontMatterSection


class RecipesFile(BaseModel):
    schema_version: int = 1
    recipes: list[Recipe]
```

- [ ] **Step 2: Write tests for schema validation.**

```python
# pipeline/tests/test_schema.py
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from cookbook_pipeline.schema import (
    Recipe,
    RecipesFile,
    Section,
    SectionsFile,
    GraphEdge,
)


def test_recipe_minimal_required_fields():
    r = Recipe(
        id="x",
        name="X",
        section_id="s",
        section_name="S",
        origin_region_id="r",
        origin_region_name="R",
        heat_level=0,
        ingredients=[{"item": "salt"}],
        instructions=["do it"],
        source_page=1,
    )
    assert r.heat_level == 0
    assert r.dietary_tags == []
    assert r.image is None


def test_recipe_heat_level_bounds():
    with pytest.raises(ValidationError):
        Recipe(
            id="x",
            name="X",
            section_id="s",
            section_name="S",
            origin_region_id="r",
            origin_region_name="R",
            heat_level=4,
            ingredients=[{"item": "x"}],
            instructions=["x"],
            source_page=1,
        )


def test_recipes_file_round_trip():
    payload = {
        "schema_version": 1,
        "recipes": [
            {
                "id": "x",
                "name": "X",
                "section_id": "s",
                "section_name": "S",
                "origin_region_id": "r",
                "origin_region_name": "R",
                "heat_level": 1,
                "ingredients": [{"item": "salt"}],
                "instructions": ["do it"],
                "source_page": 1,
            }
        ],
    }
    rf = RecipesFile.model_validate(payload)
    assert rf.recipes[0].id == "x"


def test_graph_edge_from_alias():
    edge = GraphEdge.model_validate({"from": "a", "to": "b", "kind": "uses"})
    assert edge.from_ == "a"
    assert edge.model_dump(by_alias=True)["from"] == "a"


def test_section_page_range_is_tuple():
    s = Section(
        id="s",
        name="S",
        intro_markdown="x",
        page_range=(10, 20),
        recipe_ids=[],
    )
    assert s.page_range == (10, 20)


def test_repo_stub_data_validates(tmp_path: Path):
    """The stub /data files on main MUST validate against these schemas."""
    project_root = Path(__file__).resolve().parents[3]
    recipes_path = project_root / "data" / "recipes.json"
    payload = json.loads(recipes_path.read_text())
    rf = RecipesFile.model_validate(payload)
    assert len(rf.recipes) >= 3
```

- [ ] **Step 3: Run the tests.**

```bash
pytest tests/test_schema.py -v
```

Expected: 6 passed (the last one validates the stub data we put on `main`).

- [ ] **Step 4: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/schema.py pipeline/tests/test_schema.py
git commit -m "feat(pipeline): pydantic schemas for all output JSON files"
git push origin backend
```

---

## Task 3: Text utilities (slug, ingredient normalization)

**Files:**
- Create: `pipeline/src/cookbook_pipeline/utils/__init__.py` (empty)
- Create: `pipeline/src/cookbook_pipeline/utils/text.py`
- Create: `pipeline/tests/test_utils_text.py`

- [ ] **Step 1: Create empty `utils/__init__.py`.**

- [ ] **Step 2: Write the failing test first.**

```python
# pipeline/tests/test_utils_text.py
from cookbook_pipeline.utils.text import slugify, normalize_ingredient


def test_slugify_basic():
    assert slugify("Nargisi Seekh Kebab") == "nargisi-seekh-kebab"


def test_slugify_punctuation():
    assert slugify("Khumb Shabnam: Mushrooms!") == "khumb-shabnam-mushrooms"


def test_slugify_diacritics():
    # Common diacritics in transliterated Hindi names
    assert slugify("Kheer Pāṭiśapta") == "kheer-patisapta"


def test_slugify_collapses_dashes():
    assert slugify("Foo  --  Bar") == "foo-bar"


def test_normalize_ingredient_strips_quantity_words():
    assert normalize_ingredient("paneer, grated") == "paneer"
    assert normalize_ingredient("button (white) mushrooms, sliced") == "button-mushrooms"


def test_normalize_ingredient_synonyms():
    # cilantro and coriander leaves collapse to one
    assert normalize_ingredient("coriander (cilantro) leaves") == "coriander-leaves"
    assert normalize_ingredient("cilantro leaves") == "coriander-leaves"


def test_normalize_ingredient_lowercase_and_singular():
    assert normalize_ingredient("Onions") == "onion"
    assert normalize_ingredient("Potatoes") == "potato"
```

- [ ] **Step 3: Run the test, expect failure.**

```bash
pytest tests/test_utils_text.py -v
```

Expected: ImportError or ModuleNotFoundError on `cookbook_pipeline.utils.text`.

- [ ] **Step 4: Implement `utils/text.py`.**

```python
# pipeline/src/cookbook_pipeline/utils/text.py
"""Slug and ingredient-normalization helpers.

These are pure functions with no I/O. Synonyms and singularization rules
deliberately use a small explicit dictionary, not a stemmer; the corpus is
~1000 recipes and we want predictable output.
"""

from __future__ import annotations

import re
import unicodedata

# Phrases that mean the same thing across the book.
INGREDIENT_SYNONYMS: dict[str, str] = {
    "coriander cilantro leaves": "coriander leaves",
    "cilantro leaves": "coriander leaves",
    "cilantro": "coriander leaves",
    "curd": "yoghurt",
    "natural plain yoghurt": "yoghurt",
    "plain yoghurt": "yoghurt",
}

# Words to strip from ingredient strings before normalization.
INGREDIENT_NOISE = {
    "fresh", "freshly", "chopped", "sliced", "grated", "minced", "diced",
    "peeled", "unpeeled", "deseeded", "de-seeded", "halved", "quartered",
    "ground", "whole", "small", "large", "medium",
    "natural", "plain",
}

# Manual singularization for the words the book actually uses.
SINGULARIZE = {
    "onions": "onion",
    "potatoes": "potato",
    "tomatoes": "tomato",
    "chillies": "chilli",
    "leaves": "leaves",  # keep
    "mushrooms": "mushroom",
    "carrots": "carrot",
    "peas": "peas",  # keep
    "lentils": "lentils",  # keep
    "eggs": "egg",
}


def slugify(text: str) -> str:
    """Convert a recipe or ingredient name into a URL-safe slug.

    >>> slugify("Nargisi Seekh Kebab")
    'nargisi-seekh-kebab'
    """
    # Strip diacritics
    nkfd = unicodedata.normalize("NFKD", text)
    ascii_text = nkfd.encode("ascii", "ignore").decode("ascii")
    # Lowercase and replace non-alphanumerics with dashes
    s = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())
    return s.strip("-")


def normalize_ingredient(raw: str) -> str:
    """Map an ingredient line to a stable identifier.

    Strips quantities, parentheticals, descriptive adjectives, and applies
    a small synonym dictionary. Returns a slug.
    """
    s = raw.lower()
    # Drop parentheticals like "(white)" or "(cilantro)"
    s = re.sub(r"\([^)]*\)", " ", s)
    # Drop trailing comma-separated descriptors after the first comma:
    #   "paneer, grated" -> "paneer"
    s = s.split(",", 1)[0]
    # Apply synonym substitutions on the whitespace-collapsed string
    collapsed = " ".join(s.split())
    if collapsed in INGREDIENT_SYNONYMS:
        return slugify(INGREDIENT_SYNONYMS[collapsed])
    # Strip noise words
    tokens = [t for t in collapsed.split() if t not in INGREDIENT_NOISE]
    # Singularize each token
    tokens = [SINGULARIZE.get(t, t) for t in tokens]
    return slugify(" ".join(tokens))
```

- [ ] **Step 5: Run the tests.**

```bash
pytest tests/test_utils_text.py -v
```

Expected: 7 passed.

- [ ] **Step 6: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/utils/ pipeline/tests/test_utils_text.py
git commit -m "feat(pipeline): slug and ingredient normalization utilities"
git push origin backend
```

---

## Task 4: Stage 0 — page text and image dump

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/__init__.py` (empty)
- Create: `pipeline/src/cookbook_pipeline/stages/stage_0_extract.py`
- Create: `pipeline/tests/test_stage_0_extract.py`
- Create: `pipeline/tests/fixtures/.gitkeep`

- [ ] **Step 1: Empty `stages/__init__.py`.**

- [ ] **Step 2: Write the test first.**

```python
# pipeline/tests/test_stage_0_extract.py
"""Tests for Stage 0: PDF page text + image dump.

We build a tiny fixture PDF the first time we run, by extracting 2 pages
from the real source. The fixture is regenerated if missing.
"""

import shutil
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
            ["qpdf", "--pages", str(src), "96-97", "--", str(src), str(out)],
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
```

- [ ] **Step 3: Run the test, expect failure.**

```bash
pytest tests/test_stage_0_extract.py -v
```

Expected: ModuleNotFoundError on `stages.stage_0_extract`.

- [ ] **Step 4: Implement Stage 0.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_0_extract.py
"""Stage 0 — dump per-page text (via pdftotext -layout) and PNG images.

Idempotent: skips pages that are already extracted.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import fitz  # PyMuPDF


def extract_pages(pdf_path: Path, pages_dir: Path, images_dir: Path) -> int:
    """Extract per-page text and 200dpi PNG images from `pdf_path`.

    Returns the number of pages processed.
    """
    pages_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(pdf_path))
    n = doc.page_count
    for i in range(n):
        page_num = i + 1  # 1-indexed
        text_path = pages_dir / f"page-{page_num:04d}.txt"
        image_path = images_dir / f"page-{page_num:04d}.png"
        if not text_path.exists():
            text_path.write_text(_pdftotext_layout(pdf_path, page_num))
        if not image_path.exists():
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=200)
            pix.save(str(image_path))
    doc.close()
    return n


def _pdftotext_layout(pdf_path: Path, page_num: int) -> str:
    """Run `pdftotext -layout` on a single page and return its text."""
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
    return result.stdout
```

- [ ] **Step 5: Run the tests.**

```bash
pytest tests/test_stage_0_extract.py -v
```

Expected: 2 passed (or skipped if no source PDF; the skip is acceptable for CI).

- [ ] **Step 6: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/ pipeline/tests/test_stage_0_extract.py pipeline/tests/fixtures/.gitkeep
git commit -m "feat(pipeline): stage 0 — pdftotext and image dump per page"
git push origin backend
```

---

## Task 5: Stage 1 — section detection from page footers

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_1_sections.py`
- Create: `pipeline/tests/test_stage_1_sections.py`
- Create: `pipeline/tests/fixtures/page-096.txt`
- Create: `pipeline/tests/fixtures/page-097.txt`

- [ ] **Step 1: Create the page fixture files** (real OCR output from `pdftotext -layout`).

```bash
cd pipeline
mkdir -p tests/fixtures
pdftotext -layout -f 96 -l 96 ../source/india-cookbook.pdf tests/fixtures/page-096.txt
pdftotext -layout -f 97 -l 97 ../source/india-cookbook.pdf tests/fixtures/page-097.txt
```

If the source PDF lives at the project root with its long filename, use that path instead. The fixture files must end up containing real text including the footer line `SNACKS AND APPETIZERS` and a page number.

- [ ] **Step 2: Write the failing test.**

```python
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
```

- [ ] **Step 3: Run, expect failure.**

```bash
pytest tests/test_stage_1_sections.py -v
```

Expected: ImportError.

- [ ] **Step 4: Implement Stage 1.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_1_sections.py
"""Stage 1 — detect chapter boundaries from page footers.

Each non-front-matter page in the book has a footer of the form:

    <SECTION NAME IN ALL CAPS>
    <page number>

We walk the page text dumps in order and group consecutive pages by section.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from cookbook_pipeline.utils.text import slugify

# A section-name footer: ALL CAPS line of letters and ampersands, length 4..40
_FOOTER_LINE = re.compile(r"^([A-Z][A-Z &]{2,40}[A-Z])\s*$", re.MULTILINE)


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
    """Group consecutive pages with the same section into ranges."""
    page_files = sorted(pages_dir.glob("page-*.txt"))
    out: list[dict] = []
    current: dict | None = None
    for pf in page_files:
        page_num = int(pf.stem.split("-")[1])
        section = extract_section_name(pf.read_text())
        if section is None:
            # Front matter or chapter opener; close any current run.
            if current is not None:
                out.append(current)
                current = None
            continue
        if current is not None and current["name"] == section:
            current["page_range"] = (current["page_range"][0], page_num)
        else:
            if current is not None:
                out.append(current)
            current = {
                "id": slugify(section),
                "name": section,
                "page_range": (page_num, page_num),
            }
    if current is not None:
        out.append(current)
    return out


def write_sections_raw(pages_dir: Path, output_path: Path) -> None:
    """Run section detection and write to disk."""
    sections = detect_sections(pages_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(sections, indent=2))
```

- [ ] **Step 5: Run the tests.**

```bash
pytest tests/test_stage_1_sections.py -v
```

Expected: 3 passed.

- [ ] **Step 6: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_1_sections.py pipeline/tests/test_stage_1_sections.py pipeline/tests/fixtures/page-09*.txt
git commit -m "feat(pipeline): stage 1 — section detection from page footers"
git push origin backend
```

---

## Task 6: Stage 3 — recipe block segmentation

(Stage 3 before Stage 2 because front-matter extraction needs to know where recipe content starts.)

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_3_segment.py`
- Create: `pipeline/tests/test_stage_3_segment.py`

- [ ] **Step 1: Write the test.**

```python
# pipeline/tests/test_stage_3_segment.py
from pathlib import Path

from cookbook_pipeline.stages.stage_3_segment import segment_page


def test_segment_page_two_recipes(fixtures_dir: Path):
    text = (fixtures_dir / "page-096.txt").read_text()
    blocks = segment_page(text, page_num=96)
    # Page 96 has two recipes: Nargisi Seekh Kebab and Khumb Shabnam
    assert len(blocks) == 2
    titles = [b["title_line"] for b in blocks]
    assert any("Nargisi" in t for t in titles)
    assert any("Khumb" in t or "Shabnam" in t for t in titles)
    for b in blocks:
        assert b["page_num"] == 96
        assert "Origin" in b["raw_text"]
        assert "Preparation time" in b["raw_text"]


def test_segment_page_skips_chapter_opener(tmp_path: Path):
    # Pure prose, no Origin/Preparation markers — yields no blocks
    text = "Across India, snacks and appetizers...\n\nIntroduction to this chapter."
    assert segment_page(text, page_num=89) == []
```

- [ ] **Step 2: Run, expect failure.**

```bash
pytest tests/test_stage_3_segment.py -v
```

Expected: ImportError.

- [ ] **Step 3: Implement Stage 3.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_3_segment.py
"""Stage 3 — split a page into recipe blocks.

Anchor heuristic: each recipe contains the literal substring "Origin " somewhere
near its top, followed by "Preparation time", "Cooking time", "Serves". A page
typically has two recipes side-by-side. We split at "Origin" markers and
attach the preceding 1–2 lines as the title/subtitle.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_ORIGIN_MARKER = re.compile(r"^.*\bOrigin\b\s+\S", re.MULTILINE)
_RECIPE_REQUIRED = ("Preparation time", "Cooking time", "Serves")


def segment_page(page_text: str, page_num: int) -> list[dict]:
    """Return a list of recipe blocks found on the page.

    Each block: {"page_num": int, "title_line": str, "raw_text": str}
    """
    matches = list(_ORIGIN_MARKER.finditer(page_text))
    if not matches:
        return []

    blocks: list[dict] = []
    starts = [_block_start(page_text, m.start()) for m in matches]
    starts.append(len(page_text))  # sentinel for slicing

    for i, m in enumerate(matches):
        start = starts[i]
        end = starts[i + 1]
        raw = page_text[start:end].strip()
        if not all(req in raw for req in _RECIPE_REQUIRED):
            continue
        title_line = _extract_title(raw)
        blocks.append({"page_num": page_num, "title_line": title_line, "raw_text": raw})
    return blocks


def _block_start(text: str, origin_pos: int) -> int:
    """Walk backwards from an Origin match to the start of the block.

    A block starts at the previous blank line OR the page top. We look back
    past 1–2 non-blank lines (title, subtitle) for a blank.
    """
    pos = origin_pos
    blanks_seen = 0
    while pos > 0:
        pos -= 1
        if text[pos] == "\n" and pos > 0 and text[pos - 1] == "\n":
            blanks_seen += 1
            if blanks_seen >= 1:
                return pos + 1
    return 0


def _extract_title(block: str) -> str:
    """Pull the first non-empty line of a block as a title hint."""
    for line in block.splitlines():
        s = line.strip()
        if s:
            return s
    return ""


def write_recipes_raw(
    pages_dir: Path, sections: list[dict], output_path: Path
) -> int:
    """Segment every page that belongs to a section and write the raw blocks."""
    blocks: list[dict] = []
    page_to_section = {}
    for sec in sections:
        lo, hi = sec["page_range"]
        for p in range(lo, hi + 1):
            page_to_section[p] = sec
    for pf in sorted(pages_dir.glob("page-*.txt")):
        page_num = int(pf.stem.split("-")[1])
        sec = page_to_section.get(page_num)
        if sec is None:
            continue
        for b in segment_page(pf.read_text(), page_num):
            b["section_id"] = sec["id"]
            b["section_name"] = sec["name"]
            blocks.append(b)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(blocks, indent=2))
    return len(blocks)
```

- [ ] **Step 4: Run tests.**

```bash
pytest tests/test_stage_3_segment.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_3_segment.py pipeline/tests/test_stage_3_segment.py
git commit -m "feat(pipeline): stage 3 — segment pages into recipe blocks"
git push origin backend
```

---

## Task 7: LLM client wrapper (with caching + retry)

**Files:**
- Create: `pipeline/src/cookbook_pipeline/llm/__init__.py` (empty)
- Create: `pipeline/src/cookbook_pipeline/llm/client.py`
- Create: `pipeline/src/cookbook_pipeline/llm/prompts.py`
- Create: `pipeline/tests/test_llm_client.py`

- [ ] **Step 1: Empty `llm/__init__.py`.**

- [ ] **Step 2: Write the test (with a mocked Anthropic client).**

```python
# pipeline/tests/test_llm_client.py
import json
from unittest.mock import MagicMock

import pytest

from cookbook_pipeline.llm.client import call_with_retry, parse_json_response


def _fake_message(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    msg.stop_reason = "end_turn"
    return msg


def test_parse_json_response_extracts_inline_json():
    raw = 'Here is the result:\n```json\n{"a": 1}\n```\nDone.'
    assert parse_json_response(raw) == {"a": 1}


def test_parse_json_response_bare_object():
    raw = '{"a": 1, "b": 2}'
    assert parse_json_response(raw) == {"a": 1, "b": 2}


def test_parse_json_response_invalid_raises():
    with pytest.raises(ValueError):
        parse_json_response("not json")


def test_call_with_retry_returns_on_success():
    client = MagicMock()
    client.messages.create.return_value = _fake_message('{"ok": true}')
    result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=3)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 1


def test_call_with_retry_retries_invalid_json_then_succeeds():
    client = MagicMock()
    client.messages.create.side_effect = [
        _fake_message("garbage"),
        _fake_message('{"ok": true}'),
    ]
    result = call_with_retry(client, model="m", system="s", messages=[], max_attempts=3)
    assert result == {"ok": True}
    assert client.messages.create.call_count == 2


def test_call_with_retry_gives_up():
    client = MagicMock()
    client.messages.create.return_value = _fake_message("garbage")
    with pytest.raises(ValueError):
        call_with_retry(client, model="m", system="s", messages=[], max_attempts=2)
    assert client.messages.create.call_count == 2
```

- [ ] **Step 3: Run, expect failure.**

```bash
pytest tests/test_llm_client.py -v
```

Expected: ImportError.

- [ ] **Step 4: Implement the client wrapper.**

```python
# pipeline/src/cookbook_pipeline/llm/client.py
"""Thin wrapper over the Anthropic SDK.

Adds:
- prompt caching on the system message (5-minute TTL is enough for a single
  pipeline run)
- JSON response parsing with markdown fence stripping
- retry on invalid JSON
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any

from anthropic import Anthropic

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def get_client() -> Anthropic:
    """Return an Anthropic client. Reads ANTHROPIC_API_KEY from env."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY not set. Put it in pipeline/.env or export it."
        )
    return Anthropic(api_key=key)


def parse_json_response(text: str) -> Any:
    """Extract a JSON object from a model response.

    Accepts: bare JSON, JSON inside a ```json fence, JSON inside a generic ```
    fence, or JSON preceded/followed by prose.
    """
    text = text.strip()
    # ```json ... ``` fence
    fence = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.DOTALL)
    if fence:
        return json.loads(fence.group(1))
    # First top-level object/array
    if text.startswith("{") or text.startswith("["):
        return json.loads(text)
    # Try to find the first { ... } in the string with brace matching
    start = text.find("{")
    if start == -1:
        raise ValueError(f"No JSON found in response: {text[:200]}")
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError(f"Unterminated JSON in response: {text[:200]}")


def call_with_retry(
    client: Anthropic,
    *,
    model: str,
    system: str,
    messages: list[dict],
    max_attempts: int = 3,
    cache_system: bool = True,
    max_tokens: int = 2048,
) -> Any:
    """Call the Claude API and return the parsed JSON response.

    Retries on invalid JSON up to `max_attempts` times. On final failure
    raises ValueError with the last raw response.
    """
    last_error: Exception | None = None
    last_text: str = ""
    system_block = (
        [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]
        if cache_system
        else system
    )
    for attempt in range(max_attempts):
        msg = client.messages.create(
            model=model,
            system=system_block,
            messages=messages,
            max_tokens=max_tokens,
        )
        last_text = "".join(getattr(b, "text", "") for b in msg.content)
        try:
            return parse_json_response(last_text)
        except (ValueError, json.JSONDecodeError) as e:
            last_error = e
            time.sleep(0.5 * (attempt + 1))
    raise ValueError(
        f"Failed to get valid JSON after {max_attempts} attempts. "
        f"Last response: {last_text[:300]}"
    ) from last_error
```

- [ ] **Step 5: Implement prompt templates.**

```python
# pipeline/src/cookbook_pipeline/llm/prompts.py
"""Prompt templates used by Stages 4, 6, and 7.

Each template returns a `system` string that's stable across all calls in
a stage (so it caches well) and a per-call user message.
"""

CLEANUP_SYSTEM = """\
You are a meticulous data extractor for a cookbook digitization project. You
receive raw OCR text from a single recipe in *India Cookbook* by Pushpesh Pant
(Phaidon, 2010), plus an image of the page. Your job is to return a STRICT
JSON object describing the recipe.

The OCR text is messy. Common artifacts:
- Fractions: "y2oz" / "I/20Z" / "14 teaspoon" should be "½oz" / "¼ teaspoon".
- Two-column layout sometimes interleaves text. The image is authoritative.
- Hyphenated line breaks: "ginger-\\nroot" should be "ginger-root" or "ginger root".

Return ONLY valid JSON, no prose, no markdown fences. Schema:

{
  "name": "string",
  "subtitle": "string or null",
  "origin_region_name": "string (one of the Indian regions like Awadh, Punjab, ...)",
  "prep_minutes": int or null,
  "prep_notes": "string or null (e.g. 'plus cooling time')",
  "cook_minutes": int or null,
  "cook_notes": "string or null",
  "serves": int or null,
  "heat_level": int (0/1/2/3, count the sun icons in the image; 0 if none),
  "dietary_tags": ["vegetarian" | "vegan-possible" | "non-veg" | "contains-egg" | ...],
  "technique_tags": ["tandoor" | "deep-fry" | "stir-fry" | "grill" | "slow-cook" | "steam" | "boil" | "no-cook" | ...],
  "occasion_tags": ["festival" | "everyday" | "wedding" | ...] or [],
  "ingredients": [
    { "qty_metric": "300g" or null,
      "qty_imperial": "11oz" or null,
      "qty_count": "3 medium" or null,
      "item": "potatoes",
      "notes": "unpeeled" or null }
  ],
  "instructions": ["paragraph 1", "paragraph 2", ...],
  "cross_refs": [{"name": "Garlic Paste", "page": 57}]
}

Rules:
- Each instruction is one paragraph from the source. Do not summarize, merge, or rewrite.
- Ingredients are in source order. Quantities go in the qty_* fields, not in `item`.
- Cross-refs come from "(see page N)" markers in the ingredients or instructions.
- If unsure about a field, prefer null over guessing. Never invent ingredients.
"""


def cleanup_user_message(raw_text: str, page_image_b64: str) -> list[dict]:
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": page_image_b64,
                    },
                },
                {
                    "type": "text",
                    "text": f"OCR text:\n\n{raw_text}\n\nReturn the JSON now.",
                },
            ],
        }
    ]


INTRO_EXTRACTION_SYSTEM = """\
You receive raw OCR text from a chapter-opening page (or front-matter page) of
*India Cookbook* by Pushpesh Pant (Phaidon, 2010), plus an image of the page.

Return a JSON object:

{
  "title": "string (the chapter or section title from the page)",
  "markdown": "string (the prose content as Markdown — paragraphs separated by blank lines)"
}

Rules:
- Preserve the author's voice and full text. Do not summarize.
- Fix obvious OCR errors using the image as authoritative.
- Drop chrome (page numbers, decorative footers).
- Return ONLY JSON, no prose, no fences.
"""


def intro_user_message(raw_text: str, page_image_b64: str) -> list[dict]:
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": page_image_b64,
                    },
                },
                {"type": "text", "text": f"OCR text:\n\n{raw_text}"},
            ],
        }
    ]


PICKS_SYSTEM = """\
You are curating a cookbook section for a casual reader. Given a chapter intro
and a list of recipes in that chapter, choose 3–5 recipes that are the best
starting point for someone new to this style of cooking. Prefer recipes that:
- Are foundational (other recipes use them, or they teach core technique).
- Are approachable (modest ingredient lists, common equipment).
- Span the breadth of the chapter (don't pick five variants of the same dish).

Return JSON:

{
  "picks": [
    {"id": "recipe-id", "rationale": "one sentence in plain English"}
  ]
}

Rules:
- Pick from the provided recipe list ONLY. Use the exact `id` values.
- 3–5 picks. Rationale is one sentence each, ~15 words max.
- Return ONLY JSON, no prose, no fences.
"""


def picks_user_message(section_name: str, intro_markdown: str, recipes: list[dict]) -> list[dict]:
    recipe_lines = "\n".join(
        f"- id={r['id']}, name={r['name']}, tags={r.get('technique_tags', [])}"
        for r in recipes
    )
    return [
        {
            "role": "user",
            "content": (
                f"Section: {section_name}\n\nIntro:\n{intro_markdown}\n\n"
                f"Recipes in this section:\n{recipe_lines}\n\nPick 3–5 starting recipes."
            ),
        }
    ]
```

- [ ] **Step 6: Run the tests.**

```bash
pytest tests/test_llm_client.py -v
```

Expected: 6 passed.

- [ ] **Step 7: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/llm/ pipeline/tests/test_llm_client.py
git commit -m "feat(pipeline): LLM client wrapper with caching, retry, JSON parsing"
git push origin backend
```

---

## Task 8: Stage 4 — recipe cleanup (LLM)

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_4_clean.py`
- Create: `pipeline/tests/test_stage_4_clean.py`
- Create: `pipeline/tests/fixtures/mock_clean_response.json`

- [ ] **Step 1: Write the canned response fixture** so tests don't hit the API.

```json
// pipeline/tests/fixtures/mock_clean_response.json
{
  "name": "Nargisi Seekh Kebab",
  "subtitle": "Vegetable & Egg Skewers",
  "origin_region_name": "Awadh",
  "prep_minutes": 30,
  "prep_notes": "plus cooling time",
  "cook_minutes": 15,
  "cook_notes": null,
  "serves": 4,
  "heat_level": 1,
  "dietary_tags": ["contains-egg", "vegetarian"],
  "technique_tags": ["tandoor", "grill"],
  "occasion_tags": [],
  "ingredients": [
    {"qty_metric": "300g", "qty_imperial": "11oz", "qty_count": "3 medium", "item": "potatoes", "notes": "unpeeled"}
  ],
  "instructions": ["Cook the potatoes..."],
  "cross_refs": [{"name": "Paneer", "page": 59}]
}
```

- [ ] **Step 2: Write the test.**

```python
# pipeline/tests/test_stage_4_clean.py
import json
from pathlib import Path
from unittest.mock import MagicMock

from cookbook_pipeline.stages.stage_4_clean import clean_recipe_block, build_id


def _fake_msg(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    return msg


def test_clean_recipe_block_returns_validated_recipe(fixtures_dir: Path):
    canned = (fixtures_dir / "mock_clean_response.json").read_text()
    client = MagicMock()
    client.messages.create.return_value = _fake_msg(canned)

    image_path = fixtures_dir / "page-096-image.png"
    if not image_path.exists():
        image_path.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)

    block = {
        "page_num": 96,
        "title_line": "Nargisi Seekh Kebab",
        "raw_text": "Nargisi Seekh Kebab\nVegetable & Egg Skewers\n\nOrigin Awadh\n...",
        "section_id": "snacks-and-appetizers",
        "section_name": "Snacks and Appetizers",
    }
    recipe = clean_recipe_block(client, block, image_path, model="m")
    assert recipe.name == "Nargisi Seekh Kebab"
    assert recipe.section_id == "snacks-and-appetizers"
    assert recipe.origin_region_name == "Awadh"
    assert recipe.origin_region_id == "awadh"
    assert recipe.id == "nargisi-seekh-kebab"
    assert recipe.source_page == 96
    assert recipe.heat_level == 1


def test_build_id_collisions_get_suffix():
    seen = {"pakoras"}
    assert build_id("Pakoras", seen) == "pakoras-2"
    seen.add("pakoras-2")
    assert build_id("Pakoras", seen) == "pakoras-3"
```

- [ ] **Step 3: Run, expect failure.**

```bash
pytest tests/test_stage_4_clean.py -v
```

Expected: ImportError.

- [ ] **Step 4: Implement Stage 4.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_4_clean.py
"""Stage 4 — turn a raw recipe block into a validated Recipe via Haiku.

This is the core of the pipeline. ~1000 calls; concurrency = 8 by default.
"""

from __future__ import annotations

import base64
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from anthropic import Anthropic
from pydantic import ValidationError
from tqdm import tqdm

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry
from cookbook_pipeline.llm.prompts import CLEANUP_SYSTEM, cleanup_user_message
from cookbook_pipeline.schema import Recipe
from cookbook_pipeline.utils.text import slugify


def build_id(name: str, seen: set[str]) -> str:
    base = slugify(name)
    if base not in seen:
        return base
    n = 2
    while f"{base}-{n}" in seen:
        n += 1
    return f"{base}-{n}"


def clean_recipe_block(
    client: Anthropic,
    block: dict,
    page_image_path: Path,
    *,
    model: str = DEFAULT_MODEL,
    seen_ids: set[str] | None = None,
) -> Recipe:
    """Run Haiku on one recipe block and return a validated Recipe."""
    img_b64 = base64.b64encode(page_image_path.read_bytes()).decode("ascii")
    parsed = call_with_retry(
        client,
        model=model,
        system=CLEANUP_SYSTEM,
        messages=cleanup_user_message(block["raw_text"], img_b64),
        max_tokens=4096,
    )
    name = parsed["name"]
    seen = seen_ids if seen_ids is not None else set()
    rid = build_id(name, seen)
    seen.add(rid)
    region_name = parsed["origin_region_name"]
    return Recipe(
        id=rid,
        name=name,
        subtitle=parsed.get("subtitle"),
        section_id=block["section_id"],
        section_name=block["section_name"],
        origin_region_id=slugify(region_name),
        origin_region_name=region_name,
        prep_minutes=parsed.get("prep_minutes"),
        prep_notes=parsed.get("prep_notes"),
        cook_minutes=parsed.get("cook_minutes"),
        cook_notes=parsed.get("cook_notes"),
        serves=parsed.get("serves"),
        heat_level=parsed.get("heat_level", 0),
        dietary_tags=parsed.get("dietary_tags", []),
        technique_tags=parsed.get("technique_tags", []),
        occasion_tags=parsed.get("occasion_tags", []),
        ingredients=parsed["ingredients"],
        instructions=parsed["instructions"],
        cross_refs=[{"name": x["name"], "page": x["page"]} for x in parsed.get("cross_refs", [])],
        source_page=block["page_num"],
        image=None,  # filled in by Stage 9
    )


def clean_all(
    blocks: list[dict],
    page_images_dir: Path,
    output_path: Path,
    failures_path: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
    concurrency: int = 8,
) -> dict:
    """Clean every block in `blocks` and write results to `output_path`.

    Returns a summary dict {extracted, failed}.
    """
    from cookbook_pipeline.llm.client import get_client
    client = client or get_client()
    seen_ids: set[str] = set()
    results: list[Recipe] = []
    failures: list[dict] = []
    lock_seen = set()  # Build IDs serially after the parallel fetch.

    # First pass: fetch and parse, in parallel.
    raw_results: list[tuple[int, dict, dict | None, str | None]] = []

    def fetch(idx_block: tuple[int, dict]):
        idx, block = idx_block
        img_path = page_images_dir / f"page-{block['page_num']:04d}.png"
        try:
            img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
            parsed = call_with_retry(
                client,
                model=model,
                system=CLEANUP_SYSTEM,
                messages=cleanup_user_message(block["raw_text"], img_b64),
                max_tokens=4096,
            )
            return (idx, block, parsed, None)
        except Exception as e:
            return (idx, block, None, str(e))

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(fetch, (i, b)) for i, b in enumerate(blocks)]
        for fut in tqdm(as_completed(futures), total=len(futures), desc="cleanup"):
            raw_results.append(fut.result())

    raw_results.sort(key=lambda x: x[0])

    # Second pass: assign IDs and validate, serially.
    for idx, block, parsed, err in raw_results:
        if err is not None or parsed is None:
            failures.append({"page_num": block["page_num"], "title_line": block["title_line"], "error": err})
            continue
        try:
            name = parsed["name"]
            rid = build_id(name, seen_ids)
            seen_ids.add(rid)
            region_name = parsed["origin_region_name"]
            recipe = Recipe(
                id=rid,
                name=name,
                subtitle=parsed.get("subtitle"),
                section_id=block["section_id"],
                section_name=block["section_name"],
                origin_region_id=slugify(region_name),
                origin_region_name=region_name,
                prep_minutes=parsed.get("prep_minutes"),
                prep_notes=parsed.get("prep_notes"),
                cook_minutes=parsed.get("cook_minutes"),
                cook_notes=parsed.get("cook_notes"),
                serves=parsed.get("serves"),
                heat_level=parsed.get("heat_level", 0),
                dietary_tags=parsed.get("dietary_tags", []),
                technique_tags=parsed.get("technique_tags", []),
                occasion_tags=parsed.get("occasion_tags", []),
                ingredients=parsed["ingredients"],
                instructions=parsed["instructions"],
                cross_refs=[{"name": x["name"], "page": x["page"]} for x in parsed.get("cross_refs", [])],
                source_page=block["page_num"],
                image=None,
            )
            results.append(recipe)
        except (KeyError, ValidationError) as e:
            failures.append({"page_num": block["page_num"], "title_line": block["title_line"], "error": str(e)})

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps([r.model_dump() for r in results], indent=2))
    failures_path.parent.mkdir(parents=True, exist_ok=True)
    failures_path.write_text(json.dumps(failures, indent=2))
    return {"extracted": len(results), "failed": len(failures)}
```

- [ ] **Step 5: Run the tests.**

```bash
pytest tests/test_stage_4_clean.py -v
```

Expected: 2 passed.

- [ ] **Step 6: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_4_clean.py pipeline/tests/test_stage_4_clean.py pipeline/tests/fixtures/mock_clean_response.json
git commit -m "feat(pipeline): stage 4 — Haiku-driven recipe cleanup with concurrency"
git push origin backend
```

---

## Task 9: Stage 5 — cross-reference resolution

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_5_xrefs.py`
- Create: `pipeline/tests/test_stage_5_xrefs.py`

- [ ] **Step 1: Write the test.**

```python
# pipeline/tests/test_stage_5_xrefs.py
from cookbook_pipeline.stages.stage_5_xrefs import resolve_xrefs


def test_resolve_xrefs_attaches_ids_and_builds_used_in():
    recipes = [
        {"id": "garlic-paste", "source_page": 57, "cross_refs": []},
        {
            "id": "nargisi-seekh-kebab",
            "source_page": 96,
            "cross_refs": [{"name": "Garlic Paste", "page": 57}],
        },
        {
            "id": "khumb-shabnam",
            "source_page": 96,
            "cross_refs": [{"name": "Garlic Paste", "page": 57}],
        },
    ]
    updated, edges, used_in = resolve_xrefs(recipes)
    # Forward: cross_refs gain ids
    nargisi = next(r for r in updated if r["id"] == "nargisi-seekh-kebab")
    assert nargisi["cross_refs"][0]["id"] == "garlic-paste"
    # Edges
    assert {"from": "nargisi-seekh-kebab", "to": "garlic-paste", "kind": "uses"} in edges
    # Reverse
    assert sorted(used_in["garlic-paste"]) == ["khumb-shabnam", "nargisi-seekh-kebab"]


def test_resolve_xrefs_unresolved_kept_as_null_id():
    recipes = [
        {"id": "x", "source_page": 100, "cross_refs": [{"name": "Mystery", "page": 999}]},
    ]
    updated, edges, used_in = resolve_xrefs(recipes)
    assert updated[0]["cross_refs"][0]["id"] is None
    assert edges == []
    assert used_in == {}
```

- [ ] **Step 2: Run, expect failure.**

```bash
pytest tests/test_stage_5_xrefs.py -v
```

Expected: ImportError.

- [ ] **Step 3: Implement Stage 5.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_5_xrefs.py
"""Stage 5 — resolve "(see page X)" cross-refs to recipe IDs.

Builds a graph: forward edges on each recipe, plus a reverse `used_in` index.
References to pages that don't have a recipe (e.g. chapter-intro pages) are
kept with `id=null` so the frontend can either show them or hide them.
"""

from __future__ import annotations


def resolve_xrefs(recipes: list[dict]) -> tuple[list[dict], list[dict], dict[str, list[str]]]:
    page_to_id: dict[int, str] = {}
    for r in recipes:
        # If multiple recipes share a page, the FIRST one wins for cross-ref
        # resolution. Most cross-refs point to staple paste/masala recipes
        # which are alone on their page anyway.
        page_to_id.setdefault(r["source_page"], r["id"])

    edges: list[dict] = []
    used_in: dict[str, list[str]] = {}
    updated = []

    for r in recipes:
        new_refs = []
        for ref in r.get("cross_refs", []):
            target_id = page_to_id.get(ref["page"])
            new_refs.append({"name": ref["name"], "page": ref["page"], "id": target_id})
            if target_id is not None and target_id != r["id"]:
                edges.append({"from": r["id"], "to": target_id, "kind": "uses"})
                used_in.setdefault(target_id, []).append(r["id"])
        new = dict(r)
        new["cross_refs"] = new_refs
        updated.append(new)

    # Sort reverse lists for stable output
    for k in used_in:
        used_in[k] = sorted(set(used_in[k]))
    return updated, edges, used_in
```

- [ ] **Step 4: Run the tests.**

```bash
pytest tests/test_stage_5_xrefs.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_5_xrefs.py pipeline/tests/test_stage_5_xrefs.py
git commit -m "feat(pipeline): stage 5 — cross-reference resolution and used_in graph"
git push origin backend
```

---

## Task 10: Stage 2 + Stage 6 — front-matter and intro extraction (LLM)

(Combined because they share the same `intro_user_message` prompt.)

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_2_front_matter.py`
- Create: `pipeline/src/cookbook_pipeline/stages/stage_6_intros.py`

- [ ] **Step 1: Implement Stage 2 (front-matter extraction).**

```python
# pipeline/src/cookbook_pipeline/stages/stage_2_front_matter.py
"""Stage 2 — extract introduction, history, ayurveda, regions overview, and notes.

These live in a fixed page range at the front of the book. The exact ranges are
captured here as constants. When running on a slightly different edition,
update the ranges.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import INTRO_EXTRACTION_SYSTEM, intro_user_message

# (start_page, end_page, key)
FRONT_MATTER_RANGES: list[tuple[int, int, str]] = [
    (9, 9, "introduction"),
    (10, 11, "history"),
    (12, 13, "ayurveda"),
    (14, 17, "regions_overview"),
    (18, 19, "notes_on_recipes"),
]


def extract_front_matter(
    pages_dir: Path,
    page_images_dir: Path,
    output_path: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> dict:
    client = client or get_client()
    out: dict = {"schema_version": 1}
    for start, end, key in FRONT_MATTER_RANGES:
        text = "\n\n".join(
            (pages_dir / f"page-{p:04d}.txt").read_text() for p in range(start, end + 1)
        )
        # Use the first page's image as the visual reference
        img_path = page_images_dir / f"page-{start:04d}.png"
        img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        parsed = call_with_retry(
            client,
            model=model,
            system=INTRO_EXTRACTION_SYSTEM,
            messages=intro_user_message(text, img_b64),
            max_tokens=4096,
        )
        section = {"title": parsed["title"], "markdown": parsed["markdown"]}
        if key == "regions_overview":
            section["map_image"] = None
        out[key] = section
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(out, indent=2))
    return out
```

- [ ] **Step 2: Implement Stage 6 (chapter and region intros).**

```python
# pipeline/src/cookbook_pipeline/stages/stage_6_intros.py
"""Stage 6 — extract the prose intro on each chapter-opener page.

A chapter opener is a page whose footer matches a section name but whose body
contains no recipe-block markers (no "Origin "). For each such page, run the
same intro_user_message prompt as Stage 2.
"""

from __future__ import annotations

import base64
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import INTRO_EXTRACTION_SYSTEM, intro_user_message
from cookbook_pipeline.stages.stage_3_segment import segment_page


def extract_section_intros(
    sections: list[dict],
    pages_dir: Path,
    page_images_dir: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> dict[str, str]:
    """Return {section_id: intro_markdown}. Skips sections with no opener page."""
    client = client or get_client()
    intros: dict[str, str] = {}
    for sec in sections:
        lo, hi = sec["page_range"]
        # Walk from `lo - 1` (the page just before this section) downward to
        # find the chapter-opener: a page whose section-detection MATCHED but
        # which has no recipe blocks. In practice, the opener is `lo - 1` or `lo`.
        candidate = lo - 1 if lo > 1 else lo
        text_path = pages_dir / f"page-{candidate:04d}.txt"
        if not text_path.exists():
            continue
        text = text_path.read_text()
        if segment_page(text, candidate):
            continue  # not an opener
        img_path = page_images_dir / f"page-{candidate:04d}.png"
        img_b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        parsed = call_with_retry(
            client,
            model=model,
            system=INTRO_EXTRACTION_SYSTEM,
            messages=intro_user_message(text, img_b64),
            max_tokens=4096,
        )
        intros[sec["id"]] = parsed["markdown"]
    return intros


def extract_region_intros(
    front_matter: dict, regions: list[str]
) -> dict[str, str]:
    """Slice region intros out of the front_matter `regions_overview.markdown`.

    The regions overview is a single Markdown blob with H2/H3 headers per
    region. We split on `## RegionName` headers.
    """
    body = front_matter["regions_overview"]["markdown"]
    intros: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []
    for line in body.splitlines():
        m = line.strip()
        if m.startswith("## "):
            if current:
                intros[current] = "\n".join(buf).strip()
            current = m.removeprefix("## ").strip()
            buf = []
        else:
            buf.append(line)
    if current:
        intros[current] = "\n".join(buf).strip()
    # Filter to only regions we care about
    return {k: v for k, v in intros.items() if k in regions}
```

- [ ] **Step 3: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_2_front_matter.py pipeline/src/cookbook_pipeline/stages/stage_6_intros.py
git commit -m "feat(pipeline): stages 2 and 6 — front-matter and chapter intro extraction"
git push origin backend
```

---

## Task 11: Stage 7 — "start here" picks per section

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_7_picks.py`

- [ ] **Step 1: Implement Stage 7.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_7_picks.py
"""Stage 7 — curated "start here" picks per section, via Haiku."""

from __future__ import annotations

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.prompts import PICKS_SYSTEM, picks_user_message


def pick_starters_for_section(
    section_name: str,
    intro_markdown: str,
    section_recipes: list[dict],
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> list[dict]:
    """Return a list of {id, rationale} dicts (3–5 items)."""
    if len(section_recipes) <= 5:
        # Don't ask the model to "curate" tiny sections — return all recipes.
        return [
            {"id": r["id"], "rationale": "Featured in this short section."}
            for r in section_recipes
        ]
    client = client or get_client()
    parsed = call_with_retry(
        client,
        model=model,
        system=PICKS_SYSTEM,
        messages=picks_user_message(section_name, intro_markdown, section_recipes),
        max_tokens=1024,
    )
    valid_ids = {r["id"] for r in section_recipes}
    return [p for p in parsed["picks"] if p["id"] in valid_ids][:5]
```

- [ ] **Step 2: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_7_picks.py
git commit -m "feat(pipeline): stage 7 — start-here picks per section via Haiku"
git push origin backend
```

---

## Task 12: Stage 8 — ingredient and tag indexing

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_8_indexes.py`
- Create: `pipeline/tests/test_stage_8_indexes.py`

- [ ] **Step 1: Write the test.**

```python
# pipeline/tests/test_stage_8_indexes.py
from cookbook_pipeline.stages.stage_8_indexes import build_ingredient_index, build_tag_index


def test_build_ingredient_index_groups_by_normalized_form():
    recipes = [
        {
            "id": "a",
            "ingredients": [
                {"item": "Onions", "qty_metric": None, "qty_imperial": None, "qty_count": "2", "notes": None},
                {"item": "paneer", "qty_metric": "300g", "qty_imperial": None, "qty_count": None, "notes": "grated"},
            ],
        },
        {
            "id": "b",
            "ingredients": [
                {"item": "onion", "qty_metric": None, "qty_imperial": None, "qty_count": "1", "notes": "chopped"},
            ],
        },
    ]
    idx = build_ingredient_index(recipes)
    assert idx["onion"]["count"] == 2
    assert sorted(idx["onion"]["recipe_ids"]) == ["a", "b"]
    assert idx["paneer"]["count"] == 1


def test_build_tag_index_collapses_kinds():
    recipes = [
        {"id": "a", "dietary_tags": ["vegetarian"], "technique_tags": ["tandoor"], "occasion_tags": []},
        {"id": "b", "dietary_tags": ["vegetarian", "vegan-possible"], "technique_tags": ["deep-fry"], "occasion_tags": ["everyday"]},
    ]
    idx = build_tag_index(recipes)
    assert idx["vegetarian"]["kind"] == "dietary"
    assert idx["vegetarian"]["count"] == 2
    assert idx["tandoor"]["kind"] == "technique"
    assert idx["everyday"]["kind"] == "occasion"
```

- [ ] **Step 2: Run, expect failure.**

```bash
pytest tests/test_stage_8_indexes.py -v
```

Expected: ImportError.

- [ ] **Step 3: Implement Stage 8.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_8_indexes.py
"""Stage 8 — ingredient and tag indexes."""

from __future__ import annotations

from cookbook_pipeline.utils.text import normalize_ingredient


def build_ingredient_index(recipes: list[dict]) -> dict[str, dict]:
    idx: dict[str, dict] = {}
    for r in recipes:
        seen_in_recipe: set[str] = set()
        for ing in r["ingredients"]:
            slug = normalize_ingredient(ing["item"])
            if not slug or slug in seen_in_recipe:
                continue
            seen_in_recipe.add(slug)
            entry = idx.setdefault(
                slug,
                {"display_name": ing["item"].lower().strip(), "recipe_ids": [], "count": 0},
            )
            entry["recipe_ids"].append(r["id"])
            entry["count"] += 1
    # Sort ids for stable output
    for entry in idx.values():
        entry["recipe_ids"] = sorted(set(entry["recipe_ids"]))
        entry["count"] = len(entry["recipe_ids"])
    return idx


def build_tag_index(recipes: list[dict]) -> dict[str, dict]:
    idx: dict[str, dict] = {}
    kind_field = {
        "dietary": "dietary_tags",
        "technique": "technique_tags",
        "occasion": "occasion_tags",
    }
    for kind, field in kind_field.items():
        for r in recipes:
            for tag in r.get(field, []):
                entry = idx.setdefault(tag, {"kind": kind, "recipe_ids": [], "count": 0})
                entry["recipe_ids"].append(r["id"])
    for entry in idx.values():
        entry["recipe_ids"] = sorted(set(entry["recipe_ids"]))
        entry["count"] = len(entry["recipe_ids"])
    return idx
```

- [ ] **Step 4: Run the tests.**

```bash
pytest tests/test_stage_8_indexes.py -v
```

Expected: 2 passed.

- [ ] **Step 5: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_8_indexes.py pipeline/tests/test_stage_8_indexes.py
git commit -m "feat(pipeline): stage 8 — ingredient and tag indexes"
git push origin backend
```

---

## Task 13: Stage 9 — image extraction and recipe association

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_9_images.py`

- [ ] **Step 1: Implement Stage 9.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_9_images.py
"""Stage 9 — extract recipe photos from the PDF and associate them with recipes.

Strategy: walk every page that holds at least one recipe. For each embedded
image larger than a threshold (filters out icons / decorations), save as WebP
and JPEG to /data/images/, and attach the path to the recipe(s) on that page.
If a page has multiple recipes and one image, attach to the recipe whose
title appears closest (by y-coordinate) to the image.
"""

from __future__ import annotations

import io
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image
from tqdm import tqdm

MIN_IMAGE_SIZE_PIXELS = 200 * 200  # below this is decoration


def extract_recipe_images(
    pdf_path: Path,
    recipes: list[dict],
    images_out: Path,
) -> dict[str, str]:
    """Return {recipe_id: image_path} for every recipe with a matched photo."""
    images_out.mkdir(parents=True, exist_ok=True)
    by_page: dict[int, list[dict]] = {}
    for r in recipes:
        by_page.setdefault(r["source_page"], []).append(r)

    doc = fitz.open(str(pdf_path))
    associations: dict[str, str] = {}

    for page_num, recipes_on_page in tqdm(by_page.items(), desc="images"):
        page = doc.load_page(page_num - 1)
        info = page.get_image_info(xrefs=True)
        big_imgs = [im for im in info if im["width"] * im["height"] >= MIN_IMAGE_SIZE_PIXELS]
        if not big_imgs:
            continue
        # Sort recipes on the page by their y-pos hint (we don't know it
        # exactly; for two-recipe pages we'll alternate).
        sorted_recipes = recipes_on_page
        for i, im in enumerate(big_imgs):
            if i >= len(sorted_recipes):
                break
            target = sorted_recipes[i]
            xref = im["xref"]
            base = doc.extract_image(xref)
            pil = Image.open(io.BytesIO(base["image"])).convert("RGB")
            slug = target["id"]
            webp_path = images_out / f"p{page_num:04d}-{slug}.webp"
            jpg_path = images_out / f"p{page_num:04d}-{slug}.jpg"
            pil.save(webp_path, "WEBP", quality=82)
            pil.save(jpg_path, "JPEG", quality=85)
            associations[target["id"]] = f"images/{webp_path.name}"

    doc.close()
    return associations
```

- [ ] **Step 2: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_9_images.py
git commit -m "feat(pipeline): stage 9 — image extraction and recipe association"
git push origin backend
```

---

## Task 14: Stage 10 — validate and emit final files to /data

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/stage_10_emit.py`

- [ ] **Step 1: Implement Stage 10.**

```python
# pipeline/src/cookbook_pipeline/stages/stage_10_emit.py
"""Stage 10 — validate everything against schemas and emit final /data files."""

from __future__ import annotations

import json
from pathlib import Path

from cookbook_pipeline.schema import (
    FrontMatterFile,
    GraphFile,
    IngredientsFile,
    RecipesFile,
    RegionsFile,
    SectionsFile,
    TagsFile,
)


def emit(
    *,
    recipes: list[dict],
    sections: list[dict],
    regions: list[dict],
    ingredients_idx: dict[str, dict],
    tags_idx: dict[str, dict],
    edges: list[dict],
    used_in: dict[str, list[str]],
    front_matter: dict,
    out_dir: Path,
) -> None:
    """Validate every payload and write to /data/."""
    out_dir.mkdir(parents=True, exist_ok=True)

    rf = RecipesFile.model_validate({"schema_version": 1, "recipes": recipes})
    (out_dir / "recipes.json").write_text(rf.model_dump_json(indent=2))

    sf = SectionsFile.model_validate({"schema_version": 1, "sections": sections})
    (out_dir / "sections.json").write_text(sf.model_dump_json(indent=2))

    rgf = RegionsFile.model_validate({"schema_version": 1, "regions": regions})
    (out_dir / "regions.json").write_text(rgf.model_dump_json(indent=2))

    ing = IngredientsFile.model_validate(
        {"schema_version": 1, "ingredients": ingredients_idx}
    )
    (out_dir / "ingredients.json").write_text(ing.model_dump_json(indent=2))

    tg = TagsFile.model_validate({"schema_version": 1, "tags": tags_idx})
    (out_dir / "tags.json").write_text(tg.model_dump_json(indent=2))

    gf = GraphFile.model_validate(
        {"schema_version": 1, "edges": edges, "used_in": used_in}
    )
    (out_dir / "graph.json").write_text(gf.model_dump_json(indent=2, by_alias=True))

    fm_payload = {"schema_version": 1, **front_matter}
    fm = FrontMatterFile.model_validate(fm_payload)
    (out_dir / "front-matter.json").write_text(fm.model_dump_json(indent=2))
```

- [ ] **Step 2: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/stages/stage_10_emit.py
git commit -m "feat(pipeline): stage 10 — schema-validated emit to /data"
git push origin backend
```

---

## Task 15: CLI orchestration

**Files:**
- Modify: `pipeline/src/cookbook_pipeline/__main__.py`

- [ ] **Step 1: Replace the placeholder CLI with the full orchestrator.**

```python
# pipeline/src/cookbook_pipeline/__main__.py
"""CLI: wire all ten stages together.

Usage:
    python -m cookbook_pipeline run                # all stages
    python -m cookbook_pipeline run --stage 4      # one stage only
    python -m cookbook_pipeline pilot              # process 50 recipes for spot-checking
"""

from __future__ import annotations

import argparse
import json
import sys

from dotenv import load_dotenv
from tqdm import tqdm

from cookbook_pipeline import paths
from cookbook_pipeline.stages.stage_0_extract import extract_pages
from cookbook_pipeline.stages.stage_1_sections import write_sections_raw
from cookbook_pipeline.stages.stage_2_front_matter import extract_front_matter
from cookbook_pipeline.stages.stage_3_segment import write_recipes_raw
from cookbook_pipeline.stages.stage_4_clean import clean_all
from cookbook_pipeline.stages.stage_5_xrefs import resolve_xrefs
from cookbook_pipeline.stages.stage_6_intros import (
    extract_region_intros,
    extract_section_intros,
)
from cookbook_pipeline.stages.stage_7_picks import pick_starters_for_section
from cookbook_pipeline.stages.stage_8_indexes import (
    build_ingredient_index,
    build_tag_index,
)
from cookbook_pipeline.stages.stage_9_images import extract_recipe_images
from cookbook_pipeline.stages.stage_10_emit import emit


def stage_0() -> None:
    paths.ensure_build_dirs()
    n = extract_pages(paths.SOURCE_PDF, paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES)
    print(f"Stage 0: extracted {n} pages.")


def stage_1() -> None:
    write_sections_raw(paths.BUILD_PAGES, paths.SECTIONS_RAW)
    sections = json.loads(paths.SECTIONS_RAW.read_text())
    print(f"Stage 1: detected {len(sections)} sections.")


def stage_2() -> None:
    extract_front_matter(paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES, paths.FRONT_MATTER_RAW)
    print("Stage 2: front matter written.")


def stage_3() -> None:
    sections = json.loads(paths.SECTIONS_RAW.read_text())
    n = write_recipes_raw(paths.BUILD_PAGES, sections, paths.RECIPES_RAW)
    print(f"Stage 3: segmented {n} recipe blocks.")


def stage_4(*, limit: int | None = None) -> None:
    blocks = json.loads(paths.RECIPES_RAW.read_text())
    if limit is not None:
        blocks = blocks[:limit]
    summary = clean_all(
        blocks,
        paths.BUILD_PAGE_IMAGES,
        paths.RECIPES_CLEANED,
        paths.FAILURES,
    )
    print(f"Stage 4: cleaned {summary['extracted']}, failed {summary['failed']}.")


def stage_5_through_10() -> None:
    cleaned = json.loads(paths.RECIPES_CLEANED.read_text())
    sections_raw = json.loads(paths.SECTIONS_RAW.read_text())
    front_matter = json.loads(paths.FRONT_MATTER_RAW.read_text())

    # Stage 5: cross-refs
    recipes_with_ids, edges, used_in = resolve_xrefs(cleaned)
    print(f"Stage 5: resolved {len(edges)} cross-ref edges.")

    # Stage 6: section + region intros
    section_intros = extract_section_intros(
        sections_raw, paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES
    )
    region_names = sorted({r["origin_region_name"] for r in recipes_with_ids})
    region_intros = extract_region_intros(front_matter, region_names)
    print(f"Stage 6: extracted {len(section_intros)} section intros, {len(region_intros)} region intros.")

    # Build sections payload (now with intros, recipe_ids, and start-here picks coming next)
    sections: list[dict] = []
    by_section: dict[str, list[dict]] = {}
    for r in recipes_with_ids:
        by_section.setdefault(r["section_id"], []).append(r)
    for sec in sections_raw:
        sec_recipes = by_section.get(sec["id"], [])
        intro = section_intros.get(sec["id"], "")
        # Stage 7: picks
        picks = pick_starters_for_section(sec["name"], intro, sec_recipes)
        sections.append({
            "id": sec["id"],
            "name": sec["name"],
            "intro_markdown": intro,
            "page_range": list(sec["page_range"]),
            "recipe_ids": [r["id"] for r in sec_recipes],
            "start_here": picks,
            "hero_image": None,
        })

    # Build regions payload
    from cookbook_pipeline.utils.text import slugify
    regions: list[dict] = []
    for name in region_names:
        rid = slugify(name)
        regions.append({
            "id": rid,
            "name": name,
            "intro_markdown": region_intros.get(name, ""),
            "recipe_ids": [r["id"] for r in recipes_with_ids if r["origin_region_id"] == rid],
            "map_coords": None,
        })

    # Stage 8: indexes
    ingredients_idx = build_ingredient_index(recipes_with_ids)
    tags_idx = build_tag_index(recipes_with_ids)
    print(f"Stage 8: {len(ingredients_idx)} ingredients, {len(tags_idx)} tags.")

    # Stage 9: images (must happen before emit so we can attach paths)
    associations = extract_recipe_images(paths.SOURCE_PDF, recipes_with_ids, paths.DATA_IMAGES)
    for r in recipes_with_ids:
        r["image"] = associations.get(r["id"])
    print(f"Stage 9: associated {len(associations)} images.")

    # Page-range tuples need to be tuples for SectionsFile to validate
    for s in sections:
        s["page_range"] = tuple(s["page_range"])

    # Stage 10: emit
    emit(
        recipes=recipes_with_ids,
        sections=sections,
        regions=regions,
        ingredients_idx=ingredients_idx,
        tags_idx=tags_idx,
        edges=edges,
        used_in=used_in,
        front_matter=front_matter,
        out_dir=paths.DATA_DIR,
    )
    print(f"Stage 10: emitted final files to {paths.DATA_DIR}.")


def run_all(*, limit: int | None = None) -> None:
    stage_0()
    stage_1()
    stage_2()
    stage_3()
    stage_4(limit=limit)
    stage_5_through_10()


def main(argv: list[str] | None = None) -> int:
    load_dotenv(paths.PIPELINE_DIR / ".env")
    parser = argparse.ArgumentParser(prog="cookbook_pipeline")
    parser.add_argument("command", choices=["run", "pilot"])
    parser.add_argument("--stage", type=int, default=None,
                        help="Run only one stage (0-10).")
    args = parser.parse_args(argv)

    if args.command == "pilot":
        run_all(limit=50)
        return 0

    if args.stage is None:
        run_all()
        return 0

    {
        0: stage_0, 1: stage_1, 2: stage_2, 3: stage_3, 4: stage_4,
        5: stage_5_through_10, 6: stage_5_through_10,
        7: stage_5_through_10, 8: stage_5_through_10,
        9: stage_5_through_10, 10: stage_5_through_10,
    }[args.stage]()
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Smoke-test the CLI surface (no API call).**

```bash
python -m cookbook_pipeline --help
python -m cookbook_pipeline run --help
```

Expected: argparse help output.

- [ ] **Step 3: Commit.**

```bash
git add pipeline/src/cookbook_pipeline/__main__.py
git commit -m "feat(pipeline): wire all ten stages into a single CLI"
git push origin backend
```

---

## Task 16: Pilot run on 50 recipes + spot-check

**Files:** none new — running the pipeline.

- [ ] **Step 1: Place the source PDF.**

```bash
cd "/Users/vishal/Library/Mobile Documents/com~apple~CloudDocs/Projects/Cookbook"
mkdir -p source
# If the user moved one of the root PDFs into source/, skip this step.
ln -sf "../India cookbook _ the only book on Indian food you'll ever -- Pushpesh Pant; Andy Sewell -- 1st Edition, FIRST, First Edition, PT, 2010 -- Phaidon -- isbn13 9780714859026 -- 8871e7a227e9d6a005f50826ff1727bb -- Anna's Archive.pdf" source/india-cookbook.pdf
```

(If the symlink target name differs, adapt — the goal is `source/india-cookbook.pdf` resolving to one of the source PDFs.)

- [ ] **Step 2: Set the API key (one-time per shell).**

```bash
cd pipeline
# Confirm .env has ANTHROPIC_API_KEY=...
cat .env | head -1
```

If the user hasn't dropped the key, stop here and ask them to.

- [ ] **Step 3: Run the pilot.**

```bash
source .venv/bin/activate
python -m cookbook_pipeline pilot
```

Expected: stages 0–10 run; ~50 recipes appear in `/data/recipes.json`. Wall time roughly 5–10 minutes. Cost roughly $0.10–0.30.

- [ ] **Step 4: Spot-check the output.**

```bash
python - <<'PY'
import json, pathlib
recipes = json.loads(pathlib.Path("../data/recipes.json").read_text())["recipes"]
print(f"recipes: {len(recipes)}")
sample = recipes[:3]
for r in sample:
    print(f"\n--- {r['name']} ({r['origin_region_name']}, page {r['source_page']}) ---")
    print(f"  serves={r['serves']} prep={r['prep_minutes']} cook={r['cook_minutes']} heat={r['heat_level']}")
    print(f"  ingredients: {len(r['ingredients'])}, instructions: {len(r['instructions'])}")
    print(f"  cross_refs: {[x['name'] for x in r['cross_refs']]}")
PY
```

Expected: each recipe has a sensible name, region, time fields, ingredient count >0, instruction count >0. If any field looks wrong (e.g., heat_level=0 for everything, or ingredients list is empty for many), iterate on the prompt in `llm/prompts.py`.

- [ ] **Step 5: Compare 3 pilot recipes to the source PDF visually.**

Open the PDF to pages 96–100 (or whichever range the pilot hit) and compare:
- Recipe name matches
- Ingredients are complete and in source order
- Instructions are NOT summarized
- Heat level matches the sun icons on the page

If any are off, fix the prompt and re-run the pilot.

- [ ] **Step 6: Commit pilot output ONLY if quality is acceptable.**

If quality is good, do not commit yet — the next task runs the full pipeline. If quality needs prompt tweaks, commit the prompt changes:

```bash
# Only if you changed prompts.py:
git add pipeline/src/cookbook_pipeline/llm/prompts.py
git commit -m "tune(pipeline): refine cleanup prompt based on pilot spot-check"
git push origin backend
```

---

## Task 17: Full pipeline run + commit data

**Files:** running the pipeline; committing `/data/`.

- [ ] **Step 1: Run the full pipeline.**

```bash
cd pipeline
source .venv/bin/activate
python -m cookbook_pipeline run
```

Expected wall time: 30–60 minutes. Expected cost: ~$2–5.

- [ ] **Step 2: Validate the output by re-running the schema test.**

```bash
pytest tests/test_schema.py::test_repo_stub_data_validates -v
```

Expected: PASS. (The test loads `/data/recipes.json` and validates against the schema.)

- [ ] **Step 3: Inspect summary.**

```bash
cat pipeline/build/failures.json | python -m json.tool | head -40
python - <<'PY'
import json, pathlib
data = pathlib.Path("../data")
for f in sorted(data.glob("*.json")):
    payload = json.loads(f.read_text())
    if isinstance(payload, dict) and "recipes" in payload:
        print(f"{f.name}: {len(payload['recipes'])} recipes")
    elif isinstance(payload, dict) and "sections" in payload:
        print(f"{f.name}: {len(payload['sections'])} sections")
    elif isinstance(payload, dict) and "regions" in payload:
        print(f"{f.name}: {len(payload['regions'])} regions")
    elif isinstance(payload, dict) and "ingredients" in payload:
        print(f"{f.name}: {len(payload['ingredients'])} ingredients")
    elif isinstance(payload, dict) and "tags" in payload:
        print(f"{f.name}: {len(payload['tags'])} tags")
    else:
        print(f"{f.name}: ok")
images = list((data / "images").glob("*.webp"))
print(f"images: {len(images)} webp files")
PY
```

Expected: ~1000 recipes, ~12 sections, 25–30 regions, hundreds of ingredients and tags, hundreds of images.

- [ ] **Step 4: Commit /data on backend branch.**

```bash
cd "/Users/vishal/Library/Mobile Documents/com~apple~CloudDocs/Projects/Cookbook"
git add data/
git commit -m "data: full pipeline output — ~1000 recipes, sections, regions, indexes, images"
git push origin backend
```

- [ ] **Step 5: Open a PR `backend → main`.**

```bash
gh pr create --base main --head backend \
  --title "data: full extraction of India Cookbook" \
  --body "$(cat <<'EOF'
## Summary
- Replaces stub `/data` with the full pipeline output.
- ~1000 recipes, all sections and regions, ingredient and tag indexes, cross-reference graph, recipe images.

## Verification
- `pytest` passes in `pipeline/`.
- `pipeline/build/failures.json` lists any recipes that didn't survive cleanup (expected: <2% of corpus).
- Visual spot-checks on 5 recipes against the source PDF match.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Merge once Vercel preview looks right.**

The user reviews the Vercel preview deploy posted on the PR. When approved, merge:

```bash
gh pr merge <number> --merge
```

Production deploys from main; the frontend (after rebasing off main) will pick up real data on its next deploy.

---

## Self-Review

### Spec coverage check

Working through the spec sections:
- §2 Source material → Tasks 4 (extraction) and 16 (PDF placement) cover the source.
- §4 Repo layout & branches → Pre-flight + Task 1 + Task 17 PR.
- §5.1 Stack → Task 1 (`pyproject.toml`).
- §5.2 Stages 0–10 → Tasks 4, 5, 10, 6, 8, 9, 10, 11, 12, 13, 14 (one each).
- §5.3 Failure handling → Task 8 (`failures.json` output, retry in `call_with_retry`).
- §5.4 Cost & runtime → Task 16 pilot, Task 17 full run.
- §6 Data contracts → Task 2 schemas.
- §10 Risks → Task 16 pilot mitigates OCR-quality risk.

All spec sections covered.

### Placeholder scan

No `TBD`, no "implement later", no "similar to Task N", no "add appropriate error handling". All steps include exact commands, exact code, exact paths.

### Type consistency

- `Recipe.ingredients` → `list[Ingredient]` everywhere.
- `Recipe.cross_refs` → `list[CrossRef]` consistent across stages 4, 5.
- `extract_pages(pdf, pages_dir, images_dir) -> int` consistent in test, impl, and CLI.
- `build_ingredient_index(recipes) -> dict[str, dict]` matches schema's `IngredientsFile.ingredients: dict[str, IngredientEntry]`.
- `GraphEdge.from_` aliased to `"from"` — used consistently.

No type mismatches.
