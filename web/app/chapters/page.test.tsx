import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAllRecipeSections } from "@/lib/data";
import { sectionPath } from "@/lib/routes";
import ChaptersPage from "./page";

describe("ChaptersPage", () => {
  it("renders recipe chapters as a separate top-level landing page", () => {
    render(<ChaptersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Chapters" })).toBeInTheDocument();

    const chapters = within(screen.getByRole("region", { name: "Cookbook chapters" }));

    for (const section of getAllRecipeSections()) {
      const tile = chapters.getByRole("link", { name: section.name });

      expect(tile).toHaveAttribute("href", sectionPath(section.id));
      expect(within(tile).getByRole("img", { name: new RegExp(section.name, "i") }).tagName).toBe("IMG");
    }

    expect(chapters.queryByRole("link", { name: /Introduction/i })).not.toBeInTheDocument();
    expect(chapters.queryByRole("link", { name: /Glossary/i })).not.toBeInTheDocument();
    expect(chapters.queryByRole("link", { name: /Directory/i })).not.toBeInTheDocument();
    expect(chapters.queryByRole("link", { name: /Index/i })).not.toBeInTheDocument();
  });
});
