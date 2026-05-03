import type { IngredientMatcher, IngredientMatcherChip, Recipe } from "./types";

export interface CookWithSelection {
  selectedChipIds: string[];
  sectionId?: string;
}

export interface CookWithRecipeMatch {
  recipe: Recipe;
  exact: boolean;
  matched: IngredientMatcherChip[];
  missing: IngredientMatcherChip[];
}

interface MatcherIndex {
  chipsById: Map<string, IngredientMatcherChip>;
  familyChildrenById: Map<string, IngredientMatcherChip[]>;
  excludedSlugs: Set<string>;
}

const MAX_TYPEAHEAD_OPTIONS = 8;

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value: string) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function singularizeToken(token: string) {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("oes") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("ves") && token.length > 4) {
    return `${token.slice(0, -3)}f`;
  }

  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function tokenVariants(tokens: string[]) {
  const singular = tokens.map(singularizeToken);

  return [tokens, singular];
}

function addNgrams(candidates: Set<string>, tokens: string[]) {
  const maxLength = Math.min(tokens.length, 6);

  for (let size = 1; size <= maxLength; size += 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      candidates.add(tokens.slice(start, start + size).join("-"));
    }
  }
}

function ingredientSlugCandidates(value: string) {
  const candidates = new Set<string>();
  const normalized = normalizeText(value);

  if (!normalized) {
    return candidates;
  }

  const parts = [normalized, ...normalized.split(/\b(?:or|and)\b|[,;/]/)].map((part) => part.trim()).filter(Boolean);

  for (const part of parts) {
    const tokens = part.split(/\s+/).filter(Boolean);

    for (const variant of tokenVariants(tokens)) {
      addNgrams(candidates, variant);
    }
  }

  const fullSlug = slugify(value);
  if (fullSlug) {
    candidates.add(fullSlug);
  }

  return candidates;
}

function recipeIngredientSlugs(recipe: Recipe) {
  const slugs = new Set<string>();

  recipe.ingredients.forEach((ingredient) => {
    ingredientSlugCandidates(ingredient.item).forEach((slug) => slugs.add(slug));
    if (ingredient.notes) {
      ingredientSlugCandidates(`${ingredient.item} ${ingredient.notes}`).forEach((slug) => slugs.add(slug));
    }
  });

  return slugs;
}

function indexMatcher(matcher: IngredientMatcher): MatcherIndex {
  const chipsById = new Map(matcher.chips.map((chip) => [chip.id, chip]));
  const familyChildrenById = new Map<string, IngredientMatcherChip[]>();

  matcher.families.forEach((family) => {
    familyChildrenById.set(
      family.id,
      family.chip_ids.map((chipId) => chipsById.get(chipId)).filter((chip): chip is IngredientMatcherChip => Boolean(chip))
    );
  });

  return {
    chipsById,
    familyChildrenById,
    excludedSlugs: new Set(matcher.excluded_ingredient_slugs)
  };
}

function chipSearchScore(chip: IngredientMatcherChip, query: string) {
  const label = normalizeText(chip.label);
  const aliases = chip.aliases.map(normalizeText);
  const searchable = [label, chip.id, ...aliases].filter(Boolean);

  if (label === query || aliases.includes(query)) {
    return 0;
  }

  if (label.startsWith(query)) {
    return 1;
  }

  if (aliases.some((alias) => alias.startsWith(query))) {
    return 2;
  }

  if (searchable.some((entry) => entry.includes(query))) {
    return 3;
  }

  return Number.POSITIVE_INFINITY;
}

function chipHasRecipeSlug(chip: IngredientMatcherChip, recipeSlugs: Set<string>, excludedSlugs: Set<string>) {
  if (chip.kind !== "ingredient") {
    return false;
  }

  return chip.ingredient_slugs.some((slug) => !excludedSlugs.has(slug) && recipeSlugs.has(slug));
}

