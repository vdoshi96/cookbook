# India Cookbook Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 Next.js frontend for the India Cookbook: static, searchable, chapter-led, responsive, light/dark compatible, and wired to `/data/*.json`.

**Architecture:** The app lives under `/web` and reads the repo-level `/data` JSON files at build time through typed helpers in `web/lib`. Server routes render static pages with `generateStaticParams`; client components handle theme selection, instant search, filter side sheets, and the dedicated search page. Reusable components keep recipe cards, filters, curated imagery, and recipe detail sections consistent across home, section, region, ingredient, recipe, about, and search routes.

**Tech Stack:** Next.js App Router, TypeScript, React, plain CSS custom properties, Fuse.js, next-themes, react-markdown, lucide-react, Vitest, Testing Library.

---

## File Structure

Create and own these frontend files under `/web`:

- `web/package.json`: scripts and frontend dependencies.
- `web/next.config.ts`: allow build-time imports from the repo-level `/data` directory.
- `web/tsconfig.json`: TypeScript configuration with JSON module imports.
- `web/vitest.config.ts`: Vitest browser-like test environment.
- `web/test/setup.ts`: Testing Library matchers.
- `web/app/layout.tsx`: root HTML, metadata, theme provider, shared shell.
- `web/app/page.tsx`: chapters-first home page.
- `web/app/about/page.tsx`: front matter reader.
- `web/app/search/page.tsx`: dedicated search route shell.
- `web/app/sections/[id]/page.tsx`: static section route.
- `web/app/regions/[id]/page.tsx`: static region route.
- `web/app/recipes/[id]/page.tsx`: static recipe route.
- `web/app/ingredients/[name]/page.tsx`: static ingredient route.
- `web/app/not-found.tsx`: calm not-found state.
- `web/app/globals.css`: theme tokens, base layout, responsive utility classes.
- `web/components/Header.tsx`: compact navigation, mobile menu, search entry.
- `web/components/SiteFooter.tsx`: simple footer links and project context.
- `web/components/ThemeProvider.tsx`: `next-themes` wrapper.
- `web/components/ThemeToggle.tsx`: accessible light/dark toggle.
- `web/components/SearchBox.tsx`: instant Fuse suggestions.
- `web/components/SearchPageClient.tsx`: client-side `/search` experience.
- `web/components/RecipeCard.tsx`: reusable result card.
- `web/components/RecipeImage.tsx`: curated image or typographic fallback art.
- `web/components/RecipeMeta.tsx`: time, serves, heat summary.
- `web/components/RecipeDetail.tsx`: ingredients, method, cross-refs, related rails.
- `web/components/FilterSidebar.tsx`: desktop grouped filters.
- `web/components/FilterSideSheet.tsx`: mobile slide-in filter side sheet.
- `web/components/ActiveFilters.tsx`: active filter summary.
- `web/components/MarkdownBlock.tsx`: front matter and intro prose renderer.
- `web/lib/types.ts`: data contract types.
- `web/lib/data.ts`: typed build-time data access helpers.
- `web/lib/search.ts`: search document building and Fuse search.
- `web/lib/filters.ts`: recipe filtering and filter option helpers.
- `web/lib/format.ts`: small display formatters.
- `web/lib/curated-images.ts`: frontend-owned image lookup map.
- `web/lib/routes.ts`: route builders.
- `web/lib/data.test.ts`: data helper tests.
- `web/lib/search.test.ts`: search tests.
- `web/lib/filters.test.ts`: filter tests.
- `web/lib/format.test.ts`: formatting tests.
- `web/lib/curated-images.test.ts`: image lookup tests.
- `web/components/SearchBox.test.tsx`: instant search behavior test.
- `web/components/RecipeCard.test.tsx`: card rendering test.

Do not read, edit, or stage `/pipeline/`, `/source/`, or `/data/`. The only allowed interaction with `/data/` is import/read from `/web` code.

## Task 1: Scaffold Next.js App And Test Harness

**Files:**
- Create: `web/`
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`
- Modify: `web/package.json`
- Modify: `web/next.config.ts`
- Modify: `web/tsconfig.json`
- Test: `web/lib/smoke.test.ts`

- [ ] **Step 1: Scaffold the app**

Run from the repo root:

```bash
npx create-next-app@latest web --ts --eslint --app --no-tailwind --use-npm --import-alias "@/*"
```

Expected: a new `web/` directory exists with `app/`, `package.json`, `next.config.ts`, and TypeScript files.

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
cd web
npm install fuse.js lucide-react next-themes react-markdown
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `web/package-lock.json` changes and installed packages appear in `web/package.json`.

- [ ] **Step 3: Configure test scripts**

Replace the `scripts` block in `web/package.json` with:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Expected: `npm run test`, `npm run typecheck`, and `npm run lint` are valid package scripts.

- [ ] **Step 4: Configure Vitest**

Create `web/vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname)
    }
  }
});
```

Create `web/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Allow repo-level data imports**

Replace `web/next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
```

Confirm `web/tsconfig.json` has JSON module support. If it does not, add these compiler options:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

- [ ] **Step 6: Add a smoke test**

Create `web/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs Vitest", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 7: Run scaffold verification**

Run:

```bash
cd web
npm run test
npm run typecheck
```

Expected: both commands pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add web
git commit -m "chore: scaffold frontend app"
```

## Task 2: Typed Data Layer

**Files:**
- Create: `web/lib/types.ts`
- Create: `web/lib/data.ts`
- Create: `web/lib/routes.ts`
- Test: `web/lib/data.test.ts`

- [ ] **Step 1: Write failing data helper tests**

Create `web/lib/data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getAllIngredients,
  getAllRecipes,
  getAllSections,
  getIngredientBySlug,
  getRecipeById,
  getRecipesByIds,
  getRecipesByRegion,
  getRecipesBySection,
  getSectionById,
  getStartHereRecipes,
  getUsedInRecipes
} from "./data";

describe("cookbook data helpers", () => {
  it("loads the stub recipe corpus", () => {
    expect(getAllRecipes().map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("finds a recipe by id", () => {
    expect(getRecipeById("pakoras")?.name).toBe("Pakoras");
    expect(getRecipeById("missing")).toBeNull();
  });

  it("returns section recipes in section order", () => {
    expect(getRecipesBySection("snacks-and-appetizers").map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("returns region recipes in region order", () => {
    expect(getRecipesByRegion("awadh").map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "khumb-shabnam"
    ]);
  });

  it("resolves start-here recipe records with rationale", () => {
    expect(getStartHereRecipes("snacks-and-appetizers")).toEqual([
      {
        id: "pakoras",
        rationale: "The most universal Indian snack — chickpea-flour fritters that work with almost any vegetable.",
        recipeName: "Pakoras"
      },
      {
        id: "nargisi-seekh-kebab",
        rationale: "A showcase of Awadhi technique: a vegetarian take on a kebab, grilled on skewers.",
        recipeName: "Nargisi Seekh Kebab"
      }
    ]);
  });

  it("returns ingredient records by slug", () => {
    expect(getIngredientBySlug("paneer")?.display_name).toBe("Paneer");
    expect(getAllIngredients().map((ingredient) => ingredient.slug)).toContain("gram-flour");
  });

  it("resolves reverse graph edges to recipes", () => {
    expect(getUsedInRecipes("garam-masala").map((recipe) => recipe.id)).toEqual(["khumb-shabnam"]);
  });

  it("drops unknown ids when resolving id lists", () => {
    expect(getRecipesByIds(["pakoras", "missing"]).map((recipe) => recipe.id)).toEqual(["pakoras"]);
  });

  it("loads sections by id", () => {
    expect(getAllSections()).toHaveLength(3);
    expect(getSectionById("rice")?.name).toBe("Rice");
  });
});
```

- [ ] **Step 2: Run data tests to verify failure**

Run:

```bash
cd web
npm run test -- lib/data.test.ts
```

Expected: FAIL with an import error for `./data`.

- [ ] **Step 3: Create data contract types**

Create `web/lib/types.ts`:

