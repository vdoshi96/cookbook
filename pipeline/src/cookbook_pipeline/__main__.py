# pipeline/src/cookbook_pipeline/__main__.py
"""CLI: wire all ten stages together.

Usage:
    python -m cookbook_pipeline run                # all stages
    python -m cookbook_pipeline run --stage 4      # one stage only
    python -m cookbook_pipeline pilot              # process 50 recipes for spot-checking
"""

from __future__ import annotations

import argparse
import json
import sys

from dotenv import load_dotenv

from cookbook_pipeline import paths
from cookbook_pipeline.stages.stage_0_extract import extract_pages
from cookbook_pipeline.stages.stage_1_sections import write_sections_raw
from cookbook_pipeline.stages.stage_2_front_matter import extract_front_matter
from cookbook_pipeline.stages.stage_3_segment import write_recipes_raw
from cookbook_pipeline.stages.stage_4_clean import clean_all
from cookbook_pipeline.stages.stage_5_xrefs import resolve_xrefs
from cookbook_pipeline.stages.stage_6_intros import (
    extract_region_intros,
    extract_section_intros,
)
from cookbook_pipeline.stages.stage_7_picks import pick_starters_for_section
from cookbook_pipeline.stages.stage_8_indexes import (
    build_ingredient_index,
    build_tag_index,
)
from cookbook_pipeline.stages.stage_9_images import extract_recipe_images
from cookbook_pipeline.stages.stage_10_emit import emit


def stage_0() -> None:
    paths.ensure_build_dirs()
    n = extract_pages(paths.SOURCE_PDF, paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES)
    print(f"Stage 0: extracted {n} pages.")


def stage_1() -> None:
    write_sections_raw(paths.BUILD_PAGES, paths.SECTIONS_RAW)
    sections = json.loads(paths.SECTIONS_RAW.read_text())
    print(f"Stage 1: detected {len(sections)} sections.")


def stage_2() -> None:
    extract_front_matter(paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES, paths.FRONT_MATTER_RAW)
    print("Stage 2: front matter written.")


def stage_3() -> None:
    sections = json.loads(paths.SECTIONS_RAW.read_text())
    n = write_recipes_raw(paths.BUILD_PAGES, sections, paths.RECIPES_RAW)
    print(f"Stage 3: segmented {n} recipe blocks.")


def stage_4(*, limit: int | None = None) -> None:
    blocks = json.loads(paths.RECIPES_RAW.read_text())
    if limit is not None:
        blocks = blocks[:limit]
    summary = clean_all(
        blocks,
        paths.BUILD_PAGE_IMAGES,
        paths.RECIPES_CLEANED,
        paths.FAILURES,
    )
    print(f"Stage 4: cleaned {summary['extracted']}, failed {summary['failed']}.")


def stage_5_through_10() -> None:
    cleaned = json.loads(paths.RECIPES_CLEANED.read_text())
    sections_raw = json.loads(paths.SECTIONS_RAW.read_text())
    front_matter = json.loads(paths.FRONT_MATTER_RAW.read_text())

    # Stage 5: cross-refs
    recipes_with_ids, edges, used_in = resolve_xrefs(cleaned)
    print(f"Stage 5: resolved {len(edges)} cross-ref edges.")

    # Stage 6: section + region intros
    section_intros = extract_section_intros(
        sections_raw, paths.BUILD_PAGES, paths.BUILD_PAGE_IMAGES
    )
    region_names = sorted({r["origin_region_name"] for r in recipes_with_ids})
    region_intros = extract_region_intros(front_matter, region_names)
    print(f"Stage 6: extracted {len(section_intros)} section intros, {len(region_intros)} region intros.")

    # Build sections payload (now with intros, recipe_ids, and start-here picks coming next)
    sections: list[dict] = []
    by_section: dict[str, list[dict]] = {}
    for r in recipes_with_ids:
        by_section.setdefault(r["section_id"], []).append(r)
    for sec in sections_raw:
        sec_recipes = by_section.get(sec["id"], [])
        intro = section_intros.get(sec["id"], "")
        # Stage 7: picks
        picks = pick_starters_for_section(sec["name"], intro, sec_recipes)
        sections.append({
            "id": sec["id"],
            "name": sec["name"],
            "intro_markdown": intro,
            "page_range": list(sec["page_range"]),
            "recipe_ids": [r["id"] for r in sec_recipes],
            "start_here": picks,
            "hero_image": None,
        })

    # Build regions payload
    from cookbook_pipeline.utils.text import slugify
    regions: list[dict] = []
    for name in region_names:
        rid = slugify(name)
        regions.append({
            "id": rid,
            "name": name,
            "intro_markdown": region_intros.get(name, ""),
            "recipe_ids": [r["id"] for r in recipes_with_ids if r["origin_region_id"] == rid],
            "map_coords": None,
        })

    # Stage 8: indexes
    ingredients_idx = build_ingredient_index(recipes_with_ids)
    tags_idx = build_tag_index(recipes_with_ids)
    print(f"Stage 8: {len(ingredients_idx)} ingredients, {len(tags_idx)} tags.")

    # Stage 9: images (must happen before emit so we can attach paths)
    associations = extract_recipe_images(paths.SOURCE_PDF, recipes_with_ids, paths.DATA_IMAGES)
    for r in recipes_with_ids:
        r["image"] = associations.get(r["id"])
    print(f"Stage 9: associated {len(associations)} images.")

    # Page-range tuples need to be tuples for SectionsFile to validate
    for s in sections:
        s["page_range"] = tuple(s["page_range"])

    # Stage 10: emit
    emit(
        recipes=recipes_with_ids,
        sections=sections,
        regions=regions,
        ingredients_idx=ingredients_idx,
        tags_idx=tags_idx,
        edges=edges,
        used_in=used_in,
        front_matter=front_matter,
        out_dir=paths.DATA_DIR,
    )
    print(f"Stage 10: emitted final files to {paths.DATA_DIR}.")


def run_all(*, limit: int | None = None) -> None:
    stage_0()
    stage_1()
    stage_2()
    stage_3()
    stage_4(limit=limit)
    stage_5_through_10()


def main(argv: list[str] | None = None) -> int:
    # Use override=True so a blank ANTHROPIC_API_KEY in the shell environment
    # doesn't block the value from pipeline/.env from loading.
    load_dotenv(paths.PIPELINE_DIR / ".env", override=True)
    parser = argparse.ArgumentParser(prog="cookbook_pipeline")
    parser.add_argument("command", choices=["run", "pilot"])
    parser.add_argument("--stage", type=int, default=None,
                        help="Run only one stage (0-10).")
    args = parser.parse_args(argv)

    if args.command == "pilot":
        run_all(limit=50)
        return 0

    if args.stage is None:
        run_all()
        return 0

    {
        0: stage_0, 1: stage_1, 2: stage_2, 3: stage_3, 4: stage_4,
        5: stage_5_through_10, 6: stage_5_through_10,
        7: stage_5_through_10, 8: stage_5_through_10,
        9: stage_5_through_10, 10: stage_5_through_10,
    }[args.stage]()
    return 0


if __name__ == "__main__":
    sys.exit(main())
