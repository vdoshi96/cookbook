import { test, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

interface PageTarget {
  label: string;
  path: string;
  kind: string;
}

interface PageIssue {
  type: string;
  detail: string;
}

interface PageResult extends PageTarget {
  screenshot: string;
  repoScreenshot: string;
  status: number | null;
  issues: PageIssue[];
}

interface VisualCheck {
  name: string;
  status: "passed" | "failed";
  details: string;
  screenshots: string[];
  repoScreenshots: string[];
}

const repoRoot = path.resolve(__dirname, "../..");
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const tmpScreenshotDir = "/tmp/qa-screenshots";
const repoScreenshotDir = path.join(repoRoot, "qa-screenshots");

const recipes = JSON.parse(fs.readFileSync(path.join(repoRoot, "data/recipes.json"), "utf8")).recipes as Array<{
  id: string;
  name: string;
}>;
const sections = JSON.parse(fs.readFileSync(path.join(repoRoot, "data/sections.json"), "utf8")).sections as Array<{
  id: string;
  name: string;
}>;
const regions = JSON.parse(fs.readFileSync(path.join(repoRoot, "data/regions.json"), "utf8")).regions as Array<{
  id: string;
  name: string;
}>;

function ensureCleanDir(dir: string) {
  fs.rmSync(dir, { force: true, recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function makeSeed(value: string) {
  return [...value].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function seededRandom(seedInput: string) {
  let seed = makeSeed(seedInput) || 1;

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function sampleRecipes() {
  const seed = process.env.QA_SEED ?? new Date().toISOString();
  const random = seededRandom(seed);
  const shuffled = [...recipes];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return { seed, sample: shuffled.slice(0, 30) };
}

function screenshotNames(index: number, target: PageTarget) {
  const filename = `${String(index + 1).padStart(3, "0")}-${slugify(`${target.kind}-${target.label}`)}.jpg`;

  return {
    tmp: path.join(tmpScreenshotDir, filename),
    repo: path.join(repoScreenshotDir, filename)
  };
}

function copyScreenshot(tmpPath: string, repoPath: string) {
  fs.mkdirSync(path.dirname(repoPath), { recursive: true });
  fs.copyFileSync(tmpPath, repoPath);
}

async function captureScreenshot(page: Page, tmpPath: string, repoPath: string) {
  await page.screenshot({ path: tmpPath, quality: 72, type: "jpeg" });
  copyScreenshot(tmpPath, repoPath);
}

function issue(type: string, detail: string): PageIssue {
  return { type, detail };
}

async function collectFailedImages(page: Page) {
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt
      }))
  );
}

async function auditPage(context: BrowserContext, target: PageTarget, index: number): Promise<PageResult> {
  const page = await context.newPage();
  const issues: PageIssue[] = [];
  const notFoundUrls: string[] = [];
  const screenshot = screenshotNames(index, target);
  let status: number | null = null;

  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push(issue("console error", message.text()));
    }
  });

  page.on("pageerror", (error) => {
    issues.push(issue("page error", error.message));
  });

  page.on("response", (response) => {
    if (response.status() === 404) {
      notFoundUrls.push(response.url());
    }
  });

  page.on("requestfailed", (request) => {
    issues.push(issue("request failed", `${request.url()} (${request.failure()?.errorText ?? "unknown error"})`));
  });

  try {
    const response = await page.goto(new URL(target.path, baseUrl).toString(), {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    status = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => undefined);
  } catch (error) {
    issues.push(issue("navigation error", error instanceof Error ? error.message : String(error)));
  }

  await captureScreenshot(page, screenshot.tmp, screenshot.repo);

  if (status !== null && status >= 400) {
    issues.push(issue("document status", `${status} for ${target.path}`));
  }

  for (const url of notFoundUrls) {
    issues.push(issue("network 404", url));
  }

  for (const image of await collectFailedImages(page)) {
    issues.push(issue("image failed", `${image.src}${image.alt ? ` (alt: ${image.alt})` : ""}`));
  }

  await page.close();

  return {
    ...target,
    screenshot: screenshot.tmp,
    repoScreenshot: path.relative(repoRoot, screenshot.repo),
    status,
    issues
  };
}

async function visualScreenshot(page: Page, filename: string) {
  const tmp = path.join(tmpScreenshotDir, filename);
  const repo = path.join(repoScreenshotDir, filename);
  await captureScreenshot(page, tmp, repo);

  return { tmp, repo: path.relative(repoRoot, repo) };
}