```ts
export interface IngredientLine {
  qty_metric: string | null;
  qty_imperial: string | null;
  qty_count: string | null;
  item: string;
  notes: string | null;
}

export interface CrossReference {
  name: string;
  page: number;
  id: string;
}

export interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  section_id: string;
  section_name: string;
  origin_region_id: string;
  origin_region_name: string;
  prep_minutes: number;
  prep_notes: string | null;
  cook_minutes: number;
  cook_notes: string | null;
  serves: number;
  heat_level: number;
  dietary_tags: string[];
  technique_tags: string[];
  occasion_tags: string[];
  ingredients: IngredientLine[];
  instructions: string[];
  cross_refs: CrossReference[];
  source_page: number;
  image: string | null;
}

export interface SectionStartHere {
  id: string;
  rationale: string;
}

export interface Section {
  id: string;
  name: string;
  intro_markdown: string;
  page_range: [number, number];
  recipe_ids: string[];
  start_here: SectionStartHere[];
  hero_image: string | null;
}

export interface Region {
  id: string;
  name: string;
  intro_markdown: string;
  recipe_ids: string[];
  map_coords: {
    lat: number;
    lng: number;
  };
}

export interface IngredientRecord {
  slug: string;
  display_name: string;
  recipe_ids: string[];
  count: number;
}

export type TagKind = "dietary" | "technique" | "occasion";

export interface TagRecord {
  slug: string;
  kind: TagKind;
  recipe_ids: string[];
  count: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: "uses";
}

export interface FrontMatterSection {
  title: string;
  markdown: string;
}

export interface RegionsOverviewSection extends FrontMatterSection {
  map_image: string | null;
}

export interface FrontMatter {
  introduction: FrontMatterSection;
  history: FrontMatterSection;
  ayurveda: FrontMatterSection;
  regions_overview: RegionsOverviewSection;
  notes_on_recipes: FrontMatterSection;
}

export interface StartHereRecipe {
  id: string;
  rationale: string;
  recipeName: string;
}
```

- [ ] **Step 4: Create route builders**

Create `web/lib/routes.ts`:

```ts
export function recipePath(id: string) {
  return `/recipes/${encodeURIComponent(id)}`;
}

export function sectionPath(id: string) {
  return `/sections/${encodeURIComponent(id)}`;
}

export function regionPath(id: string) {
  return `/regions/${encodeURIComponent(id)}`;
}

export function ingredientPath(slug: string) {
  return `/ingredients/${encodeURIComponent(slug)}`;
}

export function searchPath(query?: string) {
  if (!query) {
    return "/search";
  }

  return `/search?q=${encodeURIComponent(query)}`;
}
```

- [ ] **Step 5: Create data helpers**

Create `web/lib/data.ts`:

```ts
import frontMatterFile from "../../data/front-matter.json";
import graphFile from "../../data/graph.json";
import ingredientsFile from "../../data/ingredients.json";
import recipesFile from "../../data/recipes.json";
import regionsFile from "../../data/regions.json";
import sectionsFile from "../../data/sections.json";
import tagsFile from "../../data/tags.json";
import type {
  FrontMatter,
  GraphEdge,
  IngredientRecord,
  Recipe,
  Region,
  Section,
  StartHereRecipe,
  TagRecord
} from "./types";

const recipes = recipesFile.recipes as Recipe[];
const sections = sectionsFile.sections as Section[];
const regions = regionsFile.regions as Region[];
const ingredients = ingredientsFile.ingredients as Record<string, Omit<IngredientRecord, "slug">>;
const tags = tagsFile.tags as Record<string, Omit<TagRecord, "slug">>;
const graph = graphFile as { edges: GraphEdge[]; used_in: Record<string, string[]> };
const frontMatter = frontMatterFile as FrontMatter;

const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
const sectionById = new Map(sections.map((section) => [section.id, section]));
const regionById = new Map(regions.map((region) => [region.id, region]));

export function getAllRecipes(): Recipe[] {
  return recipes;
}

export function getRecipeById(id: string): Recipe | null {
  return recipeById.get(id) ?? null;
}

export function getRecipesByIds(ids: string[]): Recipe[] {
  return ids.map((id) => recipeById.get(id)).filter((recipe): recipe is Recipe => Boolean(recipe));
}

export function getAllSections(): Section[] {
  return sections;
}

export function getSectionById(id: string): Section | null {
  return sectionById.get(id) ?? null;
}

export function getRecipesBySection(sectionId: string): Recipe[] {
  const section = getSectionById(sectionId);
  return section ? getRecipesByIds(section.recipe_ids) : [];
}

export function getStartHereRecipes(sectionId: string): StartHereRecipe[] {
  const section = getSectionById(sectionId);

  if (!section) {
    return [];
  }

  return section.start_here
    .map((entry) => {
      const recipe = getRecipeById(entry.id);

      if (!recipe) {
        return null;
      }

      return {
        id: entry.id,
        rationale: entry.rationale,
        recipeName: recipe.name
      };
    })
    .filter((entry): entry is StartHereRecipe => Boolean(entry));
}

export function getAllRegions(): Region[] {
  return regions;
}

export function getRegionById(id: string): Region | null {
  return regionById.get(id) ?? null;
}

export function getRecipesByRegion(regionId: string): Recipe[] {
  const region = getRegionById(regionId);
  return region ? getRecipesByIds(region.recipe_ids) : [];
}

export function getAllIngredients(): IngredientRecord[] {
  return Object.entries(ingredients).map(([slug, ingredient]) => ({
    slug,
    ...ingredient
  }));
}

export function getIngredientBySlug(slug: string): IngredientRecord | null {
  const ingredient = ingredients[slug];

  if (!ingredient) {
    return null;
  }

  return {
    slug,
    ...ingredient
  };
}

export function getAllTags(): TagRecord[] {
  return Object.entries(tags).map(([slug, tag]) => ({
    slug,
    ...tag
  }));
}

export function getTagBySlug(slug: string): TagRecord | null {
  const tag = tags[slug];

  if (!tag) {
    return null;
  }

  return {
    slug,
    ...tag
  };
}

export function getGraphEdges(): GraphEdge[] {
  return graph.edges;
}

export function getUsedInRecipes(referenceId: string): Recipe[] {
  return getRecipesByIds(graph.used_in[referenceId] ?? []);
}

export function getFrontMatter(): FrontMatter {
  return frontMatter;
}
```

- [ ] **Step 6: Run data tests**

Run:

```bash
cd web
npm run test -- lib/data.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add web/lib/types.ts web/lib/data.ts web/lib/routes.ts web/lib/data.test.ts
git commit -m "feat: add typed cookbook data access"
```

## Task 3: Search And Filtering Logic

**Files:**
- Create: `web/lib/search.ts`
- Create: `web/lib/filters.ts`
- Test: `web/lib/search.test.ts`
- Test: `web/lib/filters.test.ts`

- [ ] **Step 1: Write failing search tests**

Create `web/lib/search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSearchDocuments, searchCookbook } from "./search";

describe("cookbook search", () => {
  it("builds documents for recipes, ingredients, regions, sections, and tags", () => {
    const documents = buildSearchDocuments();

    expect(documents.some((document) => document.kind === "recipe" && document.id === "pakoras")).toBe(true);
    expect(documents.some((document) => document.kind === "ingredient" && document.id === "paneer")).toBe(true);
    expect(documents.some((document) => document.kind === "region" && document.id === "awadh")).toBe(true);
    expect(documents.some((document) => document.kind === "section" && document.id === "snacks-and-appetizers")).toBe(true);
    expect(documents.some((document) => document.kind === "tag" && document.id === "tandoor")).toBe(true);
  });

  it("finds recipes by ingredient text", () => {
    const results = searchCookbook("paneer");

    expect(results[0]).toMatchObject({
      kind: "recipe",
      id: "nargisi-seekh-kebab",
      title: "Nargisi Seekh Kebab"
    });
  });

  it("finds regions and techniques", () => {
    expect(searchCookbook("awadh").some((result) => result.kind === "region" && result.id === "awadh")).toBe(true);
    expect(searchCookbook("tandoor").some((result) => result.kind === "tag" && result.id === "tandoor")).toBe(true);
  });

  it("returns an empty array for blank search", () => {
    expect(searchCookbook("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Write failing filter tests**

Create `web/lib/filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAllRecipes } from "./data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "./filters";

