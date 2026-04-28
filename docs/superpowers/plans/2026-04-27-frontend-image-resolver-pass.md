# Frontend Image Resolver Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/web` render against the real main-branch cookbook data with no blank image slots and with stale frontend audit issues fixed.

**Architecture:** Add a frontend-owned curated image manifest plus resolver helpers that prefer exact recipe images, then region fallback, then section fallback, then a generic web image. Components pass recipe context into the resolver instead of checking backend image fields, and listing/detail pages render region and section imagery through the same component.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library.

---

### Task 1: Real-Data Image Resolver

**Files:**
- Modify: `web/lib/curated-images.ts`
- Modify: `web/lib/curated-images.test.ts`
- Modify: `web/components/RecipeImage.tsx`

- [x] **Step 1: Write failing tests**
  - Assert every recipe, section, and region resolves to a non-empty image URL using real data helpers.
  - Assert recipe lookup prefers exact recipe, then region fallback, then section fallback, then generic fallback.
  - Assert URLs are direct remote image URLs and never backend scanned/PDF image paths.

- [x] **Step 2: Implement resolver**
  - Keep a maintainable manifest in `web/lib/curated-images.ts`.
  - Include curated web-sourced images for all 31 real regions and all real sections.
  - Include representative exact recipe web images for high-visibility dishes and rely on region/section fallbacks for long-tail recipes.

### Task 2: Wire Images Into UI

**Files:**
- Modify: `web/components/RecipeCard.tsx`
- Modify: `web/app/recipes/[id]/page.tsx`
- Modify: `web/app/page.tsx`
- Modify: `web/app/regions/[id]/page.tsx`
- Modify: `web/app/sections/[id]/page.tsx`
- Modify: `web/app/globals.css`

- [x] **Step 1: Write failing render tests**
  - Assert recipe cards/detail pages render `<img>` instead of text placeholders.
  - Assert home section and region cards render images.
  - Assert section and region detail pages render hero images.

- [x] **Step 2: Update components/pages**
  - Use resolver context on all recipe cards and recipe hero images.
  - Add region and section images to the relevant card/detail surfaces.

### Task 3: Audit Fixes

**Files:**
- Modify: `web/components/SearchFilters.tsx`
- Modify: `web/components/SearchPageClient.tsx`
- Modify: `web/app/about/page.tsx`
- Modify: `web/app/search/page.test.tsx`
- Modify: `web/app/about/page.test.tsx`
- Modify: `web/app/regions/[id]/page.test.tsx`
- Modify: `web/app/sections/[id]/page.test.tsx`

- [x] **Step 1: Write failing tests**
  - Clear filters resets client filter state while preserving the search query.
  - `source_page` and `page_range` values are not rendered as user-facing text.
  - About page does not render `front_matter.regions_overview.markdown`.
  - Region and section pages expose static params for the real data.

- [x] **Step 2: Fix behavior**
  - Replace the clear-filter link with a state reset control plus clean search URL.
  - Suppress unwanted regions overview from the about page.
  - Keep existing static param generation and cover it with tests.

### Task 4: Real-Data Test Refresh And Verification

**Files:**
- Modify stale tests under `web/lib`, `web/components`, and `web/app`.

- [x] **Step 1: Replace stub IDs**
  - Remove assertions against obsolete `pakoras` / `khumb-shabnam` fixture assumptions.
  - Use real data IDs such as `subz-seekh`, `awadh`, and current section IDs where relevant.

- [x] **Step 2: Run verification**
  - Run `npm install`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` from `web/`.
