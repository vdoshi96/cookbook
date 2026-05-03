import json
from pathlib import Path

from cookbook_pipeline.stages.stage_10_emit import emit


def test_emit_writes_ingredient_matcher_file(tmp_path: Path):
    emit(
        recipes=[
            {
                "id": "simple-recipe",
                "name": "Simple Recipe",
                "section_id": "vegetables",
                "section_name": "Vegetables",
                "origin_region_id": "pan-indian",
                "origin_region_name": "Pan-Indian",
                "heat_level": 0,
                "ingredients": [{"item": "potato"}],
                "instructions": ["Cook the potato."],
                "source_page": 1,
            }
        ],
        sections=[
            {
                "id": "vegetables",
                "name": "Vegetables",
                "intro_markdown": "Vegetable dishes.",
                "page_range": (1, 2),
                "recipe_ids": ["simple-recipe"],
                "start_here": [],
                "hero_image": None,
            }
        ],
        regions=[
            {
                "id": "pan-indian",
                "name": "Pan-Indian",
                "intro_markdown": "Across India.",
                "recipe_ids": ["simple-recipe"],
                "map_coords": None,
                "hero_image": None,
            }
        ],
        ingredients_idx={"potato": {"display_name": "potato", "recipe_ids": ["simple-recipe"], "count": 1}},
        ingredient_matcher={
            "schema_version": 1,
            "chips": [
                {
                    "id": "potato",
                    "label": "Potato",
                    "kind": "ingredient",
                    "family_id": None,
                    "ingredient_slugs": ["potato"],
                    "aliases": ["aloo"],
                    "include_in_missing": True,
                }
            ],
            "families": [],
            "excluded_ingredient_slugs": [],
        },
        tags_idx={},
        edges=[],
        used_in={},
        front_matter={
            "introduction": {"title": "Introduction", "markdown": "Intro."},
            "history": {"title": "History", "markdown": "History."},
            "ayurveda": {"title": "Ayurveda", "markdown": "Ayurveda."},
            "regions_overview": {"title": "Regions", "markdown": "Regions.", "map_image": None},
            "notes_on_recipes": {"title": "Notes", "markdown": "Notes."},
        },
        glossary_entries=[],
        out_dir=tmp_path,
    )

    payload = json.loads((tmp_path / "ingredient-matcher.json").read_text())
    assert payload["chips"][0]["id"] == "potato"
