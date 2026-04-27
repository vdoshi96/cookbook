import type { Metadata } from "next";
import { SearchPageClient } from "@/components/SearchPageClient";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Search"
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

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
      <SearchPageClient initialQuery={q ?? ""} />
    </div>
  );
}
