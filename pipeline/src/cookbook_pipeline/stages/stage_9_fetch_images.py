"""Stage 9 — fetch high-quality images from the internet (tiered).

Replaces the original PDF image extraction. The PDF photos are too low
quality for the website; per the design spec §8.5, every recipe / section /
region image is sourced from the internet.

## Source priority (per asset)

Tries each tier in order until one yields a downloadable, non-duplicate image:

1. **Manual override** (`pipeline/data/image-overrides.yml`).
2. **Cache** — if the asset already has a file on disk AND a URL recorded
   in `_provenance.json`, register it in the dedup ledger and skip.
3. **SerpAPI** — Google Images, full-resolution only. Wikimedia /
   Wikipedia URLs are dropped at this tier so they only land via
   WikimediaSource.
4. **Pexels** — license-clean stock with photographer attribution.
5. **Wikimedia Commons** — last resort.
6. **MISSING** — set image to null, log to failures, never reuse another
   asset's photo to fill the slot.

## Dedup invariant

Every accepted image's URL **and** content hash is registered in the
`DedupLedger`. No two recipes / sections / regions may share a URL or a
byte-identical file. If a download collides, it's discarded and the
fetcher tries the next candidate / next source.

## Provenance

Written synchronously after every successful fetch so a crash never wipes
the audit trail. Each row records: source tier, URL, query that won,
dimensions, content sha256, attribution (where available).
"""

from __future__ import annotations

import io
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
import yaml
from PIL import Image
from tqdm import tqdm

from cookbook_pipeline.stages.image_dedup import DedupLedger, DuplicateAsset
from cookbook_pipeline.stages.image_sources import (
    Candidate,
    PexelsSource,
    SerpApiSource,
    Source,
    SourceError,
    WikimediaSource,
)

# IDs Stage 9 never fetches for. The paratext restructure removed these
# from sections.json, but the skip list keeps the fetcher safe if it ever
# runs against an older snapshot.
PARATEXT_IDS = frozenset({"introduction", "glossary", "directory", "index"})

WEBP_QUALITY = 85
DOWNLOAD_TIMEOUT_S = 20
MIN_WIDTH = 800
MIN_HEIGHT = 600


class FetcherError(Exception):
    """Per-asset fetch error. Surfaced into `failures`, not raised."""


def _utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------------------
# Config loaders
# ---------------------------------------------------------------------------


def load_overrides(path: Path) -> dict[str, str]:
    """Load `{asset_id: url_or_path}` overrides. Missing file → empty dict."""
    if not path.exists():
        return {}
    raw = yaml.safe_load(path.read_text()) or {}
    if not isinstance(raw, dict):
        raise FetcherError(f"image-overrides.yml must be a mapping, got {type(raw).__name__}")
    return {str(k): str(v) for k, v in raw.items()}


def load_region_queries(path: Path) -> dict[str, list[str]]:
    """Load `{region_id: [query, ...]}` from YAML. Missing file → empty dict.

    Each value must be a non-empty list of strings; the first is the primary
    query, the rest are fallbacks tried in order.
    """
    if not path.exists():
        return {}
    raw = yaml.safe_load(path.read_text()) or {}
    if not isinstance(raw, dict):
        raise FetcherError(
            f"region-queries.yml must be a mapping, got {type(raw).__name__}"
        )
    out: dict[str, list[str]] = {}
    for k, v in raw.items():
        if not isinstance(v, list) or not v or not all(isinstance(q, str) and q for q in v):
            raise FetcherError(
                f"region-queries.yml[{k!r}]: must be a non-empty list of strings"
            )
        out[str(k)] = [str(q) for q in v]
    return out


