import { describe, expect, it } from "vitest";
import { getIngredientMatcher } from "./data";
import {
  rankCookWithRecipes,
  searchIngredientChipOptions,
  type CookWithRecipeMatch,
  type CookWithSelection
} from "./cook-with";
import type { IngredientMatcher, Recipe } from "./types";

type RecipeFixtureOverrides = Omit<Partial<Recipe>, "id" | "ingredients"> & {
  id: string;
  ingredients: string[];
};

function recipeFixture(overrides: RecipeFixtureOverrides): Recipe {
  const { id, ingredients, ...rest } = overrides;

  return {
    id,
    name: rest.name ?? id,
    subtitle: "",
    section_id: rest.section_id ?? "main-dishes",
    section_name: rest.section_name ?? "Main Dishes",
    origin_region_id: "region",
    origin_region_name: "Region",
    prep_minutes: 0,
    prep_notes: null,
    cook_minutes: 0,
    cook_notes: null,
    serves: 4,
    heat_level: 1,
    dietary_tags: [],
    technique_tags: [],
    occasion_tags: [],
    ingredients: ingredients.map((item) => ({
      qty_metric: null,
      qty_imperial: null,
      qty_count: null,
      item,
      notes: null
    })),
    instructions: [],
    cross_refs: [],
    source_page: 1,
    image: null,
    ...rest
  };
}

const matcherFixture: IngredientMatcher = {
  schema_version: 1,
  chips: [
    {
      id: "seafood",
      label: "Seafood",
      kind: "family",
      family_id: null,
      ingredient_slugs: [],
      aliases: ["seafood"],
      include_in_missing: false
    },
    {
      id: "fish",
      label: "Fish",
      kind: "ingredient",
      family_id: "seafood",
      ingredient_slugs: ["fish", "fish-fillets", "firm-white-fish-fillets"],
      aliases: ["machhli"],
      include_in_missing: true
    },
    {
      id: "prawns",
      label: "Prawns/Shrimp",
      kind: "ingredient",
      family_id: "seafood",
      ingredient_slugs: ["prawns", "king-prawns"],
      aliases: ["shrimp"],
      include_in_missing: true
    },
    {
      id: "paneer",
      label: "Paneer",
      kind: "ingredient",
      family_id: null,
      ingredient_slugs: ["paneer"],
      aliases: ["panir"],
      include_in_missing: true
    },
    {
      id: "potato",
      label: "Potato",
      kind: "ingredient",
      family_id: null,
      ingredient_slugs: ["potato"],
      aliases: ["aloo"],
      include_in_missing: true
    },
    {
      id: "spinach",
      label: "Spinach",
      kind: "ingredient",
      family_id: "greens",
      ingredient_slugs: ["spinach"],
      aliases: ["palak"],
      include_in_missing: true
    },
    {
      id: "tomato",
      label: "Tomato",
      kind: "ingredient",
      family_id: null,
      ingredient_slugs: ["tomato"],
      aliases: ["tamatar"],
      include_in_missing: true
    },
    {
      id: "garlic",
      label: "Garlic",
      kind: "ingredient",
      family_id: null,
      ingredient_slugs: ["garlic"],
      aliases: [],
      include_in_missing: true
    }
  ],
  families: [
    {
      id: "seafood",
      label: "Seafood",
      chip_ids: ["fish", "prawns"],
      aliases: ["seafood"]
    }
  ],
  excluded_ingredient_slugs: ["garlic", "salt", "cumin-seeds"]
};

function ids(matches: CookWithRecipeMatch[]) {
  return matches.map((match) => match.recipe.id);
}

function selected(chipIds: string[], sectionId?: string): CookWithSelection {
  return { selectedChipIds: chipIds, sectionId };
}

describe("cook-with matcher", () => {
  it("searches curated chips by label and aliases", () => {
    const matcher = getIngredientMatcher();

    expect(searchIngredientChipOptions(matcher, "pot").map((chip) => chip.id)).toContain("potato");
    expect(searchIngredientChipOptions(matcher, "aloo").map((chip) => chip.id)).toContain("potato");
    expect(searchIngredientChipOptions(matcher, "machhli").map((chip) => chip.id)).toContain("fish");
    expect(searchIngredientChipOptions(matcher, "moon rocks").map((chip) => chip.id)).toEqual([]);
  });

  it("lets broad family chips match child ingredients", () => {
    const matches = rankCookWithRecipes(
      [recipeFixture({ id: "prawn-curry", ingredients: ["king prawns", "salt"] })],
      matcherFixture,
      selected(["seafood"])
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      exact: true,
      matched: [{ id: "seafood", label: "Seafood" }],
      missing: []
    });
  });

  it("keeps a specific chip from matching sibling ingredients", () => {
    const recipes = [recipeFixture({ id: "prawn-curry", ingredients: ["prawns"] })];

    expect(rankCookWithRecipes(recipes, matcherFixture, selected(["fish"]))).toEqual([]);
    expect(ids(rankCookWithRecipes(recipes, matcherFixture, selected(["seafood"])))).toEqual(["prawn-curry"]);
  });

  it("ranks exact matches before close matches", () => {
    const recipes = [
      recipeFixture({ id: "paneer-only", name: "Paneer Only", ingredients: ["Paneer"] }),
      recipeFixture({ id: "paneer-potato", name: "Paneer Potato", ingredients: ["Paneer", "potatoes"] })
    ];

    expect(ids(rankCookWithRecipes(recipes, matcherFixture, selected(["paneer", "potato"])))).toEqual([
      "paneer-potato",
      "paneer-only"
    ]);
  });

  it("uses the close-match threshold for three and four selected chips", () => {
    const oneMatch = recipeFixture({ id: "one-match", ingredients: ["Paneer"] });
    const twoMatches = recipeFixture({ id: "two-matches", ingredients: ["Paneer", "tomatoes"] });

    expect(ids(rankCookWithRecipes([oneMatch], matcherFixture, selected(["paneer", "potato", "spinach"])))).toEqual([
      "one-match"
    ]);
    expect(ids(rankCookWithRecipes([oneMatch], matcherFixture, selected(["paneer", "potato", "spinach", "tomato"])))).toEqual([]);
    expect(ids(rankCookWithRecipes([twoMatches], matcherFixture, selected(["paneer", "potato", "spinach", "tomato"])))).toEqual([
      "two-matches"
    ]);
  });

  it("does not show excluded staple or aromatic slugs as missing ingredients", () => {
    const matches = rankCookWithRecipes(
      [recipeFixture({ id: "paneer-garlic", ingredients: ["Paneer", "garlic", "cumin seeds", "salt", "potatoes"] })],
      matcherFixture,
      selected(["paneer"])
    );

    expect(matches[0].missing.map((chip) => chip.label)).toEqual(["Potato"]);
  });

  it("narrows by chapter without changing ranking semantics", () => {
    const recipes = [
      recipeFixture({ id: "dessert-exact", section_id: "desserts", ingredients: ["Paneer", "potatoes"] }),
      recipeFixture({ id: "main-close", section_id: "main-dishes", ingredients: ["Paneer"] }),
      recipeFixture({ id: "main-exact", section_id: "main-dishes", ingredients: ["Paneer", "potatoes"] })
    ];

    expect(ids(rankCookWithRecipes(recipes, matcherFixture, selected(["paneer", "potato"], "main-dishes")))).toEqual([
      "main-exact",
      "main-close"
    ]);
  });
});
