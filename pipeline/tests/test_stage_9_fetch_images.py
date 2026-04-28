"""Stage 9 orchestrator tests.

We mock the source chain so no real network. Sources are injected as plain
objects exposing `search(query) -> list[Candidate]`; the test fixtures use
custom classes per scenario.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import pytest
from PIL import Image

from cookbook_pipeline.stages.image_sources import Candidate, Source, SourceError
from cookbook_pipeline.stages.stage_9_fetch_images import (
    FetcherError,
    PARATEXT_IDS,
    _build_recipe_queries,
    _build_region_queries,
    _build_section_queries,
    fetch_all,
    load_overrides,
    load_provenance,
    load_region_queries,
    save_provenance,
)


def _png_bytes(w: int = 1024, h: int = 768, color: tuple = (120, 80, 40)) -> bytes:
    pil = Image.new("RGB", (w, h), color=color)
    buf = io.BytesIO()
    pil.save(buf, "PNG")
    return buf.getvalue()


class _StubSource(Source):
    """Test source: returns a fixed candidate list keyed by query (or for any query)."""

    def __init__(self, name: str, candidates: list[Candidate] | dict[str, list[Candidate]],
                 raise_on: str | None = None):
        self.name = name
        self._candidates = candidates
        self._raise_on = raise_on
        self.calls: list[str] = []

    def search(self, query: str) -> list[Candidate]:
        self.calls.append(query)
        if self._raise_on and self._raise_on in query:
            raise SourceError(f"stub forced error on {query!r}")
        if isinstance(self._candidates, dict):
            return list(self._candidates.get(query, []))
        return list(self._candidates)


@pytest.fixture
def patch_download(mocker):
    """Patch download_bytes to return synthetic PNG bytes per URL.

    Returns a `register(url, bytes)` helper. Unregistered URLs raise FetcherError.
    """
    registry: dict[str, bytes] = {}

    def fake_dl(url: str) -> bytes:
        if url not in registry:
            raise FetcherError(f"download {url}: HTTP 404 (not registered in test)")
        return registry[url]

    mocker.patch("cookbook_pipeline.stages.stage_9_fetch_images.download_bytes",
                 side_effect=fake_dl)
    return registry


# ---- constants & query builders ----------------------------------------------


def test_paratext_ids_constants():
    assert PARATEXT_IDS == {"introduction", "glossary", "directory", "index"}


def test_recipe_query_includes_region_unless_pan_indian():
    r1 = {"id": "x", "name": "Nargisi", "origin_region_name": "Awadh"}
    assert _build_recipe_queries(r1)[0] == "Nargisi Awadh indian recipe"
    r2 = {"id": "y", "name": "Daal", "origin_region_name": "Pan-Indian"}
    assert _build_recipe_queries(r2)[0] == "Daal indian recipe"


def test_recipe_query_has_short_fallback():
    r = {"id": "x", "name": "Nargisi Seekh Kebab", "origin_region_name": "Awadh"}
    qs = _build_recipe_queries(r)
    assert qs[0] == "Nargisi Seekh Kebab Awadh indian recipe"
    assert qs[-1] == "Nargisi Seekh Kebab recipe"


def test_section_query():
    s = {"id": "snacks", "name": "Snacks and Appetizers"}
    assert _build_section_queries(s)[0] == "indian Snacks and Appetizers food"


def test_region_query_uses_curated_yaml():
    cfg = {"awadh": ["Bara Imambara Lucknow", "Lucknow Mughal heritage"]}
    qs = _build_region_queries({"id": "awadh", "name": "Awadh"}, cfg)
    assert qs[0] == "Bara Imambara Lucknow"
    assert qs[1] == "Lucknow Mughal heritage"
    # Bare-name last-ditch tail
    assert qs[-1] == "Awadh"


def test_region_query_falls_back_for_uncurated_region():
    qs = _build_region_queries({"id": "made-up", "name": "Made-Up"}, {})
    assert qs == ["Made-Up India culture", "Made-Up"]


# ---- YAML loaders -------------------------------------------------------------


def test_load_overrides_handles_missing_file(tmp_path: Path):
    assert load_overrides(tmp_path / "nope.yml") == {}


def test_load_overrides_parses_yaml(tmp_path: Path):
    p = tmp_path / "overrides.yml"
    p.write_text("awadh: https://example.com/a.jpg\n")
    assert load_overrides(p) == {"awadh": "https://example.com/a.jpg"}


def test_load_overrides_rejects_non_mapping(tmp_path: Path):
    p = tmp_path / "overrides.yml"
    p.write_text("- not\n- a\n- mapping\n")
    with pytest.raises(FetcherError):
        load_overrides(p)


def test_load_region_queries_round_trip(tmp_path: Path):
    p = tmp_path / "rq.yml"
    p.write_text("awadh:\n  - Bara Imambara\n  - Lucknow heritage\n")
    cfg = load_region_queries(p)
    assert cfg == {"awadh": ["Bara Imambara", "Lucknow heritage"]}


def test_load_region_queries_rejects_empty_list(tmp_path: Path):
    p = tmp_path / "rq.yml"
    p.write_text("awadh: []\n")
    with pytest.raises(FetcherError):
        load_region_queries(p)


def test_load_region_queries_rejects_non_list(tmp_path: Path):
    p = tmp_path / "rq.yml"
    p.write_text("awadh: just a string\n")
    with pytest.raises(FetcherError):
        load_region_queries(p)


def test_load_region_queries_real_config_covers_all_regions(tmp_path: Path):
    """Sanity: the committed region-queries.yml covers every region id."""
    from cookbook_pipeline import paths
    cfg_path = paths.PIPELINE_DIR / "data" / "region-queries.yml"
    if not cfg_path.exists():
        pytest.skip("region-queries.yml not present in this checkout")
    cfg = load_region_queries(cfg_path)
    regions_payload = json.loads((paths.PROJECT_ROOT / "data" / "regions.json").read_text())
    ids = {r["id"] for r in regions_payload["regions"]}
    missing = ids - set(cfg)
    assert not missing, f"region-queries.yml missing: {missing}"


def test_provenance_round_trip(tmp_path: Path):
    p = tmp_path / "prov.json"
    save_provenance(p, {"x": {"url": "u"}})
    assert load_provenance(p) == {"x": {"url": "u"}}


# ---- fetch_all: source chain --------------------------------------------------


def test_fetch_all_uses_first_source_when_it_returns_a_candidate(tmp_path, patch_download):
    serp = _StubSource("serpapi", [
        Candidate(url="https://a/1.jpg", width=1600, height=1200,
                  source="serpapi", query="q"),
    ])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])
    patch_download["https://a/1.jpg"] = _png_bytes()

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 1
    assert summary["failed"] == []
    assert summary["source_counts"] == {"serpapi": 1}
    assert recipes[0]["image"] == "https://a/1.jpg"
    assert pexels.calls == []  # never queried — first tier won
    assert wm.calls == []


def test_fetch_all_publishes_source_url_for_frontend(tmp_path, patch_download):
    """The frontend only renders http(s) data images, so Stage 9 must publish
    the accepted source URL while keeping the local WebP as its cache file."""
    serp = _StubSource("serpapi", [
        Candidate(url="https://source.example.com/r1.jpg", width=1600, height=1200,
                  source="serpapi", query="q"),
    ])
    patch_download["https://source.example.com/r1.jpg"] = _png_bytes()

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp],
    )

    assert summary["fetched"] == 1
    assert recipes[0]["image"] == "https://source.example.com/r1.jpg"
    assert (tmp_path / "images" / "recipes" / "r1.webp").exists()


def test_fetch_all_falls_through_to_pexels_when_serpapi_empty(tmp_path, patch_download):
    serp = _StubSource("serpapi", [])
    pexels = _StubSource("pexels", [
        Candidate(url="https://p/1.jpg", width=1600, height=1200,
                  source="pexels", query="q", attribution="Alice via Pexels"),
    ])
    wm = _StubSource("wikimedia", [])
    patch_download["https://p/1.jpg"] = _png_bytes()

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 1
    assert summary["source_counts"] == {"pexels": 1}


def test_fetch_all_falls_through_to_wikimedia_last_resort(tmp_path, patch_download):
    serp = _StubSource("serpapi", [])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [
        Candidate(url="https://upload.wikimedia.org/x.jpg", width=2000, height=1500,
                  source="wikimedia", query="q",
                  attribution="File:X.jpg (Wikimedia Commons)"),
    ])
    patch_download["https://upload.wikimedia.org/x.jpg"] = _png_bytes()

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 1
    assert summary["source_counts"] == {"wikimedia": 1}


def test_fetch_all_marks_missing_when_all_tiers_fail(tmp_path, patch_download):
    """All three tiers return nothing → asset is MISSING. We do not reuse
    another asset's photo to fill the slot."""
    serp = _StubSource("serpapi", [])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 0
    assert len(summary["failed"]) == 1
    assert summary["failed"][0]["error"].startswith("MISSING")
    assert recipes[0]["image"] is None


