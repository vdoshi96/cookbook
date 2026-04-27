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

  it("uses the first repeated query parameter as the initial search value", async () => {
    const { default: SearchPage } = await import("./page");

    render(<>{await SearchPage({ searchParams: Promise.resolve({ q: ["paneer", "rice"] }) })}</>);

    expect(screen.getByRole("textbox", { name: "Search recipes, ingredients, regions" })).toHaveValue("paneer");
    expect(screen.getByRole("list", { name: "Search results" })).toBeInTheDocument();
  });

  it("restores repeated filter query params and applies them to search results", async () => {
    const { default: SearchPage } = await import("./page");

    render(
      <>
        {await SearchPage({
          searchParams: Promise.resolve({
            q: ["awadh", "paneer"],
            kind: ["recipe", "region"],
            region: "awadh",
            section: "snacks-and-appetizers",
            dietary: ["vegetarian"],
            technique: ["tandoor"],
            maxTime: "45",
            heat: "1"
          })
        })}
      </>
    );

    expect(screen.getByRole("textbox", { name: "Search recipes, ingredients, regions" })).toHaveValue("awadh");
    expect(screen.getByRole("checkbox", { name: "Recipe" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Region" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Awadh" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Snacks and Appetizers" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Vegetarian" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Tandoor" })).toBeChecked();
    expect(screen.getByRole("spinbutton", { name: "Maximum total minutes" })).toHaveValue(45);
    expect(screen.getByRole("radio", { name: "Mild" })).toBeChecked();
    expect(screen.getByRole("link", { name: /Nargisi Seekh Kebab/i })).toHaveAttribute(
      "href",
      recipePath("nargisi-seekh-kebab")
    );
    expect(screen.queryByText("Khumb Shabnam")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Region\s+Awadh/i })).not.toBeInTheDocument();
  });

  it("keys the client search experience by query params so soft navigation restores filters", async () => {
    const { default: SearchPage } = await import("./page");

    const filteredPage = await SearchPage({
      searchParams: Promise.resolve({
        q: "awadh",
        kind: ["recipe", "region"],
        region: "awadh"
      })
    });
    const clearedPage = await SearchPage({
      searchParams: Promise.resolve({
        q: "awadh"
      })
    });

    expect(filteredPage.props.children[1].key).toContain("kind=recipe");
    expect(filteredPage.props.children[1].key).toContain("region=awadh");
    expect(clearedPage.props.children[1].key).toBe("q=awadh");
  });
});
