from pathlib import Path
from textwrap import dedent

import pytest

from cookbook_pipeline.stages.ingredient_matcher import build_ingredient_matcher


def write_config(path: Path, text: str) -> Path:
    path.write_text(dedent(text).strip() + "\n")
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


def test_build_ingredient_matcher_rejects_invalid_family_links(tmp_path: Path):
    config = write_config(
        tmp_path / "ingredient-matcher.yml",
        """
        schema_version: 1
        chips:
          - id: fish
            label: Fish
            kind: ingredient
            family_id: seafood
            ingredient_slugs: [fish]
            aliases: []
            include_in_missing: true
        families:
          - id: seafood
            label: Seafood
            chip_ids: [fish]
            aliases: []
        excluded_ingredient_slugs: []
        """,
    )

    with pytest.raises(ValueError, match="family chip"):
        build_ingredient_matcher(config, {"fish"})
