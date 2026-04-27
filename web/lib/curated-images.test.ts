import { describe, expect, it } from "vitest";
import { getCuratedImage } from "./curated-images";

describe("curated image lookup", () => {
  it("returns a curated recipe image when one exists", () => {
    expect(getCuratedImage("recipe", "pakoras", "Pakoras")).toMatchObject({
      alt: "A plate of pakoras.",
      sourceLabel: "Wikimedia Commons"
    });
  });

  it("returns fallback art metadata when no curated image exists", () => {
    expect(getCuratedImage("section", "rice", "Rice")).toEqual({
      id: "rice",
      kind: "section",
      src: null,
      alt: "Rice",
      sourceHref: null,
      sourceLabel: null
    });
  });
});
