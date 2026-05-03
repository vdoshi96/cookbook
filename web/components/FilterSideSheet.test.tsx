import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FilterSideSheet } from "./FilterSideSheet";
import type { RecipeFilterOptions } from "@/lib/filters";

const options: RecipeFilterOptions = {
  regions: [{ id: "awadh", name: "Awadh" }],
  mainIngredients: [{ id: "paneer", name: "Paneer" }],
  ingredients: [
    { id: "paneer", name: "Paneer" },
    { id: "potato", name: "potatoes" }
  ],
  dietary: ["vegetarian"],
  techniques: ["grill"]
};

describe("FilterSideSheet", () => {
  it("moves focus into the dialog and restores it on Escape", async () => {
    const user = userEvent.setup();

    render(<FilterSideSheet options={options} filters={{}} />);

    const openButton = screen.getByRole("button", { name: "Filter" });

    await user.click(openButton);

    const closeButton = await screen.findByRole("button", { name: "Close filters" });

    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Recipe filters" })).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("keeps keyboard focus inside the open dialog", async () => {
    const user = userEvent.setup();

    render(<FilterSideSheet options={options} filters={{}} />);

    await user.click(screen.getByRole("button", { name: "Filter" }));

    const closeButton = await screen.findByRole("button", { name: "Close filters" });

    await waitFor(() => expect(closeButton).toHaveFocus());
    await user.tab({ shift: true });

    expect(screen.getByRole("button", { name: "Apply filters" })).toHaveFocus();
  });

  it("closes and restores focus when the backdrop is clicked", async () => {
    const user = userEvent.setup();

    render(<FilterSideSheet options={options} filters={{}} />);

    const openButton = screen.getByRole("button", { name: "Filter" });

    await user.click(openButton);

    const dialog = await screen.findByRole("dialog", { name: "Recipe filters" });
    const backdrop = dialog.parentElement;

    if (!backdrop) {
      throw new Error("Expected filter sheet backdrop");
    }

    await user.click(backdrop);

    expect(screen.queryByRole("dialog", { name: "Recipe filters" })).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });
});
