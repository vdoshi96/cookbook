import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("global styles", () => {
  it("does not include scroll or transition effects", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).not.toMatch(/scroll-behavior/);
    expect(css).not.toMatch(/transition\s*:/);
    expect(css).not.toMatch(/animation\s*:/);
  });
});
