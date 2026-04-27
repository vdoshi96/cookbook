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

function cleanParam(value: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function cleanParamList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
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
  const maxTime = Number(cleanParam(params.get("maxTime")));
  const heat = Number(cleanParam(params.get("heat")));

  return {
    region: cleanParam(params.get("region")),
    dietary: cleanParamList(params.getAll("dietary")),
    technique: cleanParamList(params.getAll("technique")),
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
