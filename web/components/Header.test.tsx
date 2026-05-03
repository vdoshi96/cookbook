import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("links to the cook-with ingredient page from primary navigation", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Cook With" })).toHaveAttribute("href", "/cook-with");
  });
});