async function runVisualChecks(context: BrowserContext): Promise<VisualCheck[]> {
  const checks: VisualCheck[] = [];

  const recipe = recipes[0];
  const recipePage = await context.newPage();
  await recipePage.goto(new URL(`/recipes/${recipe.id}`, baseUrl).toString(), { waitUntil: "domcontentloaded" });
  await recipePage.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => undefined);
  const heroLoad = await visualScreenshot(recipePage, "visual-recipe-hero-load.jpg");
  const loadMetrics = await recipePage.evaluate(() => {
    const hero = document.querySelector(".recipe-fullscreen-hero")?.getBoundingClientRect();
    return { heroHeight: hero?.height ?? 0, viewportHeight: window.innerHeight };
  });
  await recipePage.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.9)));
  await recipePage.waitForTimeout(300);
  const heroScrolled = await visualScreenshot(recipePage, "visual-recipe-hero-scrolled.jpg");
  const scrolledMetrics = await recipePage.evaluate(() => {
    const content = document.querySelector(".recipe-content")?.getBoundingClientRect();
    return { contentTop: content?.top ?? Number.POSITIVE_INFINITY, viewportHeight: window.innerHeight };
  });
  await recipePage.close();

  const heroPassed =
    loadMetrics.heroHeight >= loadMetrics.viewportHeight * 0.9 &&
    scrolledMetrics.contentTop < scrolledMetrics.viewportHeight;
  checks.push({
    name: "Hero image scroll reveal on a recipe page",
    status: heroPassed ? "passed" : "failed",
    details: `Initial hero height ${Math.round(loadMetrics.heroHeight)}px / viewport ${loadMetrics.viewportHeight}px; content top after scroll ${Math.round(scrolledMetrics.contentTop)}px.`,
    screenshots: [heroLoad.tmp, heroScrolled.tmp],
    repoScreenshots: [heroLoad.repo, heroScrolled.repo]
  });

  checks.push(await verifyPage(context, "Chapters and Regions are separate top-level pages", "/chapters", "visual-chapters-page.jpg", async (page) => {
    const chaptersHeading = await page.getByRole("heading", { level: 1, name: "Chapters" }).count();
    const regionsLink = await page.getByRole("link", { name: "Regions" }).count();
    return chaptersHeading > 0 && regionsLink > 0;
  }));

  checks.push(await verifyPage(context, "Regions top-level page renders independently", "/regions", "visual-regions-page.jpg", async (page) => {
    const regionsHeading = await page.getByRole("heading", { level: 1, name: "Regions" }).count();
    const chaptersLink = await page.getByRole("link", { name: "Chapters" }).count();
    return regionsHeading > 0 && chaptersLink > 0;
  }));

  checks.push(await verifyPage(context, "Introduction page renders prose without filter UI", "/introduction", "visual-introduction-page.jpg", async (page) => {
    const introductionHeading = await page.getByRole("heading", { level: 1, name: "Introduction" }).count();
    const filters = await page.getByRole("form", { name: /recipe filters/i }).count();
    const zeroRecipes = await page.getByText(/0 recipes/i).count();
    return introductionHeading > 0 && filters === 0 && zeroRecipes === 0;
  }));

  checks.push(await verifyPage(context, "Glossary page shows alphabetical English and regional columns", "/glossary", "visual-glossary-page.jpg", async (page) => {
    const heading = await page.getByRole("heading", { level: 1, name: "Glossary" }).count();
    const english = await page.getByRole("columnheader", { name: "English" }).count();
    const regional = await page.getByRole("columnheader", { name: "Regional name" }).count();
    const cSection = await page.getByRole("region", { name: "C" }).count();
    return heading > 0 && english > 0 && regional > 0 && cSection > 0;
  }));

  checks.push(await verifyPage(context, "About page does not show an Ayurveda section", "/about", "visual-about-page.jpg", async (page) => {
    const aboutHeading = await page.getByRole("heading", { level: 1, name: "About the Cookbook" }).count();
    const ayurvedaHeading = await page.getByRole("heading", { name: /Ayurveda/i }).count();
    return aboutHeading > 0 && ayurvedaHeading === 0;
  }));

  return checks;
}

async function verifyPage(
  context: BrowserContext,
  name: string,
  route: string,
  filename: string,
  verify: (page: Page) => Promise<boolean>
): Promise<VisualCheck> {
  const page = await context.newPage();
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 2_500 }).catch(() => undefined);
  const screenshot = await visualScreenshot(page, filename);
  const passed = await verify(page);
  await page.close();

  return {
    name,
    status: passed ? "passed" : "failed",
    details: passed ? `${route} matched the expected page structure.` : `${route} did not match the expected page structure.`,
    screenshots: [screenshot.tmp],
    repoScreenshots: [screenshot.repo]
  };
}

