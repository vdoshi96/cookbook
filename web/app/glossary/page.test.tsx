import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GlossaryPage, { metadata } from "./page";

describe("GlossaryPage", () => {
  it("renders an alphabetical reference with English and regional columns", () => {
    render(<GlossaryPage />);

    expect(metadata).toMatchObject({ title: "Glossary" });
    expect(screen.getByRole("heading", { level: 1, name: "Glossary" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader", { name: "English" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("columnheader", { name: "Regional name" }).length).toBeGreaterThan(0);

    const cSection = screen.getByRole("region", { name: "C" });
    expect(within(cSection).getByRole("link", { name: "cumin seeds" })).toHaveAttribute("href", "/ingredients/cumin-seeds");
  });
});
