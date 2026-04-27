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
