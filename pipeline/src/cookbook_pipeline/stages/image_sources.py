"""Image source adapters for Stage 9 (tiered fetch chain).

Each source exposes a single `search(query) -> list[Candidate]` method:

- **SerpApiSource** — Google Images via SerpAPI. Drops thumbnail-only results,
  blocked stock domains, and (notably) any `*.wikimedia.org` /
  `*.wikipedia.org` URL. Wikimedia content is reached via WikimediaSource so
  it's gated to the last-resort tier instead of leaking through Google.

- **PexelsSource** — Pexels API. Always full-resolution; license-clean.

- **WikimediaSource** — Commons API (last resort). Polite UA per WMF policy.

A `Candidate` is a small immutable record with `url, width, height, source,
query, attribution`. The orchestrator iterates tiers, each tier's
candidates, and tries to download until one succeeds AND passes the dedup
ledger.

Sources raise `SourceError` only on HTTP/auth failure (so the orchestrator
can fall through to the next tier). Empty results are returned as `[]`.
"""

from __future__ import annotations

import time
import urllib.parse
from abc import ABC, abstractmethod
from dataclasses import dataclass

import requests

DEFAULT_TIMEOUT_S = 20
MIN_WIDTH = 800
MIN_HEIGHT = 600

# Stock photo galleries (watermarked previews) and social CDN endpoints
# (return HTML, not images). Inherited from the original Stage 9.
BLOCKED_DOMAINS = frozenset({
    "shutterstock.com",
    "alamy.com",
    "dreamstime.com",
    "istockphoto.com",
    "gettyimages.com",
    "depositphotos.com",
    "123rf.com",
    "stock.adobe.com",
    "lookaside.fbsbx.com",
    "lookaside.instagram.com",
    "tiktok.com",
})

# Demoted to the WikimediaSource tier — never accept these from SerpAPI.
WIKIMEDIA_HOSTS = frozenset({"upload.wikimedia.org", "commons.wikimedia.org"})
WIKIPEDIA_SUFFIXES = (".wikipedia.org",)


class SourceError(Exception):
    """Source-level failure (HTTP, auth, rate-limit exhausted). The
    orchestrator catches this and tries the next tier."""


@dataclass(frozen=True)
class Candidate:
    url: str
    width: int  # 0 if unknown
    height: int  # 0 if unknown
    source: str  # tier label: "serpapi" | "pexels" | "wikimedia"
    query: str
    attribution: str = ""  # photographer / page title, when the source provides one


class Source(ABC):
    """Tier interface."""

    name: str

    @abstractmethod
    def search(self, query: str) -> list[Candidate]: ...


