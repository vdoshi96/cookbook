import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRecipeById } from "@/lib/data";
import { RecipeCard } from "./RecipeCard";

describe("RecipeCard", () => {
  it("renders recipe title, region, total time, and a resolved image", () => {
    const recipe = getRecipeById("subz-seekh");

    if (!recipe) {
      throw new Error("Expected subz-seekh recipe");
    }

    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole("link", { name: /Subz Seekh/ })).toHaveAttribute("href", "/recipes/subz-seekh");
    expect(screen.getByText("Awadh")).toBeInTheDocument();
    expect(screen.getByText("1 hr 21 min")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Subz Seekh/i }).tagName).toBe("IMG");
  });
});
