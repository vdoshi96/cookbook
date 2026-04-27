"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { ActiveSearchFilters, SearchFilterSideSheet, SearchFiltersPanel } from "@/components/SearchFilters";
import { type SearchFilterOptions, type SearchFilters, type SearchKind, searchCookbook } from "@/lib/search";

interface SearchPageClientProps {
  filterOptions: SearchFilterOptions;
  initialFilters: SearchFilters;
  initialQuery: string;
}

function kindLabel(kind: string) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function HiddenFilterInputs({ filters, options }: { filters: SearchFilters; options: SearchFilterOptions }) {
  const kindValues =
    filters.kinds && filters.kinds.length > 0 && filters.kinds.length < options.kinds.length ? filters.kinds : [];

  return (
    <>
      {kindValues.map((kind: SearchKind) => (
        <input key={kind} type="hidden" name="kind" value={kind} />
      ))}
      {filters.region ? <input type="hidden" name="region" value={filters.region} /> : null}
      {filters.section ? <input type="hidden" name="section" value={filters.section} /> : null}
      {filters.maxTotalMinutes ? <input type="hidden" name="maxTime" value={filters.maxTotalMinutes} /> : null}
      {filters.heatLevel ? <input type="hidden" name="heat" value={filters.heatLevel} /> : null}
      {(filters.dietary ?? []).map((tag) => (
        <input key={`dietary:${tag}`} type="hidden" name="dietary" value={tag} />
      ))}
      {(filters.technique ?? []).map((tag) => (
        <input key={`technique:${tag}`} type="hidden" name="technique" value={tag} />
      ))}
      {(filters.occasion ?? []).map((tag) => (
        <input key={`occasion:${tag}`} type="hidden" name="occasion" value={tag} />
      ))}
    </>
  );
}

export function SearchPageClient({ filterOptions, initialFilters, initialQuery }: SearchPageClientProps) {
  const id = useId();
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const results = useMemo(() => searchCookbook(query, 50, filters), [filters, query]);
  const inputId = `${id}-search-page-input`;

  return (
    <section className="search-page-client" aria-labelledby={`${id}-search-page-heading`}>
      <form className="search-page-form" method="get">
        <label id={`${id}-search-page-heading`} htmlFor={inputId}>
          Search recipes, ingredients, regions
        </label>
        <div className="search-page-input-wrap">
          <Search aria-hidden="true" size={19} />
          <input
            id={inputId}
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try paneer, Bengal, chutney"
          />
        </div>
        <HiddenFilterInputs filters={filters} options={filterOptions} />
      </form>

      <div className="search-page-layout">
        <form className="desktop-filters" aria-label="Desktop search filters" method="get">
          <SearchFiltersPanel filters={filters} onFiltersChange={setFilters} options={filterOptions} query={query} />
        </form>
        <div className="search-results-column">
          <SearchFilterSideSheet filters={filters} onFiltersChange={setFilters} options={filterOptions} query={query} />
          <ActiveSearchFilters filters={filters} options={filterOptions} />
          {results.length > 0 ? (
            <ul className="search-result-list" aria-label="Search results">
              {results.map((result) => (
                <li key={`${result.kind}:${result.id}`}>
                  <Link className="search-result-link surface" href={result.href}>
                    <span className="search-result-kind">{kindLabel(result.kind)}</span>
                    <strong>{result.title}</strong>
                    <span>{result.subtitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-page-empty surface">
              <p className="eyebrow">No results yet</p>
              <h2>Try another path through the index.</h2>
              <p>
                Search by a dish, ingredient, region, chapter, or tag. The quick search below can also carry your next
                query into this page.
              </p>
              <SearchBox />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
