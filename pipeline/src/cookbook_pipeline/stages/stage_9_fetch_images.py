"""Stage 9 — fetch high-quality images from the internet.

Replaces the original PDF image extraction. The PDF photos are too low
quality for the website; per the design spec §8.5, every recipe / section /
region image is sourced from the internet using a Google Images search
(SerpAPI). This is a personal, non-commercial project — license is not
filtered, we pick the highest-quality match available.

## Per-asset flow

1. Build a query string ("nargisi seekh kebab awadh indian recipe").
2. Look up an override in `pipeline/data/image-overrides.yml` (manual curated
   override file, id → URL or absolute path); use that if present.
3. Else look up the asset in `data/images/_provenance.json` (the durable
   cache from prior runs). If a cached entry exists and the local file is
   present, skip — no API call.
4. Else hit SerpAPI's google_images engine, take the first image that's at
   least MIN_DIMENSIONS, isn't from a domain in BLOCKED_DOMAINS, and has a
   downloadable original. Download, re-encode to WebP @ quality 85.
5. Write to `data/images/{kind}/{id}.webp` and append to provenance.

## On failure

Per-asset failures are accumulated into `failures` and returned. The pipeline
keeps going — a recipe with no image emits `image: null` and the frontend
falls back to a placeholder. The user reviews the failures list and curates
overrides as needed.

## Why the provenance cache matters

SerpAPI is rate-limited (200/hr Starter, 1000/hr Developer). The cache makes
re-runs free for assets we already fetched, so iterating on the prompts /
overrides / data doesn't re-burn quota.
"""

from __future__ import annotations

import io
import json
import os
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
import yaml
from PIL import Image
from tqdm import tqdm

# IDs we never fetch images for. Stage 1's footer scan still surfaces these
# as sections in some pipeline versions; with the paratext restructure they
# no longer appear in sections.json, but the skip list keeps the fetcher
# robust if it ever runs on an older sections.json.
PARATEXT_IDS = frozenset({"introduction", "glossary", "directory", "index"})

MIN_WIDTH = 800
MIN_HEIGHT = 600

# Stock-photo and gallery domains that often serve watermarked or
# license-restricted previews. Personal use is unrestricted, but the
# previews are visibly bad (giant watermarks). Skip them for image quality,
# not for licensing reasons.
BLOCKED_DOMAINS = frozenset({
    "shutterstock.com",
    "alamy.com",
    "dreamstime.com",
    "istockphoto.com",
    "gettyimages.com",
    "depositphotos.com",
    "123rf.com",
    "stock.adobe.com",
})

WEBP_QUALITY = 85
DOWNLOAD_TIMEOUT_S = 20
SERPAPI_ENDPOINT = "https://serpapi.com/search.json"


class FetcherError(Exception):
    """Per-asset fetch error. Surfaced into `failures`, not raised to caller."""


def _utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat(timespec="seconds")


