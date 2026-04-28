"""Hard dedup ledger for Stage 9.

Two items (recipe / section / region) must never share the same image. This
catches two failure modes that bit PR #7:

1. **Same source URL across slots.** SerpAPI happily returns the same image
   for "Nargisi Seekh Kebab" and "Sikampoor Kebab" because the recipes look
   visually similar. URL dedup catches this.

2. **Different URLs, byte-identical content.** A recipe blogger republishes
   the same JPEG under multiple paths/CDNs; or two SerpAPI queries surface
   the same upstream photo via different mirrors. Hash dedup catches this.

The ledger is updated *after* a download succeeds — `register()` either
records the URL+hash (returning True) or rejects them as duplicates
(returning False). On rejection, the fetcher discards the file and falls
through to the next candidate / next source tier.

Thread-safe so the orchestrator's ThreadPoolExecutor can call from workers.
"""

from __future__ import annotations

import hashlib
import threading
from dataclasses import dataclass


@dataclass
class LedgerEntry:
    asset_id: str
    kind: str  # "recipe" | "section" | "region"
    url: str
    sha256: str


class DedupLedger:
    """Tracks every accepted image's URL + content hash across all kinds.

    Slot collisions are rejected at register time. The ledger never deletes
    entries — once an image is assigned to an asset, no other asset can
    claim it during the run.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._by_url: dict[str, LedgerEntry] = {}
        self._by_hash: dict[str, LedgerEntry] = {}

    def has_url(self, url: str) -> bool:
        with self._lock:
            return url in self._by_url

    def has_hash(self, sha256: str) -> bool:
        with self._lock:
            return sha256 in self._by_hash

    def lookup_url(self, url: str) -> LedgerEntry | None:
        with self._lock:
            return self._by_url.get(url)

    def lookup_hash(self, sha256: str) -> LedgerEntry | None:
        with self._lock:
            return self._by_hash.get(sha256)

    def register(self, *, asset_id: str, kind: str, url: str, content: bytes) -> LedgerEntry:
        """Reserve `url` + content for `asset_id`.

        Raises `DuplicateAsset` if either the URL or the content hash is
        already claimed by another asset.
        """
        sha = hashlib.sha256(content).hexdigest()
        with self._lock:
            existing_url = self._by_url.get(url)
            if existing_url is not None and existing_url.asset_id != asset_id:
                raise DuplicateAsset(
                    f"URL already assigned to {existing_url.kind}/{existing_url.asset_id}: {url}"
                )
            existing_hash = self._by_hash.get(sha)
            if existing_hash is not None and existing_hash.asset_id != asset_id:
                raise DuplicateAsset(
                    f"content hash already assigned to "
                    f"{existing_hash.kind}/{existing_hash.asset_id} (different URL: "
                    f"{existing_hash.url}); reject {url}"
                )
            entry = LedgerEntry(asset_id=asset_id, kind=kind, url=url, sha256=sha)
            self._by_url[url] = entry
            self._by_hash[sha] = entry
            return entry

    def stats(self) -> dict:
        with self._lock:
            return {
                "unique_urls": len(self._by_url),
                "unique_hashes": len(self._by_hash),
            }


class DuplicateAsset(Exception):
    """Raised when a download collides with something already registered."""
