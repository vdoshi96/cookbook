import type { Metadata } from "next";
import Link from "next/link";
import { RecipeImage } from "@/components/RecipeImage";
import { resolveSectionImage } from "@/lib/curated-images";
import { getAllRecipeSections } from "@/lib/data";
import { sectionPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Chapters"
};

export default function ChaptersPage() {
  const sections = getAllRecipeSections();

  return (
    <div className="page-shell browse-page">
      <header className="browse-page-header">
        <p className="eyebrow">Chapters</p>
        <h1 className="section-title">Chapters</h1>
        <p className="lede">
          Browse the cookbook by chapter, following the book&apos;s structure from spice mixtures and pastes through snacks,
          main dishes, breads, rice, desserts, and drinks.
        </p>
      </header>

      <section className="page-section" aria-labelledby="chapters-heading">
        <div className="section-heading">
          <p className="eyebrow">Recipe chapters</p>
          <h2 id="chapters-heading">Cookbook chapters</h2>
        </div>
        <div className="chapter-grid">
          {sections.map((section) => {
            const image = resolveSectionImage(section);

            return (
              <Link aria-label={section.name} className="chapter-tile surface" href={sectionPath(section.id)} key={section.id}>
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
    </div>
  );
}
