# Image Fetcher Rework (PR follow-up to #7)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` checkboxes for tracking.

**Goal:** Replace the SerpAPI-only fetcher with a tiered chain (SerpAPI full-res → Pexels → Wikimedia → MISSING), enforce hard cross-kind URL+content dedup, curate all 36 region queries, and produce a complete provenance trail with human-readable coverage report.

**Architecture:**
- Each tier is a `Source` adapter exposing `search(query) -> Iterable[Candidate]`. The fetcher iterates tiers in a fixed order; the first candidate that passes filters AND dedup checks wins. No content is reused across slots.
- Provenance is written **synchronously per-asset** (not batched) so a crash never erases the audit trail again. New `source` values: `serpapi`, `pexels`, `wikimedia`, `override`, `override-local`. The `bootstrap-pre-crash` sentinel is retired.
- Region queries move from the inline `REGION_QUERY_OVERRIDES` dict in `stage_9_fetch_images.py` to a YAML config (`pipeline/data/region-queries.yml`) with one curated query list per region id. Each region has a primary, secondary, and bare-name fallback.

**Tech Stack:** Python 3.13, `requests`, `Pillow`, `pytest`, `responses` (HTTP mocking — already in dev deps via `requests` ecosystem; install if missing).

---

## File Structure

| File | Responsibility |
|---|---|
| `pipeline/src/cookbook_pipeline/stages/stage_9_fetch_images.py` | Top-level orchestrator: load assets, dispatch to source chain, dedup ledger, save provenance. Slimmed; sources moved out. |
| `pipeline/src/cookbook_pipeline/stages/image_sources.py` *(new)* | `SerpApiSource`, `PexelsSource`, `WikimediaSource`. Each implements `search(query) -> list[Candidate]`. Pure HTTP; no file I/O. |
| `pipeline/src/cookbook_pipeline/stages/image_dedup.py` *(new)* | `DedupLedger` — tracks every accepted URL + content hash; `check_url(url)` and `register(url, content)` methods; raises `DuplicateAsset` on collision. |
| `pipeline/data/region-queries.yml` *(new)* | Curated 36-region query config. One primary + secondary list per region. |
| `pipeline/tests/test_stage_9_fetch_images.py` | Updated: fallback-chain test, dedup test, region-query loader test. |
| `pipeline/tests/test_image_dedup.py` *(new)* | Unit tests for the ledger. |
| `pipeline/tests/test_image_sources.py` *(new)* | Per-source unit tests with mocked HTTP. |

---

## Task 1: Region query config

**Files:**
- Create: `pipeline/data/region-queries.yml`
- Modify: `pipeline/src/cookbook_pipeline/stages/stage_9_fetch_images.py` (load from YAML)

- [ ] **Step 1: Write the YAML config.** All 36 region ids from `data/regions.json` get a `primary` (most recognizable landmark/scene), `secondary` (alt landmark or food culture phrase), and the region's bare name as last fallback.
- [ ] **Step 2: Show config to user (Gate B).** Pause for approval before fetching.
- [ ] **Step 3: Loader function `load_region_queries(path) -> dict[str, list[str]]`** with a unit test that the file parses and covers all 36 region ids.
- [ ] **Step 4: Commit.** `feat(pipeline): add curated region query config`

## Task 2: Source adapters

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/image_sources.py`
- Create: `pipeline/tests/test_image_sources.py`

`Candidate` is a small dataclass: `url, width, height, source_label, source_query, attribution`.

- [ ] **Step 1: Write `Candidate` dataclass + `Source` ABC** with `search(query) -> list[Candidate]`.
- [ ] **Step 2: TDD `SerpApiSource`.** Filter rules: drop results without `original`/`image` (thumbnails), drop blocked stock domains, drop `*.wikimedia.org`/`*.wikipedia.org` (handled by Wikimedia tier), drop dimensions below 800×600.
- [ ] **Step 3: TDD `PexelsSource`.** `GET https://api.pexels.com/v1/search?query=…&per_page=10&orientation=landscape` with `Authorization: <key>`. Map `photos[].src.large2x` (or `.original`) into `Candidate`. Skip results below 800×600.
- [ ] **Step 4: TDD `WikimediaSource`.** Commons API: `action=query&prop=imageinfo&generator=search&gsrnamespace=6&gsrsearch=<q>&gsrlimit=10&iiprop=url|size|mime`. Filter MIME to image/jpeg|png|webp. Use a polite UA per WMF policy.
- [ ] **Step 5: Each source returns `[]` on empty results, raises `SourceError` only on HTTP/auth failure** (so the fetcher can fall through to the next tier without losing the asset).
- [ ] **Step 6: Commit.** `feat(pipeline): add tiered image source adapters`

