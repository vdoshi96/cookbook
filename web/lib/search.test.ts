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