def test_fetch_all_continues_to_next_source_when_one_raises(tmp_path, patch_download):
    """SourceError on a tier (auth, 5xx) doesn't abort — fall through."""
    serp = _StubSource("serpapi", [], raise_on="R1")  # forces SourceError
    pexels = _StubSource("pexels", [
        Candidate(url="https://p/1.jpg", width=1600, height=1200,
                  source="pexels", query="q"),
    ])
    wm = _StubSource("wikimedia", [])
    patch_download["https://p/1.jpg"] = _png_bytes()

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 1
    assert summary["source_counts"] == {"pexels": 1}


# ---- fetch_all: dedup --------------------------------------------------------


def test_fetch_all_rejects_duplicate_url_and_falls_to_next_candidate(
    tmp_path, patch_download,
):
    """Regression test for PR #7's `nargisi`/`sikampoor` reuse: when SerpAPI
    returns a URL already assigned to another asset, that candidate is
    skipped and we try the next one — never reuse."""
    shared_url = "https://shared.example.com/used.jpg"
    unique_url = "https://shared.example.com/unique.jpg"
    serp = _StubSource("serpapi", [
        Candidate(url=shared_url, width=1600, height=1200, source="serpapi", query="q"),
        Candidate(url=unique_url, width=1600, height=1200, source="serpapi", query="q"),
    ])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])
    # Two distinct PNG payloads so content-hash dedup also passes.
    patch_download[shared_url] = _png_bytes(color=(10, 20, 30))
    patch_download[unique_url] = _png_bytes(color=(200, 100, 50))

    recipes = [
        {"id": "r1", "name": "R1", "origin_region_name": "Awadh"},
        {"id": "r2", "name": "R2", "origin_region_name": "Awadh"},
    ]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
        concurrency=1,  # deterministic order for the test
    )
    assert summary["fetched"] == 2
    # Both got images, but they're DIFFERENT URLs.
    prov = json.loads((tmp_path / "prov.json").read_text())
    urls = {prov[k]["url"] for k in prov}
    assert urls == {shared_url, unique_url}
    # Ledger stats: 2 unique URLs, 2 unique hashes.
    assert summary["ledger_stats"] == {"unique_urls": 2, "unique_hashes": 2}