describe("recipe filters", () => {
  it("filters by region", () => {
    expect(applyRecipeFilters(getAllRecipes(), { region: "awadh" }).map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "khumb-shabnam"
    ]);
  });

  it("filters by max total time", () => {
    expect(applyRecipeFilters(getAllRecipes(), { maxTotalMinutes: 30 }).map((recipe) => recipe.id)).toEqual([
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("filters by dietary, technique, and heat", () => {
    expect(
      applyRecipeFilters(getAllRecipes(), {
        dietary: ["vegetarian"],
        technique: ["grill"],
        heatLevel: 1
      }).map((recipe) => recipe.id)
    ).toEqual(["nargisi-seekh-kebab"]);
  });

  it("parses URL search params", () => {
    const filters = parseRecipeFilters(
      new URLSearchParams("region=awadh&dietary=vegetarian&technique=grill&maxTime=45&heat=1")
    );

    expect(filters).toEqual({
      region: "awadh",
      dietary: ["vegetarian"],
      technique: ["grill"],
      maxTotalMinutes: 45,
      heatLevel: 1
    });
  });

  it("builds unique filter options", () => {
    const options = getRecipeFilterOptions(getAllRecipes());

    expect(options.regions).toEqual([{ id: "awadh", name: "Awadh" }, { id: "tamil-nadu", name: "Tamil Nadu" }]);
    expect(options.dietary).toEqual(["contains-egg", "vegan-possible", "vegetarian"]);
    expect(options.techniques).toEqual(["deep-fry", "grill", "no-cook", "stir-fry", "tandoor"]);
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
cd web
npm run test -- lib/search.test.ts lib/filters.test.ts
```

Expected: FAIL with import errors for `./search` and `./filters`.

- [ ] **Step 4: Implement Fuse search**

Create `web/lib/search.ts`:

```ts
import Fuse from "fuse.js";
import {
  getAllIngredients,
  getAllRecipes,
  getAllRegions,
  getAllSections,
  getAllTags
} from "./data";
import { ingredientPath, recipePath, regionPath, searchPath, sectionPath } from "./routes";
import type { Recipe } from "./types";

export type SearchKind = "recipe" | "ingredient" | "region" | "section" | "tag";

export interface SearchDocument {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
}

function recipeKeywords(recipe: Recipe): string[] {
  return [
    recipe.name,
    recipe.subtitle,
    recipe.section_name,
    recipe.origin_region_name,
    ...recipe.ingredients.map((ingredient) => ingredient.item),
    ...recipe.dietary_tags,
    ...recipe.technique_tags,
    ...recipe.occasion_tags,
    ...recipe.cross_refs.map((reference) => reference.name)
  ];
}

export function buildSearchDocuments(): SearchDocument[] {
  const recipeDocuments = getAllRecipes().map((recipe) => ({
    id: recipe.id,
    kind: "recipe" as const,
    title: recipe.name,
    subtitle: `${recipe.subtitle} · ${recipe.origin_region_name} · ${recipe.section_name}`,
    href: recipePath(recipe.id),
    keywords: recipeKeywords(recipe)
  }));

  const ingredientDocuments = getAllIngredients().map((ingredient) => ({
    id: ingredient.slug,
    kind: "ingredient" as const,
    title: ingredient.display_name,
    subtitle: `Used in ${ingredient.count} ${ingredient.count === 1 ? "recipe" : "recipes"}`,
    href: ingredientPath(ingredient.slug),
    keywords: [ingredient.display_name, ingredient.slug]
  }));

  const regionDocuments = getAllRegions().map((region) => ({
    id: region.id,
    kind: "region" as const,
    title: region.name,
    subtitle: `${region.recipe_ids.length} ${region.recipe_ids.length === 1 ? "recipe" : "recipes"}`,
    href: regionPath(region.id),
    keywords: [region.name, region.intro_markdown]
  }));

  const sectionDocuments = getAllSections().map((section) => ({
    id: section.id,
    kind: "section" as const,
    title: section.name,
    subtitle: `${section.recipe_ids.length} ${section.recipe_ids.length === 1 ? "recipe" : "recipes"}`,
    href: sectionPath(section.id),
    keywords: [section.name, section.intro_markdown]
  }));

  const tagDocuments = getAllTags().map((tag) => ({
    id: tag.slug,
    kind: "tag" as const,
    title: tag.slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    subtitle: `${tag.kind} · ${tag.count} ${tag.count === 1 ? "recipe" : "recipes"}`,
    href: searchPath(tag.slug),
    keywords: [tag.slug, tag.kind]
  }));

  return [
    ...recipeDocuments,
    ...ingredientDocuments,
    ...regionDocuments,
    ...sectionDocuments,
    ...tagDocuments
  ];
}

export function createSearchIndex(documents = buildSearchDocuments()) {
  return new Fuse(documents, {
    includeScore: true,
    threshold: 0.32,
    keys: [
      { name: "title", weight: 0.45 },
      { name: "subtitle", weight: 0.2 },
      { name: "keywords", weight: 0.35 }
    ]
  });
}

export function searchCookbook(query: string, limit = 8): SearchDocument[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  return createSearchIndex()
    .search(normalizedQuery, { limit })
    .map((result) => result.item);
}
```

- [ ] **Step 5: Implement recipe filters**

Create `web/lib/filters.ts`:

```ts
import type { Recipe } from "./types";

export interface RecipeFilters {
  region?: string;
  dietary?: string[];
  technique?: string[];
  maxTotalMinutes?: number;
  heatLevel?: number;
}

export interface RecipeFilterOptions {
  regions: Array<{ id: string; name: string }>;
  dietary: string[];
  techniques: string[];
}

function includesEvery(selected: string[] | undefined, values: string[]) {
  if (!selected || selected.length === 0) {
    return true;
  }

  return selected.every((value) => values.includes(value));
}

export function getTotalMinutes(recipe: Recipe) {
  return recipe.prep_minutes + recipe.cook_minutes;
}

export function applyRecipeFilters(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  return recipes.filter((recipe) => {
    if (filters.region && recipe.origin_region_id !== filters.region) {
      return false;
    }

    if (filters.maxTotalMinutes && getTotalMinutes(recipe) > filters.maxTotalMinutes) {
      return false;
    }

    if (filters.heatLevel && recipe.heat_level !== filters.heatLevel) {
      return false;
    }

    if (!includesEvery(filters.dietary, recipe.dietary_tags)) {
      return false;
    }

    if (!includesEvery(filters.technique, recipe.technique_tags)) {
      return false;
    }

    return true;
  });
}

export function parseRecipeFilters(params: URLSearchParams): RecipeFilters {
  const maxTime = Number(params.get("maxTime"));
  const heat = Number(params.get("heat"));

  return {
    region: params.get("region") ?? undefined,
    dietary: params.getAll("dietary"),
    technique: params.getAll("technique"),
    maxTotalMinutes: Number.isFinite(maxTime) && maxTime > 0 ? maxTime : undefined,
    heatLevel: Number.isFinite(heat) && heat > 0 ? heat : undefined
  };
}

export function getRecipeFilterOptions(recipes: Recipe[]): RecipeFilterOptions {
  const regionMap = new Map<string, string>();
  const dietary = new Set<string>();
  const techniques = new Set<string>();

  recipes.forEach((recipe) => {
    regionMap.set(recipe.origin_region_id, recipe.origin_region_name);
    recipe.dietary_tags.forEach((tag) => dietary.add(tag));
    recipe.technique_tags.forEach((tag) => techniques.add(tag));
  });

  return {
    regions: Array.from(regionMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    dietary: Array.from(dietary).sort(),
    techniques: Array.from(techniques).sort()
  };
}
```

- [ ] **Step 6: Run search/filter tests**

Run:

```bash
cd web
npm run test -- lib/search.test.ts lib/filters.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add web/lib/search.ts web/lib/filters.ts web/lib/search.test.ts web/lib/filters.test.ts
git commit -m "feat: add cookbook search and filters"
```

## Task 4: Formatting And Curated Images

**Files:**
- Create: `web/lib/format.ts`
- Create: `web/lib/curated-images.ts`
- Test: `web/lib/format.test.ts`
- Test: `web/lib/curated-images.test.ts`

- [ ] **Step 1: Write failing formatter tests**

Create `web/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatHeatLevel, formatIngredientLine, formatTagLabel, formatTotalTime } from "./format";
import type { IngredientLine } from "./types";

describe("format helpers", () => {
  it("formats total time", () => {
    expect(formatTotalTime(30, 15)).toBe("45 min");
    expect(formatTotalTime(70, 15)).toBe("1 hr 25 min");
  });

  it("formats heat levels", () => {
    expect(formatHeatLevel(1)).toBe("Mild");
    expect(formatHeatLevel(2)).toBe("Medium");
    expect(formatHeatLevel(3)).toBe("Hot");
  });

  it("formats ingredient lines", () => {
    const ingredient: IngredientLine = {
      qty_metric: "300g",
      qty_imperial: "11oz",
      qty_count: "3 medium",
      item: "potatoes",
      notes: "unpeeled"
    };

    expect(formatIngredientLine(ingredient)).toBe("300g / 11oz / 3 medium potatoes, unpeeled");
  });

  it("formats tag labels", () => {
    expect(formatTagLabel("vegan-possible")).toBe("Vegan Possible");
  });
});
```

- [ ] **Step 2: Write failing image lookup tests**

Create `web/lib/curated-images.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getCuratedImage } from "./curated-images";

describe("curated image lookup", () => {
  it("returns a curated recipe image when one exists", () => {
    expect(getCuratedImage("recipe", "pakoras", "Pakoras")).toMatchObject({
      alt: "A plate of pakoras.",
      sourceLabel: "Wikimedia Commons"
    });
  });

  it("returns fallback art metadata when no curated image exists", () => {
    expect(getCuratedImage("section", "rice", "Rice")).toEqual({
      id: "rice",
      kind: "section",
      src: null,
      alt: "Rice",
      sourceHref: null,
      sourceLabel: null
    });
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
cd web
npm run test -- lib/format.test.ts lib/curated-images.test.ts
```

Expected: FAIL with import errors.

- [ ] **Step 4: Implement format helpers**

Create `web/lib/format.ts`:

```ts
import type { IngredientLine } from "./types";

export function formatTotalTime(prepMinutes: number, cookMinutes: number) {
  const total = prepMinutes + cookMinutes;

  if (total < 60) {
    return `${total} min`;
  }

  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatHeatLevel(level: number) {
  if (level <= 1) {
    return "Mild";
  }

  if (level === 2) {
    return "Medium";
  }

  return "Hot";
}

export function formatTagLabel(tag: string) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatIngredientLine(ingredient: IngredientLine) {
  const quantities = [ingredient.qty_metric, ingredient.qty_imperial, ingredient.qty_count].filter(Boolean);
  const quantityText = quantities.length > 0 ? `${quantities.join(" / ")} ` : "";
  const notesText = ingredient.notes ? `, ${ingredient.notes}` : "";

  return `${quantityText}${ingredient.item}${notesText}`;
}
```

- [ ] **Step 5: Implement curated image lookup**

Create `web/lib/curated-images.ts`:

```ts
export type CuratedImageKind = "recipe" | "section" | "region";

export interface CuratedImage {
  id: string;
  kind: CuratedImageKind;
  src: string | null;
  alt: string;
  sourceHref: string | null;
  sourceLabel: string | null;
}

const curatedImages: Record<string, CuratedImage> = {
  "recipe:nargisi-seekh-kebab": {
    id: "nargisi-seekh-kebab",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nargisi_Kofta.JPG",
    alt: "Nargisi kofta served in a dish.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Nargisi_Kofta.JPG",
    sourceLabel: "Wikimedia Commons"
  },
  "recipe:pakoras": {
    id: "pakoras",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pakora.JPG",
    alt: "A plate of pakoras.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Pakora.JPG",
    sourceLabel: "Wikimedia Commons"
  },
  "recipe:khumb-shabnam": {
    id: "khumb-shabnam",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mushroom_Tikka_Masala_by_Preeti_Tamilarasan.jpg",
    alt: "A mushroom curry in a serving bowl.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Mushroom_Tikka_Masala_by_Preeti_Tamilarasan.jpg",
    sourceLabel: "Wikimedia Commons"
  },
  "section:snacks-and-appetizers": {
    id: "snacks-and-appetizers",
    kind: "section",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pakoras.jpg",
    alt: "A plate of assorted pakoras.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Pakoras.jpg",
    sourceLabel: "Wikimedia Commons"
  }
};

export function getCuratedImage(kind: CuratedImageKind, id: string, label: string): CuratedImage {
  const image = curatedImages[`${kind}:${id}`];

  if (image) {
    return image;
  }

  return {
    id,
    kind,
    src: null,
    alt: label,
    sourceHref: null,
    sourceLabel: null
  };
}
```

- [ ] **Step 6: Run formatter and image tests**

Run:

```bash
cd web
npm run test -- lib/format.test.ts lib/curated-images.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add web/lib/format.ts web/lib/curated-images.ts web/lib/format.test.ts web/lib/curated-images.test.ts
git commit -m "feat: add display helpers and curated images"
```

## Task 5: Theme, Global Styles, And Site Shell

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`
- Create: `web/components/ThemeProvider.tsx`
- Create: `web/components/ThemeToggle.tsx`
- Create: `web/components/Header.tsx`
- Create: `web/components/SiteFooter.tsx`
- Test: `web/components/ThemeToggle.test.tsx`

- [ ] **Step 1: Write failing theme toggle test**

Create `web/components/ThemeToggle.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn()
  })
}));

describe("ThemeToggle", () => {
  it("renders an accessible theme toggle", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
cd web
npm run test -- components/ThemeToggle.test.tsx
```

Expected: FAIL with an import error for `./ThemeToggle`.

- [ ] **Step 3: Create the theme provider**

Create `web/components/ThemeProvider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemeProvider>
  );
}
```

- [ ] **Step 4: Create the theme toggle**

Create `web/components/ThemeToggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button className="icon-button" type="button" aria-label={label} onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
    </button>
  );
}
```

- [ ] **Step 5: Create header and footer**

Create `web/components/Header.tsx`:

```tsx
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        India Cookbook
      </Link>
      <nav className="primary-nav" aria-label="Primary navigation">
        <Link href="/">Home</Link>
        <Link href="/#chapters">Chapters</Link>
        <Link href="/#regions">Regions</Link>
        <Link href="/search">Search</Link>
        <Link href="/about">About</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
```

Create `web/components/SiteFooter.tsx`:

```tsx
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>India Cookbook is a personal digital companion for browsing recipes, regions, ingredients, and cross-references.</p>
    </footer>
  );
}
```

- [ ] **Step 6: Replace root layout**

Replace `web/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "India Cookbook",
    template: "%s · India Cookbook"
  },
  description: "A searchable, browsable companion to Pushpesh Pant's India Cookbook."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Replace global CSS**

Replace `web/app/globals.css` with:

```css
:root {
  color-scheme: light;
  --page: #fbf7ef;
  --surface: #fffdf8;
  --surface-strong: #f3eadb;
  --ink: #241f1a;
  --muted: rgba(36, 31, 26, 0.68);
  --line: rgba(57, 45, 35, 0.16);
  --accent: #7d4d36;
  --accent-soft: rgba(125, 77, 54, 0.14);
  --shadow: 0 18px 40px rgba(36, 31, 26, 0.1);
  --radius: 8px;
  --max: 1180px;
}

[data-theme="dark"] {
  color-scheme: dark;
  --page: #181412;
  --surface: #211b18;
  --surface-strong: #2b231e;
  --ink: #f4ead8;
  --muted: rgba(244, 234, 216, 0.72);
  --line: rgba(244, 234, 216, 0.14);
  --accent: #c99a74;
  --accent-soft: rgba(201, 154, 116, 0.16);
  --shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: Georgia, "Times New Roman", serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select {
  font: inherit;
}

main {
  min-height: 72vh;
}

.site-header,
.site-footer,
.page-shell {
  width: min(var(--max), calc(100vw - 32px));
  margin: 0 auto;
}

.site-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.brand {
  font-size: 1.1rem;
  font-weight: 700;
}

.primary-nav {
  display: flex;
  justify-content: center;
  gap: 18px;
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.icon-button {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}

.site-footer {
  margin-top: 72px;
  padding: 28px 0 36px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.9rem;
}

.eyebrow {
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.display-title {
  margin: 0;
  font-size: clamp(2.4rem, 7vw, 5.8rem);
  line-height: 0.94;
  letter-spacing: 0;
}

.section-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1;
  letter-spacing: 0;
}

.lede {
  max-width: 70ch;
  color: var(--muted);
  font-size: 1.08rem;
  line-height: 1.65;
}

.surface {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

@media (max-width: 760px) {
  .site-header {
    grid-template-columns: 1fr auto;
  }

  .primary-nav {
    grid-column: 1 / -1;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
```

- [ ] **Step 8: Run tests and typecheck**

Run:

```bash
cd web
npm run test -- components/ThemeToggle.test.tsx
npm run typecheck
```

Expected: both commands pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add web/app/layout.tsx web/app/globals.css web/components/ThemeProvider.tsx web/components/ThemeToggle.tsx web/components/Header.tsx web/components/SiteFooter.tsx web/components/ThemeToggle.test.tsx
git commit -m "feat: add themed site shell"
```

## Task 6: Core UI Components

**Files:**
- Create: `web/components/RecipeImage.tsx`
- Create: `web/components/RecipeCard.tsx`
- Create: `web/components/RecipeMeta.tsx`
- Create: `web/components/MarkdownBlock.tsx`
- Create: `web/components/SearchBox.tsx`
- Test: `web/components/RecipeCard.test.tsx`
- Test: `web/components/SearchBox.test.tsx`

- [ ] **Step 1: Write failing RecipeCard test**

Create `web/components/RecipeCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRecipeById } from "@/lib/data";
import { RecipeCard } from "./RecipeCard";

describe("RecipeCard", () => {
  it("renders recipe title, region, and total time", () => {
    const recipe = getRecipeById("pakoras");

    if (!recipe) {
      throw new Error("Expected pakoras fixture");
    }

    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole("link", { name: /Pakoras/ })).toHaveAttribute("href", "/recipes/pakoras");
    expect(screen.getByText("Tamil Nadu")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write failing SearchBox test**

Create `web/components/SearchBox.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SearchBox } from "./SearchBox";

describe("SearchBox", () => {
  it("shows instant suggestions while typing", async () => {
    const user = userEvent.setup();

    render(<SearchBox />);
    await user.type(screen.getByRole("combobox", { name: "Search recipes, ingredients, regions" }), "paneer");

    expect(await screen.findByRole("link", { name: /Nargisi Seekh Kebab/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
cd web
npm run test -- components/RecipeCard.test.tsx components/SearchBox.test.tsx
```

Expected: FAIL with missing component imports.

- [ ] **Step 4: Create recipe image component**

Create `web/components/RecipeImage.tsx`:

```tsx
import { getCuratedImage, type CuratedImageKind } from "@/lib/curated-images";

interface RecipeImageProps {
  kind: CuratedImageKind;
  id: string;
  label: string;
  className?: string;
}

export function RecipeImage({ kind, id, label, className }: RecipeImageProps) {
  const image = getCuratedImage(kind, id, label);
  const classNames = ["recipe-image", className].filter(Boolean).join(" ");

  if (!image.src) {
    return (
      <div className={classNames} role="img" aria-label={image.alt}>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <figure className={classNames}>
      <img src={image.src} alt={image.alt} loading="lazy" />
      {image.sourceHref && image.sourceLabel ? (
        <figcaption>
          <a href={image.sourceHref}>{image.sourceLabel}</a>
        </figcaption>
      ) : null}
    </figure>
  );
}
```

- [ ] **Step 5: Create metadata and markdown components**

Create `web/components/RecipeMeta.tsx`:

```tsx
import { formatHeatLevel, formatTotalTime } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <dl className="recipe-meta">
      <div>
        <dt>Total</dt>
        <dd>{formatTotalTime(recipe.prep_minutes, recipe.cook_minutes)}</dd>
      </div>
      <div>
        <dt>Prep</dt>
        <dd>
          {recipe.prep_minutes} min{recipe.prep_notes ? `, ${recipe.prep_notes}` : ""}
        </dd>
      </div>
      <div>
        <dt>Cook</dt>
        <dd>
          {recipe.cook_minutes} min{recipe.cook_notes ? `, ${recipe.cook_notes}` : ""}
        </dd>
      </div>
      <div>
        <dt>Serves</dt>
        <dd>{recipe.serves}</dd>
      </div>
      <div>
        <dt>Heat</dt>
        <dd>{formatHeatLevel(recipe.heat_level)}</dd>
      </div>
    </dl>
  );
}
```

Create `web/components/MarkdownBlock.tsx`:

```tsx
import ReactMarkdown from "react-markdown";

export function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-block">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 6: Create RecipeCard**

Create `web/components/RecipeCard.tsx`:

```tsx
import Link from "next/link";
import { formatTagLabel, formatTotalTime } from "@/lib/format";
import { recipePath } from "@/lib/routes";
import type { Recipe } from "@/lib/types";
import { RecipeImage } from "./RecipeImage";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="recipe-card surface">
      <RecipeImage kind="recipe" id={recipe.id} label={recipe.name} className="recipe-card-image" />
      <div className="recipe-card-body">
        <p className="eyebrow">{recipe.origin_region_name}</p>
        <h3>
          <Link href={recipePath(recipe.id)}>{recipe.name}</Link>
        </h3>
        <p>{recipe.subtitle}</p>
        <div className="recipe-card-meta">
          <span>{formatTotalTime(recipe.prep_minutes, recipe.cook_minutes)}</span>
          <span>{recipe.serves} servings</span>
          <span>{formatTagLabel(recipe.dietary_tags[0] ?? "recipe")}</span>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 7: Create SearchBox**

Create `web/components/SearchBox.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { searchCookbook } from "@/lib/search";
import { searchPath } from "@/lib/routes";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCookbook(query, 6), [query]);

  return (
    <div className="search-box">
      <label className="visually-hidden" htmlFor="global-search">
        Search recipes, ingredients, regions
      </label>
      <div className="search-input-wrap">
        <Search aria-hidden="true" size={18} />
        <input
          id="global-search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="global-search-results"
          aria-label="Search recipes, ingredients, regions"
          placeholder="Search recipes, ingredients, regions"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Link className="search-submit" href={searchPath(query)}>
          Search
        </Link>
      </div>
      {results.length > 0 ? (
        <div className="search-suggestions surface" id="global-search-results" role="listbox">
          {results.map((result) => (
            <Link key={`${result.kind}:${result.id}`} href={result.href} role="option">
              <span>{result.title}</span>
              <small>{result.subtitle}</small>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 8: Add component CSS**

Append to `web/app/globals.css`:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.recipe-image {
  position: relative;
  display: grid;
  min-height: 180px;
  place-items: center;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--surface-strong);
  color: var(--muted);
}

.recipe-image img {
  width: 100%;
  height: 100%;
  min-height: 180px;
  object-fit: cover;
  filter: saturate(0.94);
}

[data-theme="dark"] .recipe-image img {
  filter: brightness(0.84) saturate(0.9);
}

.recipe-image figcaption {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.48);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.7rem;
}

.recipe-card {
  display: grid;
  grid-template-columns: minmax(120px, 0.42fr) 1fr;
  gap: 16px;
  padding: 12px;
}

.recipe-card-image {
  min-height: 150px;
}

.recipe-card-body h3 {
  margin: 6px 0;
  font-size: 1.35rem;
  line-height: 1.1;
}

.recipe-card-body p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.recipe-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.82rem;
}

.recipe-meta {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0;
}

.recipe-meta div {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.recipe-meta dt {
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.78rem;
}

.recipe-meta dd {
  margin: 4px 0 0;
  font-weight: 700;
}

.markdown-block {
  color: var(--ink);
  font-size: 1.05rem;
  line-height: 1.75;
}

.search-box {
  position: relative;
  width: min(720px, 100%);
}

.search-input-wrap {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
}

.search-input-wrap input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
}

.search-submit {
  color: var(--accent);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.86rem;
}

.search-suggestions {
  position: absolute;
  z-index: 10;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  display: grid;
  padding: 8px;
  box-shadow: var(--shadow);
}

.search-suggestions a {
  display: grid;
  gap: 2px;
  padding: 10px;
  border-radius: 6px;
}

.search-suggestions a:hover {
  background: var(--accent-soft);
}

.search-suggestions small {
  color: var(--muted);
}

@media (max-width: 700px) {
  .recipe-card {
    grid-template-columns: 1fr;
  }

  .recipe-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 9: Run component tests**

Run:

```bash
cd web
npm run test -- components/RecipeCard.test.tsx components/SearchBox.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add web/components web/app/globals.css
git commit -m "feat: add core cookbook components"
```

## Task 7: Filters UI Components

**Files:**
- Create: `web/components/ActiveFilters.tsx`
- Create: `web/components/FilterSidebar.tsx`
- Create: `web/components/FilterSideSheet.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Create active filters component**

Create `web/components/ActiveFilters.tsx`:

```tsx
import { formatTagLabel } from "@/lib/format";
import type { RecipeFilters } from "@/lib/filters";

export function ActiveFilters({ filters }: { filters: RecipeFilters }) {
  const labels = [
    filters.region ? `Region: ${formatTagLabel(filters.region)}` : null,
    filters.maxTotalMinutes ? `Under ${filters.maxTotalMinutes} min` : null,
    filters.heatLevel ? `Heat ${filters.heatLevel}` : null,
    ...(filters.dietary ?? []).map((tag) => formatTagLabel(tag)),
    ...(filters.technique ?? []).map((tag) => formatTagLabel(tag))
  ].filter((label): label is string => Boolean(label));

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="active-filters" aria-label="Active filters">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create desktop filter sidebar**

Create `web/components/FilterSidebar.tsx`:

```tsx
import { formatTagLabel } from "@/lib/format";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";

interface FilterSidebarProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
}

export function FilterSidebar({ options, filters }: FilterSidebarProps) {
  return (
    <aside className="filter-sidebar surface" aria-label="Recipe filters">
      <h2>Filter</h2>
      <div className="filter-group">
        <h3>Region</h3>
        {options.regions.map((region) => (
          <label key={region.id}>
            <input type="radio" name="region" value={region.id} defaultChecked={filters.region === region.id} />
            {region.name}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Dietary</h3>
        {options.dietary.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="dietary" value={tag} defaultChecked={filters.dietary?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Technique</h3>
        {options.techniques.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="technique" value={tag} defaultChecked={filters.technique?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </div>
      <button className="text-button" type="submit">
        Apply filters
      </button>
    </aside>
  );
}
```

- [ ] **Step 3: Create mobile filter side sheet**

Create `web/components/FilterSideSheet.tsx`:

```tsx
"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";
import { FilterSidebar } from "./FilterSidebar";

interface FilterSideSheetProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
}

export function FilterSideSheet({ options, filters }: FilterSideSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="filter-sheet-wrap">
      <button className="filter-open-button" type="button" onClick={() => setOpen(true)}>
        <SlidersHorizontal aria-hidden="true" size={16} />
        Filter
      </button>
      {open ? (
        <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Recipe filters">
          <button className="icon-button filter-close" type="button" aria-label="Close filters" onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={18} />
          </button>
          <FilterSidebar options={options} filters={filters} />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Add filter CSS**

Append to `web/app/globals.css`:

```css
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.active-filters span {
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--accent-soft);
  font-size: 0.8rem;
}

.filter-sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.filter-sidebar h2,
.filter-sidebar h3 {
  margin: 0;
}

.filter-group {
  display: grid;
  gap: 9px;
}

.filter-group label {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.text-button,
.filter-open-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  padding: 9px 12px;
  cursor: pointer;
}

.filter-sheet-wrap {
  display: none;
}

.filter-sheet {
  position: fixed;
  z-index: 40;
  inset: 0 auto 0 0;
  width: min(360px, 88vw);
  padding: 16px;
  background: var(--page);
  box-shadow: var(--shadow);
}

.filter-close {
  margin: 0 0 12px auto;
}

@media (max-width: 860px) {
  .desktop-filters {
    display: none;
  }

  .filter-sheet-wrap {
    display: block;
  }
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
cd web
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add web/components/ActiveFilters.tsx web/components/FilterSidebar.tsx web/components/FilterSideSheet.tsx web/app/globals.css
git commit -m "feat: add responsive filter controls"
```

## Task 8: Home, About, And Not Found Routes

**Files:**
- Modify: `web/app/page.tsx`
- Create: `web/app/about/page.tsx`
- Create: `web/app/not-found.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Create chapters-first home page**

Replace `web/app/page.tsx` with:

```tsx
import Link from "next/link";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeImage } from "@/components/RecipeImage";
import { SearchBox } from "@/components/SearchBox";
import { getAllRegions, getAllSections, getFrontMatter } from "@/lib/data";
import { regionPath, sectionPath } from "@/lib/routes";

export default function HomePage() {
  const sections = getAllSections();
  const regions = getAllRegions();
  const frontMatter = getFrontMatter();

  return (
    <div className="page-shell home-page">
      <section className="home-hero">
        <p className="eyebrow">A digital companion</p>
        <h1 className="display-title">India Cookbook</h1>
        <p className="lede">
          Browse the cookbook by chapter, region, ingredient, and the cross-references that connect one dish to another.
        </p>
        <SearchBox />
      </section>

      <section className="page-section" id="chapters" aria-labelledby="chapters-heading">
        <div className="section-heading">
          <p className="eyebrow">Chapters</p>
          <h2 className="section-title" id="chapters-heading">
            The Chapters
          </h2>
        </div>
        <div className="chapter-grid">
          {sections.map((section) => (
            <Link className="chapter-tile surface" href={sectionPath(section.id)} key={section.id}>
              <RecipeImage kind="section" id={section.id} label={section.name} className="chapter-image" />
              <h3>{section.name}</h3>
              <p>{section.intro_markdown}</p>
              <span>{section.recipe_ids.length} recipes</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-section front-matter-rail surface" aria-labelledby="intro-heading">
        <p className="eyebrow">From the introduction</p>
        <h2 id="intro-heading">{frontMatter.introduction.title}</h2>
        <MarkdownBlock markdown={frontMatter.introduction.markdown} />
        <Link className="text-link" href="/about">
          Read the front matter
        </Link>
      </section>

      <section className="page-section" id="regions" aria-labelledby="regions-heading">
        <div className="section-heading">
          <p className="eyebrow">Regions</p>
          <h2 className="section-title" id="regions-heading">
            Browse by Region
          </h2>
        </div>
        <div className="region-grid">
          {regions.map((region) => (
            <Link className="region-tile surface" href={regionPath(region.id)} key={region.id}>
              <h3>{region.name}</h3>
              <p>{region.intro_markdown}</p>
              <span>
                {region.recipe_ids.length} {region.recipe_ids.length === 1 ? "recipe" : "recipes"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create About route**

Create `web/app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { getFrontMatter } from "@/lib/data";

export const metadata: Metadata = {
  title: "About"
};

export default function AboutPage() {
  const frontMatter = getFrontMatter();
  const sections = [
    frontMatter.introduction,
    frontMatter.history,
    frontMatter.ayurveda,
    frontMatter.regions_overview,
    frontMatter.notes_on_recipes
  ];

  return (
    <div className="page-shell reading-page">
      <p className="eyebrow">Front matter</p>
      <h1 className="section-title">About the Cookbook</h1>
      {sections.map((section) => (
        <section className="reading-section surface" key={section.title}>
          <h2>{section.title}</h2>
          <MarkdownBlock markdown={section.markdown} />
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create not-found route**

Create `web/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell empty-state">
      <p className="eyebrow">Not found</p>
      <h1 className="section-title">No matching page</h1>
      <p className="lede">No matches yet. Try a region, ingredient, or technique.</p>
      <Link className="text-link" href="/search">
        Search the cookbook
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Add page CSS**

Append to `web/app/globals.css`:

```css
.home-page,
.reading-page,
.empty-state {
  padding-top: 52px;
}

.home-hero {
  display: grid;
  gap: 18px;
  max-width: 860px;
  padding: 44px 0 28px;
}

.page-section {
  margin-top: 72px;
}

.section-heading {
  display: grid;
  gap: 8px;
  margin-bottom: 22px;
}

.chapter-grid,
.region-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.chapter-tile,
.region-tile,
.front-matter-rail,
.reading-section {
  padding: 16px;
}

.chapter-image {
  min-height: 190px;
  margin-bottom: 14px;
}

.chapter-tile h3,
.region-tile h3,
.front-matter-rail h2,
.reading-section h2 {
  margin: 0 0 8px;
  font-size: 1.45rem;
  line-height: 1.12;
}

.chapter-tile p,
.region-tile p {
  color: var(--muted);
  line-height: 1.5;
}

.chapter-tile span,
.region-tile span,
.text-link {
  color: var(--accent);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.9rem;
}

.reading-page {
  display: grid;
  gap: 24px;
  max-width: 880px;
}

.empty-state {
  display: grid;
  gap: 16px;
}

@media (max-width: 900px) {
  .chapter-grid,
  .region-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify build**

Run:

```bash
cd web
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add web/app/page.tsx web/app/about/page.tsx web/app/not-found.tsx web/app/globals.css
git commit -m "feat: add home and about pages"
```

## Task 9: Section, Region, And Ingredient Routes

**Files:**
- Create: `web/app/sections/[id]/page.tsx`
- Create: `web/app/regions/[id]/page.tsx`
- Create: `web/app/ingredients/[name]/page.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Create section route**

Create `web/app/sections/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeCard } from "@/components/RecipeCard";
import {
  getAllSections,
  getRecipesBySection,
  getSectionById,
  getStartHereRecipes
} from "@/lib/data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "@/lib/filters";
import { recipePath } from "@/lib/routes";
import Link from "next/link";

interface SectionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return getAllSections().map((section) => ({ id: section.id }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const section = getSectionById(id);

  return {
    title: section?.name ?? "Section"
  };
}

function toSearchParams(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  });

  return params;
}

export default async function SectionPage({ params, searchParams }: SectionPageProps) {
  const { id } = await params;
  const section = getSectionById(id);

  if (!section) {
    notFound();
  }

  const filters = parseRecipeFilters(toSearchParams(await searchParams));
  const recipes = getRecipesBySection(section.id);
  const filteredRecipes = applyRecipeFilters(recipes, filters);
  const options = getRecipeFilterOptions(recipes);
  const startHere = getStartHereRecipes(section.id);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Chapter</p>
      <h1 className="section-title">{section.name}</h1>
      <MarkdownBlock markdown={section.intro_markdown} />

      {startHere.length > 0 ? (
        <section className="start-here surface">
          <h2>Start with these recipes</h2>
          <div>
            {startHere.map((entry) => (
              <Link href={recipePath(entry.id)} key={entry.id}>
                <strong>{entry.recipeName}</strong>
                <span>{entry.rationale}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <form className="listing-layout">
        <div className="desktop-filters">
          <FilterSidebar options={options} filters={filters} />
        </div>
        <section>
          <FilterSideSheet options={options} filters={filters} />
          <ActiveFilters filters={filters} />
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
        </section>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create region route**

Create `web/app/regions/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllRegions, getRecipesByRegion, getRegionById } from "@/lib/data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "@/lib/filters";

interface RegionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return getAllRegions().map((region) => ({ id: region.id }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { id } = await params;
  const region = getRegionById(id);

  return {
    title: region?.name ?? "Region"
  };
}

function toSearchParams(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  });

  return params;
}

export default async function RegionPage({ params, searchParams }: RegionPageProps) {
  const { id } = await params;
  const region = getRegionById(id);

  if (!region) {
    notFound();
  }

  const filters = parseRecipeFilters(toSearchParams(await searchParams));
  const recipes = getRecipesByRegion(region.id);
  const filteredRecipes = applyRecipeFilters(recipes, filters);
  const options = getRecipeFilterOptions(recipes);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Region</p>
      <h1 className="section-title">{region.name}</h1>
      <div className="region-map surface" aria-label={`${region.name} map marker`}>
        <span>{region.map_coords.lat.toFixed(2)}</span>
        <span>{region.map_coords.lng.toFixed(2)}</span>
      </div>
      <MarkdownBlock markdown={region.intro_markdown} />

      <form className="listing-layout">
        <div className="desktop-filters">
          <FilterSidebar options={options} filters={filters} />
        </div>
        <section>
          <FilterSideSheet options={options} filters={filters} />
          <ActiveFilters filters={filters} />
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
        </section>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create ingredient route**

Create `web/app/ingredients/[name]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllIngredients, getIngredientBySlug, getRecipesByIds } from "@/lib/data";

interface IngredientPageProps {
  params: Promise<{ name: string }>;
}

export function generateStaticParams() {
  return getAllIngredients().map((ingredient) => ({ name: ingredient.slug }));
}

export async function generateMetadata({ params }: IngredientPageProps): Promise<Metadata> {
  const { name } = await params;
  const ingredient = getIngredientBySlug(name);

  return {
    title: ingredient?.display_name ?? "Ingredient"
  };
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  const { name } = await params;
  const ingredient = getIngredientBySlug(name);

  if (!ingredient) {
    notFound();
  }

  const recipes = getRecipesByIds(ingredient.recipe_ids);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Ingredient</p>
      <h1 className="section-title">{ingredient.display_name}</h1>
      <p className="lede">
        Used in {ingredient.count} {ingredient.count === 1 ? "recipe" : "recipes"}.
      </p>
      <div className="recipe-list">
        {recipes.map((recipe) => (
          <RecipeCard recipe={recipe} key={recipe.id} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add listing CSS**

Append to `web/app/globals.css`:

```css
.listing-page {
  display: grid;
  gap: 22px;
  padding-top: 52px;
}

.listing-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 22px;
  align-items: start;
}

.recipe-list {
  display: grid;
  gap: 14px;
}

.start-here {
  padding: 16px;
}

.start-here h2 {
  margin: 0 0 14px;
}

.start-here div {
  display: grid;
  gap: 10px;
}

.start-here a {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.start-here span {
  color: var(--muted);
  line-height: 1.45;
}

.region-map {
  display: flex;
  gap: 12px;
  align-items: center;
  width: fit-content;
  padding: 12px;
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

@media (max-width: 860px) {
  .listing-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Verify static route build**

Run:

```bash
cd web
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add web/app/sections web/app/regions web/app/ingredients web/app/globals.css
git commit -m "feat: add listing routes"
```

## Task 10: Recipe Detail Route

**Files:**
- Create: `web/components/RecipeDetail.tsx`
- Create: `web/app/recipes/[id]/page.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Create recipe detail component**

Create `web/components/RecipeDetail.tsx`:

```tsx
import Link from "next/link";
import { getRecipesByIds, getUsedInRecipes } from "@/lib/data";
import { formatIngredientLine } from "@/lib/format";
import { ingredientPath, recipePath } from "@/lib/routes";
import type { Recipe } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";

export function RecipeDetail({ recipe, sectionRecipes, regionRecipes }: { recipe: Recipe; sectionRecipes: Recipe[]; regionRecipes: Recipe[] }) {
  const usedInRecipes = getUsedInRecipes(recipe.id);
  const crossRefRecipes = getRecipesByIds(recipe.cross_refs.map((reference) => reference.id));
  const relatedSectionRecipes = sectionRecipes.filter((candidate) => candidate.id !== recipe.id).slice(0, 3);
  const relatedRegionRecipes = regionRecipes.filter((candidate) => candidate.id !== recipe.id).slice(0, 3);

  return (
    <div className="recipe-detail-grid">
      <nav className="recipe-jump-nav" aria-label="Recipe sections">
        <a href="#ingredients">Ingredients</a>
        <a href="#method">Method</a>
        <a href="#references">References</a>
      </nav>

      <section className="recipe-panel surface" id="ingredients">
        <h2>Ingredients</h2>
        <ul className="ingredient-list">
          {recipe.ingredients.map((ingredient) => (
            <li key={`${ingredient.item}:${ingredient.qty_metric}:${ingredient.qty_count}`}>
              {formatIngredientLine(ingredient)}
            </li>
          ))}
        </ul>
      </section>

      <section className="recipe-panel surface" id="method">
        <h2>Method</h2>
        <ol className="method-list">
          {recipe.instructions.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="recipe-panel surface" id="references">
        <h2>Cross-references</h2>
        {recipe.cross_refs.length > 0 ? (
          <div className="reference-list">
            {recipe.cross_refs.map((reference) => {
              const linkedRecipe = crossRefRecipes.find((candidate) => candidate.id === reference.id);

              return linkedRecipe ? (
                <Link href={recipePath(linkedRecipe.id)} key={reference.id}>
                  {reference.name}
                </Link>
              ) : (
                <Link href={ingredientPath(reference.id)} key={reference.id}>
                  {reference.name}
                </Link>
              );
            })}
          </div>
        ) : (
          <p>No cross-references listed for this recipe.</p>
        )}

        {usedInRecipes.length > 0 ? (
          <>
            <h3>Used in these dishes</h3>
            <div className="reference-list">
              {usedInRecipes.map((usedInRecipe) => (
                <Link href={recipePath(usedInRecipe.id)} key={usedInRecipe.id}>
                  {usedInRecipe.name}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {relatedRegionRecipes.length > 0 ? (
        <section className="related-rail">
          <h2>More from {recipe.origin_region_name}</h2>
          <div className="related-grid">
            {relatedRegionRecipes.map((related) => (
              <RecipeCard recipe={related} key={related.id} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedSectionRecipes.length > 0 ? (
        <section className="related-rail">
          <h2>More in {recipe.section_name}</h2>
          <div className="related-grid">
            {relatedSectionRecipes.map((related) => (
              <RecipeCard recipe={related} key={related.id} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Create recipe route**

Create `web/app/recipes/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";
import { RecipeImage } from "@/components/RecipeImage";
import { RecipeMeta } from "@/components/RecipeMeta";
import {
  getAllRecipes,
  getRecipeById,
  getRecipesByRegion,
  getRecipesBySection
} from "@/lib/data";
import { regionPath, sectionPath } from "@/lib/routes";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipeById(id);

  return {
    title: recipe?.name ?? "Recipe"
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return (
    <article className="page-shell recipe-page">
      <p className="eyebrow">
        <Link href={sectionPath(recipe.section_id)}>{recipe.section_name}</Link> /{" "}
        <Link href={regionPath(recipe.origin_region_id)}>{recipe.origin_region_name}</Link>
      </p>
      <h1 className="section-title">{recipe.name}</h1>
      <p className="lede">{recipe.subtitle}</p>
      <RecipeImage kind="recipe" id={recipe.id} label={recipe.name} className="recipe-hero-image" />
      <RecipeMeta recipe={recipe} />
      <RecipeDetail
        recipe={recipe}
        sectionRecipes={getRecipesBySection(recipe.section_id)}
        regionRecipes={getRecipesByRegion(recipe.origin_region_id)}
      />
    </article>
  );
}
```

- [ ] **Step 3: Add recipe detail CSS**

Append to `web/app/globals.css`:

```css
.recipe-page {
  display: grid;
  gap: 18px;
  padding-top: 52px;
}

.recipe-hero-image {
  min-height: clamp(220px, 34vw, 420px);
}

.recipe-detail-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.78fr) minmax(320px, 1.22fr);
  gap: 18px;
  align-items: start;
}

.recipe-jump-nav {
  position: sticky;
  top: 0;
  z-index: 2;
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(10px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.recipe-jump-nav a {
  padding: 7px 10px;
  border-radius: 999px;
  color: var(--muted);
}

.recipe-jump-nav a:hover {
  background: var(--accent-soft);
  color: var(--ink);
}

.recipe-panel {
  padding: 18px;
}

.recipe-panel h2,
.related-rail h2 {
  margin: 0 0 14px;
}

.ingredient-list,
.method-list {
  margin: 0;
  padding-left: 20px;
}

.ingredient-list li,
.method-list li {
  margin: 10px 0;
  line-height: 1.55;
}

.method-list li {
  padding-left: 6px;
}

.method-list p {
  margin: 0;
}

.reference-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reference-list a {
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--accent);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 0.88rem;
}

.related-rail {
  grid-column: 1 / -1;
  margin-top: 20px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 900px) {
  .recipe-detail-grid {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Verify route build**

Run:

```bash
cd web
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add web/components/RecipeDetail.tsx web/app/recipes web/app/globals.css
git commit -m "feat: add recipe detail pages"
```

## Task 11: Dedicated Search Page

**Files:**
- Create: `web/components/SearchPageClient.tsx`
- Create: `web/app/search/page.tsx`
- Modify: `web/app/globals.css`

- [ ] **Step 1: Create client search view**

Create `web/components/SearchPageClient.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchBox } from "./SearchBox";
import { searchCookbook } from "@/lib/search";

export function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchCookbook(query, 50), [query]);

  return (
    <div className="search-page-client">
      <label className="search-page-label" htmlFor="search-page-input">
        Search recipes, ingredients, regions
      </label>
      <input
        id="search-page-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search recipes, ingredients, regions"
      />
      <div className="search-page-results" aria-live="polite">
        {results.length > 0 ? (
          results.map((result) => (
            <Link className="search-result surface" href={result.href} key={`${result.kind}:${result.id}`}>
              <span className="eyebrow">{result.kind}</span>
              <strong>{result.title}</strong>
              <small>{result.subtitle}</small>
            </Link>
          ))
        ) : (
          <div className="empty-search surface">
            <p>No matches yet. Try a region, ingredient, or technique.</p>
            <SearchBox />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create search route**

Create `web/app/search/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/SearchPageClient";

export const metadata: Metadata = {
  title: "Search"
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  return (
    <div className="page-shell search-page">
      <p className="eyebrow">Index</p>
      <h1 className="section-title">Search the Cookbook</h1>
      <p className="lede">Find recipes, ingredients, chapters, regions, techniques, and cross-references.</p>
      <SearchPageClient initialQuery={q ?? ""} />
    </div>
  );
}
```

- [ ] **Step 3: Add search page CSS**

Append to `web/app/globals.css`:

```css
.search-page {
  display: grid;
  gap: 18px;
  padding-top: 52px;
}

.search-page-client {
  display: grid;
  gap: 14px;
}

.search-page-label {
  color: var(--muted);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.search-page-client input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
}

.search-page-results {
  display: grid;
  gap: 10px;
}

.search-result {
  display: grid;
  gap: 4px;
  padding: 14px;
}

.search-result small,
.empty-search p {
  color: var(--muted);
}

.empty-search {
  display: grid;
  gap: 12px;
  padding: 16px;
}
```

- [ ] **Step 4: Verify search page**

Run:

```bash
cd web
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add web/components/SearchPageClient.tsx web/app/search web/app/globals.css
git commit -m "feat: add dedicated search page"
```

## Task 12: Full Verification And Polish

**Files:**
- Modify: frontend files only if verification reveals a specific issue.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
cd web
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Start local dev server**

Run:

```bash
cd web
npm run dev
```

Expected: Next.js reports a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Browser-check key routes on laptop viewport**

Open these routes in the in-app browser:

```text
http://localhost:3000/
http://localhost:3000/sections/snacks-and-appetizers
http://localhost:3000/regions/awadh
http://localhost:3000/recipes/nargisi-seekh-kebab
http://localhost:3000/ingredients/paneer
http://localhost:3000/about
http://localhost:3000/search?q=paneer
```

Expected:

- Home is chapters-first and search is visible.
- Section page shows intro, start-here rail, filters, and recipes.
- Region page shows intro, coordinate visual, filters, and recipes.
- Recipe image scrolls away normally; time, heat, serves, ingredients, and method are reachable without awkward spacing.
- Ingredient page lists recipes using that ingredient.
- About page renders all front matter.
- Search page returns paneer-related results.

- [ ] **Step 4: Browser-check mobile viewport**

Use a mobile viewport around `390x844` and check:

```text
http://localhost:3000/
http://localhost:3000/sections/snacks-and-appetizers
http://localhost:3000/recipes/nargisi-seekh-kebab
http://localhost:3000/search?q=pakora
```

Expected:

- Navigation does not overlap.
- Search input fits its container.
- Recipe cards stack cleanly.
- Filter button opens a side sheet.
- Recipe page is a practical single-column reading stack.

- [ ] **Step 5: Check light and dark themes**

In the browser:

1. Load `/`.
2. Click the theme toggle.
3. Load `/recipes/nargisi-seekh-kebab`.
4. Click the theme toggle again.

Expected:

- Theme changes without unreadable contrast.
- Food images are not glaring in dark mode.
- Theme choice persists after navigation.

- [ ] **Step 6: Stop dev server**

Stop the dev server with `Ctrl+C`.

Expected: no long-running dev server remains.

- [ ] **Step 7: Commit verification fixes**

If Step 1 through Step 5 required code changes, run:

```bash
git add web
git commit -m "fix: polish frontend verification issues"
```

If no code changes were required, skip this commit.

## Plan Self-Review

Spec coverage:

- Chapters-first home page: Task 8.
- Quiet literary visual system: Task 5 and Task 8 CSS.
- Curated frontend-owned images: Task 4 and Task 6.
- Light and dark mode: Task 5 and Task 12.
- Compact recipe pages with scroll-away image band: Task 10 and Task 12.
- Instant search plus dedicated search page: Task 3, Task 6, and Task 11.
- Desktop sidebar plus mobile side sheet filters: Task 7 and Task 9.
- Blended copy voice: Task 8, Task 10, and Task 11.
- Static routes and data wiring: Task 2, Task 9, Task 10, and Task 11.
- About/front matter route: Task 8.
- Ingredient route: Task 9.
- Verification on mobile, laptop, and both themes: Task 12.

Completeness scan:

- The plan contains no unfinished markers, deferred implementation notes, or unnamed files.
- Every code-changing task names the exact files and concrete commands.

Type consistency:

- `Recipe`, `Section`, `Region`, `IngredientRecord`, and filter/search type names are defined before use.
- Route helpers are defined in Task 2 before components and pages import them.
- `RecipeFilters` and `RecipeFilterOptions` are defined in Task 3 before filter UI imports them.
