import Link from "next/link";
import type { ReactNode } from "react";
import { resolveRecipeImage } from "@/lib/curated-images";
import { formatTagLabel, formatTotalTime } from "@/lib/format";
import { recipePath } from "@/lib/routes";
import type { Recipe } from "@/lib/types";
import { RecipeImage } from "./RecipeImage";

export function RecipeCard({ recipe, children }: { recipe: Recipe; children?: ReactNode }) {
  const image = resolveRecipeImage(recipe);

  return (
    <article className="recipe-card surface">
      <RecipeImage kind="recipe" id={recipe.id} label={recipe.name} image={image} className="recipe-card-image" />
      <div className="recipe-card-body">
        <p className="eyebrow">{recipe.origin_region_name}</p>
        <h3>
          <Link href={recipePath(recipe.id)}>{recipe.name}</Link>
        </h3>
        <p>{recipe.subtitle}</p>
        <div className="recipe-card-meta">
          <span>{formatTotalTime(recipe.prep_minutes, recipe.cook_minutes)}</span>
          <span>{recipe.serves} servings</span>
          <span>{formatTagLabel(recipe.dietary_tags[0] ?? "recipe")}</span>
        </div>
        {children ? <div className="recipe-card-extra">{children}</div> : null}
      </div>
    </article>
  );
}
