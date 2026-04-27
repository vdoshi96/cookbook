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
