import type { IngredientRecord, Recipe } from "./types";

export interface RecipeFilters {
  region?: string;
  mainIngredient?: string;
  ingredients?: string[];
  excludedIngredients?: string[];
  dietary?: string[];
  technique?: string[];
  maxTotalMinutes?: number;
  heatLevel?: number;
}

export interface RecipeFilterOptions {
  regions: Array<{ id: string; name: string }>;
  mainIngredients: Array<{ id: string; name: string }>;
  ingredients: Array<{ id: string; name: string }>;
  dietary: string[];
  techniques: string[];
}

export interface RecipeFilterContext {
  ingredientSlugsByRecipeId?: Record<string, string[]>;
}

const PANTRY_MAIN_INGREDIENTS = new Set([
  "asafoetida",
  "bay-leaves",
  "black-cardamom-pods",
  "black-peppercorns",
  "chilli-powder",
  "chillies",
  "cinnamon",
  "cloves",
  "coriander-seeds",
  "cumin-seeds",
  "garlic",
  "ghee",
  "ghee-or-vegetable-oil",
  "ginger",
  "green-cardamom-pods",
  "green-chillies",
  "ground-coriander",
  "ground-cumin",
  "ground-turmeric",
  "groundnut-peanut-oil",
  "mustard-oil",
  "oil",
  "red-chilli-powder",
  "salt",
  "sesame-oil",
  "sugar",
  "turmeric",
  "vegetable-oil",
  "vegetable-oil-or-ghee",
  "water"
]);

function includesEvery(selected: string[] | undefined, values: string[]) {
  if (!selected || selected.length === 0) {
    return true;
  }

  return selected.every((value) => values.includes(value));
}

