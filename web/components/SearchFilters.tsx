"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatHeatLevel, formatTagLabel } from "@/lib/format";
import {
  type SearchFilterOptions,
  type SearchFilters,
  type SearchKind,
  searchFiltersAreActive
} from "@/lib/search";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  options: SearchFilterOptions;
  query: string;
}

function selectedKinds(filters: SearchFilters, options: SearchFilterOptions) {
  return new Set(filters.kinds ?? options.kinds.map((kind) => kind.id));
}

function setListValue(values: string[] | undefined, value: string, checked: boolean) {
  const next = new Set(values ?? []);

  if (checked) {
    next.add(value);
  } else {
    next.delete(value);
  }

  return Array.from(next).sort();
}

function labelFor(options: Array<{ id: string; name: string }>, value: string) {
  return options.find((option) => option.id === value)?.name ?? formatTagLabel(value);
}

function clearUrl(query: string) {
  if (!query.trim()) {
    return "/search";
  }

  const params = new URLSearchParams({ q: query });

  return `/search?${params.toString()}`;
}

function filterLabels(filters: SearchFilters, options: SearchFilterOptions) {
  const allKindCount = options.kinds.length;
  const kindLabels =
    filters.kinds && filters.kinds.length > 0 && filters.kinds.length < allKindCount
      ? filters.kinds.map((kind) => `Type: ${options.kinds.find((option) => option.id === kind)?.label ?? kind}`)
      : [];

  return [
    ...kindLabels,
    filters.region ? `Region: ${labelFor(options.regions, filters.region)}` : null,
    filters.section ? `Section: ${labelFor(options.sections, filters.section)}` : null,
    filters.maxTotalMinutes ? `Under ${filters.maxTotalMinutes} min` : null,
    filters.heatLevel ? `Heat: ${formatHeatLevel(filters.heatLevel)}` : null,
    ...(filters.dietary ?? []).map((tag) => `Dietary: ${formatTagLabel(tag)}`),
    ...(filters.technique ?? []).map((tag) => `Technique: ${formatTagLabel(tag)}`),
    ...(filters.occasion ?? []).map((tag) => `Occasion: ${formatTagLabel(tag)}`)
  ].filter((label): label is string => Boolean(label));
}

