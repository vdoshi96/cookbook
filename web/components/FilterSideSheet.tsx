"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";
import { FilterSidebar } from "./FilterSidebar";

interface FilterSideSheetProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
  query?: string;
}

export function FilterSideSheet({ options, filters, query }: FilterSideSheetProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  function closeSheet() {
    setOpen(false);
    openButtonRef.current?.focus();
  }

  function handleSheetKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      sheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <div className="filter-sheet-wrap">
      <button className="filter-open-button" type="button" ref={openButtonRef} onClick={() => setOpen(true)}>
        <SlidersHorizontal aria-hidden="true" size={16} />
        Filter
      </button>
      {open ? (
        <div className="filter-sheet-backdrop" role="presentation" onClick={closeSheet}>
          <div
            className="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Recipe filters"
            ref={sheetRef}
            onKeyDown={handleSheetKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="icon-button filter-close" type="button" aria-label="Close filters" ref={closeButtonRef} onClick={closeSheet}>
              <X aria-hidden="true" size={18} />
            </button>
            <form aria-label="Mobile recipe filters" method="get">
              {query ? <input type="hidden" name="q" value={query} /> : null}
              <FilterSidebar options={options} filters={filters} />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
