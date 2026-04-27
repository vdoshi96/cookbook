"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";
import { FilterSidebar } from "./FilterSidebar";

interface FilterSideSheetProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
}

export function FilterSideSheet({ options, filters }: FilterSideSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="filter-sheet-wrap">
      <button className="filter-open-button" type="button" onClick={() => setOpen(true)}>
        <SlidersHorizontal aria-hidden="true" size={16} />
        Filter
      </button>
      {open ? (
        <div className="filter-sheet" role="dialog" aria-modal="true" aria-label="Recipe filters">
          <button className="icon-button filter-close" type="button" aria-label="Close filters" onClick={() => setOpen(false)}>
            <X aria-hidden="true" size={18} />
          </button>
          <FilterSidebar options={options} filters={filters} />
        </div>
      ) : null}
    </div>
  );
}
