"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { searchCookbook } from "@/lib/search";

interface SearchPageClientProps {
  initialQuery: string;
}

function kindLabel(kind: string) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function SearchPageClient({ initialQuery }: SearchPageClientProps) {
  const id = useId();
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchCookbook(query, 50), [query]);
  const inputId = `${id}-search-page-input`;

  return (
    <section className="search-page-client" aria-labelledby={`${id}-search-page-heading`}>
      <div className="search-page-form">
        <label id={`${id}-search-page-heading`} htmlFor={inputId}>
          Search recipes, ingredients, regions
        </label>
        <div className="search-page-input-wrap">
          <Search aria-hidden="true" size={19} />
          <input
            id={inputId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try paneer, Bengal, chutney"
          />
        </div>
      </div>

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
    </section>
  );
}
