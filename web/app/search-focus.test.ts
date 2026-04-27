import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("search focus styles", () => {
  it("restores a visible keyboard focus indicator for the outlined search input", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(/\.search-input-wrap:focus-within\s*{[\s\S]*(outline|box-shadow):/);
  });
});
