# Cook With Ingredients Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit a validated `/data/ingredient-matcher.json` contract from curated backend taxonomy so the frontend can build `/cook-with`.

**Architecture:** Add a human-edited matcher config under `pipeline/data/`, validate it against the ingredient index, and emit a Pydantic-validated JSON file beside the other static data. Keep ranking in the frontend; backend owns chip labels, aliases, families, ingredient slug membership, and default exclusions.

**Tech Stack:** Python 3.14 in the local venv, Pydantic v2, PyYAML, pytest, ruff.

---

## File Structure

- Create `pipeline/data/ingredient-matcher.yml`: curated taxonomy source.
- Create `pipeline/src/cookbook_pipeline/stages/ingredient_matcher.py`: YAML loading, config validation, and matcher payload construction.
- Modify `pipeline/src/cookbook_pipeline/schema.py`: Pydantic models for `IngredientMatcherFile`.
- Modify `pipeline/src/cookbook_pipeline/paths.py`: config and output path constants.
- Modify `pipeline/src/cookbook_pipeline/stages/stage_10_emit.py`: validate/write `ingredient-matcher.json`.
- Modify `pipeline/src/cookbook_pipeline/__main__.py`: build matcher after Stage 8 and pass to emit.
- Create `pipeline/tests/test_ingredient_matcher.py`: builder/config tests.
- Modify `pipeline/tests/test_schema.py`: matcher schema round-trip and committed data validation.
- Create generated `data/ingredient-matcher.json`.

## Task 1: Matcher Schema Tests

**Files:**
- Modify: `pipeline/tests/test_schema.py`
- Modify later: `pipeline/src/cookbook_pipeline/schema.py`

- [ ] **Step 1: Write failing schema tests**

Add tests that import `IngredientMatcherFile` and validate a minimal contract:

```python
def test_ingredient_matcher_file_round_trip():
    matcher = IngredientMatcherFile.model_validate(
        {
            "schema_version": 1,
            "chips": [
                {
                    "id": "seafood",
                    "label": "Seafood",
                    "kind": "family",
                    "family_id": None,
                    "ingredient_slugs": [],
                    "aliases": ["seafood"],
                    "include_in_missing": False,
                },
                {
                    "id": "fish",
                    "label": "Fish",
                    "kind": "ingredient",
                    "family_id": "seafood",
                    "ingredient_slugs": ["fish"],
                    "aliases": ["meen"],
                    "include_in_missing": True,
                },
            ],
            "families": [
                {
                    "id": "seafood",
                    "label": "Seafood",
                    "chip_ids": ["fish"],
                    "aliases": ["seafood"],
                }
            ],
            "excluded_ingredient_slugs": ["salt"],
        }
    )
    assert matcher.chips[0].kind == "family"
    assert matcher.families[0].chip_ids == ["fish"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.venv/bin/python -m pytest tests/test_schema.py::test_ingredient_matcher_file_round_trip -q`

Expected: FAIL because `IngredientMatcherFile` is not defined/importable.

- [ ] **Step 3: Add schema models**

Add `Literal` import and these classes:

```python
class IngredientMatcherChip(BaseModel):
    id: str
    label: str
    kind: Literal["ingredient", "family"]
    family_id: str | None = None
    ingredient_slugs: list[str] = Field(default_factory=list)
    aliases: list[str] = Field(default_factory=list)
    include_in_missing: bool = True


class IngredientMatcherFamily(BaseModel):
    id: str
    label: str
    chip_ids: list[str]
    aliases: list[str] = Field(default_factory=list)


class IngredientMatcherFile(BaseModel):
    schema_version: int = 1
    chips: list[IngredientMatcherChip]
    families: list[IngredientMatcherFamily]
    excluded_ingredient_slugs: list[str] = Field(default_factory=list)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.venv/bin/python -m pytest tests/test_schema.py::test_ingredient_matcher_file_round_trip -q`

Expected: PASS.

## Task 2: Matcher Builder Tests And Implementation

**Files:**
- Create: `pipeline/tests/test_ingredient_matcher.py`
- Create: `pipeline/src/cookbook_pipeline/stages/ingredient_matcher.py`

- [ ] **Step 1: Write failing builder tests**

Tests cover valid payload construction and stale slug validation:

