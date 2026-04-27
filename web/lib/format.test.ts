import { describe, expect, it } from "vitest";
import { formatHeatLevel, formatIngredientLine, formatTagLabel, formatTotalTime } from "./format";
import type { IngredientLine } from "./types";

describe("format helpers", () => {
  it("formats total time", () => {
    expect(formatTotalTime(30, 15)).toBe("45 min");
    expect(formatTotalTime(70, 15)).toBe("1 hr 25 min");
  });

  it("formats heat levels", () => {
    expect(formatHeatLevel(1)).toBe("Mild");
    expect(formatHeatLevel(2)).toBe("Medium");
    expect(formatHeatLevel(3)).toBe("Hot");
  });

  it("formats ingredient lines", () => {
    const ingredient: IngredientLine = {
      qty_metric: "300g",
      qty_imperial: "11oz",
      qty_count: "3 medium",
      item: "potatoes",
      notes: "unpeeled"
    };

    expect(formatIngredientLine(ingredient)).toBe("300g / 11oz / 3 medium potatoes, unpeeled");
  });

  it("formats tag labels", () => {
    expect(formatTagLabel("vegan-possible")).toBe("Vegan Possible");
  });
});
