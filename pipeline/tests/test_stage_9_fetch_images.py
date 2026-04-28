"""Tests for Stage 9 image fetching.

We mock SerpAPI and HTTP downloads — no real network calls. Tests cover the
selection / cache / override / failure logic; the actual SerpAPI integration
is exercised by the live pipeline run.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from unittest.mock import patch

import pytest
from PIL import Image

from cookbook_pipeline.stages.stage_9_fetch_images import (
    BLOCKED_DOMAINS,
    FetcherError,
    PARATEXT_IDS,
    _build_recipe_query,
    _build_region_query,
    _build_section_query,
    _domain_of,
    _is_blocked,
    _pick_best_result,
    _pick_candidates,
    fetch_all,
    load_overrides,
    load_provenance,
    save_provenance,
)


def _png_bytes(w: int = 1024, h: int = 768) -> bytes:
    pil = Image.new("RGB", (w, h), color=(120, 80, 40))
    buf = io.BytesIO()
    pil.save(buf, "PNG")
    return buf.getvalue()


def test_paratext_ids_constants():
    """Sanity: paratext skip list covers exactly the 4 known book paratext sections."""
    assert PARATEXT_IDS == {"introduction", "glossary", "directory", "index"}


def test_domain_blocking():
    assert _domain_of("https://www.shutterstock.com/abc.jpg").endswith("shutterstock.com")
    assert _is_blocked("https://www.shutterstock.com/x.jpg")
    assert _is_blocked("https://images.gettyimages.com/x.jpg")
    assert not _is_blocked("https://upload.wikimedia.org/x.jpg")


def test_pick_best_result_skips_blocked_and_too_small():
    results = [
        {"original": "https://shutterstock.com/a.jpg", "original_width": 4000, "original_height": 3000},
        {"original": "https://example.com/tiny.jpg", "original_width": 200, "original_height": 200},
        {"original": "https://upload.wikimedia.org/good.jpg", "original_width": 1600, "original_height": 1200},
    ]
    pick = _pick_best_result(results)
    assert pick is not None
    assert pick["original"] == "https://upload.wikimedia.org/good.jpg"


def test_pick_best_result_returns_none_when_no_usable():
    assert _pick_best_result([]) is None
    assert _pick_best_result([
        {"original": "https://shutterstock.com/a.jpg"},
    ]) is None


def test_blocked_domains_includes_social_lookaside():
    """Regression: Facebook/Instagram lookaside CDN URLs return HTML, not images,
    so the picker must reject them before they reach the downloader.
    """
    assert _is_blocked("https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=x")
    assert _is_blocked("https://lookaside.instagram.com/seo/google_widget/crawler/?media_id=x")
    assert _is_blocked("https://www.tiktok.com/api/img/?itemId=x")


def test_pick_candidates_returns_multiple():
    """The fetcher needs multiple candidates so a single bad URL doesn't fail the asset."""
    results = [
        {"original": "https://shutterstock.com/blocked.jpg",
         "original_width": 4000, "original_height": 3000},
        {"original": "https://example.com/a.jpg",
         "original_width": 1600, "original_height": 1200},
        {"original": "https://example.com/b.jpg",
         "original_width": 1600, "original_height": 1200},
        {"original": "https://example.com/c.jpg"},  # no dims, accepted
        {"thumbnail": "https://t.example.com/x.jpg"},  # no original, rejected
    ]
    cands = _pick_candidates(results, limit=10)
    urls = [c["original"] for c in cands]
    assert urls == ["https://example.com/a.jpg", "https://example.com/b.jpg",
                    "https://example.com/c.jpg"]


def test_pick_candidates_respects_limit():
    results = [{"original": f"https://example.com/{i}.jpg",
                "original_width": 1600, "original_height": 1200} for i in range(20)]
    assert len(_pick_candidates(results, limit=3)) == 3


def test_pick_best_result_rejects_thumbnail_only_results():
    """Regression: a result with only `thumbnail` was being accepted by the
    picker, but the downloader only reads `original` / `image`, so it would
    crash with MissingSchema(None). Thumbnails are also too small for hero use.
    """
    pick = _pick_best_result([
        {"thumbnail": "https://t.example.com/tiny.jpg",
         "original_width": 4000, "original_height": 3000},
    ])
    assert pick is None


