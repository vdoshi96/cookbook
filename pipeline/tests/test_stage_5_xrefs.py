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


def test_resolve_xrefs_self_reference_is_skipped():
    """A recipe referencing its own page must not produce a self-edge."""
    recipes = [
        {"id": "a", "source_page": 50, "cross_refs": [{"name": "A", "page": 50}]},
    ]
    updated, edges, used_in = resolve_xrefs(recipes)
    assert edges == []
    assert used_in == {}
    # The cross_ref still gets resolved (id attached), it just doesn't produce an edge
    assert updated[0]["cross_refs"][0]["id"] == "a"


def test_resolve_xrefs_edges_are_sorted():
    """Edges should be deterministically ordered for reproducible graph.json."""
    recipes = [
        {"id": "z-recipe", "source_page": 10, "cross_refs": []},
        {"id": "a-recipe", "source_page": 11, "cross_refs": [{"name": "Z", "page": 10}]},
        {"id": "m-recipe", "source_page": 12, "cross_refs": [{"name": "Z", "page": 10}]},
    ]
    _, edges, _ = resolve_xrefs(recipes)
    # Edges must be sorted by (from, to)
    assert edges == [
        {"from": "a-recipe", "to": "z-recipe", "kind": "uses"},
        {"from": "m-recipe", "to": "z-recipe", "kind": "uses"},
    ]
