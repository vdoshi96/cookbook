import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getAllRegions } from "@/lib/data";
import { regionPath } from "@/lib/routes";
import RegionsPage from "./page";

describe("RegionsPage", () => {
  it("renders regions as a separate top-level landing page", () => {
    render(<RegionsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Regions" })).toBeInTheDocument();

    const regions = within(screen.getByRole("region", { name: "Cookbook regions" }));

    for (const region of getAllRegions()) {
      const tile = regions.getByRole("link", { name: region.name });

      expect(tile).toHaveAttribute("href", regionPath(region.id));
      expect(within(tile).getByRole("img", { name: new RegExp(region.name, "i") }).tagName).toBe("IMG");
    }
  });
});
