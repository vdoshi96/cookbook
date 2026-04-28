"use client";

import { useEffect, useMemo, useState } from "react";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "@/lib/filters";
import type { Recipe } from "@/lib/types";

function useBrowserSearch() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    function syncSearch() {
      setSearch(window.location.search);
    }

    syncSearch();
    window.addEventListener("popstate", syncSearch);

    return () => window.removeEventListener("popstate", syncSearch);
  }, []);

  return search;
}

export function RecipeListingClient({ recipes }: { recipes: Recipe[] }) {
  const search = useBrowserSearch();
  const filters = useMemo(() => parseRecipeFilters(new URLSearchParams(search)), [search]);
  const filteredRecipes = useMemo(() => applyRecipeFilters(recipes, filters), [filters, recipes]);
  const filterOptions = useMemo(() => getRecipeFilterOptions(recipes), [recipes]);

  return (
    <div className="listing-layout">
      <form className="desktop-filters" aria-label="Desktop recipe filters" method="get">
        <FilterSidebar key={`desktop:${search}`} options={filterOptions} filters={filters} />
      </form>
      <div>
        <FilterSideSheet key={`mobile:${search}`} options={filterOptions} filters={filters} />
        <ActiveFilters filters={filters} />
        <div className="recipe-list">
          {filteredRecipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
