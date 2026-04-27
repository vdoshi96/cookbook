import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllSections, getRecipesBySection, getSectionById, getStartHereRecipes } from "@/lib/data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "@/lib/filters";
import { recipePath } from "@/lib/routes";

interface SectionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

function toSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export default async function SectionPage({ params, searchParams }: SectionPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const section = getSectionById(id);

  if (!section) {
    notFound();
  }

  const filters = parseRecipeFilters(toSearchParams(resolvedSearchParams));
  const recipes = getRecipesBySection(section.id);
  const filteredRecipes = applyRecipeFilters(recipes, filters);
  const filterOptions = getRecipeFilterOptions(recipes);
  const startHereRecipes = getStartHereRecipes(section.id);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Chapter</p>
      <h1 className="section-title">{section.name}</h1>
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

      <form className="listing-layout">
        <div className="desktop-filters">
          <FilterSidebar options={filterOptions} filters={filters} />
        </div>
        <div>
          <FilterSideSheet options={filterOptions} filters={filters} />
          <ActiveFilters filters={filters} />
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
