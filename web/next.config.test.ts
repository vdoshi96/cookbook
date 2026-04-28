import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("nextConfig", () => {
  it("serves the ingredient index at /index without a literal app/index page", async () => {
    await expect(nextConfig.rewrites?.()).resolves.toEqual([
      {
        source: "/index",
        destination: "/ingredient-index"
      }
    ]);
  });
});
