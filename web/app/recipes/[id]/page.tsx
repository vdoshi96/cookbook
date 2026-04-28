import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";
import { RecipeImage } from "@/components/RecipeImage";
import { RecipeMeta } from "@/components/RecipeMeta";
import { resolveRecipeImage } from "@/lib/curated-images";
import { getAllRecipes, getRecipeById } from "@/lib/data";
import { regionPath, sectionPath } from "@/lib/routes";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllRecipes().map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipeById(id);

  return {
    title: recipe?.name ?? "Recipe"
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const image = resolveRecipeImage(recipe);

  return (
    <div className="page-shell recipe-page">
      <header className="fullscreen-hero recipe-fullscreen-hero">
        <RecipeImage
          kind="recipe"
          id={recipe.id}
          label={recipe.name}
          image={image}
          className="fullscreen-hero-image recipe-hero-image"
        />
        <div className="fullscreen-hero-overlay recipe-hero-copy">
          <nav className="breadcrumbs" aria-label="Recipe breadcrumbs">
            <Link href={sectionPath(recipe.section_id)}>{recipe.section_name}</Link>
            <span aria-hidden="true">/</span>
            <Link href={regionPath(recipe.origin_region_id)}>{recipe.origin_region_name}</Link>
          </nav>
          <p className="eyebrow">Recipe</p>
          <h1>{recipe.name}</h1>
          <p className="lede">{recipe.subtitle}</p>
          <RecipeMeta recipe={recipe} />
        </div>
      </header>

      <div className="recipe-content">
        <RecipeDetail recipe={recipe} />
      </div>
    </div>
  );
}
