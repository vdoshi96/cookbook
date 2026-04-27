import { describe, expect, it } from "vitest";
import {
  getAllIngredients,
  getAllRecipes,
  getAllSections,
  getFrontMatter,
  getIngredientBySlug,
  getRecipeById,
  getRecipesByIds,
  getRecipesByRegion,
  getRecipesBySection,
  getSectionById,
  getStartHereRecipes,
  getUsedInRecipes,
  validateCookbookDataForTest
} from "./data";

describe("cookbook data helpers", () => {
  it("loads the stub recipe corpus", () => {
    expect(getAllRecipes().map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("finds a recipe by id", () => {
    expect(getRecipeById("pakoras")?.name).toBe("Pakoras");
    expect(getRecipeById("missing")).toBeNull();
  });

  it("returns section recipes in section order", () => {
    expect(getRecipesBySection("snacks-and-appetizers").map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "pakoras",
      "khumb-shabnam"
    ]);
  });

  it("returns region recipes in region order", () => {
    expect(getRecipesByRegion("awadh").map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "khumb-shabnam"
    ]);
  });

  it("resolves start-here recipe records with rationale", () => {
    expect(getStartHereRecipes("snacks-and-appetizers")).toEqual([
      {
        id: "pakoras",
        rationale: "The most universal Indian snack — chickpea-flour fritters that work with almost any vegetable.",
        recipeName: "Pakoras"
      },
      {
        id: "nargisi-seekh-kebab",
        rationale: "A showcase of Awadhi technique: a vegetarian take on a kebab, grilled on skewers.",
        recipeName: "Nargisi Seekh Kebab"
      }
    ]);
  });

  it("returns ingredient records by slug", () => {
    expect(getIngredientBySlug("paneer")?.display_name).toBe("Paneer");
    expect(getAllIngredients().map((ingredient) => ingredient.slug)).toContain("gram-flour");
  });

  it("resolves reverse graph edges to recipes", () => {
    expect(getUsedInRecipes("garam-masala").map((recipe) => recipe.id)).toEqual(["khumb-shabnam"]);
  });

  it("drops unknown ids when resolving id lists", () => {
    expect(getRecipesByIds(["pakoras", "missing"]).map((recipe) => recipe.id)).toEqual(["pakoras"]);
  });

  it("loads sections by id", () => {
    expect(getAllSections()).toHaveLength(3);
    expect(getSectionById("rice")?.name).toBe("Rice");
  });

  it("protects recipe helper state from caller mutations", () => {
    const recipes = getAllRecipes();
    recipes.pop();
    recipes[0].name = "Mutated";

    expect(getAllRecipes().map((recipe) => recipe.id)).toEqual([
      "nargisi-seekh-kebab",
      "pakoras",
      "khumb-shabnam"
    ]);
    expect(getRecipeById("nargisi-seekh-kebab")?.name).toBe("Nargisi Seekh Kebab");

    const recipe = getRecipeById("pakoras");
    expect(recipe).not.toBeNull();
    const originalIngredient = recipe!.ingredients[0].item;
    recipe!.ingredients[0].item = "Mutated";

    expect(getRecipeById("pakoras")?.ingredients[0].item).toBe(originalIngredient);
  });

  it("protects front matter helper state from caller mutations", () => {
    const frontMatter = getFrontMatter();
    frontMatter.introduction.title = "Mutated";
    frontMatter.regions_overview.map_image = "mutated.png";

    const freshFrontMatter = getFrontMatter();
    expect(freshFrontMatter.introduction.title).toBe("Introduction");
    expect(freshFrontMatter.regions_overview.map_image).toBeNull();
  });

  it("validates schema versions and core container shapes", () => {
    expect(() =>
      validateCookbookDataForTest({
        recipesFile: { schema_version: 2, recipes: [] },
        sectionsFile: { schema_version: 1, sections: [] },
        regionsFile: { schema_version: 1, regions: [] },
        ingredientsFile: { schema_version: 1, ingredients: {} },
        tagsFile: { schema_version: 1, tags: {} },
        graphFile: { schema_version: 1, edges: [], used_in: {} },
        frontMatterFile: {
          schema_version: 1,
          introduction: { title: "Introduction", markdown: "" },
          history: { title: "History", markdown: "" },
          ayurveda: { title: "Ayurveda", markdown: "" },
          regions_overview: { title: "Regions", markdown: "", map_image: null },
          notes_on_recipes: { title: "Notes", markdown: "" }
        }
      })
    ).toThrow("recipes schema_version must be 1");

    expect(() =>
      validateCookbookDataForTest({
        recipesFile: { schema_version: 1, recipes: [] },
        sectionsFile: { schema_version: 1, sections: [] },
        regionsFile: { schema_version: 1, regions: [] },
        ingredientsFile: { schema_version: 1, ingredients: [] },
        tagsFile: { schema_version: 1, tags: {} },
        graphFile: { schema_version: 1, edges: [], used_in: {} },
        frontMatterFile: {
          schema_version: 1,
          introduction: { title: "Introduction", markdown: "" },
          history: { title: "History", markdown: "" },
          ayurveda: { title: "Ayurveda", markdown: "" },
          regions_overview: { title: "Regions", markdown: "", map_image: null },
          notes_on_recipes: { title: "Notes", markdown: "" }
        }
      })
    ).toThrow("ingredients must be a record");
  });
});
