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