def _domain_of(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


def _is_blocked_for_serpapi(url: str) -> bool:
    """SerpAPI candidates: drop stock, social, and Wikimedia/Wikipedia."""
    d = _domain_of(url)
    if not d:
        return True
    if any(d == bad or d.endswith("." + bad) for bad in BLOCKED_DOMAINS):
        return True
    if d in WIKIMEDIA_HOSTS:
        return True
    if any(d.endswith(suf) for suf in WIKIPEDIA_SUFFIXES):
        return True
    return False


# ---------------------------------------------------------------------------
# SerpAPI
# ---------------------------------------------------------------------------


class SerpApiSource(Source):
    """Google Images via SerpAPI's `google_images` engine."""

    name = "serpapi"
    ENDPOINT = "https://serpapi.com/search.json"

    def __init__(self, api_key: str, *, timeout_s: int = DEFAULT_TIMEOUT_S) -> None:
        if not api_key:
            raise SourceError("SerpAPI key missing")
        self._api_key = api_key
        self._timeout = timeout_s

    def search(self, query: str) -> list[Candidate]:
        params = {
            "engine": "google_images",
            "q": query,
            "api_key": self._api_key,
            "ijn": "0",
        }
        backoff = 2.0
        for attempt in range(4):
            resp = requests.get(self.ENDPOINT, params=params, timeout=self._timeout)
            if resp.status_code == 200:
                results = (resp.json() or {}).get("images_results", []) or []
                return self._filter(results, query)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise SourceError(f"SerpAPI {resp.status_code}: {resp.text[:300]}")
        raise SourceError("SerpAPI: exhausted retries")

    @staticmethod
    def _filter(results: list[dict], query: str) -> list[Candidate]:
        out: list[Candidate] = []
        for r in results:
            # Require a downloadable hero URL. `original` comes from the
            # full-resolution image; `image` is the in-search-results render.
            # `thumbnail` is the small preview — never accept it; serving a
            # thumbnail is worse than no image because it fills the slot.
            url = r.get("original") or r.get("image")
            if not url:
                continue
            if _is_blocked_for_serpapi(url):
                continue
            w = int(r.get("original_width") or 0)
            h = int(r.get("original_height") or 0)
            if w and h and (w < MIN_WIDTH or h < MIN_HEIGHT):
                continue
            attribution = r.get("source") or r.get("title") or ""
            out.append(Candidate(url=url, width=w, height=h,
                                 source="serpapi", query=query,
                                 attribution=str(attribution)[:200]))
        return out


# ---------------------------------------------------------------------------
# Pexels
# ---------------------------------------------------------------------------


class PexelsSource(Source):
    """Pexels API — license-clean stock with photographer attribution."""

    name = "pexels"
    ENDPOINT = "https://api.pexels.com/v1/search"

    def __init__(self, api_key: str, *, timeout_s: int = DEFAULT_TIMEOUT_S,
                 per_page: int = 10) -> None:
        if not api_key:
            raise SourceError("Pexels key missing")
        self._api_key = api_key
        self._timeout = timeout_s
        self._per_page = per_page

    def search(self, query: str) -> list[Candidate]:
        headers = {"Authorization": self._api_key}
        params = {
            "query": query,
            "per_page": str(self._per_page),
            "orientation": "landscape",
        }
        backoff = 2.0
        for attempt in range(3):
            resp = requests.get(self.ENDPOINT, params=params, headers=headers,
                                timeout=self._timeout)
            if resp.status_code == 200:
                data = resp.json() or {}
                photos = data.get("photos") or []
                return self._candidates(photos, query)
            if resp.status_code == 401:
                raise SourceError("Pexels: 401 unauthorized (bad PEXELS_API_KEY)")
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise SourceError(f"Pexels {resp.status_code}: {resp.text[:300]}")
        raise SourceError("Pexels: exhausted retries")

    @staticmethod
    def _candidates(photos: list[dict], query: str) -> list[Candidate]:
        out: list[Candidate] = []
        for p in photos:
            src = p.get("src") or {}
            # Prefer `large2x` (~2x display res) but fall back to `original`
            # which is full resolution but can be massive.
            url = src.get("large2x") or src.get("original")
            if not url:
                continue
            w = int(p.get("width") or 0)
            h = int(p.get("height") or 0)
            if w and h and (w < MIN_WIDTH or h < MIN_HEIGHT):
                continue
            photographer = p.get("photographer") or ""
            url_page = p.get("url") or ""
            attribution = f"{photographer} via Pexels ({url_page})" if photographer else "Pexels"
            out.append(Candidate(url=url, width=w, height=h,
                                 source="pexels", query=query,
                                 attribution=attribution[:200]))
        return out


# ---------------------------------------------------------------------------
# Wikimedia Commons (last resort)
# ---------------------------------------------------------------------------


class WikimediaSource(Source):
    """Wikimedia Commons API. Used only when both SerpAPI and Pexels miss."""

    name = "wikimedia"
    ENDPOINT = "https://commons.wikimedia.org/w/api.php"

    # Wikimedia policy: identifying UA so they can contact us if we misbehave.
    USER_AGENT = (
        "cookbook-pipeline/1.0 (https://github.com/vdoshi96/cookbook; "
        "personal use, contact via repo)"
    )

    def __init__(self, *, timeout_s: int = DEFAULT_TIMEOUT_S, limit: int = 10) -> None:
        self._timeout = timeout_s
        self._limit = limit

    def search(self, query: str) -> list[Candidate]:
        params = {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "generator": "search",
            "gsrnamespace": "6",  # File: namespace
            "gsrsearch": query,
            "gsrlimit": str(self._limit),
            "iiprop": "url|size|mime",
        }
        headers = {"User-Agent": self.USER_AGENT, "Accept": "application/json"}
        backoff = 2.0
        for attempt in range(3):
            resp = requests.get(self.ENDPOINT, params=params, headers=headers,
                                timeout=self._timeout)
            if resp.status_code == 200:
                data = resp.json() or {}
                pages = ((data.get("query") or {}).get("pages") or {})
                return self._candidates(list(pages.values()), query)
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise SourceError(f"Wikimedia {resp.status_code}: {resp.text[:300]}")
        raise SourceError("Wikimedia: exhausted retries")

    @staticmethod
    def _candidates(pages: list[dict], query: str) -> list[Candidate]:
        out: list[Candidate] = []
        for page in pages:
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            mime = (info.get("mime") or "").lower()
            if mime not in {"image/jpeg", "image/png", "image/webp"}:
                continue
            url = info.get("url")
            if not url:
                continue
            w = int(info.get("width") or 0)
            h = int(info.get("height") or 0)
            if w and h and (w < MIN_WIDTH or h < MIN_HEIGHT):
                continue
            title = page.get("title") or ""
            out.append(Candidate(
                url=url, width=w, height=h,
                source="wikimedia", query=query,
                attribution=f"{title} (Wikimedia Commons)"[:200],
            ))
        return out
