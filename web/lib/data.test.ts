import { describe, expect, it } from "vitest";
import {
  getAllIngredients,
  getAllRecipes,
  getAllSections,
  getIngredientBySlug,
  getRecipeById,
  getRecipesByIds,
  getRecipesByRegion,
  getRecipesBySection,
  getSectionById,
  getStartHereRecipes,
  getUsedInRecipes
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
});