def load_provenance(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_provenance(path: Path, prov: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(prov, indent=2, sort_keys=True))


# ---------------------------------------------------------------------------
# Query builders
# ---------------------------------------------------------------------------


def _slugify_for_query(s: str) -> str:
    return s.replace("/", " ").replace("&", "and").strip()


def _build_recipe_queries(recipe: dict) -> list[str]:
    parts = [recipe["name"]]
    region = recipe.get("origin_region_name")
    if region and region.lower() != "pan-indian":
        parts.append(region)
    parts.append("indian recipe")
    primary = " ".join(_slugify_for_query(p) for p in parts if p)
    fallback = f"{_slugify_for_query(recipe['name'])} recipe"
    out = [primary]
    if fallback != primary:
        out.append(fallback)
    return out


def _build_section_queries(section: dict) -> list[str]:
    name = _slugify_for_query(section["name"])
    return [f"indian {name} food", f"indian {name}"]


def _build_region_queries(region: dict, region_query_config: dict[str, list[str]]) -> list[str]:
    rid = region["id"]
    if rid in region_query_config:
        # Primary + curated fallbacks + bare-name last-ditch.
        return list(region_query_config[rid]) + [region["name"]]
    return [f"{region['name']} India culture", region["name"]]


# Public single-query builders kept for tests/other callers.
def _build_recipe_query(recipe: dict) -> str:
    return _build_recipe_queries(recipe)[0]


def _build_section_query(section: dict) -> str:
    return _build_section_queries(section)[0]


# ---------------------------------------------------------------------------
# Download / encode
# ---------------------------------------------------------------------------


# Browser-shaped UA. Some CDNs (and notably Wikimedia, when we hit it via
# SerpAPI URLs) rate-limit obvious bot UAs. Identifying suffix per WMF.
DOWNLOAD_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.0 Safari/605.1.15 "
        "cookbook-pipeline/1.0 (+personal use, contact via repo)"
    ),
    "Accept": "image/webp,image/jpeg,image/png,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def download_bytes(url: str) -> bytes:
    """GET `url`, return raw bytes. Retries once on 429/5xx.

    Wraps `requests.RequestException` (timeouts, DNS, conn-reset, …) in
    FetcherError so the candidate-iteration loop can fall through to the
    next URL instead of aborting the whole asset.
    """
    import time
    backoff = 1.5
    last_err = None
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=DOWNLOAD_HEADERS, timeout=DOWNLOAD_TIMEOUT_S)
        except requests.RequestException as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt < 2:
                time.sleep(backoff)
                backoff *= 2
                continue
            break
        if resp.status_code == 200:
            return resp.content
        last_err = f"HTTP {resp.status_code}"
        if resp.status_code in (429, 500, 502, 503, 504) and attempt < 2:
            time.sleep(backoff)
            backoff *= 2
            continue
        break
    raise FetcherError(f"download {url}: {last_err}")


