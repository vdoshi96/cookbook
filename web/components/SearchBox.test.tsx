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
});
