import Fuse from "fuse.js";
import { getAllIngredients, getAllRecipes, getAllRegions, getAllSections, getAllTags } from "./data";
import { ingredientPath, recipePath, regionPath, searchPath, sectionPath } from "./routes";
import type { Recipe } from "./types";

export type SearchKind = "recipe" | "ingredient" | "region" | "section" | "tag";

export interface SearchFilters {
  kinds?: SearchKind[];
  region?: string;
  section?: string;
  dietary?: string[];
  technique?: string[];
  occasion?: string[];
  maxTotalMinutes?: number;
  heatLevel?: number;
}

export interface SearchFilterOptions {
  kinds: Array<{ id: SearchKind; label: string }>;
  regions: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; name: string }>;
  dietary: string[];
  techniques: string[];
  occasions: string[];
  heatLevels: number[];
}

const SCORE_TIE_EPSILON = 0.02;

const KIND_TIE_BREAKER: Record<SearchKind, number> = {
  recipe: 0,
  ingredient: 1,
  region: 1,
  section: 1,
  tag: 1
};

const SEARCH_KIND_OPTIONS: SearchFilterOptions["kinds"] = [
  { id: "recipe", label: "Recipe" },
  { id: "ingredient", label: "Ingredient" },
  { id: "region", label: "Region" },
  { id: "section", label: "Section" },
  { id: "tag", label: "Tag" }
];

