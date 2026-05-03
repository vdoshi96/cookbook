import { describe, expect, it } from "vitest";
import { getAllRecipes } from "./data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "./filters";
import type { IngredientRecord, Recipe } from "./types";

function recipeFixture(overrides: Partial<Recipe>): Recipe {
  return {
    id: "recipe",
    name: "Recipe",
    subtitle: "",
    section_id: "section",
    section_name: "Section",
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
    ingredients: [],
    instructions: [],
    cross_refs: [],
    source_page: 1,
    image: null,
    ...overrides
  };
}

describe("recipe filters", () => {
  it("filters by region", () => {
    const recipes = applyRecipeFilters(getAllRecipes(), { region: "awadh" });

    expect(recipes).toHaveLength(142);
    expect(recipes.every((recipe) => recipe.origin_region_id === "awadh")).toBe(true);
    expect(recipes.map((recipe) => recipe.id)).toContain("nargisi-seekh-kebab");
  });

  it("filters by max total time", () => {
    const recipes = applyRecipeFilters(getAllRecipes(), { maxTotalMinutes: 30 });

    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes.every((recipe) => recipe.prep_minutes + recipe.cook_minutes <= 30)).toBe(true);
    expect(recipes.map((recipe) => recipe.id)).toContain("mangupullu");
  });

  it("filters by dietary, technique, and heat", () => {
    const recipes = applyRecipeFilters(getAllRecipes(), {
      dietary: ["vegetarian"],
      technique: ["grill"],
      heatLevel: 1
    });

    expect(recipes.length).toBeGreaterThan(0);
    expect(
      recipes.every(
        (recipe) =>
          recipe.dietary_tags.includes("vegetarian") && recipe.technique_tags.includes("grill") && recipe.heat_level === 1
      )
    ).toBe(true);
  });

  it("filters by inferred main ingredient after skipping pantry lead-ins", () => {
    const recipes = [
      recipeFixture({
        id: "potato",
        ingredients: [
          { qty_metric: null, qty_imperial: null, qty_count: "2 tablespoons", item: "vegetable oil", notes: null },
          { qty_metric: null, qty_imperial: null, qty_count: "500g", item: "potatoes, peeled and cubed", notes: null }
        ]
      }),
      recipeFixture({
        id: "paneer",
        ingredients: [
          { qty_metric: null, qty_imperial: null, qty_count: "2 tablespoons", item: "ghee", notes: null },
          { qty_metric: null, qty_imperial: null, qty_count: "250g", item: "Paneer", notes: null }
        ]
      })
    ];

    expect(applyRecipeFilters(recipes, { mainIngredient: "potatoes" }).map((recipe) => recipe.id)).toEqual(["potato"]);
  });

  it("filters by included and excluded normalized ingredients", () => {
    const recipes = [
      recipeFixture({
        id: "potato",
        ingredients: [{ qty_metric: null, qty_imperial: null, qty_count: "500g", item: "potatoes", notes: null }]
      }),
      recipeFixture({
        id: "paneer",
        ingredients: [{ qty_metric: null, qty_imperial: null, qty_count: "250g", item: "Paneer", notes: null }]
      }),
      recipeFixture({
        id: "combo",
        ingredients: [
          { qty_metric: null, qty_imperial: null, qty_count: "250g", item: "Paneer", notes: null },
          { qty_metric: null, qty_imperial: null, qty_count: "250g", item: "potatoes", notes: null }
        ]
      })
    ];
    const ingredientSlugsByRecipeId = {
      potato: ["potato"],
      paneer: ["paneer"],
      combo: ["paneer", "potato"]
    };

    expect(applyRecipeFilters(recipes, { ingredients: ["paneer"] }, { ingredientSlugsByRecipeId }).map((recipe) => recipe.id)).toEqual([
      "paneer",
      "combo"
    ]);
    expect(
      applyRecipeFilters(recipes, { ingredients: ["paneer"], excludedIngredients: ["potato"] }, { ingredientSlugsByRecipeId }).map(
        (recipe) => recipe.id
      )
    ).toEqual(["paneer"]);
  });

  it("parses URL search params", () => {
    const filters = parseRecipeFilters(
      new URLSearchParams(
        "region=awadh&dietary=vegetarian&technique=grill&maxTime=45&heat=1&mainIngredient=paneer&ingredient=potato&excludeIngredient=garlic"
      )
    );

    expect(filters).toEqual({
      region: "awadh",
      mainIngredient: "paneer",
      ingredients: ["potato"],
      excludedIngredients: ["garlic"],
      dietary: ["vegetarian"],
      technique: ["grill"],
      maxTotalMinutes: 45,
      heatLevel: 1
    });
  });

  it("ignores blank and invalid URL search params", () => {
    expect(
      parseRecipeFilters(new URLSearchParams("region=&dietary=&technique=&technique=grill&maxTime=abc&heat=abc"))
    ).toEqual({
      region: undefined,
      mainIngredient: undefined,
      ingredients: [],
      excludedIngredients: [],
      dietary: [],
      technique: ["grill"],
      maxTotalMinutes: undefined,
      heatLevel: undefined
    });
  });

  it("trims URL search param values", () => {
    expect(parseRecipeFilters(new URLSearchParams("dietary=%20vegetarian%20&region=%20awadh%20"))).toEqual({
      region: "awadh",
      mainIngredient: undefined,
      ingredients: [],
      excludedIngredients: [],
      dietary: ["vegetarian"],
      technique: [],
      maxTotalMinutes: undefined,
      heatLevel: undefined
    });
  });

  it("builds unique filter options", () => {
    const options = getRecipeFilterOptions(getAllRecipes());

    expect(options.regions).toContainEqual({ id: "awadh", name: "Awadh" });
    expect(options.regions).toContainEqual({ id: "tamil-nadu", name: "Tamil Nadu" });
    expect(options.dietary).toEqual(["contains-egg", "non-veg", "vegan-possible", "vegetarian"]);
    expect(options.techniques).toEqual([...options.techniques].sort());
    expect(options.techniques).toEqual(expect.arrayContaining(["deep-fry", "grill", "stir-fry", "tandoor"]));
    expect(options.mainIngredients).toContainEqual({ id: "paneer", name: "Paneer" });
    expect(options.mainIngredients).toContainEqual({ id: "potatoes", name: "potatoes" });
  });

  it("builds main and normalized ingredient options for a recipe set", () => {
    const potatoRecipe = recipeFixture({
      id: "potato",
      ingredients: [
        { qty_metric: null, qty_imperial: null, qty_count: "2 tablespoons", item: "vegetable oil", notes: null },
        { qty_metric: null, qty_imperial: null, qty_count: "500g", item: "potatoes, peeled and cubed", notes: null }
      ]
    });
    const paneerRecipe = recipeFixture({
      id: "paneer",
      ingredients: [
        { qty_metric: null, qty_imperial: null, qty_count: "1 tablespoon", item: "ghee", notes: null },
        { qty_metric: null, qty_imperial: null, qty_count: "250g", item: "Paneer", notes: null }
      ]
    });
    const ingredients: IngredientRecord[] = [
      { slug: "potato", display_name: "potatoes", recipe_ids: ["potato"], count: 1 },
      { slug: "paneer", display_name: "Paneer", recipe_ids: ["paneer"], count: 1 },
      { slug: "cumin-seeds", display_name: "cumin seeds", recipe_ids: ["elsewhere"], count: 1 }
    ];
    const options = getRecipeFilterOptions([potatoRecipe, paneerRecipe], ingredients);

    expect(options.mainIngredients).toEqual([
      { id: "paneer", name: "Paneer" },
      { id: "potatoes", name: "potatoes" }
    ]);
    expect(options.ingredients).toEqual([
      { id: "paneer", name: "Paneer" },
      { id: "potato", name: "potatoes" }
    ]);
  });
});
