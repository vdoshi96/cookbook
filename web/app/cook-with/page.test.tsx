import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CookWithPage, { metadata } from "./page";

describe("CookWithPage", () => {
  it("renders the empty invitation, no-match typeahead, and ranked recipe results", async () => {
    const user = userEvent.setup();

    expect(metadata).toMatchObject({ title: "Cook with what you have" });

    render(<CookWithPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Cook with what you have" })).toBeInTheDocument();
    expect(screen.getByText(/Add a few main ingredients/i)).toBeInTheDocument();

    const input = screen.getByRole("combobox", { name: "Add a main ingredient" });

    await user.type(input, "moon rocks{Enter}");

    expect(screen.getByText(/only curated ingredients are available/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove moon rocks/i })).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "aloo");
    await user.click(await screen.findByRole("option", { name: /Potato/i }));

    expect(screen.getByRole("button", { name: "Remove Potato" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all selected ingredients" })).toBeInTheDocument();

    const results = screen.getByRole("list", { name: "Cook-with recipe results" });

    expect(within(results).getAllByRole("link").length).toBeGreaterThan(0);
    expect(within(results).getAllByText(/Uses Potato/i).length).toBeGreaterThan(0);
  });

  it("shows an empty recipe state when selected ingredients and chapter have no overlap", async () => {
    const user = userEvent.setup();

    render(<CookWithPage />);

    await user.type(screen.getByRole("combobox", { name: "Add a main ingredient" }), "pork");
    await user.click(await screen.findByRole("option", { name: /^Pork$/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Chapter" }), "desserts");

    expect(screen.getByText(/No recipes match those ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/Try removing a chip or changing chapter/i)).toBeInTheDocument();
  });
});