def test_fetch_all_does_not_abort_run_on_unexpected_exception(tmp_path: Path, mocker):
    """Regression: a non-FetcherError exception in a worker (e.g. requests
    MissingSchema, PIL UnidentifiedImageError) used to propagate from
    fut.result() and abort the entire fetcher, losing all provenance.
    Now every worker exception is demoted to a per-asset failure.
    """
    images_root = tmp_path / "images"
    overrides = tmp_path / "overrides.yml"
    prov = tmp_path / "prov.json"

    # Return something the picker accepts, but where `original` is missing
    # and the URL becomes None — exercises the same code path that crashed.
    mocker.patch(
        "cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
        return_value=[{"original": "https://example.com/good.jpg",
                       "original_width": 1600, "original_height": 1200}],
    )

    # Make download raise a non-FetcherError exception.
    def boom(url, dest):
        raise RuntimeError("simulated unexpected failure")
    mocker.patch(
        "cookbook_pipeline.stages.stage_9_fetch_images.download_and_encode",
        side_effect=boom,
    )

    recipes = [{"id": f"r{i}", "name": f"R{i}", "origin_region_name": "Awadh"}
               for i in range(3)]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root, overrides_path=overrides,
        provenance_path=prov, api_key="fake",
    )
    # All three assets should report as failures, not crash the run.
    assert summary["fetched"] == 0
    assert len(summary["failed"]) == 3
    assert all(r["image"] is None for r in recipes)


def test_query_builders():
    recipe = {"id": "nargisi-seekh-kebab", "name": "Nargisi Seekh Kebab",
              "origin_region_name": "Awadh"}
    assert _build_recipe_query(recipe) == "Nargisi Seekh Kebab Awadh indian recipe"

    section = {"id": "snacks-and-appetizers", "name": "Snacks and Appetizers"}
    assert _build_section_query(section) == "indian Snacks and Appetizers food"

    # Region with override
    assert "Bara Imambara" in _build_region_query({"id": "awadh", "name": "Awadh"})
    # Region without override falls back to generic
    assert _build_region_query({"id": "made-up-region", "name": "Made-Up"}) == "Made-Up India culture"


def test_pan_indian_region_does_not_leak_into_recipe_query():
    """Pan-Indian recipes shouldn't get '... Pan-Indian indian recipe' which is silly."""
    recipe = {"id": "x", "name": "Daal", "origin_region_name": "Pan-Indian"}
    assert _build_recipe_query(recipe) == "Daal indian recipe"


def test_load_overrides_handles_missing_file(tmp_path: Path):
    assert load_overrides(tmp_path / "nonexistent.yml") == {}


def test_load_overrides_parses_yaml(tmp_path: Path):
    p = tmp_path / "overrides.yml"
    p.write_text("awadh: https://example.com/awadh.jpg\nfoo: relative/path.jpg\n")
    assert load_overrides(p) == {
        "awadh": "https://example.com/awadh.jpg",
        "foo": "relative/path.jpg",
    }


def test_load_overrides_rejects_non_mapping(tmp_path: Path):
    p = tmp_path / "overrides.yml"
    p.write_text("- not a mapping\n- just a list\n")
    with pytest.raises(FetcherError):
        load_overrides(p)


def test_provenance_round_trip(tmp_path: Path):
    p = tmp_path / "prov.json"
    save_provenance(p, {"x": {"url": "u", "fetched_at": "t"}})
    assert load_provenance(p) == {"x": {"url": "u", "fetched_at": "t"}}


def test_fetch_all_uses_provenance_cache_when_file_exists(tmp_path: Path, mocker):
    """Cached entries with file on disk must NOT hit the API."""
    images_root = tmp_path / "images"
    overrides = tmp_path / "overrides.yml"
    prov = tmp_path / "prov.json"

    # Pre-populate provenance and disk
    rid = "cached-recipe"
    cached_dest = images_root / "recipes" / f"{rid}.webp"
    cached_dest.parent.mkdir(parents=True)
    Image.new("RGB", (1024, 768)).save(cached_dest, "WEBP")
    save_provenance(prov, {rid: {"id": rid, "url": "https://x", "source": "serpapi"}})

    serp = mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
                        side_effect=AssertionError("must not call SerpAPI for cached asset"))
    dl = mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.download_and_encode",
                      side_effect=AssertionError("must not download for cached asset"))

    recipes = [{"id": rid, "name": "Cached", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root, overrides_path=overrides,
        provenance_path=prov, api_key="fake",
    )
    assert summary["fetched"] == 0
    assert summary["skipped_cached"] == 1
    assert recipes[0]["image"] == "images/recipes/cached-recipe.webp"
    serp.assert_not_called()
    dl.assert_not_called()


def test_fetch_all_skips_paratext_sections(tmp_path: Path, mocker):
    """Paratext section ids (introduction/glossary/directory/index) must not be fetched."""
    images_root = tmp_path / "images"
    overrides = tmp_path / "overrides.yml"
    prov = tmp_path / "prov.json"

    serp = mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
                        return_value=[])
    sections = [
        {"id": "introduction", "name": "Introduction"},
        {"id": "glossary", "name": "Glossary"},
        {"id": "snacks-and-appetizers", "name": "Snacks and Appetizers"},
    ]
    summary = fetch_all(
        recipes=[], sections=sections, regions=[],
        images_root=images_root, overrides_path=overrides,
        provenance_path=prov, api_key="fake",
    )
    # Only the real cooking section is in the work list — that one will fail
    # because serpapi_search returned no results; that's fine for this test.
    assert summary["total_assets"] == 1
    # SerpAPI is called for the primary query and the fallback query for snacks.
    # The two paratext sections must NOT have triggered any calls.
    assert serp.call_count == 2


