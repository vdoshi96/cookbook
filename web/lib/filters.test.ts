import { describe, expect, it } from "vitest";
import { getAllRecipes } from "./data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "./filters";

describe("recipe filters", () => {
  it("filters by region", () => {
    expect(applyRecipeFilters(getAllRecipes(), { region: "awadh" }).map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "khumb-shabnam"
    ]);
  });

  it("filters by max total time", () => {
    expect(applyRecipeFilters(getAllRecipes(), { maxTotalMinutes: 30 }).map((recipe) => recipe.id)).toEqual([
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("filters by dietary, technique, and heat", () => {
    expect(
      applyRecipeFilters(getAllRecipes(), {
        dietary: ["vegetarian"],
        technique: ["grill"],
        heatLevel: 1
      }).map((recipe) => recipe.id)
    ).toEqual(["nargisi-seekh-kebab"]);
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

    expect(options.regions).toEqual([{ id: "awadh", name: "Awadh" }, { id: "tamil-nadu", name: "Tamil Nadu" }]);
    expect(options.dietary).toEqual(["contains-egg", "vegan-possible", "vegetarian"]);
    expect(options.techniques).toEqual(["deep-fry", "grill", "no-cook", "stir-fry", "tandoor"]);
  });
});
