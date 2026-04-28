import Link from "next/link";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeImage } from "@/components/RecipeImage";
import { SearchBox } from "@/components/SearchBox";
import { resolveRegionImage, resolveSectionImage } from "@/lib/curated-images";
import { getAllRegions, getAllSections, getFrontMatter } from "@/lib/data";
import { regionPath, sectionPath } from "@/lib/routes";

export default function HomePage() {
  const sections = getAllSections();
  const regions = getAllRegions();
  const frontMatter = getFrontMatter();

  return (
    <div className="page-shell home-page">
      <section className="home-hero">
        <p className="eyebrow">A digital companion</p>
        <h1 className="display-title">India Cookbook</h1>
        <p className="lede">
          Browse the cookbook by chapter, region, ingredient, and the cross-references that connect one dish to another.
        </p>
        <SearchBox />
      </section>

      <section className="page-section" id="chapters" aria-labelledby="chapters-heading">
        <div className="section-heading">
          <p className="eyebrow">Chapters</p>
          <h2 className="section-title" id="chapters-heading">
            The Chapters
          </h2>
        </div>
        <div className="chapter-grid">
          {sections.map((section) => {
            const image = resolveSectionImage(section);

            return (
              <Link className="chapter-tile surface" href={sectionPath(section.id)} key={section.id}>
                <RecipeImage
                  kind="section"
                  id={section.id}
                  label={section.name}
                  image={image}
                  className="chapter-image"
                  showAttributionLink={false}
                />
                <h3>{section.name}</h3>
                <p>{section.intro_markdown}</p>
                <span>{section.recipe_ids.length} recipes</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-section front-matter-rail surface" aria-labelledby="intro-heading">
        <p className="eyebrow">From the introduction</p>
        <h2 id="intro-heading">{frontMatter.introduction.title}</h2>
        <MarkdownBlock markdown={frontMatter.introduction.markdown} />
        <Link className="text-link" href="/about">
          Read the front matter
        </Link>
      </section>

      <section className="page-section" id="regions" aria-labelledby="regions-heading">
        <div className="section-heading">
          <p className="eyebrow">Regions</p>
          <h2 className="section-title" id="regions-heading">
            Browse by Region
          </h2>
        </div>
        <div className="region-grid">
          {regions.map((region) => {
            const image = resolveRegionImage(region);

            return (
              <Link className="region-tile surface" href={regionPath(region.id)} key={region.id}>
                <RecipeImage
                  kind="region"
                  id={region.id}
                  label={region.name}
                  image={image}
                  className="region-tile-image"
                  showAttributionLink={false}
                />
                <h3>{region.name}</h3>
                <p>{region.intro_markdown}</p>
                <span>
                  {region.recipe_ids.length} {region.recipe_ids.length === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
