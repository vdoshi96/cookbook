"""Curated ingredient matcher contract for "cook with what you have"."""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path
from typing import Any

import yaml

from cookbook_pipeline.schema import IngredientMatcherFile


def load_ingredient_matcher_config(path: Path) -> dict[str, Any]:
    payload = yaml.safe_load(path.read_text())
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a YAML mapping")
    return payload


def build_ingredient_matcher(config_path: Path, ingredient_slugs: Iterable[str]) -> dict:
    """Build the frontend matcher payload, validating config against ingredients."""

    payload = load_ingredient_matcher_config(config_path)
    matcher = IngredientMatcherFile.model_validate(payload)
    _validate_matcher(matcher, set(ingredient_slugs))
    return matcher.model_dump(mode="json")


def _validate_matcher(matcher: IngredientMatcherFile, ingredient_slugs: set[str]) -> None:
    chip_ids = [chip.id for chip in matcher.chips]
    family_ids = [family.id for family in matcher.families]
    _raise_on_duplicates("chip id", chip_ids)
    _raise_on_duplicates("family id", family_ids)

    chips_by_id = {chip.id: chip for chip in matcher.chips}
    families_by_id = {family.id: family for family in matcher.families}

    for family in matcher.families:
        family_chip = chips_by_id.get(family.id)
        if family_chip is None or family_chip.kind != "family":
            raise ValueError(f"family {family.id!r} must have a matching family chip")

        for chip_id in family.chip_ids:
            chip = chips_by_id.get(chip_id)
            if chip is None:
                raise ValueError(f"family {family.id!r} references unknown chip {chip_id!r}")
            if chip.kind != "ingredient":
                raise ValueError(f"family {family.id!r} references non-ingredient chip {chip_id!r}")

    for chip in matcher.chips:
        _raise_on_duplicates(f"alias for chip {chip.id!r}", chip.aliases)
        _raise_on_duplicates(f"ingredient slug for chip {chip.id!r}", chip.ingredient_slugs)

        if chip.kind == "family":
            if chip.family_id is not None:
                raise ValueError(f"family chip {chip.id!r} must not set family_id")
            if chip.ingredient_slugs:
                raise ValueError(f"family chip {chip.id!r} must not set ingredient_slugs")
            continue

        if chip.family_id is not None and chip.family_id not in families_by_id:
            raise ValueError(f"chip {chip.id!r} references unknown family {chip.family_id!r}")

        missing_slugs = sorted(set(chip.ingredient_slugs) - ingredient_slugs)
        if missing_slugs:
            raise ValueError(
                f"chip {chip.id!r} references unknown ingredient slugs: "
                + ", ".join(missing_slugs)
            )

    for family in matcher.families:
        _raise_on_duplicates(f"alias for family {family.id!r}", family.aliases)
        _raise_on_duplicates(f"chip id for family {family.id!r}", family.chip_ids)

    missing_exclusions = sorted(set(matcher.excluded_ingredient_slugs) - ingredient_slugs)
    if missing_exclusions:
        raise ValueError(
            "excluded_ingredient_slugs references unknown ingredient slugs: "
            + ", ".join(missing_exclusions)
        )
    _raise_on_duplicates("excluded ingredient slug", matcher.excluded_ingredient_slugs)


def _raise_on_duplicates(label: str, values: Iterable[str]) -> None:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    if duplicates:
        raise ValueError(f"duplicate {label}: {', '.join(sorted(duplicates))}")
