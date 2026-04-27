"""Stage 4 — turn a raw recipe block into a validated Recipe via Haiku.

This is the core of the pipeline. ~1000 calls; concurrency = 8 by default.
"""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from anthropic import Anthropic
from pydantic import ValidationError
from tqdm import tqdm

from cookbook_pipeline.llm.client import DEFAULT_MODEL, call_with_retry, get_client
from cookbook_pipeline.llm.images import encode_image_for_api
from cookbook_pipeline.llm.prompts import CLEANUP_SYSTEM, cleanup_user_message
from cookbook_pipeline.schema import Recipe
from cookbook_pipeline.utils.text import slugify


def build_id(name: str, seen: set[str]) -> str:
    base = slugify(name)
    if base not in seen:
        return base
    n = 2
    while f"{base}-{n}" in seen:
        n += 1
    return f"{base}-{n}"


def clean_recipe_block(
    client: Anthropic,
    block: dict,
    page_image_path: Path,
    *,
    model: str = DEFAULT_MODEL,
    seen_ids: set[str] | None = None,
) -> Recipe:
    """Run Haiku on one recipe block and return a validated Recipe."""
    media_type, img_b64 = encode_image_for_api(page_image_path)
    parsed = call_with_retry(
        client,
        model=model,
        system=CLEANUP_SYSTEM,
        messages=cleanup_user_message(block["raw_text"], img_b64, media_type=media_type),
        max_tokens=4096,
    )
    name = parsed["name"]
    seen = seen_ids if seen_ids is not None else set()
    rid = build_id(name, seen)
    seen.add(rid)
    region_name = parsed["origin_region_name"]
    return Recipe(
        id=rid,
        name=name,
        subtitle=parsed.get("subtitle"),
        section_id=block["section_id"],
        section_name=block["section_name"],
        origin_region_id=slugify(region_name),
        origin_region_name=region_name,
        prep_minutes=parsed.get("prep_minutes"),
        prep_notes=parsed.get("prep_notes"),
        cook_minutes=parsed.get("cook_minutes"),
        cook_notes=parsed.get("cook_notes"),
        serves=parsed.get("serves"),
        heat_level=parsed.get("heat_level", 0),
        dietary_tags=parsed.get("dietary_tags", []),
        technique_tags=parsed.get("technique_tags", []),
        occasion_tags=parsed.get("occasion_tags", []),
        ingredients=parsed["ingredients"],
        instructions=parsed["instructions"],
        cross_refs=[{"name": x["name"], "page": x["page"]} for x in parsed.get("cross_refs", [])],
        source_page=block["page_num"],
        image=None,  # filled in by Stage 9
    )


def clean_all(
    blocks: list[dict],
    page_images_dir: Path,
    output_path: Path,
    failures_path: Path,
    *,
    client: Anthropic | None = None,
    model: str = DEFAULT_MODEL,
    concurrency: int = 8,
) -> dict:
    """Clean every block in `blocks` and write results to `output_path`.

    Returns a summary dict {extracted, failed}.
    """
    client = client or get_client()
    seen_ids: set[str] = set()
    results: list[Recipe] = []
    failures: list[dict] = []

    # First pass: fetch and parse, in parallel.
    raw_results: list[tuple[int, dict, dict | None, str | None]] = []

    def fetch(idx_block: tuple[int, dict]):
        idx, block = idx_block
        img_path = page_images_dir / f"page-{block['page_num']:04d}.png"
        try:
            media_type, img_b64 = encode_image_for_api(img_path)
            parsed = call_with_retry(
                client,
                model=model,
                system=CLEANUP_SYSTEM,
                messages=cleanup_user_message(block["raw_text"], img_b64, media_type=media_type),
                max_tokens=4096,
            )
            return (idx, block, parsed, None)
        except Exception as e:
            return (idx, block, None, str(e))

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(fetch, (i, b)) for i, b in enumerate(blocks)]
        for fut in tqdm(as_completed(futures), total=len(futures), desc="cleanup"):
            raw_results.append(fut.result())

    raw_results.sort(key=lambda x: x[0])

    # Abort on systemic failure (wrong API key, network down, hard rate-limit).
    # Skip the check for tiny runs where one or two errors trip the threshold
    # spuriously; the per-recipe failures path handles those.
    total = len(raw_results)
    if total >= 20:
        failure_count = sum(1 for _, _, _, err in raw_results if err is not None)
        if failure_count / total > 0.5:
            first_errors = [err for _, _, _, err in raw_results if err is not None][:3]
            raise RuntimeError(
                f"Aborting Stage 4: {failure_count}/{total} calls failed. "
                f"First errors: {first_errors}"
            )

    # Second pass: assign IDs and validate, serially.
    for idx, block, parsed, err in raw_results:
        if err is not None or parsed is None:
            failures.append({"page_num": block["page_num"], "title_hint": block.get("title_hint", ""), "error": err})
            continue
        # Guard: the model occasionally wraps the object in an array.
        if isinstance(parsed, list):
            if parsed and isinstance(parsed[0], dict):
                parsed = parsed[0]
            else:
                failures.append({"page_num": block["page_num"], "title_hint": block.get("title_hint", ""), "error": f"unexpected list response: {str(parsed)[:200]}"})
                continue
        try:
            name = parsed["name"]
            rid = build_id(name, seen_ids)
            seen_ids.add(rid)
            region_name = parsed["origin_region_name"]
            recipe = Recipe(
                id=rid,
                name=name,
                subtitle=parsed.get("subtitle"),
                section_id=block["section_id"],
                section_name=block["section_name"],
                origin_region_id=slugify(region_name),
                origin_region_name=region_name,
                prep_minutes=parsed.get("prep_minutes"),
                prep_notes=parsed.get("prep_notes"),
                cook_minutes=parsed.get("cook_minutes"),
                cook_notes=parsed.get("cook_notes"),
                serves=parsed.get("serves"),
                heat_level=parsed.get("heat_level", 0),
                dietary_tags=parsed.get("dietary_tags", []),
                technique_tags=parsed.get("technique_tags", []),
                occasion_tags=parsed.get("occasion_tags", []),
                ingredients=parsed["ingredients"],
                instructions=parsed["instructions"],
                cross_refs=[{"name": x["name"], "page": x["page"]} for x in parsed.get("cross_refs", [])],
                source_page=block["page_num"],
                image=None,
            )
            results.append(recipe)
        except (KeyError, ValidationError) as e:
            failures.append({"page_num": block["page_num"], "title_hint": block.get("title_hint", ""), "error": str(e)})

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps([r.model_dump() for r in results], indent=2))
    failures_path.parent.mkdir(parents=True, exist_ok=True)
    failures_path.write_text(json.dumps(failures, indent=2))
    return {"extracted": len(results), "failed": len(failures)}
