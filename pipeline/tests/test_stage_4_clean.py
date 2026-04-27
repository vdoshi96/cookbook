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
        "title_hint": "Nargisi Seekh Kebab",
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
