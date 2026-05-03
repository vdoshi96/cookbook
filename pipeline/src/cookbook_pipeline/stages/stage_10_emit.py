# pipeline/src/cookbook_pipeline/stages/stage_10_emit.py
"""Stage 10 — validate everything against schemas and emit final /data files."""

from __future__ import annotations

from pathlib import Path

from cookbook_pipeline.schema import (
    FrontMatterFile,
    GlossaryFile,
    GraphFile,
    IngredientsFile,
    IngredientMatcherFile,
    RecipesFile,
    RegionsFile,
    SectionsFile,
    TagsFile,
)


def emit(
    *,
    recipes: list[dict],
    sections: list[dict],
    regions: list[dict],
    ingredients_idx: dict[str, dict],
    ingredient_matcher: dict,
    tags_idx: dict[str, dict],
    edges: list[dict],
    used_in: dict[str, list[str]],
    front_matter: dict,
    glossary_entries: list[dict],
    out_dir: Path,
) -> None:
    """Validate every payload and write to /data/."""
    out_dir.mkdir(parents=True, exist_ok=True)

    rf = RecipesFile.model_validate({"schema_version": 1, "recipes": recipes})
    (out_dir / "recipes.json").write_text(rf.model_dump_json(indent=2))

    sf = SectionsFile.model_validate({"schema_version": 1, "sections": sections})
    (out_dir / "sections.json").write_text(sf.model_dump_json(indent=2))

    rgf = RegionsFile.model_validate({"schema_version": 1, "regions": regions})
    (out_dir / "regions.json").write_text(rgf.model_dump_json(indent=2))

    ing = IngredientsFile.model_validate(
        {"schema_version": 1, "ingredients": ingredients_idx}
    )
    (out_dir / "ingredients.json").write_text(ing.model_dump_json(indent=2))

    matcher = IngredientMatcherFile.model_validate(ingredient_matcher)
    (out_dir / "ingredient-matcher.json").write_text(matcher.model_dump_json(indent=2))

    tg = TagsFile.model_validate({"schema_version": 1, "tags": tags_idx})
    (out_dir / "tags.json").write_text(tg.model_dump_json(indent=2))

    gf = GraphFile.model_validate(
        {"schema_version": 1, "edges": edges, "used_in": used_in}
    )
    (out_dir / "graph.json").write_text(gf.model_dump_json(indent=2, by_alias=True))

    fm_payload = {"schema_version": 1, **front_matter}
    fm = FrontMatterFile.model_validate(fm_payload)
    (out_dir / "front-matter.json").write_text(fm.model_dump_json(indent=2))

    gl = GlossaryFile.model_validate(
        {"schema_version": 1, "entries": glossary_entries}
    )
    (out_dir / "glossary.json").write_text(gl.model_dump_json(indent=2))