```python
from pathlib import Path

import pytest

from cookbook_pipeline.stages.ingredient_matcher import build_ingredient_matcher


def write_config(path: Path, text: str) -> Path:
    path.write_text(text.strip() + "\n")
    return path


def test_build_ingredient_matcher_validates_and_preserves_contract(tmp_path: Path):
    config = write_config(
        tmp_path / "ingredient-matcher.yml",
        """
        schema_version: 1
        chips:
          - id: seafood
            label: Seafood
            kind: family
            family_id: null
            ingredient_slugs: []
            aliases: [seafood]
            include_in_missing: false
          - id: fish
            label: Fish
            kind: ingredient
            family_id: seafood
            ingredient_slugs: [fish, fish-fillets]
            aliases: [meen]
            include_in_missing: true
        families:
          - id: seafood
            label: Seafood
            chip_ids: [fish]
            aliases: [seafood]
        excluded_ingredient_slugs: [salt]
        """,
    )

    matcher = build_ingredient_matcher(config, {"fish", "fish-fillets", "salt"})

    assert matcher["chips"][0]["id"] == "seafood"
    assert matcher["chips"][1]["ingredient_slugs"] == ["fish", "fish-fillets"]
    assert matcher["families"][0]["chip_ids"] == ["fish"]
    assert matcher["excluded_ingredient_slugs"] == ["salt"]


def test_build_ingredient_matcher_rejects_stale_ingredient_slugs(tmp_path: Path):
    config = write_config(
        tmp_path / "ingredient-matcher.yml",
        """
        schema_version: 1
        chips:
          - id: fish
            label: Fish
            kind: ingredient
            family_id: null
            ingredient_slugs: [fish, missing-fish]
            aliases: []
            include_in_missing: true
        families: []
        excluded_ingredient_slugs: [salt]
        """,
    )

    with pytest.raises(ValueError, match="missing-fish"):
        build_ingredient_matcher(config, {"fish", "salt"})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `.venv/bin/python -m pytest tests/test_ingredient_matcher.py -q`

Expected: FAIL because `cookbook_pipeline.stages.ingredient_matcher` does not exist.

- [ ] **Step 3: Implement builder**

Implement:

```python
from pathlib import Path
from typing import Any

import yaml

from cookbook_pipeline.schema import IngredientMatcherFile


def load_ingredient_matcher_config(path: Path) -> dict[str, Any]:
    payload = yaml.safe_load(path.read_text())
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a YAML mapping")
    return payload


def build_ingredient_matcher(config_path: Path, ingredient_slugs: set[str]) -> dict:
    payload = load_ingredient_matcher_config(config_path)
    matcher = IngredientMatcherFile.model_validate(payload)
    _validate_matcher(matcher, ingredient_slugs)
    return matcher.model_dump()
```

Include helper validation for duplicate chip ids, duplicate family ids, missing ingredient slugs, missing excluded slugs, invalid `family_id`, family rows without a matching family chip, and family `chip_ids` that reference missing or non-ingredient chips.

- [ ] **Step 4: Run builder tests**

Run: `.venv/bin/python -m pytest tests/test_ingredient_matcher.py -q`

Expected: PASS.

## Task 3: Emit Wiring Tests And Implementation

**Files:**
- Modify: `pipeline/src/cookbook_pipeline/paths.py`
- Modify: `pipeline/src/cookbook_pipeline/stages/stage_10_emit.py`
- Modify: `pipeline/src/cookbook_pipeline/__main__.py`
- Modify: `pipeline/tests/test_schema.py`

- [ ] **Step 1: Write failing committed-data validation test**

Add to `test_schema.py`:

```python
def test_repo_ingredient_matcher_data_validates():
    project_root = Path(__file__).resolve().parents[2]
    p = project_root / "data" / "ingredient-matcher.json"
    payload = json.loads(p.read_text())
    matcher = IngredientMatcherFile.model_validate(payload)
    assert any(chip.id == "fish" for chip in matcher.chips)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.venv/bin/python -m pytest tests/test_schema.py::test_repo_ingredient_matcher_data_validates -q`

Expected: FAIL because `data/ingredient-matcher.json` does not exist.

- [ ] **Step 3: Wire emit and paths**

Add:

```python
INGREDIENT_MATCHER_CONFIG = PIPELINE_DIR / "data" / "ingredient-matcher.yml"
INGREDIENT_MATCHER_JSON = DATA_DIR / "ingredient-matcher.json"
```

Update `emit()` to accept `ingredient_matcher: dict`, validate with `IngredientMatcherFile`, and write `ingredient-matcher.json`.

Update `stage_5_through_10()` to call:

```python
ingredient_matcher = build_ingredient_matcher(
    paths.INGREDIENT_MATCHER_CONFIG,
    set(ingredients_idx),
)
```

and pass it to `emit()`.

- [ ] **Step 4: Add curated config and generate JSON**

Create `pipeline/data/ingredient-matcher.yml` with the approved first-pass taxonomy. Generate `data/ingredient-matcher.json` by importing `build_ingredient_matcher()` against committed `data/ingredients.json`.

- [ ] **Step 5: Run schema committed-data test**

Run: `.venv/bin/python -m pytest tests/test_schema.py::test_repo_ingredient_matcher_data_validates -q`

Expected: PASS.

## Task 4: Full QA And Publish

**Files:**
- All changed backend/data/doc files.

- [ ] **Step 1: Run targeted tests**

Run: `.venv/bin/python -m pytest tests/test_ingredient_matcher.py tests/test_schema.py tests/test_stage_8_indexes.py -q`

Expected: PASS.

- [ ] **Step 2: Run full pipeline tests**

Run: `.venv/bin/python -m pytest`

Expected: PASS.

- [ ] **Step 3: Run lint**

Run: `.venv/bin/ruff check src tests`

Expected: PASS.

- [ ] **Step 4: Run data validation spot checks**

Run a short Python check that validates committed `data/ingredient-matcher.json`, verifies aliases such as `aloo`, `baingan`, `murg`, `meen`, `jhinga`, and `dahi`, and confirms excluded slugs include `salt`, `ghee`, `garam-masala`, `garlic`, and `onion`.

- [ ] **Step 5: Commit and PR**

Stage only intended files, commit with `feat: add ingredient matcher data contract`, push `codex/cook-with-backend`, and open a draft PR against `main`.
