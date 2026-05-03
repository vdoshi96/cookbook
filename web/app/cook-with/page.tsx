import type { Metadata } from "next";
import { CookWithPageClient } from "@/components/CookWithPageClient";
import { getAllRecipes, getAllRecipeSections, getIngredientMatcher } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cook with what you have"
};

export default function CookWithPage() {
  return (
    <div className="page-shell cook-with-page">
      <header className="cook-with-hero">
        <p className="eyebrow">Ingredient matcher</p>
        <h1 className="section-title">Cook with what you have</h1>
        <p className="lede">
          Pick the main ingredients already in your kitchen. Exact matches come first, followed by recipes that get close and
          explain what else they need.
        </p>
      </header>
      <CookWithPageClient matcher={getIngredientMatcher()} recipes={getAllRecipes()} sections={getAllRecipeSections()} />
    </div>
  );
}
