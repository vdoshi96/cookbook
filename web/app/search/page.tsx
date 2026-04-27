import type { Metadata } from "next";
import { SearchPageClient } from "@/components/SearchPageClient";
import { getSearchFilterOptions, parseSearchFilters } from "@/lib/search";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Search"
};

function normalizeQueryParam(query: string | string[] | undefined) {
  if (Array.isArray(query)) {
    return query[0] ?? "";
  }

  return query ?? "";
}

function toSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseSearchFilters(toSearchParams(resolvedSearchParams));

  return (
    <div className="page-shell search-page">
      <header className="search-page-hero">
        <p className="eyebrow">Index</p>
        <h1 className="section-title">Search the Cookbook</h1>
        <p className="lede">
          Look up recipes by name, follow ingredients across chapters, or find regional threads woven through the
          collection.
        </p>
      </header>
      <SearchPageClient
        filterOptions={getSearchFilterOptions()}
        initialFilters={filters}
        initialQuery={normalizeQueryParam(resolvedSearchParams.q)}
      />
    </div>
  );
}
