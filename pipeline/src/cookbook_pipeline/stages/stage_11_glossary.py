"""Stage 11 — extract Glossary entries from the back-of-book Glossary pages.

The Glossary is alphabetical. Each entry is typically:

    <ENGLISH NAME> [<regional name in italics>]
        <one- or two-line definition>

Some entries name a specific recipe in the book — when so, we link the entry
to that recipe by id. Linking is best-effort fuzzy match against the recipe
corpus; unmatched entries leave `recipe_id` as null.

Page range is sourced from `detect_paratext_ranges` in Stage 1, so this stage
adapts automatically if the Phaidon edition's Glossary moves.
"""

from __future__ import annotations

import json
from difflib import SequenceMatcher
from pathlib import Path

from anthropic import Anthropic

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.images import encode_image_for_api
from cookbook_pipeline.utils.text import slugify

GLOSSARY_SYSTEM = """\
You receive raw OCR text from one Glossary page of *India Cookbook* by Pushpesh
Pant (Phaidon, 2010), plus an image of the page. The Glossary is alphabetical
and lists ingredients, techniques, and equipment — each entry is an English
term, sometimes followed by a Hindi/regional name in italics, then a short
definition.

Return ONLY valid JSON, no prose, no fences. Schema:

{
  "entries": [
    {
      "english_name": "Asafoetida",
      "regional_name": "Hing",
      "definition": "A pungent gum resin used in tiny amounts ..."
    }
  ]
}

Rules:
- One object per glossary entry on the page. Preserve source order.
- `regional_name` is the italicized non-English name when present, else null.
- `definition` is the prose body of the entry, joined into a single string.
  Drop trailing decorative text. If absent, use null.
- The image is authoritative for italicization and column boundaries.
- Skip page chrome (page numbers, footers).
"""


def _glossary_user_message(raw_text: str, page_image_b64: str, media_type: str) -> list[dict]:
    return [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": page_image_b64,
                    },
                },
                {"type": "text", "text": f"OCR text:\n\n{raw_text}\n\nReturn the JSON now."},
            ],
        }
    ]


def _link_entry_to_recipe(
    english_name: str,
    recipes_by_slug: dict[str, str],
    recipe_names: list[tuple[str, str]],
) -> str | None:
    """Best-effort fuzzy match from a glossary term to a recipe id.

    Pass 1: exact slug match. Pass 2: fuzzy name match at threshold 0.85
    (deliberately strict — false positives are worse than misses, since the
    frontend will just not deep-link an unmatched entry).
    """
    slug = slugify(english_name)
    if slug in recipes_by_slug:
        return recipes_by_slug[slug]
    target_low = english_name.lower()
    best_ratio = 0.0
    best_id: str | None = None
    for rid, rname in recipe_names:
        r = SequenceMatcher(None, target_low, rname.lower()).ratio()
        if r > best_ratio:
            best_ratio = r
            best_id = rid
    return best_id if best_ratio >= 0.85 else None


def extract_glossary(
    pages_dir: Path,
    page_images_dir: Path,
    page_range: tuple[int, int],
    recipes: list[dict],
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
) -> list[dict]:
    """Extract glossary entries across the page range, link to recipes."""
    client = client or get_client()
    start, end = page_range

    recipes_by_slug = {slugify(r["name"]): r["id"] for r in recipes}
    recipe_names = [(r["id"], r["name"]) for r in recipes]

    entries: list[dict] = []
    for page in range(start, end + 1):
        text_path = pages_dir / f"page-{page:04d}.txt"
        img_path = page_images_dir / f"page-{page:04d}.png"
        if not text_path.exists() or not img_path.exists():
            continue
        media_type, img_b64 = encode_image_for_api(img_path)
        parsed = call_with_retry(
            client,
            model=model,
            system=GLOSSARY_SYSTEM,
            messages=_glossary_user_message(text_path.read_text(), img_b64, media_type),
            max_tokens=4096,
        )
        page_entries = parsed.get("entries") or []
        for e in page_entries:
            if not e.get("english_name"):
                continue
            entries.append({
                "english_name": e["english_name"].strip(),
                "regional_name": (e.get("regional_name") or None) or None,
                "definition": (e.get("definition") or None) or None,
                "recipe_id": _link_entry_to_recipe(
                    e["english_name"], recipes_by_slug, recipe_names
                ),
            })
    return entries


def write_glossary(
    entries: list[dict],
    output_path: Path,
) -> None:
    payload = {"schema_version": 1, "entries": entries}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2))