def test_fetch_all_rejects_byte_identical_content_under_different_urls(
    tmp_path, patch_download,
):
    """Same JPEG bytes served from two different CDN URLs → second asset
    must NOT accept the duplicate content. The other asset goes MISSING
    rather than reusing.
    """
    same_bytes = _png_bytes(color=(99, 99, 99))
    serp = _StubSource("serpapi", [
        Candidate(url="https://cdn-a/x.jpg", width=1600, height=1200,
                  source="serpapi", query="q"),
    ])
    pexels = _StubSource("pexels", [
        Candidate(url="https://cdn-b/x.jpg", width=1600, height=1200,
                  source="pexels", query="q"),
    ])
    wm = _StubSource("wikimedia", [])
    patch_download["https://cdn-a/x.jpg"] = same_bytes
    patch_download["https://cdn-b/x.jpg"] = same_bytes

    recipes = [
        {"id": "r1", "name": "R1", "origin_region_name": "Awadh"},
        {"id": "r2", "name": "R2", "origin_region_name": "Awadh"},
    ]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
        concurrency=1,
    )
    # One filled, one MISSING.
    assert summary["fetched"] == 1
    assert len(summary["failed"]) == 1
    assert summary["failed"][0]["error"].startswith("MISSING")


def test_fetch_all_dedup_is_cross_kind(tmp_path, patch_download):
    """A region and a recipe must not share an image (the deployed-site bug)."""
    shared_url = "https://shared/charminar.jpg"
    serp = _StubSource("serpapi", [
        Candidate(url=shared_url, width=2000, height=1500,
                  source="serpapi", query="q"),
    ])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])
    patch_download[shared_url] = _png_bytes()

    recipes = [{"id": "biryani", "name": "Biryani", "origin_region_name": "Hyderabad"}]
    regions = [{"id": "hyderabad", "name": "Hyderabad"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=regions,
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
        concurrency=1,
    )
    # First-comer wins; the other goes MISSING (no other candidates available).
    assert summary["fetched"] == 1
    assert len(summary["failed"]) == 1


# ---- fetch_all: skip / cache / override --------------------------------------


def test_fetch_all_skips_paratext_sections(tmp_path, patch_download):
    serp = _StubSource("serpapi", [])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])
    sections = [
        {"id": "introduction", "name": "Introduction"},
        {"id": "glossary", "name": "Glossary"},
        {"id": "snacks", "name": "Snacks"},  # not paratext
    ]
    summary = fetch_all(
        recipes=[], sections=sections, regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp, pexels, wm],
    )
    assert summary["total_assets"] == 1


