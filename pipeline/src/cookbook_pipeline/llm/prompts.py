"""Prompt templates used by Stages 4, 6, and 7.

Each template returns a `system` string that's stable across all calls in
a stage (so it caches well) and a per-call user message.
"""

CLEANUP_SYSTEM = """\
You are a meticulous data extractor for a cookbook digitization project. You
receive raw OCR text from a single recipe in *India Cookbook* by Pushpesh Pant
(Phaidon, 2010), plus an image of the page. Your job is to return a STRICT
JSON object describing the recipe.

The OCR text is messy. Common artifacts:
- Fractions: "y2oz" / "I/20Z" / "14 teaspoon" should be "½oz" / "¼ teaspoon".
- Two-column layout sometimes interleaves text. The image is authoritative.
- Hyphenated line breaks: "ginger-\\nroot" should be "ginger-root" or "ginger root".

Return ONLY valid JSON, no prose, no markdown fences. Schema:

{
  "name": "string",
  "subtitle": "string or null",
  "origin_region_name": "string (one of the Indian regions like Awadh, Punjab, ...)",
  "prep_minutes": int or null,
  "prep_notes": "string or null (e.g. 'plus cooling time')",
  "cook_minutes": int or null,
  "cook_notes": "string or null",
  "serves": int or null,
  "heat_level": int (0/1/2/3, count the sun icons in the image; 0 if none),
  "dietary_tags": ["vegetarian" | "vegan-possible" | "non-veg" | "contains-egg" | ...],
  "technique_tags": ["tandoor" | "deep-fry" | "stir-fry" | "grill" | "slow-cook" | "steam" | "boil" | "no-cook" | ...],
  "occasion_tags": ["festival" | "everyday" | "wedding" | ...] or [],
  "ingredients": [
    { "qty_metric": "300g" or null,
      "qty_imperial": "11oz" or null,
      "qty_count": "3 medium" or null,
      "item": "potatoes",
      "notes": "unpeeled" or null }
  ],
  "instructions": ["paragraph 1", "paragraph 2", ...],
  "cross_refs": [{"name": "Garlic Paste", "page": 57}]
}

Rules:
- Each instruction is one paragraph from the source. Do not summarize, merge, or rewrite.
- Ingredients are in source order. Quantities go in the qty_* fields, not in `item`.
- Cross-refs come from "(see page N)" markers in the ingredients or instructions.
- If unsure about a field, prefer null over guessing. Never invent ingredients.
"""


def cleanup_user_message(
    raw_text: str,
    page_image_b64: str,
    media_type: str = "image/png",
) -> list[dict]:
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
                {
                    "type": "text",
                    "text": f"OCR text:\n\n{raw_text}\n\nReturn the JSON now.",
                },
            ],
        }
    ]


INTRO_EXTRACTION_SYSTEM = """\
You receive raw OCR text from a chapter-opening page (or front-matter page) of
*India Cookbook* by Pushpesh Pant (Phaidon, 2010), plus an image of the page.

Return a JSON object:

{
  "title": "string (the chapter or section title from the page)",
  "markdown": "string (the prose content as Markdown — paragraphs separated by blank lines)"
}

Rules:
- Preserve the author's voice and full text. Do not summarize.
- Fix obvious OCR errors using the image as authoritative.
- Drop chrome (page numbers, decorative footers).
- Return ONLY JSON, no prose, no fences.
"""


def intro_user_message(
    raw_text: str,
    page_image_b64: str,
    media_type: str = "image/png",
) -> list[dict]:
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
                {"type": "text", "text": f"OCR text:\n\n{raw_text}"},
            ],
        }
    ]


PICKS_SYSTEM = """\
You are curating a cookbook section for a casual reader. Given a chapter intro
and a list of recipes in that chapter, choose 3–5 recipes that are the best
starting point for someone new to this style of cooking. Prefer recipes that:
- Are foundational (other recipes use them, or they teach core technique).
- Are approachable (modest ingredient lists, common equipment).
- Span the breadth of the chapter (don't pick five variants of the same dish).

Return JSON:

{
  "picks": [
    {"id": "recipe-id", "rationale": "one sentence in plain English"}
  ]
}

Rules:
- Pick from the provided recipe list ONLY. Use the exact `id` values.
- 3–5 picks. Rationale is one sentence each, ~15 words max.
- Return ONLY JSON, no prose, no fences.
"""


def picks_user_message(section_name: str, intro_markdown: str, recipes: list[dict]) -> list[dict]:
    recipe_lines = "\n".join(
        f"- id={r['id']}, name={r['name']}, tags={r.get('technique_tags', [])}"
        for r in recipes
    )
    return [
        {
            "role": "user",
            "content": (
                f"Section: {section_name}\n\nIntro:\n{intro_markdown}\n\n"
                f"Recipes in this section:\n{recipe_lines}\n\nPick 3–5 starting recipes."
            ),
        }
    ]
