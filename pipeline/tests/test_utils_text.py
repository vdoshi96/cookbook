from cookbook_pipeline.utils.text import slugify, normalize_ingredient


def test_slugify_basic():
    assert slugify("Nargisi Seekh Kebab") == "nargisi-seekh-kebab"


def test_slugify_punctuation():
    assert slugify("Khumb Shabnam: Mushrooms!") == "khumb-shabnam-mushrooms"


def test_slugify_diacritics():
    # Common diacritics in transliterated Hindi names
    assert slugify("Kheer Pāṭiśapta") == "kheer-patisapta"


def test_slugify_collapses_dashes():
    assert slugify("Foo  --  Bar") == "foo-bar"


def test_normalize_ingredient_strips_quantity_words():
    assert normalize_ingredient("paneer, grated") == "paneer"
    assert normalize_ingredient("button (white) mushrooms, sliced") == "button-mushrooms"


def test_normalize_ingredient_synonyms():
    # cilantro and coriander leaves collapse to one
    assert normalize_ingredient("coriander (cilantro) leaves") == "coriander-leaves"
    assert normalize_ingredient("cilantro leaves") == "coriander-leaves"


def test_normalize_ingredient_lowercase_and_singular():
    assert normalize_ingredient("Onions") == "onion"
    assert normalize_ingredient("Potatoes") == "potato"