function markdownTable(headers: string[], rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return "_None._\n";
  const escape = (value: string | number | null) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");

  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => escape(row[header])).join(" | ")} |`)
  ].join("\n");
}

function writeReport(results: PageResult[], visualChecks: VisualCheck[], seed: string, sampledRecipes: Array<{ id: string; name: string }>) {
  const lines: string[] = [];
  const issueCount = results.reduce((count, result) => count + result.issues.length, 0);

  lines.push("# Live Audit");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Base URL: ${baseUrl}`);
  lines.push(`Recipe sample seed: ${seed}`);
  lines.push("");
  lines.push("## Coverage");
  lines.push("");
  lines.push(`- Static/reference pages: ${results.filter((result) => result.kind === "static").length}`);
  lines.push(`- Random recipe pages: ${sampledRecipes.length}`);
  lines.push(`- Cooking section pages: ${sections.length}`);
  lines.push(`- Region pages: ${regions.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(markdownTable(["Metric", "Count"], [
    { Metric: "Pages visited", Count: results.length },
    { Metric: "Pages with issues", Count: results.filter((result) => result.issues.length > 0).length },
    { Metric: "Total issues", Count: issueCount },
    { Metric: "Visual checks passed", Count: visualChecks.filter((check) => check.status === "passed").length },
    { Metric: "Visual checks failed", Count: visualChecks.filter((check) => check.status === "failed").length }
  ]));
  lines.push("");
  lines.push("## Random Recipe Sample");
  lines.push("");
  lines.push(markdownTable(["id", "name"], sampledRecipes.map((recipe) => ({ id: recipe.id, name: recipe.name }))));
  lines.push("");
  lines.push("## Visual Fix Verification");
  lines.push("");
  for (const check of visualChecks) {
    lines.push(`### ${check.name}`);
    lines.push("");
    lines.push(`Status: ${check.status}`);
    lines.push("");
    lines.push(check.details);
    lines.push("");
    lines.push("Screenshots:");
    for (let index = 0; index < check.screenshots.length; index += 1) {
      lines.push(`- ${check.screenshots[index]} (repo: \`${check.repoScreenshots[index]}\`)`);
    }
    lines.push("");
  }
  lines.push("## Issues By Page");
  lines.push("");
  for (const result of results) {
    lines.push(`### ${result.label} (${result.path})`);
    lines.push("");
    lines.push(`Screenshot: ${result.screenshot} (repo: \`${result.repoScreenshot}\`)`);
    lines.push("");
    lines.push(`Document status: ${result.status ?? "not captured"}`);
    lines.push("");
    if (result.issues.length === 0) {
      lines.push("_No issues captured._");
    } else {
      for (const pageIssue of result.issues) {
        lines.push(`- **${pageIssue.type}:** ${pageIssue.detail}`);
      }
    }
    lines.push("");
  }

  fs.writeFileSync(path.join(repoRoot, "live-audit.md"), lines.join("\n"));
}

test.describe("live cookbook QA audit", () => {
  test.setTimeout(900_000);

  test("captures live page issues and screenshots", async ({ browser }) => {
    ensureCleanDir(tmpScreenshotDir);
    ensureCleanDir(repoScreenshotDir);

    const { seed, sample } = sampleRecipes();
    const targets: PageTarget[] = [
      { label: "Home", path: "/", kind: "static" },
      { label: "Chapters", path: "/chapters", kind: "static" },
      { label: "Regions", path: "/regions", kind: "static" },
      { label: "About", path: "/about", kind: "static" },
      { label: "Introduction", path: "/introduction", kind: "static" },
      { label: "Glossary", path: "/glossary", kind: "static" },
      { label: "Directory", path: "/directory", kind: "static" },
      { label: "Index", path: "/index", kind: "static" },
      { label: "Search", path: "/search", kind: "static" },
      ...sample.map((recipe) => ({ label: recipe.name, path: `/recipes/${recipe.id}`, kind: "recipe" })),
      ...sections.map((section) => ({ label: section.name, path: `/sections/${section.id}`, kind: "section" })),
      ...regions.map((region) => ({ label: region.name, path: `/regions/${region.id}`, kind: "region" }))
    ];

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }
    });
    const results: PageResult[] = [];

    for (const [index, target] of targets.entries()) {
      results.push(await auditPage(context, target, index));
    }

    const visualChecks = await runVisualChecks(context);
    await context.close();

    writeReport(results, visualChecks, seed, sample);
  });
});
