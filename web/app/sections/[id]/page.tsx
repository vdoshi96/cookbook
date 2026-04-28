import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeImage } from "@/components/RecipeImage";
import { RecipeListingClient } from "@/components/RecipeListingClient";
import { resolveSectionImage } from "@/lib/curated-images";
import { getAllSections, getFrontMatter, getRecipesBySection, getSectionById, getStartHereRecipes } from "@/lib/data";
import { recipePath } from "@/lib/routes";

interface SectionPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllSections().map((section) => ({ id: section.id }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const section = getSectionById(id);

  return {
    title: section?.name ?? "Chapter"
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { id } = await params;
  const section = getSectionById(id);

  if (!section) {
    notFound();
  }

  if (section.id === "introduction") {
    const frontMatter = getFrontMatter();

    return (
      <div className="page-shell reading-page">
        <p className="eyebrow">Introduction</p>
        <h1 className="section-title">{frontMatter.introduction.title}</h1>
        <section className="reading-section surface">
          <MarkdownBlock markdown={frontMatter.introduction.markdown} />
        </section>
      </div>
    );
  }

  const recipes = getRecipesBySection(section.id);
  const startHereRecipes = getStartHereRecipes(section.id);
  const image = resolveSectionImage(section);

  if (recipes.length === 0) {
    return (
      <div className="page-shell reading-page">
        <p className="eyebrow">Reference</p>
        <h1 className="section-title">{section.name}</h1>
        <section className="reading-section surface">
          <MarkdownBlock markdown={section.intro_markdown} />
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell listing-page">
      <header className="fullscreen-hero listing-fullscreen-hero">
        <RecipeImage
          kind="section"
          id={section.id}
          label={section.name}
          image={image}
          className="fullscreen-hero-image listing-hero-image"
        />
        <div className="fullscreen-hero-overlay">
          <p className="eyebrow">Chapter</p>
          <h1>{section.name}</h1>
          <MarkdownBlock markdown={section.intro_markdown} />
        </div>
      </header>

      <div className="listing-content">
        {startHereRecipes.length > 0 ? (
          <section className="start-here surface" aria-labelledby="start-here-heading">
            <h2 id="start-here-heading">Start here</h2>
            <div>
              {startHereRecipes.map((recipe) => (
                <Link href={recipePath(recipe.id)} key={recipe.id}>
                  <strong>{recipe.recipeName}</strong>
                  <span>{recipe.rationale}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <RecipeListingClient recipes={recipes} />
      </div>
    </div>
  );
}
