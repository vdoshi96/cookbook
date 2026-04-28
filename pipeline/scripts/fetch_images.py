#!/usr/bin/env python3
"""Standalone Stage 9 runner with sample-mode and coverage reporting.

Reads /data/recipes.json, /data/sections.json, /data/regions.json, runs the
tiered fetcher (SerpAPI → Pexels → Wikimedia), and writes back updated JSON.
Coverage report (source distribution, unique-URL audit, MISSING list,
random URL sample) is printed to stdout and persisted to
build/image-coverage-report.json.

Usage:

    cd pipeline
    source .venv/bin/activate

    # Full run
    python scripts/fetch_images.py

    # Gate C sample: 10 recipes + 5 regions, picked deterministically
    python scripts/fetch_images.py --sample

    # Custom limits / explicit region ids
    python scripts/fetch_images.py --limit-recipes 10 \
        --regions awadh,kerala,goa,kashmir,bengal
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from dotenv import load_dotenv  # noqa: E402

from cookbook_pipeline import paths  # noqa: E402
from cookbook_pipeline.stages.stage_9_fetch_images import fetch_all  # noqa: E402

# Deterministic 10-recipe sample for Gate C — picks dishes that span regions
# / cuisine styles so the user can spot-check breadth, not just depth.
SAMPLE_RECIPE_IDS = [
    "nargisi-seekh-kebab",        # Awadhi kebab — worst URL-reuse offender
    "masala-dosa",                # South Indian — was hash-dup with `dosa`
    "amritsari-kulcha",           # Punjabi flatbread — was hash-dup with `awushi-kulho`
    "thali-peeth",                # Maharashtrian (dup cluster member)
    "khatte-chole",               # Punjabi street food
    "kerala-paratha",             # Kerala
    "hyderabadi-dum-ki-biryani",  # Hyderabadi rice
    "goan-fish-curry-i",          # Goan
    "gulab-jamun",                # North Indian sweet
    "gajar-ka-halwa",             # Punjabi/North dessert
]

SAMPLE_REGION_IDS = ["awadh", "kerala", "goa", "jammu-and-kashmir", "bengal"]


def _filter_assets(payload_key: str, payload: dict, ids: list[str] | None,
                   limit: int | None) -> list[dict]:
    items = payload[payload_key]
    if ids is not None:
        wanted = set(ids)
        items = [i for i in items if i["id"] in wanted]
    elif limit is not None:
        items = items[:limit]
    return items


def _print_coverage_report(summary: dict, prov_path: Path) -> dict:
    """Compose and print the coverage report; persist a JSON copy.

    Returns the report dict so callers can inspect / further transform it.
    """
    prov = json.loads(prov_path.read_text()) if prov_path.exists() else {}

    # Active provenance only — entries we wrote this run (have a non-null URL).
    active = {k: v for k, v in prov.items() if v.get("url")}
    by_source: dict[str, int] = {}
    for v in active.values():
        by_source[v.get("source", "?")] = by_source.get(v.get("source", "?"), 0) + 1

    # Unique URL audit
    urls = [v["url"] for v in active.values()]
    unique_urls = len(set(urls))

    # Random 20-URL sample for visual spot-check
    rng = random.Random(42)
    sample = rng.sample(list(active.values()), min(20, len(active)))
    sample_view = [
        {"id": v["id"], "kind_dir": v.get("kind_dir"),
         "source": v["source"], "url": v["url"]}
        for v in sample
    ]

    failures = summary.get("failed", [])
    missing = [f for f in failures
               if isinstance(f.get("error"), str) and f["error"].startswith("MISSING")]

    report = {
        "total_assets": summary.get("total_assets"),
        "fetched_this_run": summary.get("fetched"),
        "skipped_cached": summary.get("skipped_cached"),
        "failures": len(failures),
        "missing_count": len(missing),
        "source_counts": by_source,
        "ledger_stats": summary.get("ledger_stats", {}),
        "unique_urls_in_provenance": unique_urls,
        "active_provenance_count": len(active),
        "missing_items": [
            {"id": f["id"], "kind": f["kind"], "queries": f.get("queries", []),
             "error": f["error"]}
            for f in missing
        ],
        "random_url_sample": sample_view,
    }

    print()
    print("=" * 68)
    print("IMAGE COVERAGE REPORT")
    print("=" * 68)
    print(f"  Total slots:           {report['total_assets']}")
    print(f"  Fetched this run:      {report['fetched_this_run']}")
    print(f"  Skipped (cached):      {report['skipped_cached']}")
    print(f"  Failures:              {report['failures']}  (MISSING: {report['missing_count']})")
    print()
    print("  Source distribution:")
    for src, n in sorted(by_source.items(), key=lambda kv: -kv[1]):
        print(f"    {src:20s} {n}")
    print()
    print(f"  Unique URLs in provenance:    {unique_urls}")
    print(f"  Active provenance entries:    {len(active)}")
    if unique_urls != len(active):
        print(f"  ⚠️  url-uniqueness invariant VIOLATED ({len(active)-unique_urls} duplicates)")
    else:
        print("  ✅ url-uniqueness invariant holds (1 URL per slot)")
    ledger = summary.get("ledger_stats") or {}
    if ledger:
        print(f"  Ledger: unique_urls={ledger.get('unique_urls')} "
              f"unique_hashes={ledger.get('unique_hashes')}")
    print()

    if missing:
        print(f"  MISSING items ({len(missing)}) — manual override needed:")
        for m in missing:
            qs = " | ".join(m.get("queries", []))
            print(f"    [{m['kind']:8s}] {m['id']:35s}  queries: {qs}")
        print()

    print("  Random 20-URL sample (for spot-check):")
    for entry in sample_view:
        print(f"    [{entry['source']:10s}] {entry['kind_dir'] or '?':9s} "
              f"{entry['id']:35s} {entry['url']}")
    print("=" * 68)

    return report


def main(argv: list[str] | None = None) -> int:
    load_dotenv(paths.PIPELINE_DIR / ".env", override=True)
    paths.ensure_build_dirs()

    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sample", action="store_true",
                        help="Gate C sample: 10 representative recipes + 5 regions.")
    parser.add_argument("--limit-recipes", type=int, default=None,
                        help="Cap the recipe work list to this many.")
    parser.add_argument("--limit-regions", type=int, default=None,
                        help="Cap the region work list to this many.")
    parser.add_argument("--recipes", type=str, default=None,
                        help="Comma-separated recipe ids to fetch (overrides --limit-recipes).")
    parser.add_argument("--regions", type=str, default=None,
                        help="Comma-separated region ids to fetch (overrides --limit-regions).")
    parser.add_argument("--no-write-back", action="store_true",
                        help="Skip writing recipes/sections/regions JSON. Useful for sample runs.")
    args = parser.parse_args(argv)

    if args.sample:
        recipe_ids = SAMPLE_RECIPE_IDS
        region_ids = SAMPLE_REGION_IDS
        no_write_back = True
    else:
        recipe_ids = [s.strip() for s in args.recipes.split(",")] if args.recipes else None
        region_ids = [s.strip() for s in args.regions.split(",")] if args.regions else None
        no_write_back = args.no_write_back

    recipes_payload = json.loads(paths.RECIPES_JSON.read_text())
    sections_payload = json.loads(paths.SECTIONS_JSON.read_text())
    regions_payload = json.loads(paths.REGIONS_JSON.read_text())

    recipes = _filter_assets("recipes", recipes_payload, recipe_ids, args.limit_recipes)
    sections = sections_payload["sections"] if (recipe_ids is None and region_ids is None
                                                 and not args.sample) else []
    regions = _filter_assets("regions", regions_payload, region_ids, args.limit_regions)

    print(
        f"Fetching: {len(recipes)} recipes, {len(sections)} sections, "
        f"{len(regions)} regions  (sample={args.sample})"
    )

    summary = fetch_all(
        recipes=recipes,
        sections=sections,
        regions=regions,
        images_root=paths.DATA_IMAGES,
        overrides_path=paths.IMAGE_OVERRIDES,
        provenance_path=paths.IMAGE_PROVENANCE,
        region_queries_path=paths.IMAGE_REGION_QUERIES,
    )

    paths.IMAGE_FETCH_FAILURES.write_text(json.dumps(summary["failed"], indent=2))

    if not no_write_back:
        # Re-emit through the existing payloads to preserve schema_version
        # and other top-level fields. Pydantic validation skipped — only
        # `image` / `hero_image` changed, both nullable strings.
        paths.RECIPES_JSON.write_text(json.dumps(recipes_payload, indent=2))
        paths.SECTIONS_JSON.write_text(json.dumps(sections_payload, indent=2))
        paths.REGIONS_JSON.write_text(json.dumps(regions_payload, indent=2))

    report = _print_coverage_report(summary, paths.IMAGE_PROVENANCE)
    paths.IMAGE_COVERAGE_REPORT.write_text(json.dumps(report, indent=2))

    print(f"\nFailures (full): {paths.IMAGE_FETCH_FAILURES}")
    print(f"Coverage report: {paths.IMAGE_COVERAGE_REPORT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
