"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters, searchRecipes, type RecipeFilters } from "@/lib/filters";
import type { IngredientRecord } from "@/lib/types";
import type { Recipe } from "@/lib/types";

function searchQueryFromBrowserSearch(search: string) {
  return new URLSearchParams(search).get("q") ?? "";
}

function readSearchState(search: string) {
  return { query: searchQueryFromBrowserSearch(search), search };
}

function readBrowserSearchState() {
  return readSearchState(typeof window === "undefined" ? "" : window.location.search);
}

function useChapterSearchState(initialSearch: string) {
  const [state, setState] = useState(() => readSearchState(initialSearch));

  useEffect(() => {
    function syncSearch() {
      setState(readBrowserSearchState());
    }

    syncSearch();
    window.addEventListener("popstate", syncSearch);

    return () => window.removeEventListener("popstate", syncSearch);
  }, []);

  const setQuery = useCallback((query: string) => {
    setState((current) => ({ ...current, query }));
  }, []);

  return { ...state, setQuery };
}

function HiddenRecipeFilterInputs({ filters }: { filters: RecipeFilters }) {
  return (
    <>
      {filters.region ? <input type="hidden" name="region" value={filters.region} /> : null}
      {filters.mainIngredient ? <input type="hidden" name="mainIngredient" value={filters.mainIngredient} /> : null}
      {(filters.ingredients ?? []).map((ingredient) => (
        <input key={`ingredient:${ingredient}`} type="hidden" name="ingredient" value={ingredient} />
      ))}
      {(filters.excludedIngredients ?? []).map((ingredient) => (
        <input key={`excludeIngredient:${ingredient}`} type="hidden" name="excludeIngredient" value={ingredient} />
      ))}
      {(filters.dietary ?? []).map((tag) => (
        <input key={`dietary:${tag}`} type="hidden" name="dietary" value={tag} />
      ))}
      {(filters.technique ?? []).map((tag) => (
        <input key={`technique:${tag}`} type="hidden" name="technique" value={tag} />
      ))}
      {filters.maxTotalMinutes ? <input type="hidden" name="maxTime" value={filters.maxTotalMinutes} /> : null}
      {filters.heatLevel ? <input type="hidden" name="heat" value={filters.heatLevel} /> : null}
    </>
  );
}

export function RecipeListingClient({
  recipes,
  ingredients,
  ingredientSlugsByRecipeId,
  initialSearch = ""
}: {
  recipes: Recipe[];
  ingredients?: IngredientRecord[];
  ingredientSlugsByRecipeId?: Record<string, string[]>;
  initialSearch?: string;
}) {
  const id = useId();
  const { query, search, setQuery } = useChapterSearchState(initialSearch);
  const filters = useMemo(() => parseRecipeFilters(new URLSearchParams(search)), [search]);
  const activeQuery = query.trim();
  const filteredRecipes = useMemo(
    () => searchRecipes(applyRecipeFilters(recipes, filters, { ingredientSlugsByRecipeId }), activeQuery),
    [activeQuery, filters, ingredientSlugsByRecipeId, recipes]
  );
  const filterOptions = useMemo(() => getRecipeFilterOptions(recipes, ingredients), [ingredients, recipes]);
  const searchInputId = `${id}-chapter-search`;

  return (
    <div className="listing-layout">
      <form className="desktop-filters" aria-label="Desktop recipe filters" method="get">
        {activeQuery ? <input type="hidden" name="q" value={activeQuery} /> : null}
        <FilterSidebar key={`desktop:${search}`} options={filterOptions} filters={filters} />
      </form>
      <div>
        <form className="chapter-search surface" method="get">
          <label htmlFor={searchInputId}>Search this chapter</label>
          <div className="chapter-search-row">
            <Search aria-hidden="true" size={18} />
            <input
              id={searchInputId}
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try bhaang, raita, pickle"
            />
            {activeQuery ? (
              <button className="icon-button chapter-search-clear" type="button" aria-label="Clear chapter search" onClick={() => setQuery("")}>
                <X aria-hidden="true" size={16} />
              </button>
            ) : null}
          </div>
          <HiddenRecipeFilterInputs filters={filters} />
        </form>
        <FilterSideSheet key={`mobile:${search}`} options={filterOptions} filters={filters} query={activeQuery} />
        <ActiveFilters filters={filters} />
        <p className="chapter-search-count" aria-live="polite">
          {filteredRecipes.length} of {recipes.length} recipes
        </p>
        {filteredRecipes.length > 0 ? (
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state chapter-search-empty surface">
            <p className="eyebrow">No recipes found</p>
            <h2>{activeQuery ? `Nothing matches "${activeQuery}".` : "Nothing matches these filters."}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
