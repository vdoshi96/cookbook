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
