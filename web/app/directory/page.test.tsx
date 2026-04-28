import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DirectoryPage, { metadata } from "./page";

describe("DirectoryPage", () => {
  it("renders a recipe directory grouped alphabetically", () => {
    render(<DirectoryPage />);

    expect(metadata).toMatchObject({ title: "Directory" });
    expect(screen.getByRole("heading", { level: 1, name: "Recipe Directory" })).toBeInTheDocument();

    const gSection = screen.getByRole("region", { name: "G" });
    expect(within(gSection).getByRole("link", { name: "Garam Masala (I)" })).toHaveAttribute(
      "href",
      "/recipes/garam-masala-i"
    );
    expect(screen.queryByRole("form", { name: /recipe filters/i })).not.toBeInTheDocument();
  });
});
