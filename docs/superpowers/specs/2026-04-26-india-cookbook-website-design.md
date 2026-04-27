# India Cookbook Website — Design

**Date:** 2026-04-26
**Author:** Vishal (with Claude)
**Status:** Approved for planning
**Repo:** https://github.com/vdoshi96/cookbook

---

## 1. Goal

Build a Vercel-hosted website that turns Pushpesh Pant's *India Cookbook* (Phaidon, 2010) into a digital experience that is two things at once:

1. **A searchable index** — type "paneer" or "Awadh" or "tandoor" and find every recipe that matches.
2. **An exploration of Indian cooking** — the same way the book itself reads. Browse Chutneys. Wander into Awadh. Follow a cross-reference from Garlic Paste to the 47 dishes that use it. Read the chapter intros. Notice the patterns.

The website should preserve the book's editorial voice and structure, not just its data.

---

## 2. Source Material

- Two PDFs in the project root, both ~50 MB, 824 pages, 1000 recipes. They are OCR-identical — pick one and use it.
- Recipes follow a strict template (title → subtitle → `Origin <region>` → `Preparation time` → `Cooking time` → `Serves` → ingredients → instructions → page-footer section name).
- Heat-level icons (one/two/three suns) per recipe.
- Cross-references in the form `(see page X)` linking to base recipes (Garlic Paste, Garam Masala, Paneer, etc.).
- Front matter contains: an introduction, a brief history of Indian food, an Ayurveda primer, a regions overview with a map, and recipe notes.
- Each chapter (Pastes, Pickles/Chutneys/Raitas, Snacks & Appetizers, Vegetables, Fish & Seafood, Meat, Rice, Breads, etc.) opens with prose written by the author.
- The OCR text layer is usable but messy: fractions garble (`½oz` → `y2oz` / `I/20Z` / `14`), and the two-column layout interleaves unless extracted with `pdftotext -layout`.
- PDFs are copyrighted; they live in the repo's `/source` directory and are gitignored.

---

## 3. Architecture (One Sentence)

A single Next.js project deployed on Vercel, where a build-time Python pipeline turns the PDFs into static JSON + image assets that the frontend ships to the browser; client-side fuzzy search replaces a runtime database.

Why static instead of a runtime backend (Vercel Functions + Postgres):

- 1000 recipes that never change.
- Read-only content, no user state in v1.
- Free Vercel hosting, no DB ops.
- Faster page loads (data inlined or fetched once).
- Trade-off: if v2 adds user accounts, ratings, or saved recipes, we revisit. Document this so the future "we need a DB" decision is deliberate.

---

## 4. Repo Layout & Branch Strategy

```
/pipeline      Backend branch — Python extraction + cleanup + indexing
/web           Frontend branch — Next.js app (built by Codex)
/data          Pipeline output: recipes.json, sections.json, regions.json,
               ingredients.json, tags.json, graph.json, images/*.jpg
               Acts as the contract between backend and frontend.
/source        Original PDFs — gitignored.
/docs          Specs and design notes (this file lives here).
BRIEF.md       Project brief for Codex (frontend instructions + data contract).
README.md      Project overview, how to run pipeline, how to run web.
.gitignore     Excludes /source/*.pdf, .env, node_modules, etc.
```

**Branches:**

- `main` — scaffolding only: `README.md`, `BRIEF.md`, `.gitignore`, this spec, and a `/data` directory containing stub JSON files (`recipes.json`, `sections.json`, `regions.json`, `ingredients.json`, `tags.json`, `graph.json`, `front-matter.json`) — each holding 2–3 hand-authored representative records that match the schemas in §6, so Codex can build and type-check against the contract from day one.
- `backend` — branched off `main`. All `/pipeline` work happens here. Pipeline runs commit real `/data/*.json` and `/data/images/*.jpg` to this branch as they're produced.
- `frontend` — branched off `main`. All `/web` work happens here, by Codex.
- The two branches don't touch each other's directories, so they don't conflict.
- When the backend has a stable `/data` snapshot, it gets merged forward to `main`, and the frontend rebases off `main` to pick up the new data.
- Final integration: both branches merge into `main`.

---

## 5. Backend Pipeline (My Work)

### 5.1 Stack

