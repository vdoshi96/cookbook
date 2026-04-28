import { describe, expect, it } from "vitest";
import { getAllRecipes, getAllRegions, getAllSections, getRecipeById } from "./data";
import { getCuratedImage, resolveRecipeImage, resolveRegionImage, resolveSectionImage } from "./curated-images";
import type { Recipe } from "./types";

describe("curated image lookup", () => {
  it("returns a curated exact recipe image when one exists", () => {
    expect(getCuratedImage("recipe", "nargisi-seekh-kebab", "Nargisi Seekh Kebab")).toMatchObject({
      alt: expect.stringContaining("Nargisi"),
      sourceLabel: "Wikimedia Commons"
    });
  });

  it("uses direct image asset URLs instead of redirect pages", () => {
    const image = getCuratedImage("recipe", "nargisi-seekh-kebab", "Nargisi Seekh Kebab");

    expect(image.src).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
    expect(image.src).not.toContain("/wiki/Special:Redirect/");
  });

  it("resolves every real recipe to a non-empty web image without backend image paths", () => {
    for (const recipe of getAllRecipes()) {
      const image = resolveRecipeImage(recipe);

      expect(image.src, recipe.id).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(image.src, recipe.id).not.toMatch(/(^|\/)(data|images)\//);
      expect(image.alt, recipe.id).not.toHaveLength(0);
    }
  });

  it("resolves every real region to a non-empty web image", () => {
    for (const region of getAllRegions()) {
      const image = resolveRegionImage(region);

      expect(image.src, region.id).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(image.alt, region.id).not.toHaveLength(0);
    }
  });

  it("resolves every real section to a non-empty web image and keeps Guest Chefs absent", () => {
    const sections = getAllSections();

    expect(sections.map((section) => section.id)).not.toContain("guest-chefs");

    for (const section of sections) {
      const image = resolveSectionImage(section);

      expect(image.src, section.id).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
      expect(image.alt, section.id).not.toHaveLength(0);
    }
  });

  it("resolves recipe images by exact recipe, then region, then section, then generic fallback", () => {
    const exactRecipe = getRecipeById("nargisi-seekh-kebab");
    const regionFallbackRecipe = getRecipeById("mangupullu");

    expect(exactRecipe).not.toBeNull();
    expect(regionFallbackRecipe).not.toBeNull();

    expect(resolveRecipeImage(exactRecipe!).resolvedFrom).toBe("recipe");
    expect(resolveRecipeImage(regionFallbackRecipe!).resolvedFrom).toBe("region");

    const sectionFallbackRecipe: Pick<
      Recipe,
      "id" | "name" | "section_id" | "section_name" | "origin_region_id" | "origin_region_name"
    > = {
      id: "missing-recipe",
      name: "Missing Recipe",
      section_id: "snacks-and-appetizers",
      section_name: "Snacks and Appetizers",
      origin_region_id: "missing-region",
      origin_region_name: "Missing Region"
    };
    const genericFallbackRecipe = { ...sectionFallbackRecipe, section_id: "missing-section", section_name: "Missing Section" };

    expect(resolveRecipeImage(sectionFallbackRecipe).resolvedFrom).toBe("section");
    expect(resolveRecipeImage(genericFallbackRecipe).resolvedFrom).toBe("generic");
  });

  it("returns a fresh curated image object for each lookup", () => {
    const image = getCuratedImage("recipe", "nargisi-seekh-kebab", "Nargisi Seekh Kebab");

    image.alt = "Changed alt text";

    expect(getCuratedImage("recipe", "nargisi-seekh-kebab", "Nargisi Seekh Kebab")).toMatchObject({
      alt: expect.stringContaining("Nargisi"),
      sourceLabel: "Wikimedia Commons"
    });
    expect(getCuratedImage("recipe", "nargisi-seekh-kebab", "Nargisi Seekh Kebab")).not.toBe(image);
  });
});
