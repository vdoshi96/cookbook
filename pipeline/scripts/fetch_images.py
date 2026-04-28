#!/usr/bin/env python3
"""Standalone Stage 9 runner.

Reads /data/recipes.json, /data/sections.json, /data/regions.json, calls
fetch_all() against SerpAPI, and writes the updated JSON files (with
populated image / hero_image paths) and the failures report.

Use this when only Stage 9 needs to run — no source PDF or full pipeline
build artifacts are required.

    cd pipeline
    source .venv/bin/activate
    python scripts/fetch_images.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Add src/ so cookbook_pipeline is importable regardless of editable-install state.
HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from dotenv import load_dotenv

from cookbook_pipeline import paths
from cookbook_pipeline.stages.stage_9_fetch_images import fetch_all


def main(argv: list[str] | None = None) -> int:
    load_dotenv(paths.PIPELINE_DIR / ".env", override=True)

    paths.ensure_build_dirs()

    recipes_payload = json.loads(paths.RECIPES_JSON.read_text())
    sections_payload = json.loads(paths.SECTIONS_JSON.read_text())
    regions_payload = json.loads(paths.REGIONS_JSON.read_text())

    recipes = recipes_payload["recipes"]
    sections = sections_payload["sections"]
    regions = regions_payload["regions"]

    print(
        f"Loaded {len(recipes)} recipes, {len(sections)} sections, "
        f"{len(regions)} regions."
    )

    summary = fetch_all(
        recipes=recipes,
        sections=sections,
        regions=regions,
        images_root=paths.DATA_IMAGES,
        overrides_path=paths.IMAGE_OVERRIDES,
        provenance_path=paths.IMAGE_PROVENANCE,
    )

    paths.IMAGE_FETCH_FAILURES.write_text(json.dumps(summary["failed"], indent=2))

    # Write back. Note: we re-emit through the existing payloads to preserve
    # schema_version and any other top-level fields. Pydantic validation is
    # skipped here intentionally — the only fields that changed are image /
    # hero_image, both of which are nullable strings; the rest of the data
    # is unchanged from the validated state we read in.
    paths.RECIPES_JSON.write_text(json.dumps(recipes_payload, indent=2))
    paths.SECTIONS_JSON.write_text(json.dumps(sections_payload, indent=2))
    paths.REGIONS_JSON.write_text(json.dumps(regions_payload, indent=2))

    print(
        f"\nDone. fetched={summary['fetched']} cached={summary['skipped_cached']} "
        f"failed={len(summary['failed'])} (total={summary['total_assets']})."
    )
    print(f"Failures (if any) logged to {paths.IMAGE_FETCH_FAILURES}.")
    if summary["failed"]:
        # Show first 20 failures for quick triage
        print("\nFirst 20 failures:")
        for f in summary["failed"][:20]:
            print(f"  - {f['kind']:8s} {f['id']:35s} query={f['query']!r}\n      {f['error']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
