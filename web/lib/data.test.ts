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
  it("loads the real main-branch recipe corpus", () => {
    const recipes = getAllRecipes();

    expect(recipes).toHaveLength(619);
    expect(recipes.map((recipe) => recipe.id)).toContain("subz-seekh");
    expect(recipes.map((recipe) => recipe.id)).toContain("nargisi-seekh-kebab");
  });

  it("finds a recipe by id", () => {
    expect(getRecipeById("subz-seekh")?.name).toBe("Subz Seekh");
    expect(getRecipeById("missing")).toBeNull();
  });

  it("returns section recipes in section order", () => {
    expect(getRecipesBySection("snacks-and-appetizers").slice(0, 4).map((recipe) => recipe.id)).toEqual([
      "subz-seekh",
      "subz-ke-kakori",
      "jaipuri-subz-seekh",
      "lauki-ki-seekh"
    ]);
  });

  it("returns region recipes in region order", () => {
    const awadhRecipes = getRecipesByRegion("awadh");

    expect(awadhRecipes).toHaveLength(142);
    expect(awadhRecipes.slice(0, 3).map((recipe) => recipe.id)).toEqual([
      "garam-masala-ii",
      "dum-ka-masala",
      "dahi-ki-chutney"
    ]);
  });

  it("resolves start-here recipe records with rationale", () => {
    expect(getStartHereRecipes("snacks-and-appetizers").slice(0, 2)).toEqual([
      {
        id: "samosa",
        rationale: "Iconic crispy pastry-filled snack; foundational technique for fried appetizers.",
        recipeName: "Samosa"
      },
      {
        id: "paneer-tikka-kali-mirch",
        rationale: "Approachable grilled skewer; teaches tandoor/grill method with common paneer ingredient.",
        recipeName: "Paneer Tikka Kali Mirch"
      }
    ]);
  });

  it("returns ingredient records by slug", () => {
    expect(getIngredientBySlug("paneer")?.display_name).toBe("paneer");
    expect(getAllIngredients().map((ingredient) => ingredient.slug)).toContain("gram-flour");
  });

  it("resolves reverse graph edges to recipes", () => {
    expect(getUsedInRecipes("pappu-charu").map((recipe) => recipe.id)).toEqual(["pani-poori"]);
  });

  it("drops unknown ids when resolving id lists", () => {
    expect(getRecipesByIds(["subz-seekh", "missing"]).map((recipe) => recipe.id)).toEqual(["subz-seekh"]);
  });

  it("loads sections by id", () => {
    expect(getAllSections()).toHaveLength(9);
    expect(getAllSections().map((section) => section.id)).not.toContain("guest-chefs");
    expect(getAllSections().map((section) => section.id)).not.toContain("introduction");
    expect(getSectionById("rice")?.name).toBe("Rice");
  });

  it("protects recipe helper state from caller mutations", () => {
    const expectedIds = getAllRecipes().map((recipe) => recipe.id);
    const recipes = getAllRecipes();
    recipes.pop();
    recipes[0].name = "Mutated";

    expect(getAllRecipes().map((recipe) => recipe.id)).toEqual(expectedIds);
    expect(getRecipeById("subz-seekh")?.name).toBe("Subz Seekh");

    const recipe = getRecipeById("subz-seekh");
    expect(recipe).not.toBeNull();
    const originalIngredient = recipe!.ingredients[0].item;
    recipe!.ingredients[0].item = "Mutated";

    expect(getRecipeById("subz-seekh")?.ingredients[0].item).toBe(originalIngredient);
  });

  it("protects front matter helper state from caller mutations", () => {
    const frontMatter = getFrontMatter();
    const originalIntroductionTitle = frontMatter.introduction.title;
    frontMatter.introduction.title = "Mutated";
    frontMatter.regions_overview.map_image = "mutated.png";

    const freshFrontMatter = getFrontMatter();
    expect(freshFrontMatter.introduction.title).toBe(originalIntroductionTitle);
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