def encode_to_webp(raw: bytes, dest: Path) -> tuple[int, int]:
    """Decode `raw`, validate dimensions, write WebP to `dest`. Returns (w, h)."""
    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise FetcherError(f"decode: {e}") from e
    if pil.width < MIN_WIDTH or pil.height < MIN_HEIGHT:
        raise FetcherError(
            f"actual dimensions {pil.width}x{pil.height} below "
            f"min {MIN_WIDTH}x{MIN_HEIGHT}"
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    pil.save(dest, "WEBP", quality=WEBP_QUALITY)
    return pil.width, pil.height


# ---------------------------------------------------------------------------
# Per-asset orchestration
# ---------------------------------------------------------------------------


def _try_candidate(
    cand: Candidate, dest: Path, asset_id: str, kind: str, ledger: DedupLedger,
) -> dict | None:
    """Download `cand`, register in ledger, write to disk. Returns provenance
    row on success, or None if this candidate is a duplicate / unusable."""
    # Pre-check URL — don't waste a download on a URL we already accepted.
    if ledger.has_url(cand.url):
        return None
    try:
        raw = download_bytes(cand.url)
    except FetcherError:
        return None
    # Dimension check + decode happens in encode_to_webp; if it fails the
    # candidate is rejected without registering.
    try:
        # Encode to a temp path so a dedup collision doesn't leave a stale file.
        tmp = dest.with_suffix(dest.suffix + ".tmp")
        w, h = encode_to_webp(raw, tmp)
    except FetcherError:
        return None
    try:
        entry = ledger.register(
            asset_id=asset_id, kind=kind, url=cand.url, content=raw,
        )
    except DuplicateAsset:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
        return None
    # Commit: move tmp into final location.
    dest.parent.mkdir(parents=True, exist_ok=True)
    os.replace(tmp, dest)
    return {
        "id": asset_id,
        "kind_dir": _kind_dir(kind),
        "source": cand.source,
        "url": cand.url,
        "query": cand.query,
        "width": w,
        "height": h,
        "sha256": entry.sha256,
        "attribution": cand.attribution,
        "fetched_at": _utc_now_iso(),
    }


def _kind_dir(kind: str) -> str:
    return {"recipe": "recipes", "section": "sections", "region": "regions"}[kind]


def _published_image_value(row: dict, dest: Path, images_root: Path) -> str:
    """Value written to recipe.image / section.hero_image / region.hero_image.

    The local WebP remains the cache artifact, but the website consumes http(s)
    URLs directly. Publishing the source URL keeps the generated images visible
    without requiring a separate static-asset copy step in /web.
    """
    url = row.get("url")
    if isinstance(url, str) and url.startswith(("http://", "https://")):
        return url
    return dest.relative_to(images_root.parent).as_posix()


def _fetch_one(
    *,
    asset_id: str,
    kind: str,
    queries: list[str],
    dest: Path,
    overrides: dict[str, str],
    provenance: dict[str, dict],
    ledger: DedupLedger,
    sources: list[Source],
    images_root: Path,
) -> dict | None:
    """Resolve, download, dedup-check, and write one asset.

    Returns the provenance row on success, or None on MISSING (all tiers
    exhausted). Raises FetcherError only for override misconfig — never for
    network / source errors (those fall through to the next tier).
    """
    # 1. Override
    if asset_id in overrides:
        return _fetch_via_override(
            asset_id=asset_id, kind=kind, dest=dest,
            url_or_path=overrides[asset_id], ledger=ledger, images_root=images_root,
        )

    # 2. Cache (file already on disk + URL recorded in provenance + URL not
    # already claimed by another asset). This re-registers the cached item
    # so dedup is correct on incremental runs.
    cached = provenance.get(asset_id)
    if cached and cached.get("url") and dest.exists():
        try:
            raw = dest.read_bytes()
            entry = ledger.register(
                asset_id=asset_id, kind=kind, url=cached["url"], content=raw,
            )
            row = dict(cached)
            row["sha256"] = entry.sha256
            row.setdefault("kind_dir", _kind_dir(kind))
            return row
        except DuplicateAsset:
            # Cached entry collides with another asset's existing file —
            # drop the cache, refetch through tiers below.
            try:
                dest.unlink(missing_ok=True)
            except OSError:
                pass

    # 3. Source chain
    for source in sources:
        for q in queries:
            try:
                cands = source.search(q)
            except SourceError:
                # Source-level failure: skip the rest of this source's
                # queries and fall through to the next tier.
                break
            for cand in cands:
                row = _try_candidate(cand, dest, asset_id, kind, ledger)
                if row is not None:
                    return row

    # 4. MISSING
    return None


def _fetch_via_override(
    *, asset_id: str, kind: str, dest: Path, url_or_path: str,
    ledger: DedupLedger, images_root: Path,
) -> dict:
    """Resolve an override entry. URL or local path."""
    if url_or_path.startswith(("http://", "https://")):
        raw = download_bytes(url_or_path)
        tmp = dest.with_suffix(dest.suffix + ".tmp")
        w, h = encode_to_webp(raw, tmp)
        try:
            entry = ledger.register(
                asset_id=asset_id, kind=kind, url=url_or_path, content=raw,
            )
        except DuplicateAsset as e:
            try:
                tmp.unlink(missing_ok=True)
            except OSError:
                pass
            raise FetcherError(f"override collides with another asset: {e}") from e
        dest.parent.mkdir(parents=True, exist_ok=True)
        os.replace(tmp, dest)
        return {
            "id": asset_id,
            "kind_dir": _kind_dir(kind),
            "source": "override",
            "url": url_or_path,
            "query": None,
            "width": w,
            "height": h,
            "sha256": entry.sha256,
            "attribution": "",
            "fetched_at": _utc_now_iso(),
        }
    # Local file path
    src = Path(url_or_path)
    if not src.is_absolute():
        src = (images_root.parent.parent / src).resolve()
    if not src.exists():
        raise FetcherError(f"override path does not exist: {src}")
    raw = src.read_bytes()
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    w, h = encode_to_webp(raw, tmp)
    try:
        entry = ledger.register(
            asset_id=asset_id, kind=kind, url=str(src), content=raw,
        )
    except DuplicateAsset as e:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
        raise FetcherError(f"override-local collides: {e}") from e
    dest.parent.mkdir(parents=True, exist_ok=True)
    os.replace(tmp, dest)
    return {
        "id": asset_id,
        "kind_dir": _kind_dir(kind),
        "source": "override-local",
        "url": str(src),
        "query": None,
        "width": w,
        "height": h,
        "sha256": entry.sha256,
        "attribution": "",
        "fetched_at": _utc_now_iso(),
    }


# ---------------------------------------------------------------------------
# Top-level
# ---------------------------------------------------------------------------


def _build_default_sources() -> list[Source]:
    serp_key = os.environ.get("SERPAPI_API_KEY")
    pexels_key = os.environ.get("PEXELS_API_KEY")
    sources: list[Source] = []
    if serp_key:
        sources.append(SerpApiSource(serp_key))
    if pexels_key:
        sources.append(PexelsSource(pexels_key))
    sources.append(WikimediaSource())
    return sources


def fetch_all(
    *,
    recipes: list[dict],
    sections: list[dict],
    regions: list[dict],
    images_root: Path,
    overrides_path: Path,
    provenance_path: Path,
    region_queries_path: Path | None = None,
    sources: list[Source] | None = None,
    concurrency: int = 4,
    api_key: str | None = None,  # back-compat: SerpAPI key only
) -> dict[str, Any]:
    """Fetch images for every recipe / section / region asset.

    If `sources` is None, builds the default chain
    `[SerpApiSource, PexelsSource, WikimediaSource]` from environment
    variables (`SERPAPI_API_KEY`, `PEXELS_API_KEY`). Tests pass a custom
    list to inject mocks.
    """
    if sources is None:
        if api_key:
            os.environ.setdefault("SERPAPI_API_KEY", api_key)
        sources = _build_default_sources()
    if not sources:
        raise FetcherError("no image sources configured (set SERPAPI_API_KEY / PEXELS_API_KEY)")

    overrides = load_overrides(overrides_path)
    provenance = load_provenance(provenance_path)
    region_query_cfg = (
        load_region_queries(region_queries_path) if region_queries_path else {}
    )

    ledger = DedupLedger()
    failures: list[dict] = []
    fetched = 0
    skipped_cached = 0
    source_counts: dict[str, int] = {}

    # Build the work list.
    work: list[tuple[str, dict, Path, list[str], str]] = []
    for r in recipes:
        dest = images_root / "recipes" / f"{r['id']}.webp"
        work.append(("recipe", r, dest, _build_recipe_queries(r), "image"))
    for s in sections:
        if s["id"] in PARATEXT_IDS:
            continue
        dest = images_root / "sections" / f"{s['id']}.webp"
        work.append(("section", s, dest, _build_section_queries(s), "hero_image"))
    for rg in regions:
        dest = images_root / "regions" / f"{rg['id']}.webp"
        work.append((
            "region", rg, dest,
            _build_region_queries(rg, region_query_cfg), "hero_image",
        ))

    prov_lock = threading.Lock()

    def _persist_row(asset_id: str, row: dict) -> None:
        with prov_lock:
            provenance[asset_id] = row
            save_provenance(provenance_path, provenance)

    def _run_one(item: tuple[str, dict, Path, list[str], str]):
        kind, asset, dest, queries, set_field = item
        try:
            row = _fetch_one(
                asset_id=asset["id"], kind=kind, queries=queries,
                dest=dest, overrides=overrides, provenance=provenance,
                ledger=ledger, sources=sources, images_root=images_root,
            )
            return ("ok", kind, asset, set_field, dest, queries, row)
        except Exception as e:
            # Catch-all: a single asset's exception must never abort the run
            # (would lose all in-flight provenance).
            return ("err", kind, asset, set_field, dest, queries,
                    f"{type(e).__name__}: {e}")

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        futures = [ex.submit(_run_one, w) for w in work]
        for fut in tqdm(as_completed(futures), total=len(futures), desc="images"):
            res = fut.result()
            if res[0] == "ok":
                _, kind, asset, set_field, dest, queries, row = res
                if row is None:
                    # MISSING — all tiers exhausted, no usable image.
                    asset[set_field] = None
                    failures.append({
                        "id": asset["id"], "kind": kind,
                        "queries": queries,
                        "error": "MISSING: no source returned a usable, non-duplicate image",
                    })
                else:
                    asset[set_field] = _published_image_value(row, dest, images_root)
                    prev = provenance.get(asset["id"])
                    is_cached = (
                        prev is not None
                        and prev.get("url") == row.get("url")
                        and dest.exists()
                        and row.get("source") not in ("override", "override-local")
                    )
                    if is_cached:
                        skipped_cached += 1
                    else:
                        fetched += 1
                    source_counts[row["source"]] = source_counts.get(row["source"], 0) + 1
                    _persist_row(asset["id"], row)
            else:
                _, kind, asset, set_field, dest, queries, err = res
                asset[set_field] = None
                failures.append({"id": asset["id"], "kind": kind,
                                 "queries": queries, "error": err})

    return {
        "fetched": fetched,
        "skipped_cached": skipped_cached,
        "failed": failures,
        "total_assets": len(work),
        "source_counts": source_counts,
        "ledger_stats": ledger.stats(),
    }
