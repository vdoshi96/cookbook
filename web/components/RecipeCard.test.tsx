import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRecipeById } from "@/lib/data";
import { RecipeCard } from "./RecipeCard";

describe("RecipeCard", () => {
  it("renders recipe title, region, and total time", () => {
    const recipe = getRecipeById("pakoras");

    if (!recipe) {
      throw new Error("Expected pakoras fixture");
    }

    render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole("link", { name: /Pakoras/ })).toHaveAttribute("href", "/recipes/pakoras");
    expect(screen.getByText("Tamil Nadu")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });
});
