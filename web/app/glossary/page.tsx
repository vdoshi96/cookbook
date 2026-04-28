import type { Metadata } from "next";
import { AlphabeticalReference, type ReferenceEntry } from "@/components/AlphabeticalReference";
import { getAllIngredients } from "@/lib/data";
import { ingredientPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Glossary"
};

function glossaryEntries(): ReferenceEntry[] {
  return getAllIngredients().map((ingredient) => ({
    id: ingredient.slug,
    label: ingredient.display_name,
    href: ingredientPath(ingredient.slug),
    columns: [
      { label: "English", value: ingredient.display_name },
      { label: "Regional name", value: "Not listed" },
      { label: "Recipes", value: `${ingredient.recipe_ids.length}` }
    ]
  }));
}

export default function GlossaryPage() {
  return (
    <div className="page-shell reference-page">
      <header className="browse-page-header">
        <p className="eyebrow">Reference</p>
        <h1 className="section-title">Glossary</h1>
        <p className="lede">An alphabetical reference for ingredients used across the cookbook.</p>
      </header>
      <AlphabeticalReference entries={glossaryEntries()} label="glossary" />
    </div>
  );
}