## Task 3: Dedup ledger

**Files:**
- Create: `pipeline/src/cookbook_pipeline/stages/image_dedup.py`
- Create: `pipeline/tests/test_image_dedup.py`

- [ ] **Step 1: TDD `DedupLedger`** — methods `seen_url(url) -> bool`, `seen_hash(sha256) -> bool`, `register(url, content_bytes, asset_id, kind)`. Test: registering the same URL twice raises; registering different URLs with byte-identical content also raises (catches the `nargisi`/`sikampoor` case).
- [ ] **Step 2: Persistence helper** — `to_dict()`/`from_dict()` so the ledger can be initialized from existing provenance for incremental runs.
- [ ] **Step 3: Commit.** `feat(pipeline): add image dedup ledger`

## Task 4: Fetcher orchestration

**Files:**
- Modify: `pipeline/src/cookbook_pipeline/stages/stage_9_fetch_images.py`
- Modify: `pipeline/tests/test_stage_9_fetch_images.py`

- [ ] **Step 1: Replace `_fetch_one` body with the source chain.** Order: override → cached-and-still-valid (URL not duplicate, file exists) → SerpAPI → Pexels → Wikimedia → MISSING. Each tier loops through its candidates; the first that downloads cleanly AND passes `DedupLedger.register()` wins.
- [ ] **Step 2: Provenance writes synchronously.** After every successful fetch, write the row to `_provenance.json` immediately (under a process-lock). Drop the 25-asset checkpoint batching.
- [ ] **Step 3: MISSING handling.** If all tiers exhaust, set `image: null` (or `hero_image: null`), append to `failures` with all attempted queries + reason. Never reuse another asset's image.
- [ ] **Step 4: Region queries iterate the curated list.** `_build_region_queries(region) -> list[str]` returns `[primary] + secondary + [bare_name]` from YAML.
- [ ] **Step 5: Update `fetch_all` summary** to include source-distribution counts and a `unique_urls`/`unique_content_hashes` tally.
- [ ] **Step 6: Tests** — fallback chain (SerpAPI returns nothing → Pexels hits), dedup (SerpAPI returns a URL already used → falls to Pexels), MISSING (all tiers fail → asset set to null, never reused).
- [ ] **Step 7: Commit.** `feat(pipeline): tiered fetch chain with hard dedup`

## Task 5: Coverage report

**Files:**
- Modify: `pipeline/scripts/fetch_images.py`

- [ ] **Step 1: Print/write a coverage report.** Source distribution, total unique URLs (must equal total slots filled), MISSING list, 20-URL random sample.
- [ ] **Step 2: Commit.** `feat(pipeline): coverage report from fetch_images`

## Task 6: Sample run (Gate C)

- [ ] **Step 1: Wipe `data/images/` and `data/images/_provenance.json`** so the rebuild starts clean. (Local op, reversible via git.)
- [ ] **Step 2: Run the new fetcher restricted to 10 representative recipes + 5 regions.** Implement a `--limit-recipes 10 --limit-regions 5 --regions <comma-list>` flag in `fetch_images.py`.
- [ ] **Step 3: Show user the URLs.** Pause for Gate C approval.

## Task 7: Full run + PR

- [ ] **Step 1: Full fetch.** `python scripts/fetch_images.py` (no limits). Watch for SerpAPI quota.
- [ ] **Step 2: Verify dedup invariant** — total unique URLs == total filled slots; cross-kind hash check passes.
- [ ] **Step 3: Manually triage MISSING list** — show user.
- [ ] **Step 4: Push to a new branch** (e.g. `backend-image-fetcher-v2`), open a fresh PR (NOT an amend of #7), let Vercel preview.
- [ ] **Step 5: Commit data updates.** `data: rebuild image set with tiered fetcher`

---

## Self-Review Notes

- All 36 regions covered by Task 1's YAML — verified against `data/regions.json`.
- All four user requirements have a task: source priority (Task 4), dedup (Task 3, enforced in Task 4), curated regions (Task 1), approval gates (Gates B & C explicit in Tasks 1 and 6).
- Coverage-report contents match Task 6 of the user brief.
- Tasks are small enough to commit independently; failures in one tier don't break others.