export interface SearchDocument {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  recipe?: {
    regionId: string;
    regionName: string;
    sectionId: string;
    sectionName: string;
    totalMinutes: number;
    heatLevel: number;
    dietaryTags: string[];
    techniqueTags: string[];
    occasionTags: string[];
  };
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

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function cleanParam(value: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function cleanParamList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function cleanSearchKinds(values: string[]) {
  const kinds = cleanParamList(values).filter((value): value is SearchKind =>
    SEARCH_KIND_OPTIONS.some((option) => option.id === value)
  );

  return kinds.length > 0 ? kinds : undefined;
}

function includesEvery(selected: string[] | undefined, values: string[]) {
  if (!selected || selected.length === 0) {
    return true;
  }

  return selected.every((value) => values.includes(value));
}

function hasRecipeSpecificFilters(filters: SearchFilters) {
  return Boolean(
    filters.region ||
      filters.section ||
      filters.maxTotalMinutes ||
      filters.heatLevel ||
      filters.dietary?.length ||
      filters.technique?.length ||
      filters.occasion?.length
  );
}

function isExactNavigationMatch(document: SearchDocument, query: string) {
  if (document.kind !== "region" && document.kind !== "section" && document.kind !== "tag") {
    return false;
  }

  const normalizedQuery = normalizeSearchValue(query);

  return normalizeSearchValue(document.title) === normalizedQuery || normalizeSearchValue(document.id) === normalizedQuery;
}

export function buildSearchDocuments(): SearchDocument[] {
  const recipeDocuments = getAllRecipes().map((recipe) => ({
    id: recipe.id,
    kind: "recipe" as const,
    title: recipe.name,
    subtitle: `${recipe.subtitle} · ${recipe.origin_region_name} · ${recipe.section_name}`,
    href: recipePath(recipe.id),
    keywords: recipeKeywords(recipe),
    recipe: {
      regionId: recipe.origin_region_id,
      regionName: recipe.origin_region_name,
      sectionId: recipe.section_id,
      sectionName: recipe.section_name,
      totalMinutes: recipe.prep_minutes + recipe.cook_minutes,
      heatLevel: recipe.heat_level,
      dietaryTags: recipe.dietary_tags,
      techniqueTags: recipe.technique_tags,
      occasionTags: recipe.occasion_tags
    }
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

  return [...recipeDocuments, ...ingredientDocuments, ...regionDocuments, ...sectionDocuments, ...tagDocuments];
}

export function parseSearchFilters(params: URLSearchParams): SearchFilters {
  const maxTime = Number(cleanParam(params.get("maxTime")));
  const heat = Number(cleanParam(params.get("heat")));

  return {
    kinds: cleanSearchKinds(params.getAll("kind")),
    region: cleanParam(params.get("region")),
    section: cleanParam(params.get("section")),
    dietary: cleanParamList(params.getAll("dietary")),
    technique: cleanParamList(params.getAll("technique")),
    occasion: cleanParamList(params.getAll("occasion")),
    maxTotalMinutes: Number.isFinite(maxTime) && maxTime > 0 ? maxTime : undefined,
    heatLevel: Number.isFinite(heat) && heat > 0 ? heat : undefined
  };
}

export function getSearchFilterOptions(): SearchFilterOptions {
  const recipes = getAllRecipes();
  const dietary = new Set<string>();
  const techniques = new Set<string>();
  const occasions = new Set<string>();
  const heatLevels = new Set<number>();

  recipes.forEach((recipe) => {
    recipe.dietary_tags.forEach((tag) => dietary.add(tag));
    recipe.technique_tags.forEach((tag) => techniques.add(tag));
    recipe.occasion_tags.forEach((tag) => occasions.add(tag));
    heatLevels.add(recipe.heat_level);
  });

  return {
    kinds: SEARCH_KIND_OPTIONS,
    regions: getAllRegions().map((region) => ({ id: region.id, name: region.name })),
    sections: getAllSections().map((section) => ({ id: section.id, name: section.name })),
    dietary: Array.from(dietary).sort(),
    techniques: Array.from(techniques).sort(),
    occasions: Array.from(occasions).sort(),
    heatLevels: Array.from(heatLevels).sort((a, b) => a - b)
  };
}

export function searchFiltersAreActive(filters: SearchFilters) {
  const kindFilterActive =
    filters.kinds !== undefined && filters.kinds.length > 0 && filters.kinds.length < SEARCH_KIND_OPTIONS.length;

  return kindFilterActive || hasRecipeSpecificFilters(filters);
}

export function applySearchFilters(documents: SearchDocument[], filters: SearchFilters): SearchDocument[] {
  const recipeSpecificFiltersActive = hasRecipeSpecificFilters(filters);

  return documents.filter((document) => {
    if (filters.kinds && filters.kinds.length > 0 && !filters.kinds.includes(document.kind)) {
      return false;
    }

    if (!recipeSpecificFiltersActive) {
      return true;
    }

    if (document.kind !== "recipe" || !document.recipe) {
      return false;
    }

    if (filters.region && document.recipe.regionId !== filters.region) {
      return false;
    }

    if (filters.section && document.recipe.sectionId !== filters.section) {
      return false;
    }

    if (filters.maxTotalMinutes && document.recipe.totalMinutes > filters.maxTotalMinutes) {
      return false;
    }

    if (filters.heatLevel && document.recipe.heatLevel !== filters.heatLevel) {
      return false;
    }

    if (!includesEvery(filters.dietary, document.recipe.dietaryTags)) {
      return false;
    }

    if (!includesEvery(filters.technique, document.recipe.techniqueTags)) {
      return false;
    }

    if (!includesEvery(filters.occasion, document.recipe.occasionTags)) {
      return false;
    }

    return true;
  });
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

export function searchCookbook(query: string, limit = 8, filters: SearchFilters = {}): SearchDocument[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const rankedDocuments = createSearchIndex()
    .search(normalizedQuery)
    .sort((a, b) => {
      const aExactNavigation = isExactNavigationMatch(a.item, normalizedQuery);
      const bExactNavigation = isExactNavigationMatch(b.item, normalizedQuery);

      if (aExactNavigation !== bExactNavigation) {
        return aExactNavigation ? -1 : 1;
      }

      const scoreDifference = (a.score ?? 0) - (b.score ?? 0);

      if (Math.abs(scoreDifference) > SCORE_TIE_EPSILON) {
        return scoreDifference;
      }

      const kindDifference = KIND_TIE_BREAKER[a.item.kind] - KIND_TIE_BREAKER[b.item.kind];

      if (kindDifference !== 0) {
        return kindDifference;
      }

      return a.item.title.localeCompare(b.item.title);
    })
    .map((result) => result.item);

  return applySearchFilters(rankedDocuments, filters).slice(0, limit);
}