function recipeSatisfiesChip(chip: IngredientMatcherChip, recipeSlugs: Set<string>, index: MatcherIndex) {
  if (chip.kind === "family") {
    return (index.familyChildrenById.get(chip.id) ?? []).some((child) => chipHasRecipeSlug(child, recipeSlugs, index.excludedSlugs));
  }

  return chipHasRecipeSlug(chip, recipeSlugs, index.excludedSlugs);
}

function coveredIngredientChipIds(selectedChips: IngredientMatcherChip[], index: MatcherIndex) {
  const covered = new Set<string>();

  selectedChips.forEach((chip) => {
    if (chip.kind === "family") {
      (index.familyChildrenById.get(chip.id) ?? []).forEach((child) => covered.add(child.id));
    } else {
      covered.add(chip.id);
    }
  });

  return covered;
}

function recipeMainChips(recipe: Recipe, matcher: IngredientMatcher, index: MatcherIndex) {
  const recipeSlugs = recipeIngredientSlugs(recipe);

  return matcher.chips.filter(
    (chip) => chip.kind === "ingredient" && chip.include_in_missing && chipHasRecipeSlug(chip, recipeSlugs, index.excludedSlugs)
  );
}

function selectedChipsForIds(matcher: IngredientMatcher, selectedChipIds: string[], index: MatcherIndex) {
  const seen = new Set<string>();
  const selected: IngredientMatcherChip[] = [];

  selectedChipIds.forEach((chipId) => {
    const chip = index.chipsById.get(chipId);

    if (chip && !seen.has(chip.id)) {
      selected.push(chip);
      seen.add(chip.id);
    }
  });

  return selected;
}

export function getIngredientChipById(matcher: IngredientMatcher, chipId: string) {
  return matcher.chips.find((chip) => chip.id === chipId) ?? null;
}

export function searchIngredientChipOptions(matcher: IngredientMatcher, query: string, selectedChipIds: string[] = []) {
  const normalizedQuery = normalizeText(query);
  const selected = new Set(selectedChipIds);

  if (!normalizedQuery) {
    return [];
  }

  return matcher.chips
    .map((chip, index) => ({ chip, index, score: chipSearchScore(chip, normalizedQuery) }))
    .filter((entry) => !selected.has(entry.chip.id) && Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score || a.chip.label.localeCompare(b.chip.label) || a.index - b.index)
    .slice(0, MAX_TYPEAHEAD_OPTIONS)
    .map((entry) => entry.chip);
}

export function minimumCloseMatches(selectedChipCount: number) {
  return Math.max(1, Math.floor(selectedChipCount / 2));
}

export function rankCookWithRecipes(
  recipes: Recipe[],
  matcher: IngredientMatcher,
  selection: CookWithSelection
): CookWithRecipeMatch[] {
  const index = indexMatcher(matcher);
  const selectedChips = selectedChipsForIds(matcher, selection.selectedChipIds, index);

  if (selectedChips.length === 0) {
    return [];
  }

  const minimumMatches = minimumCloseMatches(selectedChips.length);
  const results: CookWithRecipeMatch[] = [];

  recipes.forEach((recipe) => {
    if (selection.sectionId && recipe.section_id !== selection.sectionId) {
      return;
    }

    const recipeSlugs = recipeIngredientSlugs(recipe);
    const matched = selectedChips.filter((chip) => recipeSatisfiesChip(chip, recipeSlugs, index));
    const exact = matched.length === selectedChips.length;

    if (!exact && matched.length < minimumMatches) {
      return;
    }

    const coveredChipIds = coveredIngredientChipIds(selectedChips, index);
    const missing = recipeMainChips(recipe, matcher, index).filter((chip) => !coveredChipIds.has(chip.id));

    results.push({ recipe, exact, matched, missing });
  });

  return results.sort(
    (a, b) =>
      Number(b.exact) - Number(a.exact) ||
      b.matched.length - a.matched.length ||
      a.missing.length - b.missing.length ||
      a.recipe.name.localeCompare(b.recipe.name) ||
      a.recipe.id.localeCompare(b.recipe.id)
  );
}
