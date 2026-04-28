"""DedupLedger tests."""

from __future__ import annotations

import pytest

from cookbook_pipeline.stages.image_dedup import DedupLedger, DuplicateAsset


def test_first_register_succeeds():
    led = DedupLedger()
    entry = led.register(asset_id="r1", kind="recipe",
                         url="https://x/a.jpg", content=b"abc")
    assert entry.asset_id == "r1"
    assert led.has_url("https://x/a.jpg")
    assert led.has_hash(entry.sha256)


def test_same_asset_can_re_register_idempotently():
    """Re-registering the same asset_id with the same URL+content is a noop —
    happens during cached-asset reload."""
    led = DedupLedger()
    e1 = led.register(asset_id="r1", kind="recipe", url="https://x/a.jpg", content=b"abc")
    e2 = led.register(asset_id="r1", kind="recipe", url="https://x/a.jpg", content=b"abc")
    assert e1.sha256 == e2.sha256


def test_register_rejects_duplicate_url_for_different_asset():
    led = DedupLedger()
    led.register(asset_id="r1", kind="recipe", url="https://x/a.jpg", content=b"abc")
    with pytest.raises(DuplicateAsset, match="URL already assigned"):
        led.register(asset_id="r2", kind="recipe", url="https://x/a.jpg", content=b"def")


def test_register_rejects_byte_identical_content_under_different_url():
    """Same JPEG under two CDN URLs must collide via the hash check.
    This is the `nargisi`/`sikampoor` regression — same image bytes,
    different SerpAPI result URLs.
    """
    led = DedupLedger()
    led.register(asset_id="r1", kind="recipe", url="https://cdn-a/x.jpg", content=b"jpegbytes")
    with pytest.raises(DuplicateAsset, match="content hash already assigned"):
        led.register(asset_id="r2", kind="recipe", url="https://cdn-b/x.jpg", content=b"jpegbytes")


def test_dedup_is_cross_kind():
    """A recipe and a region both grabbing the same Wikimedia photo must collide."""
    led = DedupLedger()
    led.register(asset_id="hyderabad", kind="region",
                 url="https://upload.wikimedia.org/Charminar.jpg", content=b"img")
    with pytest.raises(DuplicateAsset):
        led.register(asset_id="charminar-biryani", kind="recipe",
                     url="https://upload.wikimedia.org/Charminar.jpg", content=b"img")


def test_stats():
    led = DedupLedger()
    led.register(asset_id="a", kind="recipe", url="https://x/1.jpg", content=b"1")
    led.register(asset_id="b", kind="recipe", url="https://x/2.jpg", content=b"2")
    assert led.stats() == {"unique_urls": 2, "unique_hashes": 2}
