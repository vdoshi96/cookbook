from unittest.mock import MagicMock

from cookbook_pipeline.stages.stage_7_picks import pick_starters_for_section


def _fake_msg(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    return msg


def test_pick_starters_short_section_returns_all_recipes():
    """Sections with 5 or fewer recipes bypass the LLM and return everything."""
    recipes = [
        {"id": "a", "name": "Recipe A"},
        {"id": "b", "name": "Recipe B"},
        {"id": "c", "name": "Recipe C"},
    ]
    result = pick_starters_for_section("Short Section", "Some intro.", recipes)
    assert len(result) == 3
    assert {p["id"] for p in result} == {"a", "b", "c"}
    for p in result:
        assert p["rationale"] == "Featured in this short section."


def test_pick_starters_filters_invalid_ids_and_caps_at_five():
    """LLM-returned picks are filtered to known recipe ids and capped at 5."""
    recipes = [{"id": f"r{i}", "name": f"Recipe {i}"} for i in range(10)]
    canned = """{"picks": [
        {"id": "r0", "rationale": "great starter"},
        {"id": "r1", "rationale": "approachable"},
        {"id": "BOGUS", "rationale": "not a real id"},
        {"id": "r2", "rationale": "covers technique"},
        {"id": "r3", "rationale": "uses common pantry"},
        {"id": "r4", "rationale": "kid-friendly"},
        {"id": "r5", "rationale": "extra one beyond cap"}
    ]}"""
    client = MagicMock()
    client.messages.create.return_value = _fake_msg(canned)

    result = pick_starters_for_section("Big Section", "Intro.", recipes, client=client, model="m")
    assert len(result) == 5
    ids = [p["id"] for p in result]
    assert "BOGUS" not in ids  # filtered
    assert ids == ["r0", "r1", "r2", "r3", "r4"]  # capped at 5 in order
