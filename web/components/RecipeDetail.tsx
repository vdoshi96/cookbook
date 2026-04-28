import Link from "next/link";
import {
  getIngredientBySlug,
  getRecipeById,
  getRecipesByRegion,
  getRecipesBySection,
  getUsedInRecipes
} from "@/lib/data";
import { formatIngredientLine } from "@/lib/format";
import { ingredientPath, recipePath } from "@/lib/routes";
import type { CrossReference, Recipe } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";

function relatedRecipes(recipes: Recipe[], currentId: string) {
  return recipes.filter((recipe) => recipe.id !== currentId).slice(0, 3);
}

function normalizeReferenceLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function crossReferenceHref(reference: CrossReference) {
  if (!reference.id) {
    return null;
  }

  const recipe = getRecipeById(reference.id);

  if (recipe && normalizeReferenceLabel(recipe.name) === normalizeReferenceLabel(reference.name)) {
    return recipePath(reference.id);
  }

  const ingredient = getIngredientBySlug(reference.id);

  return ingredient && normalizeReferenceLabel(ingredient.display_name) === normalizeReferenceLabel(reference.name)
    ? ingredientPath(reference.id)
    : null;
}

function CrossReferenceItem({ reference }: { reference: CrossReference }) {
  const href = crossReferenceHref(reference);
  const content = <span>{reference.name}</span>;

  return <li>{href ? <Link href={href}>{content}</Link> : <span className="reference-text">{content}</span>}</li>;
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const usedInRecipes = getUsedInRecipes(recipe.id);
  const sameRegionRecipes = relatedRecipes(getRecipesByRegion(recipe.origin_region_id), recipe.id);
  const sameSectionRecipes = relatedRecipes(getRecipesBySection(recipe.section_id), recipe.id);

  return (
    <div className="recipe-detail">
      <nav className="jump-nav surface" aria-label="Recipe sections">
        <a href="#ingredients">Ingredients</a>
        <a href="#method">Method</a>
        <a href="#references">References</a>
      </nav>

      <div className="recipe-detail-grid">
        <section className="recipe-panel surface" aria-labelledby="ingredients">
          <h2 id="ingredients">Ingredients</h2>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.item}-${index}`}>{formatIngredientLine(ingredient)}</li>
            ))}
          </ul>
        </section>

        <section className="recipe-panel surface" aria-labelledby="method">
          <h2 id="method">Method</h2>
          <ol className="method-list">
            {recipe.instructions.map((instruction, index) => (
              <li key={`${recipe.id}-step-${index}`}>{instruction}</li>
            ))}
          </ol>
        </section>
      </div>

      <section className="recipe-panel surface" aria-labelledby="references">
        <h2 id="references">References</h2>
        {recipe.cross_refs.length > 0 ? (
          <ul className="reference-list">
            {recipe.cross_refs.map((reference) => (
              <CrossReferenceItem reference={reference} key={`${reference.id}-${reference.page}`} />
            ))}
          </ul>
        ) : (
          <p className="muted-copy">No references listed.</p>
        )}

        {usedInRecipes.length > 0 ? (
          <div className="used-in">
            <h3>Used in</h3>
            <ul className="reference-list">
              {usedInRecipes.map((usedInRecipe) => (
                <li key={usedInRecipe.id}>
                  <Link href={recipePath(usedInRecipe.id)}>{usedInRecipe.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {sameRegionRecipes.length > 0 ? (
        <section className="related-rail" aria-labelledby="related-region-heading">
          <div className="section-heading">
            <p className="eyebrow">Same region</p>
            <h2 id="related-region-heading">More from {recipe.origin_region_name}</h2>
          </div>
          <div className="related-recipe-list">
            {sameRegionRecipes.map((relatedRecipe) => (
              <RecipeCard recipe={relatedRecipe} key={relatedRecipe.id} />
            ))}
          </div>
        </section>
      ) : null}

      {sameSectionRecipes.length > 0 ? (
        <section className="related-rail" aria-labelledby="related-section-heading">
          <div className="section-heading">
            <p className="eyebrow">Same chapter</p>
            <h2 id="related-section-heading">More from {recipe.section_name}</h2>
          </div>
          <div className="related-recipe-list">
            {sameSectionRecipes.map((relatedRecipe) => (
              <RecipeCard recipe={relatedRecipe} key={relatedRecipe.id} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