def test_fetch_all_uses_override_url(tmp_path: Path, mocker):
    images_root = tmp_path / "images"
    overrides_path = tmp_path / "overrides.yml"
    overrides_path.write_text("nargisi-seekh-kebab: https://example.com/n.jpg\n")
    prov = tmp_path / "prov.json"

    serp = mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
                        side_effect=AssertionError("override must skip API"))

    def fake_download(url, dest):
        dest.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1024, 768)).save(dest, "WEBP")
        return (1024, 768)
    dl = mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.download_and_encode",
                      side_effect=fake_download)

    recipes = [{"id": "nargisi-seekh-kebab", "name": "Nargisi", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root, overrides_path=overrides_path,
        provenance_path=prov, api_key="fake",
    )
    assert summary["fetched"] == 1
    assert summary["failed"] == []
    assert recipes[0]["image"] == "images/recipes/nargisi-seekh-kebab.webp"
    serp.assert_not_called()
    dl.assert_called_once()
    # Provenance should record this as an override
    saved = json.loads(prov.read_text())
    assert saved["nargisi-seekh-kebab"]["source"] == "override"


def test_fetch_all_falls_through_to_next_candidate_on_download_failure(tmp_path: Path, mocker):
    """When the top SerpAPI result fails to download (HTTP 403, decode error, etc.),
    the fetcher must try the next candidate before giving up on the asset.
    """
    images_root = tmp_path / "images"
    overrides = tmp_path / "overrides.yml"
    prov = tmp_path / "prov.json"

    mocker.patch(
        "cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
        return_value=[
            {"original": "https://bad.example.com/a.jpg",
             "original_width": 1600, "original_height": 1200},
            {"original": "https://bad.example.com/b.jpg",
             "original_width": 1600, "original_height": 1200},
            {"original": "https://good.example.com/c.jpg",
             "original_width": 1600, "original_height": 1200},
        ],
    )

    call_count = {"n": 0}
    def fake_download(url, dest):
        call_count["n"] += 1
        if "bad.example.com" in url:
            raise FetcherError(f"download {url}: HTTP 403")
        dest.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1024, 768)).save(dest, "WEBP")
        return (1024, 768)
    mocker.patch(
        "cookbook_pipeline.stages.stage_9_fetch_images.download_and_encode",
        side_effect=fake_download,
    )

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root, overrides_path=overrides,
        provenance_path=prov, api_key="fake",
    )
    assert summary["fetched"] == 1
    assert summary["failed"] == []
    assert recipes[0]["image"] == "images/recipes/r1.webp"
    # Should have tried all three URLs (two bad, one good)
    assert call_count["n"] == 3


def test_fetch_all_records_failures_without_aborting(tmp_path: Path, mocker):
    """A bad asset shouldn't break the run for the others."""
    images_root = tmp_path / "images"
    overrides_path = tmp_path / "overrides.yml"
    prov = tmp_path / "prov.json"

    def serp_for(query, api_key):
        if "good" in query.lower():
            return [{"original": "https://example.com/good.jpg",
                     "original_width": 1600, "original_height": 1200}]
        return []  # no results → triggers FetcherError

    mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.serpapi_search",
                 side_effect=serp_for)

    def fake_download(url, dest):
        dest.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1024, 768)).save(dest, "WEBP")
        return (1024, 768)
    mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.download_and_encode",
                 side_effect=fake_download)

    recipes = [
        {"id": "good-recipe", "name": "Good", "origin_region_name": "Awadh"},
        {"id": "bad-recipe", "name": "Bad", "origin_region_name": "Awadh"},
    ]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root, overrides_path=overrides_path,
        provenance_path=prov, api_key="fake",
    )
    assert summary["fetched"] == 1
    assert len(summary["failed"]) == 1
    failed_ids = {f["id"] for f in summary["failed"]}
    assert failed_ids == {"bad-recipe"}
    assert recipes[0]["image"] == "images/recipes/good-recipe.webp"
    assert recipes[1]["image"] is None
