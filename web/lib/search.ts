import Fuse from "fuse.js";
import { getAllIngredients, getAllRecipes, getAllRegions, getAllSections, getAllTags } from "./data";
import { ingredientPath, recipePath, regionPath, searchPath, sectionPath } from "./routes";
import type { Recipe } from "./types";

export type SearchKind = "recipe" | "ingredient" | "region" | "section" | "tag";

const SCORE_TIE_EPSILON = 0.02;

const KIND_TIE_BREAKER: Record<SearchKind, number> = {
  recipe: 0,
  ingredient: 1,
  region: 1,
  section: 1,
  tag: 1
};

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

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
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

  return [...recipeDocuments, ...ingredientDocuments, ...regionDocuments, ...sectionDocuments, ...tagDocuments];
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
    .search(normalizedQuery, { limit: limit * 3 })
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
    .slice(0, limit)
    .map((result) => result.item);
}