- Python 3.11+
- `pdftotext` (Poppler, already installed) for the text layer with `-layout` to preserve columns
- `pdfimages` or `PyMuPDF` for image extraction
- `anthropic` SDK for the LLM cleanup pass — model `claude-haiku-4-5-20251001`
- `python-dotenv` for loading `ANTHROPIC_API_KEY` from `pipeline/.env`
- `pydantic` for output schema validation
- `tqdm` for progress bars on the 1000-recipe loop
- Standard lib for everything else

### 5.2 Stages

The pipeline is broken into discrete stages, each writing its output to disk so any stage can be re-run independently. Stages are idempotent: re-running on the same input produces the same output.

**Stage 0 — Page text and image dump.**
Run `pdftotext -layout` per page → `pipeline/build/pages/page-NNN.txt`. Run image extraction → `pipeline/build/page-images/page-NNN.png`. This is the only stage that touches the PDF.

**Stage 1 — Section detection.**
Walk pages in order. Each page footer carries the chapter name (e.g., `SNACKS AND APPETIZERS`). Build a page-range → section map. Identify chapter-opener pages (the first page of each section, which has prose, no recipes). Write `pipeline/build/sections.raw.json`.

**Stage 2 — Front-matter extraction.**
Pages 1–~30 hold the introduction, history, Ayurveda primer, regions map, and notes. Extract these as structured prose blocks. Write `pipeline/build/front-matter.raw.json`.

**Stage 3 — Recipe block segmentation.**
For each non-opener page, split into recipe blocks using the predictable headers as anchors (`Origin`, `Preparation time`, `Cooking time`, `Serves`). Most pages hold two recipes; some hold one. Output is a flat list of raw recipe blocks (still messy OCR text). Write `pipeline/build/recipes.raw.json`.

**Stage 4 — LLM cleanup pass (Haiku).**
For each raw recipe block, call Haiku 4.5 with a structured prompt that:

