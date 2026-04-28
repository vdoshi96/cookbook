from cookbook_pipeline.stages.stage_11_glossary import _link_entry_to_recipe


def _setup(recipes: list[tuple[str, str]]):
    by_slug = {}
    for rid, name in recipes:
        from cookbook_pipeline.utils.text import slugify
        by_slug[slugify(name)] = rid
    return by_slug, recipes


def test_link_exact_slug_match():
    by_slug, names = _setup([("garam-masala", "Garam Masala"), ("paneer", "Paneer")])
    assert _link_entry_to_recipe("Garam Masala", by_slug, names) == "garam-masala"


def test_link_fuzzy_match_above_threshold():
    by_slug, names = _setup([("garlic-paste", "Garlic Paste")])
    # Slight wording variation should still match — the fuzzy threshold is 0.85.
    assert _link_entry_to_recipe("Garlic-Paste", by_slug, names) == "garlic-paste"


def test_link_returns_none_for_unrelated_term():
    by_slug, names = _setup([("paneer", "Paneer"), ("garam-masala", "Garam Masala")])
    # "Asafoetida" doesn't match any recipe — must return None, not a false-positive link.
    assert _link_entry_to_recipe("Asafoetida", by_slug, names) is None


def test_link_returns_none_below_threshold():
    by_slug, names = _setup([("paneer", "Paneer")])
    # Substring overlap exists but ratio is well below 0.85 — must NOT link.
    assert _link_entry_to_recipe("Banner", by_slug, names) is None
