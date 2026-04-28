import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAllRegions } from "@/lib/data";
import RegionPage, { generateMetadata, generateStaticParams } from "./page";

describe("RegionPage", () => {
  it("renders a region hero image and recipe list without page-number references", async () => {
    render(
      await RegionPage({
        params: Promise.resolve({ id: "awadh" })
      })
    );

    expect(screen.getByRole("heading", { level: 1, name: "Awadh" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Awadh cuisine represented by galwati kebab." }).tagName).toBe("IMG");
    expect(screen.getByRole("link", { name: /Subz Seekh/i })).toHaveAttribute("href", "/recipes/subz-seekh");
    expect(screen.queryByText(/^p\.\s*\d+/i)).not.toBeInTheDocument();
  });

  it("statically generates every real region page", async () => {
    const staticParams = generateStaticParams();

    expect(staticParams).toHaveLength(getAllRegions().length);
    expect(staticParams).toContainEqual({ id: "awadh" });
    expect(staticParams).toContainEqual({ id: "tamil-nadu" });
    await expect(generateMetadata({ params: Promise.resolve({ id: "awadh" }) })).resolves.toEqual({
      title: "Awadh"
    });
  });
});
