import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("global styles", () => {
  it("only enables smooth scrolling when reduced motion is not requested", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*html\s*{[\s\S]*scroll-behavior:\s*smooth;/
    );
  });
});