function cleanParam(value: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function cleanParamList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeRecipeSearch(value: string) {
  return value.trim().toLowerCase();
}

function cleanMainIngredientName(value: string) {
  return value
    .trim()
    .replace(/^(skinless,\s*)?(boneless,\s*)?/i, "")
    .split(",")[0]
    .trim()
    .replace(/\s+/g, " ");
}

function slugifyMainIngredient(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMainIngredientOption(recipe: Recipe) {
  const ingredientOptions = recipe.ingredients
    .map((ingredient) => {
      const name = cleanMainIngredientName(ingredient.item);
      const id = slugifyMainIngredient(name);

      return id ? { id, name } : null;
    })
    .filter((ingredient): ingredient is { id: string; name: string } => Boolean(ingredient));

  return ingredientOptions.find((ingredient) => !PANTRY_MAIN_INGREDIENTS.has(ingredient.id)) ?? ingredientOptions[0] ?? null;
}

function getRawIngredientSlugs(recipe: Recipe) {
  return recipe.ingredients.map((ingredient) => slugifyMainIngredient(cleanMainIngredientName(ingredient.item))).filter(Boolean);
}

function getIngredientSlugsForRecipe(recipe: Recipe, context?: RecipeFilterContext) {
  return context?.ingredientSlugsByRecipeId?.[recipe.id] ?? getRawIngredientSlugs(recipe);
}

function hasEveryIngredient(recipe: Recipe, ingredients: string[] | undefined, context?: RecipeFilterContext) {
  if (!ingredients || ingredients.length === 0) {
    return true;
  }

  const recipeIngredientSlugs = getIngredientSlugsForRecipe(recipe, context);

  return ingredients.every((ingredient) => recipeIngredientSlugs.includes(ingredient));
}

function hasAnyIngredient(recipe: Recipe, ingredients: string[] | undefined, context?: RecipeFilterContext) {
  if (!ingredients || ingredients.length === 0) {
    return false;
  }

  const recipeIngredientSlugs = getIngredientSlugsForRecipe(recipe, context);

  return ingredients.some((ingredient) => recipeIngredientSlugs.includes(ingredient));
}

function recipeSearchText(recipe: Recipe) {
  return [
    recipe.name,
    recipe.subtitle,
    recipe.section_name,
    recipe.origin_region_name,
    ...recipe.ingredients.flatMap((ingredient) => [ingredient.item, ingredient.notes ?? ""]),
    ...recipe.dietary_tags,
    ...recipe.technique_tags,
    ...recipe.occasion_tags,
    ...recipe.cross_refs.map((reference) => reference.name)
  ]
    .join(" ")
    .toLowerCase();
}

export function getTotalMinutes(recipe: Recipe) {
  return recipe.prep_minutes + recipe.cook_minutes;
}

export function applyRecipeFilters(recipes: Recipe[], filters: RecipeFilters, context?: RecipeFilterContext): Recipe[] {
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

    if (filters.mainIngredient && getMainIngredientOption(recipe)?.id !== filters.mainIngredient) {
      return false;
    }

    if (!hasEveryIngredient(recipe, filters.ingredients, context)) {
      return false;
    }

    if (hasAnyIngredient(recipe, filters.excludedIngredients, context)) {
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

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const terms = normalizeRecipeSearch(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const searchableText = recipeSearchText(recipe);

    return terms.every((term) => searchableText.includes(term));
  });
}

export function parseRecipeFilters(params: URLSearchParams): RecipeFilters {
  const maxTime = Number(cleanParam(params.get("maxTime")));
  const heat = Number(cleanParam(params.get("heat")));

  return {
    region: cleanParam(params.get("region")),
    mainIngredient: cleanParam(params.get("mainIngredient")),
    ingredients: cleanParamList(params.getAll("ingredient")),
    excludedIngredients: cleanParamList(params.getAll("excludeIngredient")),
    dietary: cleanParamList(params.getAll("dietary")),
    technique: cleanParamList(params.getAll("technique")),
    maxTotalMinutes: Number.isFinite(maxTime) && maxTime > 0 ? maxTime : undefined,
    heatLevel: Number.isFinite(heat) && heat > 0 ? heat : undefined
  };
}

export function getRecipeIngredientSlugMap(recipes: Recipe[], ingredientRecords: IngredientRecord[]): Record<string, string[]> {
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const ingredientSlugsByRecipeId: Record<string, string[]> = Object.fromEntries(recipes.map((recipe) => [recipe.id, []]));

  ingredientRecords.forEach((ingredient) => {
    ingredient.recipe_ids.forEach((recipeId) => {
      if (recipeIds.has(recipeId)) {
        ingredientSlugsByRecipeId[recipeId]?.push(ingredient.slug);
      }
    });
  });

  return ingredientSlugsByRecipeId;
}

export function getRecipeFilterOptions(recipes: Recipe[], ingredientRecords: IngredientRecord[] = []): RecipeFilterOptions {
  const regionMap = new Map<string, string>();
  const mainIngredientMap = new Map<string, string>();
  const recipeIds = new Set(recipes.map((recipe) => recipe.id));
  const dietary = new Set<string>();
  const techniques = new Set<string>();

  recipes.forEach((recipe) => {
    const mainIngredient = getMainIngredientOption(recipe);

    regionMap.set(recipe.origin_region_id, recipe.origin_region_name);
    if (mainIngredient) {
      mainIngredientMap.set(mainIngredient.id, mainIngredient.name);
    }
    recipe.dietary_tags.forEach((tag) => dietary.add(tag));
    recipe.technique_tags.forEach((tag) => techniques.add(tag));
  });

  return {
    regions: Array.from(regionMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    mainIngredients: Array.from(mainIngredientMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    ingredients: ingredientRecords
      .filter((ingredient) => ingredient.recipe_ids.some((recipeId) => recipeIds.has(recipeId)))
      .map((ingredient) => ({ id: ingredient.slug, name: ingredient.display_name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    dietary: Array.from(dietary).sort(),
    techniques: Array.from(techniques).sort()
  };
}
