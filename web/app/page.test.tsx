import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getFrontMatter } from "@/lib/data";
import AboutPage from "./about/page";
import NotFound from "./not-found";
import Home from "./page";

describe("Home", () => {
  it("leaves the main landmark to the root layout", () => {
    render(<Home />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("presents search, front matter, and top-level browse links", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "India Cookbook" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search recipes, ingredients, regions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cook with what you have" })).toHaveAttribute("href", "/cook-with");
    expect(screen.getByRole("link", { name: "Browse chapters" })).toHaveAttribute("href", "/chapters");
    expect(screen.getByRole("link", { name: "Browse regions" })).toHaveAttribute("href", "/regions");
    expect(screen.getByRole("link", { name: "Read the front matter" })).toHaveAttribute("href", "/about");
    expect(screen.queryByRole("region", { name: "The Chapters" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Browse by Region" })).not.toBeInTheDocument();
  });
});

describe("AboutPage", () => {
  it("renders the front matter sections without adding a main landmark", () => {
    render(<AboutPage />);

    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "About the Cookbook" })).toBeInTheDocument();

    const frontMatter = getFrontMatter();

    for (const section of [frontMatter.introduction, frontMatter.history, frontMatter.notes_on_recipes]) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
    }

    expect(screen.queryByRole("heading", { level: 2, name: frontMatter.ayurveda.title })).not.toBeInTheDocument();
    expect(screen.queryByText(frontMatter.regions_overview.markdown)).not.toBeInTheDocument();
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
