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

type JsonRecord = Record<string, unknown>;

interface CookbookDataFiles {
  recipesFile: unknown;
  sectionsFile: unknown;
  regionsFile: unknown;
  ingredientsFile: unknown;
  tagsFile: unknown;
  graphFile: unknown;
  frontMatterFile: unknown;
}

interface ValidatedCookbookData {
  recipes: Recipe[];
  sections: Section[];
  regions: Region[];
  ingredients: Record<string, Omit<IngredientRecord, "slug">>;
  tags: Record<string, Omit<TagRecord, "slug">>;
  graph: {
    edges: GraphEdge[];
    used_in: Record<string, string[]>;
  };
  frontMatter: FrontMatter;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSchemaFile(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${label} data must be an object`);
  }

  if (value.schema_version !== 1) {
    throw new Error(`${label} schema_version must be 1`);
  }

  return value;
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
}

function assertRecord(value: unknown, label: string): asserts value is JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${label} must be a record`);
  }
}

function assertStringArrayRecord(value: unknown, label: string): asserts value is Record<string, string[]> {
  assertRecord(value, label);

  for (const [key, entries] of Object.entries(value)) {
    if (!Array.isArray(entries) || !entries.every((entry) => typeof entry === "string")) {
      throw new Error(`${label}.${key} must be an array of strings`);
    }
  }
}

function assertGraphEdges(value: unknown): asserts value is GraphEdge[] {
  assertArray(value, "graph edges");

  for (const edge of value) {
    if (!isRecord(edge) || typeof edge.from !== "string" || typeof edge.to !== "string" || edge.kind !== "uses") {
      throw new Error("graph edges must contain uses edges");
    }
  }
}

function assertFrontMatterSection(value: unknown, label: string): void {
  if (!isRecord(value) || typeof value.title !== "string" || typeof value.markdown !== "string") {
    throw new Error(`${label} must include title and markdown`);
  }
}

function assertRegionsOverviewSection(value: unknown): void {
  assertFrontMatterSection(value, "regions_overview");

  if (!isRecord(value) || (value.map_image !== null && typeof value.map_image !== "string")) {
    throw new Error("regions_overview map_image must be a string or null");
  }
}

function validateCookbookData(files: CookbookDataFiles): ValidatedCookbookData {
  const recipesContainer = assertSchemaFile(files.recipesFile, "recipes");
  const sectionsContainer = assertSchemaFile(files.sectionsFile, "sections");
  const regionsContainer = assertSchemaFile(files.regionsFile, "regions");
  const ingredientsContainer = assertSchemaFile(files.ingredientsFile, "ingredients");
  const tagsContainer = assertSchemaFile(files.tagsFile, "tags");
  const graphContainer = assertSchemaFile(files.graphFile, "graph");
  const frontMatterContainer = assertSchemaFile(files.frontMatterFile, "front matter");

  assertArray(recipesContainer.recipes, "recipes");
  assertArray(sectionsContainer.sections, "sections");
  assertArray(regionsContainer.regions, "regions");
  assertRecord(ingredientsContainer.ingredients, "ingredients");
  assertRecord(tagsContainer.tags, "tags");
  assertGraphEdges(graphContainer.edges);
  assertStringArrayRecord(graphContainer.used_in, "graph used_in");

  assertFrontMatterSection(frontMatterContainer.introduction, "introduction");
  assertFrontMatterSection(frontMatterContainer.history, "history");
  assertFrontMatterSection(frontMatterContainer.ayurveda, "ayurveda");
  assertRegionsOverviewSection(frontMatterContainer.regions_overview);
  assertFrontMatterSection(frontMatterContainer.notes_on_recipes, "notes_on_recipes");

  return {
    recipes: recipesContainer.recipes as Recipe[],
    sections: sectionsContainer.sections as Section[],
    regions: regionsContainer.regions as Region[],
    ingredients: ingredientsContainer.ingredients as Record<string, Omit<IngredientRecord, "slug">>,
    tags: tagsContainer.tags as Record<string, Omit<TagRecord, "slug">>,
    graph: {
      edges: graphContainer.edges,
      used_in: graphContainer.used_in
    },
    frontMatter: {
      introduction: frontMatterContainer.introduction,
      history: frontMatterContainer.history,
      ayurveda: frontMatterContainer.ayurveda,
      regions_overview: frontMatterContainer.regions_overview,
      notes_on_recipes: frontMatterContainer.notes_on_recipes
    } as FrontMatter
  };
}

export function validateCookbookDataForTest(files: CookbookDataFiles): ValidatedCookbookData {
  return validateCookbookData(files);
}

const data = validateCookbookData({
  recipesFile,
  sectionsFile,
  regionsFile,
  ingredientsFile,
  tagsFile,
  graphFile,
  frontMatterFile
});

const { recipes, sections, regions, ingredients, tags, graph, frontMatter } = data;

const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
const sectionById = new Map(sections.map((section) => [section.id, section]));
const regionById = new Map(regions.map((region) => [region.id, region]));

export function getAllRecipes(): Recipe[] {
  return clone(recipes);
}

export function getRecipeById(id: string): Recipe | null {
  const recipe = recipeById.get(id);
  return recipe ? clone(recipe) : null;
}

export function getRecipesByIds(ids: string[]): Recipe[] {
  return ids
    .map((id) => recipeById.get(id))
    .filter((recipe): recipe is Recipe => Boolean(recipe))
    .map((recipe) => clone(recipe));
}

export function getAllSections(): Section[] {
  return clone(sections);
}

export function getSectionById(id: string): Section | null {
  const section = sectionById.get(id);
  return section ? clone(section) : null;
}

export function getRecipesBySection(sectionId: string): Recipe[] {
  const section = sectionById.get(sectionId);
  return section ? getRecipesByIds(section.recipe_ids) : [];
}

export function getStartHereRecipes(sectionId: string): StartHereRecipe[] {
  const section = sectionById.get(sectionId);

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
  return clone(regions);
}

export function getRegionById(id: string): Region | null {
  const region = regionById.get(id);
  return region ? clone(region) : null;
}

export function getRecipesByRegion(regionId: string): Recipe[] {
  const region = regionById.get(regionId);
  return region ? getRecipesByIds(region.recipe_ids) : [];
}

export function getAllIngredients(): IngredientRecord[] {
  return Object.entries(ingredients).map(([slug, ingredient]) => clone({ slug, ...ingredient }));
}

export function getIngredientBySlug(slug: string): IngredientRecord | null {
  const ingredient = ingredients[slug];

  if (!ingredient) {
    return null;
  }

  return clone({ slug, ...ingredient });
}

export function getAllTags(): TagRecord[] {
  return Object.entries(tags).map(([slug, tag]) => clone({ slug, ...tag }));
}

export function getTagBySlug(slug: string): TagRecord | null {
  const tag = tags[slug];

  if (!tag) {
    return null;
  }

  return clone({ slug, ...tag });
}

export function getGraphEdges(): GraphEdge[] {
  return clone(graph.edges);
}

export function getUsedInRecipes(referenceId: string): Recipe[] {
  return getRecipesByIds(graph.used_in[referenceId] ?? []);
}

export function getFrontMatter(): FrontMatter {
  return clone(frontMatter);
}