export function ActiveSearchFilters({ filters, options }: Pick<SearchFiltersProps, "filters" | "options">) {
  const labels = filterLabels(filters, options);

  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="active-filters" aria-label="Active filters">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

export function SearchFiltersPanel({ filters, onFiltersChange, options, query }: SearchFiltersProps) {
  const selectedKindSet = useMemo(() => selectedKinds(filters, options), [filters, options]);
  const filtersActive = searchFiltersAreActive(filters);

  function update(nextFilters: SearchFilters) {
    onFiltersChange(nextFilters);
  }

  function toggleKind(kind: SearchKind, checked: boolean) {
    const nextKinds = selectedKinds(filters, options);

    if (checked) {
      nextKinds.add(kind);
    } else if (nextKinds.size > 1) {
      nextKinds.delete(kind);
    }

    const nextKindList = Array.from(nextKinds);
    update({
      ...filters,
      kinds: nextKindList.length === options.kinds.length ? undefined : nextKindList
    });
  }

  function clearFilters() {
    update({});

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", clearUrl(query));
    }
  }

  return (
    <aside className="filter-sidebar search-filter-panel surface" aria-label="Search filters">
      <input type="hidden" name="q" value={query} />
      <div className="search-filter-heading">
        <h2>Filter</h2>
        {filtersActive ? (
          <button className="text-button" type="button" aria-label="Clear filters" onClick={clearFilters}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="filter-group">
        <h3>Result type</h3>
        {options.kinds.map((kind) => (
          <label key={kind.id}>
            <input
              type="checkbox"
              name="kind"
              value={kind.id}
              checked={selectedKindSet.has(kind.id)}
              onChange={(event) => toggleKind(kind.id, event.target.checked)}
            />
            {kind.label}
          </label>
        ))}
      </div>

      {options.regions.length > 0 ? (
        <div className="filter-group">
          <h3>Region</h3>
          <label>
            <input
              type="radio"
              name="region"
              value=""
              checked={!filters.region}
              onChange={() => update({ ...filters, region: undefined })}
            />
            Any region
          </label>
          {options.regions.map((region) => (
            <label key={region.id}>
              <input
                type="radio"
                name="region"
                value={region.id}
                checked={filters.region === region.id}
                onChange={() => update({ ...filters, region: region.id })}
              />
              {region.name}
            </label>
          ))}
        </div>
      ) : null}

      {options.sections.length > 0 ? (
        <div className="filter-group">
          <h3>Section</h3>
          <label>
            <input
              type="radio"
              name="section"
              value=""
              checked={!filters.section}
              onChange={() => update({ ...filters, section: undefined })}
            />
            Any section
          </label>
          {options.sections.map((section) => (
            <label key={section.id}>
              <input
                type="radio"
                name="section"
                value={section.id}
                checked={filters.section === section.id}
                onChange={() => update({ ...filters, section: section.id })}
              />
              {section.name}
            </label>
          ))}
        </div>
      ) : null}

      <div className="filter-group">
        <h3>Time</h3>
        <label>
          Maximum total minutes
          <input
            min={1}
            name="maxTime"
            placeholder="Any"
            step={5}
            type="number"
            value={filters.maxTotalMinutes ?? ""}
            onChange={(event) =>
              update({
                ...filters,
                maxTotalMinutes: event.target.value ? Number(event.target.value) : undefined
              })
            }
          />
        </label>
      </div>

      {options.heatLevels.length > 0 ? (
        <div className="filter-group">
          <h3>Heat</h3>
          <label>
            <input
              type="radio"
              name="heat"
              value=""
              checked={!filters.heatLevel}
              onChange={() => update({ ...filters, heatLevel: undefined })}
            />
            Any heat
          </label>
          {options.heatLevels.map((level) => (
            <label key={level}>
              <input
                type="radio"
                name="heat"
                value={level}
                checked={filters.heatLevel === level}
                onChange={() => update({ ...filters, heatLevel: level })}
              />
              {formatHeatLevel(level)}
            </label>
          ))}
        </div>
      ) : null}

      {options.dietary.length > 0 ? (
        <div className="filter-group">
          <h3>Dietary</h3>
          {options.dietary.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                name="dietary"
                value={tag}
                checked={filters.dietary?.includes(tag) ?? false}
                onChange={(event) => update({ ...filters, dietary: setListValue(filters.dietary, tag, event.target.checked) })}
              />
              {formatTagLabel(tag)}
            </label>
          ))}
        </div>
      ) : null}

      {options.techniques.length > 0 ? (
        <div className="filter-group">
          <h3>Technique</h3>
          {options.techniques.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                name="technique"
                value={tag}
                checked={filters.technique?.includes(tag) ?? false}
                onChange={(event) => update({ ...filters, technique: setListValue(filters.technique, tag, event.target.checked) })}
              />
              {formatTagLabel(tag)}
            </label>
          ))}
        </div>
      ) : null}

      {options.occasions.length > 0 ? (
        <div className="filter-group">
          <h3>Occasion</h3>
          {options.occasions.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                name="occasion"
                value={tag}
                checked={filters.occasion?.includes(tag) ?? false}
                onChange={(event) => update({ ...filters, occasion: setListValue(filters.occasion, tag, event.target.checked) })}
              />
              {formatTagLabel(tag)}
            </label>
          ))}
        </div>
      ) : null}

      <button className="text-button" type="submit">
        Apply filters
      </button>
    </aside>
  );
}

export function SearchFilterSideSheet(props: SearchFiltersProps) {
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
    <div className="filter-sheet-wrap search-filter-sheet-wrap">
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
            aria-label="Search filters"
            ref={sheetRef}
            onKeyDown={handleSheetKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="icon-button filter-close" type="button" aria-label="Close filters" ref={closeButtonRef} onClick={closeSheet}>
              <X aria-hidden="true" size={18} />
            </button>
            <form aria-label="Mobile search filters" method="get">
              <SearchFiltersPanel {...props} />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
