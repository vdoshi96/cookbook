"""Slug and ingredient-normalization helpers.

These are pure functions with no I/O. Synonyms and singularization rules
deliberately use a small explicit dictionary, not a stemmer; the corpus is
~1000 recipes and we want predictable output.
"""

from __future__ import annotations

import re
import unicodedata

# Phrases that mean the same thing across the book.
INGREDIENT_SYNONYMS: dict[str, str] = {
    "cilantro leaves": "coriander leaves",
    "cilantro": "coriander leaves",
    "curd": "yoghurt",
    "natural plain yoghurt": "yoghurt",
    "plain yoghurt": "yoghurt",
}

# Words to strip from ingredient strings before normalization.
INGREDIENT_NOISE = {
    "fresh", "freshly", "chopped", "sliced", "grated", "minced", "diced",
    "peeled", "unpeeled", "deseeded", "de-seeded", "halved", "quartered",
    "ground", "whole", "small", "large", "medium",
    "natural", "plain",
}

# Manual singularization for the words the book actually uses.
# Note: "mushrooms" is intentionally absent — compound forms like
# "button mushrooms" must preserve the plural per test expectations.
SINGULARIZE = {
    "onions": "onion",
    "potatoes": "potato",
    "tomatoes": "tomato",
    "chillies": "chilli",
    "leaves": "leaves",  # keep
    "carrots": "carrot",
    "peas": "peas",  # keep
    "lentils": "lentils",  # keep
    "eggs": "egg",
}


def slugify(text: str) -> str:
    """Convert a recipe or ingredient name into a URL-safe slug.

    >>> slugify("Nargisi Seekh Kebab")
    'nargisi-seekh-kebab'
    """
    # Strip diacritics
    nkfd = unicodedata.normalize("NFKD", text)
    ascii_text = nkfd.encode("ascii", "ignore").decode("ascii")
    # Lowercase and replace non-alphanumerics with dashes
    s = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower())
    return s.strip("-")


def normalize_ingredient(raw: str) -> str:
    """Map an ingredient line to a stable identifier.

    Strips quantities, parentheticals, descriptive adjectives, and applies
    a small synonym dictionary. Returns a slug.
    """
    s = raw.lower()
    # Drop parentheticals like "(white)" or "(cilantro)"
    s = re.sub(r"\([^)]*\)", " ", s)
    # Drop trailing comma-separated descriptors after the first comma:
    #   "paneer, grated" -> "paneer"
    s = s.split(",", 1)[0]
    # Apply synonym substitutions on the whitespace-collapsed string
    collapsed = " ".join(s.split())
    if collapsed in INGREDIENT_SYNONYMS:
        return slugify(INGREDIENT_SYNONYMS[collapsed])
    # Strip noise words
    tokens = [t for t in collapsed.split() if t not in INGREDIENT_NOISE]
    # Re-check synonyms after noise stripping so that prefixes like
    # "fresh" or "plain" don't hide a known synonym phrase.
    stripped = " ".join(tokens)
    if stripped in INGREDIENT_SYNONYMS:
        return slugify(INGREDIENT_SYNONYMS[stripped])
    # Singularize each token
    tokens = [SINGULARIZE.get(t, t) for t in tokens]
    return slugify(" ".join(tokens))
