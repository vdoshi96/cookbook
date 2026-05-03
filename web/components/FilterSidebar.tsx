"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { formatHeatLevel, formatTagLabel } from "@/lib/format";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";

interface FilterSidebarProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
}

interface FilterGroupProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function FilterGroup({ title, defaultOpen = false, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details className="filter-group" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>
        <span className="filter-group-title">{title}</span>
        <ChevronDown className="filter-group-chevron" aria-hidden="true" size={16} />
      </summary>
      <div className="filter-group-body">{children}</div>
    </details>
  );
}

export function FilterSidebar({ options, filters }: FilterSidebarProps) {
  return (
    <aside className="filter-sidebar surface" aria-label="Recipe filters">
      <h2>Filter</h2>
      <FilterGroup title="Region" defaultOpen={Boolean(filters.region)}>
        {options.regions.map((region) => (
          <label key={region.id}>
            <input type="radio" name="region" value={region.id} defaultChecked={filters.region === region.id} />
            {region.name}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Main ingredient" defaultOpen={Boolean(filters.mainIngredient)}>
        <label>
          <span className="visually-hidden">Main ingredient</span>
          <select name="mainIngredient" defaultValue={filters.mainIngredient ?? ""} aria-label="Main ingredient">
            <option value="">Any ingredient</option>
            {options.mainIngredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>
      </FilterGroup>
      <FilterGroup title="Ingredients" defaultOpen={Boolean(filters.ingredients?.length || filters.excludedIngredients?.length)}>
        <label>
          Contains
          <select name="ingredient" multiple defaultValue={filters.ingredients ?? []} aria-label="Contains ingredient">
            {options.ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Excludes
          <select name="excludeIngredient" multiple defaultValue={filters.excludedIngredients ?? []} aria-label="Exclude ingredient">
            {options.ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>
      </FilterGroup>
      <FilterGroup title="Dietary" defaultOpen={Boolean(filters.dietary?.length)}>
        {options.dietary.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="dietary" value={tag} defaultChecked={filters.dietary?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Technique" defaultOpen={Boolean(filters.technique?.length)}>
        {options.techniques.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="technique" value={tag} defaultChecked={filters.technique?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Time" defaultOpen={Boolean(filters.maxTotalMinutes)}>
        <label>
          Maximum total minutes
          <input
            min={1}
            name="maxTime"
            placeholder="Any"
            step={5}
            type="number"
            defaultValue={filters.maxTotalMinutes ?? ""}
          />
        </label>
      </FilterGroup>
      <FilterGroup title="Heat" defaultOpen={Boolean(filters.heatLevel)}>
        <label>
          <input type="radio" name="heat" value="" defaultChecked={!filters.heatLevel} />
          Any heat
        </label>
        {[1, 2, 3].map((level) => (
          <label key={level}>
            <input type="radio" name="heat" value={level} defaultChecked={filters.heatLevel === level} />
            {formatHeatLevel(level)}
          </label>
        ))}
      </FilterGroup>
      <button className="text-button" type="submit">
        Apply filters
      </button>
    </aside>
  );
}