def _domain_of(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


def _is_blocked(url: str) -> bool:
    d = _domain_of(url)
    return any(d == bad or d.endswith("." + bad) for bad in BLOCKED_DOMAINS)


def load_overrides(path: Path) -> dict[str, str]:
    """Load the manual override file — {asset_id: url_or_path}.

    Missing file is OK (returns {}). Invalid YAML raises so the user notices.
    """
    if not path.exists():
        return {}
    raw = yaml.safe_load(path.read_text()) or {}
    if not isinstance(raw, dict):
        raise FetcherError(f"image-overrides.yml must be a mapping, got {type(raw).__name__}")
    return {str(k): str(v) for k, v in raw.items()}


def load_provenance(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def save_provenance(path: Path, prov: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(prov, indent=2, sort_keys=True))


def serpapi_search(query: str, api_key: str) -> list[dict]:
    """Run a Google Images search, return the raw `images_results` list.

    Retries on 429 / 5xx with exponential backoff. Empty list on no results.
    """
    params = {
        "engine": "google_images",
        "q": query,
        "api_key": api_key,
        "ijn": "0",
    }
    backoff = 2.0
    for attempt in range(4):
        resp = requests.get(SERPAPI_ENDPOINT, params=params, timeout=DOWNLOAD_TIMEOUT_S)
        if resp.status_code == 200:
            return (resp.json() or {}).get("images_results", []) or []
        if resp.status_code in (429, 500, 502, 503, 504) and attempt < 3:
            time.sleep(backoff)
            backoff *= 2
            continue
        raise FetcherError(f"SerpAPI {resp.status_code}: {resp.text[:300]}")
    raise FetcherError("SerpAPI: exhausted retries")


def _pick_best_result(results: list[dict]) -> dict | None:
    """Return the first usable result, or None."""
    for r in results:
        url = r.get("original") or r.get("image") or r.get("thumbnail")
        if not url:
            continue
        if _is_blocked(url):
            continue
        # SerpAPI returns original_width / original_height when known.
        w = r.get("original_width") or 0
        h = r.get("original_height") or 0
        if w and h and (w < MIN_WIDTH or h < MIN_HEIGHT):
            continue
        return r
    return None


def download_and_encode(url: str, dest: Path) -> tuple[int, int]:
    """Download `url`, decode, re-encode to WebP at `dest`. Returns (w, h)."""
    headers = {"User-Agent": "Mozilla/5.0 (cookbook-pipeline)"}
    resp = requests.get(url, headers=headers, timeout=DOWNLOAD_TIMEOUT_S, stream=True)
    if resp.status_code != 200:
        raise FetcherError(f"download {url}: HTTP {resp.status_code}")
    raw = resp.content
    try:
        pil = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise FetcherError(f"decode {url}: {e}") from e
    if pil.width < MIN_WIDTH or pil.height < MIN_HEIGHT:
        raise FetcherError(
            f"{url}: actual dimensions {pil.width}x{pil.height} below "
            f"min {MIN_WIDTH}x{MIN_HEIGHT}"
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    pil.save(dest, "WEBP", quality=WEBP_QUALITY)
    return pil.width, pil.height


def _slugify_for_query(s: str) -> str:
    return s.replace("/", " ").replace("&", "and").strip()


def _build_recipe_query(recipe: dict) -> str:
    parts = [recipe["name"]]
    region = recipe.get("origin_region_name")
    if region and region.lower() != "pan-indian":
        parts.append(region)
    parts.append("indian recipe")
    return " ".join(_slugify_for_query(p) for p in parts if p)


def _build_section_query(section: dict) -> str:
    return f"indian {_slugify_for_query(section['name'])} food"


# Curated per-region queries — region names alone return generic stock imagery
# of "Punjab" or "Kashmir" landscapes that don't read as a hero. Anchoring on
# a famous regional landmark or cultural scene gives much better results.
# Fallback: f"{region.name} india culture".
REGION_QUERY_OVERRIDES: dict[str, str] = {
    "awadh": "Bara Imambara Lucknow Awadh",
    "kashmir": "Dal Lake Kashmir",
    "jammu-and-kashmir": "Dal Lake Kashmir",
    "punjab": "Golden Temple Amritsar Punjab",
    "tamil-nadu": "Meenakshi Temple Madurai Tamil Nadu",
    "kerala": "Kerala backwaters houseboat",
    "rajasthan": "Hawa Mahal Jaipur Rajasthan",
    "gujarat": "Rani ki Vav Gujarat",
    "maharashtra": "Gateway of India Mumbai Maharashtra",
    "karnataka": "Mysore Palace Karnataka",
    "andhra-pradesh": "Charminar Hyderabad Andhra Pradesh",
    "telangana": "Charminar Hyderabad Telangana",
    "west-bengal": "Howrah Bridge Kolkata West Bengal",
    "bengal": "Howrah Bridge Kolkata Bengal",
    "odisha": "Konark Sun Temple Odisha",
    "orissa": "Konark Sun Temple Odisha",
    "goa": "Goa beach Portuguese church",
    "uttar-pradesh": "Taj Mahal Agra Uttar Pradesh",
    "bihar": "Mahabodhi Temple Bodh Gaya Bihar",
    "haryana": "Kurukshetra Haryana fields",
    "himachal-pradesh": "Shimla mountains Himachal Pradesh",
    "uttarakhand": "Kedarnath temple Uttarakhand Himalayas",
    "madhya-pradesh": "Khajuraho temples Madhya Pradesh",
    "chhattisgarh": "Chitrakote Falls Chhattisgarh",
    "jharkhand": "Hundru Falls Jharkhand",
    "assam": "Kamakhya Temple Guwahati Assam",
    "manipur": "Loktak Lake Manipur",
    "meghalaya": "Cherrapunji living root bridges Meghalaya",
    "nagaland": "Hornbill Festival Nagaland",
    "sikkim": "Kanchenjunga Sikkim mountains",
    "tripura": "Ujjayanta Palace Tripura",
    "arunachal-pradesh": "Tawang Monastery Arunachal Pradesh",
    "mizoram": "Mizoram hills Aizawl",
    "pan-indian": "India cultural landscape",
    "indian": "India cultural landscape",
}


def _build_region_query(region: dict) -> str:
    rid = region["id"]
    if rid in REGION_QUERY_OVERRIDES:
        return REGION_QUERY_OVERRIDES[rid]
    return f"{region['name']} India culture"


def _fetch_one(
    *,
    asset_id: str,
    query: str,
    dest: Path,
    overrides: dict[str, str],
    provenance: dict[str, dict],
    api_key: str,
) -> dict:
    """Resolve, download, and record one asset. Returns the provenance row."""
    # 1. Override file
    if asset_id in overrides:
        url = overrides[asset_id]
        if url.startswith(("http://", "https://")):
            w, h = download_and_encode(url, dest)
            return {"id": asset_id, "url": url, "source": "override",
                    "query": query, "fetched_at": _utc_now_iso(),
                    "width": w, "height": h}
        # local file path
        src = Path(url)
        if not src.is_absolute():
            src = (dest.parent.parent.parent.parent / src).resolve()
        if not src.exists():
            raise FetcherError(f"override path does not exist: {src}")
        pil = Image.open(src).convert("RGB")
        dest.parent.mkdir(parents=True, exist_ok=True)
        pil.save(dest, "WEBP", quality=WEBP_QUALITY)
        return {"id": asset_id, "url": str(src), "source": "override-local",
                "query": query, "fetched_at": _utc_now_iso(),
                "width": pil.width, "height": pil.height}

    # 2. Provenance cache (skip API call if file already on disk)
    cached = provenance.get(asset_id)
    if cached and dest.exists():
        return cached

    # 3. SerpAPI
    results = serpapi_search(query, api_key)
    pick = _pick_best_result(results)
    if pick is None:
        raise FetcherError(f"no usable results for query {query!r}")
    url = pick.get("original") or pick.get("image")
    w, h = download_and_encode(url, dest)
    return {"id": asset_id, "url": url, "source": "serpapi",
            "query": query, "fetched_at": _utc_now_iso(),
            "width": w, "height": h,
            "result_title": pick.get("title"),
            "result_source": pick.get("source")}


def fetch_all(
    *,
    recipes: list[dict],
    sections: list[dict],
    regions: list[dict],
    images_root: Path,
    overrides_path: Path,
    provenance_path: Path,
    api_key: str | None = None,
    concurrency: int = 4,
) -> dict[str, Any]:
    """Fetch images for every recipe / section / region asset.

    Mutates each input dict in place to set its `image` (recipe) or
    `hero_image` (section/region) field to the relative path under /data/.

    Returns a summary dict:
        {"fetched": N, "skipped_cached": N, "failed": [{id, kind, query, error}, ...]}
    """
    api_key = api_key or os.environ.get("SERPAPI_API_KEY")
    if not api_key:
        raise FetcherError(
            "SERPAPI_API_KEY not set. Add it to pipeline/.env or skip Stage 9."
        )

    overrides = load_overrides(overrides_path)
    provenance = load_provenance(provenance_path)
    failures: list[dict] = []
    fetched = 0
    skipped_cached = 0

    # Build the work list. Each tuple: (kind, asset, dest_path, query, set_field, parent_dict)
    work: list[tuple[str, dict, Path, str, str]] = []
    for r in recipes:
        dest = images_root / "recipes" / f"{r['id']}.webp"
        work.append(("recipe", r, dest, _build_recipe_query(r), "image"))
    for s in sections:
        if s["id"] in PARATEXT_IDS:
            continue
        dest = images_root / "sections" / f"{s['id']}.webp"
        work.append(("section", s, dest, _build_section_query(s), "hero_image"))
    for rg in regions:
        dest = images_root / "regions" / f"{rg['id']}.webp"
        work.append(("region", rg, dest, _build_region_query(rg), "hero_image"))

    # Execute in parallel. SerpAPI Developer is 1000/hr → concurrency 4-6
    # is well within budget; Starter is 200/hr → concurrency 4 will get
    # rate-limited and back off via _serpapi retries, which is fine.
    def _run_one(item: tuple[str, dict, Path, str, str]):
        kind, asset, dest, query, set_field = item
        try:
            row = _fetch_one(
                asset_id=asset["id"], query=query, dest=dest,
                overrides=overrides, provenance=provenance, api_key=api_key,
            )
            return ("ok", kind, asset, set_field, dest, row)
        except FetcherError as e:
            return ("err", kind, asset, set_field, dest, str(e), query)

    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        futures = [ex.submit(_run_one, w) for w in work]
        for fut in tqdm(as_completed(futures), total=len(futures), desc="images"):
            res = fut.result()
            if res[0] == "ok":
                _, kind, asset, set_field, dest, row = res
                # Path RELATIVE to /data/, so the frontend can prefix with /
                rel = dest.relative_to(images_root.parent).as_posix()
                asset[set_field] = rel
                if asset["id"] in provenance and dest.exists() and row.get("source") != "override":
                    skipped_cached += 1
                else:
                    fetched += 1
                provenance[asset["id"]] = row
            else:
                _, kind, asset, set_field, dest, err, query = res
                asset[set_field] = None
                failures.append({"id": asset["id"], "kind": kind,
                                 "query": query, "error": err})

    save_provenance(provenance_path, provenance)

    return {
        "fetched": fetched,
        "skipped_cached": skipped_cached,
        "failed": failures,
        "total_assets": len(work),
    }