def test_fetch_all_uses_cache_when_url_known_and_file_present(tmp_path, patch_download):
    images_root = tmp_path / "images"
    rid = "cached"
    cached_dest = images_root / "recipes" / f"{rid}.webp"
    cached_dest.parent.mkdir(parents=True)
    Image.new("RGB", (1024, 768), color=(50, 50, 50)).save(cached_dest, "WEBP")
    prov = tmp_path / "prov.json"
    save_provenance(prov, {rid: {"id": rid, "url": "https://x/cached.jpg",
                                  "source": "serpapi", "kind_dir": "recipes"}})

    # Sources must NOT be called.
    serp = _StubSource("serpapi", [], raise_on="any")
    pexels = _StubSource("pexels", [], raise_on="any")
    wm = _StubSource("wikimedia", [], raise_on="any")

    recipes = [{"id": rid, "name": "Cached", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root,
        overrides_path=tmp_path / "ov.yml",
        provenance_path=prov,
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 0
    assert summary["skipped_cached"] == 1
    assert recipes[0]["image"] == "https://x/cached.jpg"
    assert serp.calls == []


def test_fetch_all_does_not_use_bootstrap_pre_crash_cache(tmp_path, patch_download):
    """Provenance entries from prior runs that lack a URL (the
    `bootstrap-pre-crash` sentinel) must not block a refetch."""
    images_root = tmp_path / "images"
    rid = "broken-cache"
    prov = tmp_path / "prov.json"
    save_provenance(prov, {rid: {"id": rid, "url": None,
                                  "source": "bootstrap-pre-crash"}})

    serp = _StubSource("serpapi", [
        Candidate(url="https://good/1.jpg", width=1600, height=1200,
                  source="serpapi", query="q"),
    ])
    pexels = _StubSource("pexels", [])
    wm = _StubSource("wikimedia", [])
    patch_download["https://good/1.jpg"] = _png_bytes()

    recipes = [{"id": rid, "name": "Broken", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=images_root,
        overrides_path=tmp_path / "ov.yml",
        provenance_path=prov,
        sources=[serp, pexels, wm],
    )
    assert summary["fetched"] == 1
    assert recipes[0]["image"] == "https://good/1.jpg"


def test_fetch_all_uses_override_url(tmp_path, patch_download):
    overrides_path = tmp_path / "ov.yml"
    overrides_path.write_text("r1: https://override.example.com/x.jpg\n")
    patch_download["https://override.example.com/x.jpg"] = _png_bytes()

    serp = _StubSource("serpapi", [], raise_on="any")  # must not be called

    recipes = [{"id": "r1", "name": "R1", "origin_region_name": "Awadh"}]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=overrides_path,
        provenance_path=tmp_path / "prov.json",
        sources=[serp],
    )
    assert summary["fetched"] == 1
    saved = json.loads((tmp_path / "prov.json").read_text())
    assert saved["r1"]["source"] == "override"
    assert serp.calls == []


def test_fetch_all_does_not_abort_on_unexpected_exception(tmp_path, mocker, patch_download):
    """A worker exception (decode error, OS error, anything) must be demoted
    to a per-asset failure — never bubble up and abort the whole run."""
    serp = _StubSource("serpapi", [
        Candidate(url="https://x/1.jpg", width=1600, height=1200,
                  source="serpapi", query="q"),
    ])
    # download_bytes returns valid bytes, but PIL will fail to decode this:
    patch_download["https://x/1.jpg"] = b"not a real image"

    recipes = [{"id": f"r{i}", "name": f"R{i}", "origin_region_name": "Awadh"}
               for i in range(3)]
    summary = fetch_all(
        recipes=recipes, sections=[], regions=[],
        images_root=tmp_path / "images",
        overrides_path=tmp_path / "ov.yml",
        provenance_path=tmp_path / "prov.json",
        sources=[serp],
    )
    # Each asset's candidate fails to decode → MISSING.
    assert summary["fetched"] == 0
    assert len(summary["failed"]) == 3
    assert all(r["image"] is None for r in recipes)
