import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterSidebar } from "./FilterSidebar";
import type { RecipeFilterOptions } from "@/lib/filters";

const options: RecipeFilterOptions = {
  regions: [{ id: "awadh", name: "Awadh" }],
  dietary: ["vegetarian"],
  techniques: ["grill"]
};

describe("FilterSidebar", () => {
  it("serializes all supported active filters in a GET form", () => {
    const { container } = render(
      <form>
        <FilterSidebar
          options={options}
          filters={{
            region: "awadh",
            dietary: ["vegetarian"],
            technique: ["grill"],
            maxTotalMinutes: 45,
            heatLevel: 1
          }}
        />
      </form>
    );
    const form = container.querySelector("form");

    if (!form) {
      throw new Error("Expected form fixture");
    }

    const data = new FormData(form);

    expect(data.get("region")).toBe("awadh");
    expect(data.getAll("dietary")).toEqual(["vegetarian"]);
    expect(data.getAll("technique")).toEqual(["grill"]);
    expect(data.get("maxTime")).toBe("45");
    expect(data.get("heat")).toBe("1");
    expect(screen.getByLabelText("Maximum total minutes")).toBeInTheDocument();
    expect(screen.getByLabelText("Mild")).toBeInTheDocument();
  });
});
