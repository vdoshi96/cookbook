import { describe, expect, it } from "vitest";
import { getAllRecipes } from "./data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "./filters";

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

  it("parses URL search params", () => {
    const filters = parseRecipeFilters(
      new URLSearchParams("region=awadh&dietary=vegetarian&technique=grill&maxTime=45&heat=1")
    );

    expect(filters).toEqual({
      region: "awadh",
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
      dietary: [],
      technique: ["grill"],
      maxTotalMinutes: undefined,
      heatLevel: undefined
    });
  });

  it("trims URL search param values", () => {
    expect(parseRecipeFilters(new URLSearchParams("dietary=%20vegetarian%20&region=%20awadh%20"))).toEqual({
      region: "awadh",
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
  });
});
