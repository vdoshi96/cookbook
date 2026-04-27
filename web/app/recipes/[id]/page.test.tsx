import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RecipePage", () => {
  it("renders recipe content, navigation, references, and related recipes", async () => {
    const pageModule = await import("./page");

    render(
      await pageModule.default({
        params: Promise.resolve({ id: "nargisi-seekh-kebab" })
      })
    );

    expect(screen.getByRole("heading", { level: 1, name: "Nargisi Seekh Kebab" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Snacks and Appetizers" })).toHaveAttribute(
      "href",
      "/sections/snacks-and-appetizers"
    );
    expect(screen.getByRole("link", { name: "Awadh" })).toHaveAttribute("href", "/regions/awadh");

    expect(screen.getByRole("link", { name: "Ingredients" })).toHaveAttribute("href", "#ingredients");
    expect(screen.getByRole("link", { name: "Method" })).toHaveAttribute("href", "#method");
    expect(screen.getByRole("link", { name: "References" })).toHaveAttribute("href", "#references");

    const ingredients = screen.getByRole("region", { name: "Ingredients" });
    expect(within(ingredients).getByText("300g / 11oz / 3 medium potatoes, unpeeled")).toBeInTheDocument();

    const method = screen.getByRole("region", { name: "Method" });
    expect(within(method).getByText(/Cook the potatoes in a pan of boiling water/)).toBeInTheDocument();

    const references = screen.getByRole("region", { name: "References" });
    expect(within(references).getByRole("link", { name: /Paneer/ })).toHaveAttribute("href", "/ingredients/paneer");
    expect(within(references).queryByRole("link", { name: /Garlic Paste/ })).not.toBeInTheDocument();
    expect(within(references).getByText("Garlic Paste")).toBeInTheDocument();
    expect(within(references).getByText("p. 57")).toBeInTheDocument();

    const regionRail = screen.getByRole("region", { name: "More from Awadh" });
    expect(within(regionRail).getByRole("link", { name: "Khumb Shabnam" })).toHaveAttribute(
      "href",
      "/recipes/khumb-shabnam"
    );
  });

  it("exposes static params and metadata for recipes", async () => {
    const pageModule = await import("./page");

    expect(pageModule.generateStaticParams()).toContainEqual({ id: "pakoras" });
    await expect(pageModule.generateMetadata({ params: Promise.resolve({ id: "pakoras" }) })).resolves.toEqual({
      title: "Pakoras"
    });
    await expect(pageModule.generateMetadata({ params: Promise.resolve({ id: "missing" }) })).resolves.toEqual({
      title: "Recipe"
    });
  });
});
