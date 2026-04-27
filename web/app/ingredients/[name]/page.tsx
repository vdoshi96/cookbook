import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllIngredients, getIngredientBySlug, getRecipesByIds } from "@/lib/data";

interface IngredientPageProps {
  params: Promise<{ name: string }>;
}

export function generateStaticParams() {
  return getAllIngredients().map((ingredient) => ({ name: ingredient.slug }));
}

export async function generateMetadata({ params }: IngredientPageProps): Promise<Metadata> {
  const { name } = await params;
  const ingredient = getIngredientBySlug(name);

  return {
    title: ingredient?.display_name ?? "Ingredient"
  };
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  const { name } = await params;
  const ingredient = getIngredientBySlug(name);

  if (!ingredient) {
    notFound();
  }

  const recipes = getRecipesByIds(ingredient.recipe_ids);
  const recipeLabel = ingredient.count === 1 ? "recipe features" : "recipes feature";

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Ingredient</p>
      <h1 className="section-title">{ingredient.display_name}</h1>
      <p className="lede">
        {ingredient.count} {recipeLabel} {ingredient.display_name}.
      </p>
      <div className="recipe-list">
        {recipes.map((recipe) => (
          <RecipeCard recipe={recipe} key={recipe.id} />
        ))}
      </div>
    </div>
  );
}
