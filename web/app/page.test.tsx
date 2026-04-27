import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAllRegions, getAllSections, getFrontMatter } from "@/lib/data";
import { regionPath, sectionPath } from "@/lib/routes";
import AboutPage from "./about/page";
import NotFound from "./not-found";
import Home from "./page";

describe("Home", () => {
  it("leaves the main landmark to the root layout", () => {
    render(<Home />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("presents chapters first with search, front matter, and regions", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "India Cookbook" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search recipes, ingredients, regions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "The Chapters" })).toBeInTheDocument();

    const chapters = within(screen.getByRole("region", { name: "The Chapters" }));

    for (const section of getAllSections()) {
      expect(chapters.getByRole("link", { name: new RegExp(section.name, "i") })).toHaveAttribute(
        "href",
        sectionPath(section.id)
      );
    }

    expect(screen.getByRole("link", { name: "Read the front matter" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("heading", { level: 2, name: "Browse by Region" })).toBeInTheDocument();

    const regions = within(screen.getByRole("region", { name: "Browse by Region" }));

    for (const region of getAllRegions()) {
      expect(regions.getByRole("link", { name: new RegExp(region.name, "i") })).toHaveAttribute(
        "href",
        regionPath(region.id)
      );
    }
  });
});

describe("AboutPage", () => {
  it("renders the front matter sections without adding a main landmark", () => {
    render(<AboutPage />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "About the Cookbook" })).toBeInTheDocument();

    const frontMatter = getFrontMatter();

    for (const section of [
      frontMatter.introduction,
      frontMatter.history,
      frontMatter.ayurveda,
      frontMatter.regions_overview,
      frontMatter.notes_on_recipes
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
    }
  });
});

describe("NotFound", () => {
  it("points readers back to cookbook search without adding a main landmark", () => {
    render(<NotFound />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "No matching page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search the cookbook" })).toHaveAttribute("href", "/search");
  });
});
