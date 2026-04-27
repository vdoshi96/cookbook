"""Stage 5 — resolve "(see page X)" cross-refs to recipe IDs.

Builds a graph: forward edges on each recipe, plus a reverse `used_in` index.
References to pages that don't have a recipe (e.g. chapter-intro pages) are
kept with `id=null` so the frontend can either show them or hide them.
"""

from __future__ import annotations


def resolve_xrefs(recipes: list[dict]) -> tuple[list[dict], list[dict], dict[str, list[str]]]:
    page_to_id: dict[int, str] = {}
    for r in recipes:
        # If multiple recipes share a page, the FIRST one wins for cross-ref
        # resolution. Most cross-refs point to staple paste/masala recipes
        # which are alone on their page anyway.
        page_to_id.setdefault(r["source_page"], r["id"])

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
    return updated, edges, used_in
