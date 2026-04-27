# Frontend Brief — India Cookbook Website

This document is for the engineer building the frontend. The backend pipeline (a separate work-stream on the `backend` branch) produces structured JSON in `/data/`. Your job is to turn that JSON into a website.

**Before you write any code, please interview the user about look-and-feel, layout, typography, and the overall browsing experience.** This brief gives you the goal and the data contract — not the design. The design is the user's call.

---

## The book

Pushpesh Pant's *India Cookbook* (Phaidon, 2010) is ~824 pages and ~1000 recipes. It is organized as an exploration of Indian cooking: a regional map at the front, chapter intros written in the author's voice, recipes grouped by chapter (Pastes, Pickles/Chutneys/Raitas, Snacks & Appetizers, Vegetables, Fish & Seafood, Meat, Rice, Breads, etc.), and pervasive cross-references — paste recipes (Garlic Paste, Garam Masala, Paneer) referenced from dozens of other dishes.

## The vision

Two things at once, both important:

1. **A searchable index.** Type "paneer", "Awadh", "tandoor", and find every recipe that matches. Fuzzy, fast, client-side.
2. **An exploration of Indian cooking.** Read the chapter intros. Browse Chutneys. Wander into Awadh. Click from Nargisi Seekh Kebab to Garlic Paste and discover the 47 dishes that use it. Notice the patterns.

The website should preserve the book's editorial voice and structure, not just dump its data.

---

## The data contract

Everything you need lives in `/data/`. Treat these as static assets imported at build time (or fetched once on the client and cached). Schemas are defined in [docs/superpowers/specs/2026-04-26-india-cookbook-website-design.md](docs/superpowers/specs/2026-04-26-india-cookbook-website-design.md) §6; read that file for full field definitions.

| File | What's in it |
|---|---|
| `recipes.json` | Flat array of all ~1000 recipes with full content. |
| `sections.json` | Chapters (Snacks, Vegetables, Rice, Breads…), each with intro prose, recipe IDs, and a curated "start here" rail. |
| `regions.json` | Regional origins (Awadh, Punjab, Kashmir…), each with intro prose and recipe IDs. |
| `ingredients.json` | Normalized ingredient → list of recipes that use it. Powers ingredient drill-down. |
| `tags.json` | Tag → recipes. Tags include dietary (vegetarian, vegan, contains-egg, non-veg), technique (tandoor, deep-fry, grill, slow-cook…), and occasion (festival, everyday, wedding). |
| `graph.json` | Cross-reference edges + reverse edges ("used in"). |
| `front-matter.json` | The book's introduction, history, Ayurveda primer, regions overview, and notes on the recipes — as structured Markdown. |
| `images/*.{webp,jpg}` | Recipe and section/region hero photos. |

**Stub data is checked in to `main` so you can build immediately**, with 2–3 representative records per file. Real data lands incrementally on `backend` and gets merged forward to `main` as it's produced.

### Recipe shape (abbreviated)

```json
{
  "id": "nargisi-seekh-kebab",
  "name": "Nargisi Seekh Kebab",
  "subtitle": "Vegetable & Egg Skewers",
  "section_id": "snacks-and-appetizers",
  "origin_region_id": "awadh",
  "prep_minutes": 30, "cook_minutes": 15, "serves": 4,
  "heat_level": 1,
  "dietary_tags": ["contains-egg", "vegetarian"],
  "technique_tags": ["tandoor", "grill"],
  "ingredients": [
    {
      "qty_metric": "300g", "qty_imperial": "11oz", "qty_count": "3 medium",
      "item": "potatoes", "notes": "unpeeled"
    }
  ],
  "instructions": ["Cook the potatoes...", "..."],
  "cross_refs": [{ "name": "Paneer", "id": "paneer" }],
  "image": "images/p096-nargisi-seekh-kebab.webp"
}
```

---

## Pages we know we need

This is a starting list. The user will refine it during the design interview.

- **Home** — section grid (chapter tiles with hero images and intros), a prominent search bar, and a "from the introduction" rail that pulls a passage from `front-matter.json`.
- **`/sections/[id]`** — chapter intro prose at the top, then a "start here" rail (the curated picks), then a filterable grid of all recipes in the chapter (filter by region, time, heat, dietary).
- **`/regions/[id]`** — region intro, a map/silhouette highlighting the area, then the recipes from that region.
- **`/recipes/[id]`** — full recipe (ingredients, steps, heat indicator, times, serves), photo, cross-refs ("uses Garlic Paste") and reverse edges ("used in 47 recipes"), plus rails for "more from Awadh" and "more in Snacks & Appetizers".
- **`/ingredients/[name]`** — list of every recipe that uses this ingredient.
- **`/about`** — the book's front matter: history, Ayurveda primer, regions overview, notes on the recipes.
- **Search** — fuzzy, client-side (Fuse.js or similar), indexing recipe name, subtitle, ingredient, region, technique. Result page or instant dropdown — the user's call.

## Stack constraints

- **Next.js (App Router) on Vercel.** TypeScript.
- **No runtime backend.** v1 is read-only static content. Don't add a database, auth, or server actions unless explicitly asked.
- **Static optimization preferred** — `generateStaticParams` for recipe / section / region / ingredient routes is the right default.

## Things the user cares about (interview them on these)

These are the topics where the user must drive the decisions, not you:

- **Visual identity** — typography, colour palette, photography style. The book itself has a strong visual identity (handpainted truck-art covers, deep colour, decorative borders); the website might honour that or do something else entirely. Ask.
- **Browsing model** — should the home page lead with chapters? Regions? A search bar? A "recipe of the day"? Ask.
- **Recipe page density** — magazine-style with big photo and pull quotes, or compact like a reference?
- **Filter UX** — sidebar, top bar, modal? How prominent are the filters relative to the recipe list?
- **Mobile vs desktop priority** — phone-first? Both equally?
- **Copy voice** — does the site speak in the author's voice or a more neutral one?
- **The "exploration" feel** — does it feel like a book? A museum? A magazine? An app? Make this concrete.

## Coordination

- The frontend lives in `/web/`. Don't touch `/pipeline/` or `/data/` (except to read).
- When the data shape needs to change, raise it as an issue or a comment to the user — don't reach into `/pipeline/`.
- The backend may push new versions of `/data/*.json` to `main` over time. Pull from `main` to refresh.

## Definition of done for v1

- Home, section, region, recipe, ingredient, about, and search routes all render.
- Static export works on Vercel.
- Lighthouse scores reasonable (no perf disasters from giant JSON imports — code-split if needed).
- Search returns results in under 100ms on a recent laptop.
- Looks the way the user wants it to look.

That last one is the most important. Talk to the user.
