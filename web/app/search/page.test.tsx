import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { recipePath } from "@/lib/routes";

describe("SearchPage", () => {
  it("renders query-backed cookbook results and updates as readers type", async () => {
    const [{ default: SearchPage, metadata }] = await Promise.all([import("./page")]);
    const user = userEvent.setup();

    expect(metadata).toMatchObject({ title: "Search" });

    render(<>{await SearchPage({ searchParams: Promise.resolve({ q: "paneer" }) })}</>);

    expect(screen.getByRole("heading", { level: 1, name: "Search the Cookbook" })).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: "Search recipes, ingredients, regions" });

    expect(input).toHaveValue("paneer");

    const results = screen.getByRole("list", { name: "Search results" });

    expect(within(results).getByRole("link", { name: /Nargisi Seekh Kebab/i })).toHaveAttribute(
      "href",
      recipePath("nargisi-seekh-kebab")
    );

    await user.clear(input);
    await user.type(input, "no matching cookbook entry");

    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Search recipes, ingredients, regions" })).toBeInTheDocument();
  });
});
