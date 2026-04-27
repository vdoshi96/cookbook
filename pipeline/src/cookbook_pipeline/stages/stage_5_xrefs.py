"""Stage 5 — resolve "(see page X)" cross-refs to recipe IDs.

Builds a graph: forward edges on each recipe, plus a reverse `used_in` index.
References to pages that don't have a recipe (e.g. chapter-intro pages) are
kept with `id=null` so the frontend can either show them or hide them.
"""

from __future__ import annotations

import warnings


def resolve_xrefs(recipes: list[dict]) -> tuple[list[dict], list[dict], dict[str, list[str]]]:
    page_to_id: dict[int, str] = {}
    for r in recipes:
        # If multiple recipes share a page, the FIRST one wins for cross-ref
        # resolution. Cross-refs to a multi-recipe page can resolve incorrectly,
        # so we warn so the pilot run reveals how often this assumption breaks.
        page = r["source_page"]
        existing = page_to_id.setdefault(page, r["id"])
        if existing != r["id"]:
            warnings.warn(
                f"Page {page} has multiple recipes ({existing!r}, {r['id']!r}); "
                f"cross-refs to this page will resolve to {existing!r}.",
                stacklevel=2,
            )

    edges: list[dict] = []
    used_in: dict[str, list[str]] = {}
    updated = []

    for r in recipes:
        new_refs = []
        for ref in r.get("cross_refs", []):
            target_id = page_to_id.get(ref["page"])
            new_refs.append({"name": ref["name"], "page": ref["page"], "id": target_id})
            if target_id is not None and target_id != r["id"]:
                edges.append({"from": r["id"], "to": target_id, "kind": "uses"})
                used_in.setdefault(target_id, []).append(r["id"])
        new = dict(r)
        new["cross_refs"] = new_refs
        updated.append(new)

    # Sort reverse lists for stable output
    for k in used_in:
        used_in[k] = sorted(set(used_in[k]))
    edges.sort(key=lambda e: (e["from"], e["to"]))
    return updated, edges, used_in
