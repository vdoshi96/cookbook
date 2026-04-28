import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getFrontMatter } from "@/lib/data";
import IntroductionPage, { metadata } from "./page";

describe("IntroductionPage", () => {
  it("renders the introduction as prose without recipe filters", () => {
    render(<IntroductionPage />);

    expect(metadata).toMatchObject({ title: "Introduction" });
    expect(screen.getByRole("heading", { level: 1, name: getFrontMatter().introduction.title })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /recipe filters/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/0 recipes/i)).not.toBeInTheDocument();
  });
});
