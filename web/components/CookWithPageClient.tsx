"use client";

import { Search, X } from "lucide-react";
import { type KeyboardEvent, useId, useMemo, useState } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { getIngredientChipById, rankCookWithRecipes, searchIngredientChipOptions } from "@/lib/cook-with";
import type { IngredientMatcher, IngredientMatcherChip, Recipe, Section } from "@/lib/types";

interface CookWithPageClientProps {
  matcher: IngredientMatcher;
  recipes: Recipe[];
  sections: Section[];
}

function joinLabels(chips: IngredientMatcherChip[]) {
  return chips.map((chip) => chip.label).join(", ");
}

function MatchExplanation({ matched, missing, exact }: { matched: IngredientMatcherChip[]; missing: IngredientMatcherChip[]; exact: boolean }) {
  const visibleMissing = missing.slice(0, 4);
  const hiddenMissingCount = Math.max(0, missing.length - visibleMissing.length);

  return (
    <div className="cook-with-match">
      <span className="cook-with-rank-label">{exact ? "All selected ingredients" : "Close match"}</span>
      <p>
        <strong>Uses {joinLabels(matched)}</strong>
        {visibleMissing.length > 0 ? (
          <>
            {" "}
            <span aria-hidden="true">·</span> Also needs {joinLabels(visibleMissing)}
            {hiddenMissingCount > 0 ? ` and ${hiddenMissingCount} more` : ""}
          </>
        ) : null}
      </p>
    </div>
  );
}

export function CookWithPageClient({ matcher, recipes, sections }: CookWithPageClientProps) {
  const id = useId();
  const inputId = `${id}-ingredient-input`;
  const resultsId = `${id}-ingredient-options`;
  const sectionId = `${id}-section`;
  const [query, setQuery] = useState("");
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const selectedChips = useMemo(
    () => selectedChipIds.map((chipId) => getIngredientChipById(matcher, chipId)).filter((chip): chip is IngredientMatcherChip => Boolean(chip)),
    [matcher, selectedChipIds]
  );
  const options = useMemo(() => searchIngredientChipOptions(matcher, query, selectedChipIds), [matcher, query, selectedChipIds]);
  const results = useMemo(
    () =>
      rankCookWithRecipes(recipes, matcher, {
        selectedChipIds,
        sectionId: selectedSectionId || undefined
      }),
    [matcher, recipes, selectedChipIds, selectedSectionId]
  );
  const activeQuery = query.trim();
  const showNoTypeaheadMatch = activeQuery.length > 0 && options.length === 0;

  function selectChip(chip: IngredientMatcherChip) {
    setSelectedChipIds((current) => (current.includes(chip.id) ? current : [...current, chip.id]));
    setQuery("");
  }

  function removeChip(chipId: string) {
    setSelectedChipIds((current) => current.filter((selectedChipId) => selectedChipId !== chipId));
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (options[0]) {
        selectChip(options[0]);
      }
    }

    if (event.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <section className="cook-with-client" aria-label="Cook with ingredient matcher">
      <div className="cook-with-panel surface">
        <div className="cook-with-controls">
          <div className="cook-with-typeahead">
            <label htmlFor={inputId}>Add a main ingredient</label>
            <div className="cook-with-input-wrap">
              <Search aria-hidden="true" size={18} />
              <input
                id={inputId}
                role="combobox"
                aria-expanded={options.length > 0}
                aria-controls={resultsId}
                aria-label="Add a main ingredient"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Try aloo, paneer, fish, palak"
              />
            </div>
            {options.length > 0 ? (
              <div className="cook-with-options surface" id={resultsId} role="listbox">
                {options.map((chip) => (
                  <button key={chip.id} type="button" role="option" aria-label={chip.label} aria-selected="false" onClick={() => selectChip(chip)}>
                    <span>{chip.label}</span>
                    <small>{chip.kind === "family" ? "Family" : chip.aliases.slice(0, 2).join(", ") || "Ingredient"}</small>
                  </button>
                ))}
              </div>
            ) : null}
            {showNoTypeaheadMatch ? (
              <p className="cook-with-typeahead-note" role="status">
                No matching ingredient. Only curated ingredients are available for now.
              </p>
            ) : null}
          </div>

          <label className="cook-with-section-filter" htmlFor={sectionId}>
            <span>Chapter</span>
            <select id={sectionId} value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)}>
              <option value="">Any chapter</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedChips.length > 0 ? (
          <div className="cook-with-selected" aria-label="Selected ingredients">
            {selectedChips.map((chip) => (
              <button key={chip.id} type="button" className="cook-with-chip" aria-label={`Remove ${chip.label}`} onClick={() => removeChip(chip.id)}>
                <span>{chip.label}</span>
                <X aria-hidden="true" size={14} />
              </button>
            ))}
            <button className="text-button cook-with-clear" type="button" aria-label="Clear all selected ingredients" onClick={() => setSelectedChipIds([])}>
              Clear
            </button>
          </div>
        ) : null}
      </div>

      {selectedChips.length === 0 ? (
        <div className="cook-with-state surface">
          <p className="eyebrow">No ingredients selected</p>
          <h2>Add a few main ingredients to see what fits.</h2>
          <p>Choose from the curated ingredient chips. The matcher will rank recipes that use all of them first, then close matches.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="cook-with-state surface">
          <p className="eyebrow">No recipe results</p>
          <h2>No recipes match those ingredients.</h2>
          <p>Try removing a chip or changing chapter.</p>
        </div>
      ) : (
        <div className="cook-with-results">
          <p className="cook-with-result-count" aria-live="polite">
            {results.length} {results.length === 1 ? "recipe" : "recipes"} ranked for {joinLabels(selectedChips)}
          </p>
          <ul className="cook-with-result-list" aria-label="Cook-with recipe results">
            {results.map((result) => (
              <li key={result.recipe.id}>
                <RecipeCard recipe={result.recipe}>
                  <MatchExplanation exact={result.exact} matched={result.matched} missing={result.missing} />
                </RecipeCard>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
