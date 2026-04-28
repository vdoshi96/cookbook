import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from cookbook_pipeline.schema import (
    GlossaryEntry,
    GlossaryFile,
    GraphEdge,
    Recipe,
    RecipesFile,
    Section,
    SectionsFile,
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
    project_root = Path(__file__).resolve().parents[2]
    recipes_path = project_root / "data" / "recipes.json"
    payload = json.loads(recipes_path.read_text())
    rf = RecipesFile.model_validate(payload)
    assert len(rf.recipes) >= 3


def test_glossary_entry_minimal():
    e = GlossaryEntry(english_name="Asafoetida")
    assert e.regional_name is None
    assert e.recipe_id is None
    assert e.definition is None


def test_glossary_file_round_trip():
    gf = GlossaryFile.model_validate(
        {
            "schema_version": 1,
            "entries": [
                {
                    "english_name": "Asafoetida",
                    "regional_name": "Hing",
                    "definition": "A pungent gum resin.",
                    "recipe_id": None,
                },
                {
                    "english_name": "Garam Masala",
                    "regional_name": None,
                    "definition": None,
                    "recipe_id": "garam-masala",
                },
            ],
        }
    )
    assert len(gf.entries) == 2
    assert gf.entries[1].recipe_id == "garam-masala"


def test_repo_glossary_data_validates():
    """The committed glossary.json MUST validate against the schema."""
    project_root = Path(__file__).resolve().parents[2]
    p = project_root / "data" / "glossary.json"
    payload = json.loads(p.read_text())
    gf = GlossaryFile.model_validate(payload)
    assert isinstance(gf.entries, list)
