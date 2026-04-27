import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("global styles", () => {
  it("only enables smooth scrolling when reduced motion is not requested", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    const smoothScrollMatches = css.match(/scroll-behavior:\s*smooth;/g) ?? [];
    const reducedMotionBlock = css.match(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*?scroll-behavior:\s*smooth;[\s\S]*?}/
    );

    expect(smoothScrollMatches).toHaveLength(1);
    expect(reducedMotionBlock).not.toBeNull();
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{[\s\S]*html\s*{[\s\S]*scroll-behavior:\s*smooth;/
    );
  });
});
