import Fuse from "fuse.js";
import { getAllIngredients, getAllRecipes, getAllRegions, getAllSections, getAllTags } from "./data";
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
      if (a.item.kind === "recipe" && b.item.kind !== "recipe") {
        return -1;
      }

      if (a.item.kind !== "recipe" && b.item.kind === "recipe") {
        return 1;
      }

      return (a.score ?? 0) - (b.score ?? 0);
    })
    .slice(0, limit)
    .map((result) => result.item);
}