- Receives the messy OCR text and the page image (vision-capable model can cross-check the OCR against what's actually on the page).
- Returns a JSON object matching the recipe schema (see §6).
- Fixes OCR artifacts: `y2oz` → `½oz`, `I/3 cup` → `⅓ cup`, garbled fractions, broken hyphenation.
- Parses ingredient lines into `{qty_metric, qty_imperial, qty_count, item, notes}`.
- Splits instructions into discrete steps.
- Reads the heat-level icons from the page image.
- Tags dietary (`vegetarian`, `vegan`, `contains-egg`, `non-veg`), primary technique (`tandoor`, `deep-fry`, `slow-cook`, `steam`, `grill`, `no-cook`, `boil`, `stir-fry`), and occasion if signaled (`festival`, `everyday`, `wedding`).
- Resolves cross-references: `(see page 57)` → page number captured.

Prompt caching: the system prompt (schema + rules + few-shot examples) is cached. Each call reuses the cache. Per-call input is the recipe block text + the page image. Run with concurrency (e.g., 8 workers) to keep wall time reasonable.

Output: `pipeline/build/recipes.cleaned.json`.

**Stage 5 — Cross-reference resolution.**
Walk the cleaned recipes. For each `cross_ref` (page-number-only), find the recipe whose `source_page` matches and attach its `id`. Build the reverse edge ("used in") for each referenced recipe. Write `pipeline/build/graph.json`.

**Stage 6 — Section and region intro extraction.**
For each chapter-opener page (identified in Stage 1), call Haiku to extract the prose intro as structured Markdown. Same for region descriptions in the front matter. Write `pipeline/build/sections.json` and `pipeline/build/regions.json`.

**Stage 7 — "Start here" picks per section.**
For each section, give Haiku the section intro + the list of recipe titles + their tags, and ask it to pick 3–5 recommended starting recipes with one-line rationales. Output is a `start_here` array on each section. This is the only Haiku call where we accept some subjectivity; it powers the section landing page rail. Write back to `sections.json`.

**Stage 8 — Ingredient and tag indexing.**
Walk all cleaned recipes. Normalize ingredient strings (lowercase, strip qty/notes, lemmatize where helpful — `paneers` → `paneer`). Build `ingredients.json` (ingredient → recipe IDs) and `tags.json` (tag → recipe IDs). Hand-curate a small synonyms/blocklist file in `pipeline/data/ingredient-synonyms.yml` for common conflations (`coriander leaves` = `cilantro`).

**Stage 9 — Image extraction and association.**
Pull recipe photos from the PDF using `PyMuPDF`. Match each image to a recipe by page proximity (image on page N usually belongs to the recipe on page N or N±1). Compress to WebP + JPEG fallback, write to `data/images/`. Update `recipes.json` with `image` paths. Edge case: some recipes have no photo; leave `image: null`.

**Stage 10 — Validation and emit.**
Run pydantic validation against the canonical schema. Fail loudly on any record missing required fields. Emit final files to `/data/`:

```
/data/recipes.json
/data/sections.json
/data/regions.json
/data/ingredients.json
/data/tags.json
/data/graph.json
/data/front-matter.json
/data/images/*.{webp,jpg}
```

### 5.3 Failure handling

- Stage 4 calls that return invalid JSON or fail schema validation are retried up to 2× with the same prompt, then escalated to a Sonnet 4.6 retry, then logged to `pipeline/build/failures.json` and skipped (those recipes are excluded from output, not silently mangled).
- A summary report at the end lists: `recipes_extracted`, `recipes_failed`, `images_associated`, `cross_refs_resolved`, `unresolved_refs`.

### 5.4 Cost & runtime estimate

Rough back-of-envelope, to be validated on a 50-recipe pilot:

- 1000 recipes × Haiku call (~3K input tokens with cached system prompt + 1K output) ≈ low single-digit dollars.
- Wall time: 30–60 minutes with 8-way concurrency.
- Re-runs are cheap because Stage 0 outputs are cached on disk.

---

## 6. Data Contracts

These are the shapes the frontend will consume. Versioned via a top-level `schema_version` field on each file.

### 6.1 Recipe

```json
{
  "schema_version": 1,
  "id": "nargisi-seekh-kebab",
  "name": "Nargisi Seekh Kebab",
  "subtitle": "Vegetable & Egg Skewers",
  "section_id": "snacks-and-appetizers",
  "section_name": "Snacks and Appetizers",
  "origin_region_id": "awadh",
  "origin_region_name": "Awadh",
  "prep_minutes": 30,
  "prep_notes": "plus cooling time",
  "cook_minutes": 15,
  "cook_notes": null,
  "serves": 4,
  "heat_level": 1,
  "dietary_tags": ["contains-egg", "vegetarian"],
  "technique_tags": ["tandoor", "grill"],
  "occasion_tags": [],
  "ingredients": [
    {
      "qty_metric": "300g",
      "qty_imperial": "11oz",
      "qty_count": "3 medium",
      "item": "potatoes",
      "notes": "unpeeled"
    }
  ],
  "instructions": [
    "Cook the potatoes in a pan of boiling water for about 15 minutes...",
    "Prepare a tandoor or charcoal grill..."
  ],
  "cross_refs": [
    { "name": "Paneer", "page": 59, "id": "paneer" },
    { "name": "Garlic Paste", "page": 57, "id": "garlic-paste" }
  ],
  "source_page": 96,
  "image": "images/p096-nargisi-seekh-kebab.webp"
}
```

`image` is nullable — recipes without a photo emit `null`. All other fields are required; missing required fields fail validation in Stage 10.

### 6.2 Sections

```json
{
  "schema_version": 1,
  "sections": [
    {
      "id": "snacks-and-appetizers",
      "name": "Snacks and Appetizers",
      "intro_markdown": "Across India, snacks and appetizers...",
      "page_range": [88, 168],
      "recipe_ids": ["nargisi-seekh-kebab", "khumb-shabnam", "..."],
      "start_here": [
        { "id": "samosa", "rationale": "The most iconic Indian snack..." }
      ],
      "hero_image": "images/sections/snacks.webp"
    }
  ]
}
```

### 6.3 Regions

```json
{
  "schema_version": 1,
  "regions": [
    {
      "id": "awadh",
      "name": "Awadh",
      "intro_markdown": "Awadhi cuisine, born in the royal kitchens...",
      "recipe_ids": ["nargisi-seekh-kebab", "..."],
      "map_coords": { "lat": 26.85, "lng": 80.95 }
    }
  ]
}
```

### 6.4 Ingredients

```json
{
  "schema_version": 1,
  "ingredients": {
    "paneer": {
      "display_name": "Paneer",
      "recipe_ids": ["palak-paneer", "matar-paneer", "..."],
      "count": 47
    }
  }
}
```

### 6.5 Tags

```json
{
  "schema_version": 1,
  "tags": {
    "tandoor": { "kind": "technique", "recipe_ids": ["..."], "count": 23 },
    "vegetarian": { "kind": "dietary", "recipe_ids": ["..."], "count": 412 }
  }
}
```

### 6.6 Cross-reference graph

```json
{
  "schema_version": 1,
  "edges": [
    {
      "from": "nargisi-seekh-kebab",
      "to": "garlic-paste",
      "kind": "uses"
    }
  ],
  "used_in": {
    "garlic-paste": ["nargisi-seekh-kebab", "..."],
    "paneer": ["palak-paneer", "..."]
  }
}
```

### 6.7 Front matter

```json
{
  "schema_version": 1,
  "introduction": { "title": "...", "markdown": "..." },
  "history": { "title": "A Brief History of Indian Food", "markdown": "..." },
  "ayurveda": { "title": "Ayurveda and Indian Food", "markdown": "..." },
  "regions_overview": { "title": "Regions of India", "markdown": "...", "map_image": "images/india-map.webp" },
  "notes_on_recipes": { "title": "Notes on the Recipes", "markdown": "..." }
}
```

---

## 7. Frontend Brief Summary

The frontend is Codex's work. The full brief lives in `BRIEF.md`. Highlights:

- **Stack:** Next.js (App Router) on Vercel, TypeScript, no runtime DB.
- **Data source:** the JSON files in `/data/`, imported at build time or fetched as static assets.
- **Search:** client-side fuzzy search (Fuse.js or similar) over the recipe corpus, indexing name, subtitle, ingredients, region, technique tags.
- **Pages required:**
  - Home — section grid with hero images and intros, search bar, "from the introduction" call-out
  - `/sections/[id]` — chapter intro prose + "start here" rail + filterable recipe grid
  - `/regions/[id]` — region intro + map highlight + recipe grid
  - `/ingredients/[name]` — list of recipes using an ingredient
  - `/recipes/[id]` — full recipe + heat indicator + linked cross-refs ("uses Garlic Paste") + reverse edges ("used in 47 recipes") + "more from Awadh" / "more in this section"
  - `/about` — front matter (history, Ayurveda, notes)
  - Search results page
- **Look and feel:** Codex must interview the user before designing. Don't pick fonts/colors/layout autonomously.
- **Editorial voice:** preserve. Prose intros are content, not chrome.

---

## 8. Hosting & Deploy

- Vercel project linked to the GitHub repo.
- Production builds from `main`.
- Preview deploys for every PR.
- The frontend has zero runtime backend in v1.
- Image assets ship from `/public/images/` (the build copies `/data/images/` there).

---

## 9. Out of Scope (v1)

- User accounts, saved recipes, ratings, comments.
- Recipe scaling / unit conversion at runtime.
- Generated content (AI-summarized recipes, suggested substitutions).
- Mobile native app.
- Offline / PWA support (deferrable, easy to add later).
- Multilingual support (book is English).

These are all reasonable v2 candidates, captured here so the v1 spec stays small.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OCR cleanup quality is worse than expected | 50-recipe pilot before running the full 1000. Spot-check sections by region. Sonnet escalation path exists. |
| Image-to-recipe association is ambiguous on pages with multiple images | Use page proximity + heuristic (image caption or recipe title proximity). Manually fix outliers in a `pipeline/data/image-overrides.yml` file. |
| Cross-reference page numbers don't resolve cleanly (e.g., references to chapter intros, not recipes) | Allow `cross_refs` to point to sections too, not just recipes. |
| Phaidon copyright concerns about hosting recipe text | This is a personal project, not redistributed commercially. PDFs aren't checked in. If made public, take down on request. |
| Vercel free tier limits | Static site with bundled JSON should sit comfortably under any free-tier limit. |
| Branch divergence between frontend and backend creates a hard merge | Both sides only write to non-overlapping subdirectories. `/data` is owned by backend, `/web` by frontend, `/pipeline` by backend. Conflicts shouldn't happen. |

---

## 11. Glossary

- **Section / Chapter:** a top-level grouping in the book (e.g., "Snacks and Appetizers"). The book has ~12.
- **Region / Origin:** the geographic origin of a recipe (e.g., "Awadh", "Punjab", "Tamil Nadu"). Pulled from each recipe's `Origin` field.
- **Heat level:** 1, 2, or 3, from the sun icons on the recipe.
- **Cross-reference:** a `(see page X)` pointer in the source text, resolved by the pipeline to a recipe ID.
- **`/data`:** the contract directory between backend pipeline and frontend app.
