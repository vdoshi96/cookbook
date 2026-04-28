import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeImage } from "@/components/RecipeImage";
import { RecipeListingClient } from "@/components/RecipeListingClient";
import { resolveSectionImage } from "@/lib/curated-images";
import { getAllSections, getRecipesBySection, getSectionById, getStartHereRecipes } from "@/lib/data";
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

  const recipes = getRecipesBySection(section.id);
  const startHereRecipes = getStartHereRecipes(section.id);
  const image = resolveSectionImage(section);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Chapter</p>
      <h1 className="section-title">{section.name}</h1>
      <RecipeImage kind="section" id={section.id} label={section.name} image={image} className="listing-hero-image" />
      <MarkdownBlock markdown={section.intro_markdown} />

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
  );
}
