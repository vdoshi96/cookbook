import { formatHeatLevel, formatTotalTime } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <dl className="recipe-meta">
      <div>
        <dt>Total</dt>
        <dd>{formatTotalTime(recipe.prep_minutes, recipe.cook_minutes)}</dd>
      </div>
      <div>
        <dt>Prep</dt>
        <dd>
          {recipe.prep_minutes} min{recipe.prep_notes ? `, ${recipe.prep_notes}` : ""}
        </dd>
      </div>
      <div>
        <dt>Cook</dt>
        <dd>
          {recipe.cook_minutes} min{recipe.cook_notes ? `, ${recipe.cook_notes}` : ""}
        </dd>
      </div>
      <div>
        <dt>Serves</dt>
        <dd>{recipe.serves}</dd>
      </div>
      <div>
        <dt>Heat</dt>
        <dd>{formatHeatLevel(recipe.heat_level)}</dd>
      </div>
    </dl>
  );
}
