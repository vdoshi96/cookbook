import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IndexPage, { metadata } from "./page";

describe("IndexPage", () => {
  it("renders an ingredient index grouped alphabetically", () => {
    render(<IndexPage />);

    expect(metadata).toMatchObject({ title: "Index" });
    expect(screen.getByRole("heading", { level: 1, name: "Ingredient Index" })).toBeInTheDocument();

    const cSection = screen.getByRole("region", { name: "C" });
    expect(within(cSection).getByRole("link", { name: "cumin seeds" })).toHaveAttribute("href", "/ingredients/cumin-seeds");
  });
});
