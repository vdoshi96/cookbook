"""Source adapter tests — pure HTTP mocking, no real network."""

from __future__ import annotations

import pytest

from cookbook_pipeline.stages.image_sources import (
    BLOCKED_DOMAINS,
    PexelsSource,
    SerpApiSource,
    SourceError,
    WikimediaSource,
    _is_blocked_for_serpapi,
)


# ---- SerpApiSource filtering --------------------------------------------------


def test_serpapi_blocks_stock_domains():
    assert _is_blocked_for_serpapi("https://www.shutterstock.com/x.jpg")
    assert _is_blocked_for_serpapi("https://images.gettyimages.com/x.jpg")
    assert _is_blocked_for_serpapi("https://stock.adobe.com/x.jpg")


def test_serpapi_blocks_wikimedia_and_wikipedia():
    """Regression: PR #7 lets Wikimedia URLs through SerpAPI; the new policy
    routes Wikimedia exclusively through WikimediaSource."""
    assert _is_blocked_for_serpapi("https://upload.wikimedia.org/anything.jpg")
    assert _is_blocked_for_serpapi("https://commons.wikimedia.org/wiki/x")
    assert _is_blocked_for_serpapi("https://en.wikipedia.org/wiki/x.jpg")


def test_serpapi_allows_normal_food_blogs():
    assert not _is_blocked_for_serpapi("https://www.indianhealthyrecipes.com/x.jpg")
    assert not _is_blocked_for_serpapi("https://i.ytimg.com/vi/abc/maxresdefault.jpg")


def test_serpapi_filter_drops_thumbnail_only_results(mocker):
    """A result with only `thumbnail` (no `original`/`image`) must be dropped.
    Thumbnails fill the slot with a 250px image — worse than no image.
    """
    fake_resp = mocker.Mock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = {
        "images_results": [
            {"thumbnail": "https://t.example.com/tiny.jpg",
             "original_width": 4000, "original_height": 3000},
            {"original": "https://example.com/full.jpg",
             "original_width": 1600, "original_height": 1200},
        ]
    }
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    src = SerpApiSource(api_key="fake")
    cands = src.search("test query")
    assert len(cands) == 1
    assert cands[0].url == "https://example.com/full.jpg"


def test_serpapi_filter_drops_undersized(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = {
        "images_results": [
            {"original": "https://example.com/tiny.jpg",
             "original_width": 200, "original_height": 200},
            {"original": "https://example.com/big.jpg",
             "original_width": 2000, "original_height": 1500},
        ]
    }
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    cands = SerpApiSource(api_key="fake").search("q")
    assert [c.url for c in cands] == ["https://example.com/big.jpg"]


def test_serpapi_raises_source_error_on_4xx(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 400
    fake_resp.text = "Bad Request"
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    with pytest.raises(SourceError):
        SerpApiSource(api_key="fake").search("q")


def test_serpapi_raises_source_error_when_no_key():
    with pytest.raises(SourceError):
        SerpApiSource(api_key="")


# ---- PexelsSource -------------------------------------------------------------


def test_pexels_maps_response_to_candidates(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = {
        "photos": [
            {
                "id": 1, "width": 3000, "height": 2000,
                "photographer": "Alice", "url": "https://pexels.com/p/1",
                "src": {"original": "https://images.pexels.com/1/orig.jpg",
                        "large2x": "https://images.pexels.com/1/large.jpg"},
            },
            {
                "id": 2, "width": 400, "height": 300,  # too small
                "photographer": "Bob", "url": "https://pexels.com/p/2",
                "src": {"original": "https://images.pexels.com/2/orig.jpg"},
            },
        ]
    }
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    cands = PexelsSource(api_key="fake").search("indian food")
    assert len(cands) == 1
    assert cands[0].url == "https://images.pexels.com/1/large.jpg"
    assert "Alice via Pexels" in cands[0].attribution
    assert cands[0].source == "pexels"


def test_pexels_raises_on_unauthorized(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 401
    fake_resp.text = "Unauthorized"
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    with pytest.raises(SourceError, match="401"):
        PexelsSource(api_key="bad").search("q")


# ---- WikimediaSource ----------------------------------------------------------


def test_wikimedia_maps_imageinfo(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = {
        "query": {
            "pages": {
                "1": {
                    "title": "File:Charminar.jpg",
                    "imageinfo": [{
                        "url": "https://upload.wikimedia.org/Charminar.jpg",
                        "width": 4000, "height": 3000, "mime": "image/jpeg",
                    }],
                },
                "2": {
                    "title": "File:badmime.svg",
                    "imageinfo": [{
                        "url": "https://upload.wikimedia.org/badmime.svg",
                        "width": 4000, "height": 3000, "mime": "image/svg+xml",
                    }],
                },
            }
        }
    }
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    cands = WikimediaSource().search("Charminar Hyderabad")
    assert len(cands) == 1
    assert cands[0].url == "https://upload.wikimedia.org/Charminar.jpg"
    assert "Wikimedia Commons" in cands[0].attribution


def test_wikimedia_drops_undersized(mocker):
    fake_resp = mocker.Mock()
    fake_resp.status_code = 200
    fake_resp.json.return_value = {
        "query": {
            "pages": {
                "1": {
                    "title": "File:tiny.jpg",
                    "imageinfo": [{
                        "url": "https://upload.wikimedia.org/tiny.jpg",
                        "width": 100, "height": 100, "mime": "image/jpeg",
                    }],
                },
            }
        }
    }
    mocker.patch("cookbook_pipeline.stages.image_sources.requests.get",
                 return_value=fake_resp)
    assert WikimediaSource().search("q") == []


def test_blocked_domains_includes_social_lookaside():
    """Inherited from PR #7: lookaside CDNs return HTML, not images."""
    assert "lookaside.fbsbx.com" in BLOCKED_DOMAINS
    assert "lookaside.instagram.com" in BLOCKED_DOMAINS
    assert "tiktok.com" in BLOCKED_DOMAINS
