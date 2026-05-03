import { describe, expect, it } from "vitest";
import { buildSearchDocuments, searchCookbook } from "./search";

describe("cookbook search", () => {
  it("builds documents for recipes, ingredients, regions, sections, and tags", () => {
    const documents = buildSearchDocuments();

    expect(documents.some((document) => document.kind === "recipe" && document.id === "subz-seekh")).toBe(true);
    expect(documents.some((document) => document.kind === "ingredient" && document.id === "paneer")).toBe(true);
    expect(documents.some((document) => document.kind === "region" && document.id === "awadh")).toBe(true);
    expect(documents.some((document) => document.kind === "section" && document.id === "snacks-and-appetizers")).toBe(true);
    expect(documents.some((document) => document.kind === "tag" && document.id === "tandoor")).toBe(true);
  });

  it("finds recipes by ingredient text", () => {
    const results = searchCookbook("paneer", 50);

    expect(results.some((result) => result.kind === "recipe" && result.id === "subz-seekh")).toBe(true);
  });

  it("finds regions and techniques", () => {
    expect(searchCookbook("awadh").some((result) => result.kind === "region" && result.id === "awadh")).toBe(true);
    expect(searchCookbook("tandoor").some((result) => result.kind === "tag" && result.id === "tandoor")).toBe(true);
  });

  it("ranks recipe identity matches above cross-reference-only matches for English translation queries", () => {
    const results = searchCookbook("tomato chutney", 10);

    expect(results[0]).toMatchObject({
      kind: "recipe",
      id: "nariyal-tamatar-ki-chutney"
    });
    expect(results.findIndex((result) => result.id === "nariyal-tamatar-ki-chutney")).toBeLessThan(
      results.findIndex((result) => result.id === "tandoori-bharwan-paneer")
    );
    expect(results.some((result) => result.id === "aloo-chutneywale")).toBe(false);
  });

  it("finds the same recipe from transliterated original-language dish terms", () => {
    expect(searchCookbook("tamatar chutney", 10)[0]).toMatchObject({
      kind: "recipe",
      id: "nariyal-tamatar-ki-chutney"
    });
  });

  it("keeps transliterated dish searches tolerant of close misspellings", () => {
    expect(searchCookbook("tmataar chutney", 10)[0]).toMatchObject({
      kind: "recipe",
      id: "nariyal-tamatar-ki-chutney"
    });
  });

  it("ranks exact region matches before recipe matches", () => {
    expect(searchCookbook("awadh")[0]).toMatchObject({
      kind: "region",
      id: "awadh"
    });
  });

  it("returns an empty array for blank search", () => {
    expect(searchCookbook("   ")).toEqual([]);
  });
});
