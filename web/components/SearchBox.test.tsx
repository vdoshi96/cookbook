import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SearchBox } from "./SearchBox";

describe("SearchBox", () => {
  it("shows instant suggestions while typing", async () => {
    const user = userEvent.setup();

    render(<SearchBox />);
    await user.type(screen.getByRole("combobox", { name: "Search recipes, ingredients, regions" }), "paneer");

    expect(await screen.findByRole("option", { name: /Nargisi Seekh Kebab/ })).toHaveAttribute(
      "href",
      "/recipes/nargisi-seekh-kebab"
    );
  });

  it("keeps labels and suggestion lists unique for multiple instances", async () => {
    const user = userEvent.setup();

    render(
      <>
        <SearchBox />
        <SearchBox />
      </>
    );

    const inputs = screen.getAllByRole("combobox", { name: "Search recipes, ingredients, regions" });

    expect(inputs[0]).not.toHaveAttribute("id", inputs[1].id);

    await user.type(inputs[0], "paneer");

    const firstResultsId = inputs[0].getAttribute("aria-controls");
    const secondResultsId = inputs[1].getAttribute("aria-controls");

    expect(firstResultsId).toBeTruthy();
    expect(firstResultsId).not.toBe(secondResultsId);
    expect(document.querySelectorAll(`#${CSS.escape(firstResultsId ?? "")}`)).toHaveLength(1);
  });
});
