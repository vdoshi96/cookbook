import type { Metadata } from "next";
import { AlphabeticalReference, type ReferenceEntry } from "@/components/AlphabeticalReference";
import { getAllIngredients } from "@/lib/data";
import { ingredientPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Index"
};

function indexEntries(): ReferenceEntry[] {
  return getAllIngredients().map((ingredient) => ({
    id: ingredient.slug,
    label: ingredient.display_name,
    href: ingredientPath(ingredient.slug),
    columns: [
      { label: "Ingredient", value: ingredient.display_name },
      { label: "Recipes", value: `${ingredient.recipe_ids.length}` }
    ]
  }));
}

export default function IndexPage() {
  return (
    <div className="page-shell reference-page">
      <header className="browse-page-header">
        <p className="eyebrow">Index</p>
        <h1 className="section-title">Ingredient Index</h1>
        <p className="lede">Trace ingredients through the recipes that use them.</p>
      </header>
      <AlphabeticalReference entries={indexEntries()} label="index" />
    </div>
  );
}
