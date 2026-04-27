"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { searchPath } from "@/lib/routes";
import { searchCookbook } from "@/lib/search";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCookbook(query, 6), [query]);

  return (
    <div className="search-box">
      <label className="visually-hidden" htmlFor="global-search">
        Search recipes, ingredients, regions
      </label>
      <div className="search-input-wrap">
        <Search aria-hidden="true" size={18} />
        <input
          id="global-search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="global-search-results"
          aria-label="Search recipes, ingredients, regions"
          placeholder="Search recipes, ingredients, regions"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Link className="search-submit" href={searchPath(query)}>
          Search
        </Link>
      </div>
      {results.length > 0 ? (
        <div className="search-suggestions surface" id="global-search-results" role="listbox">
          {results.map((result) => (
            <Link key={`${result.kind}:${result.id}`} href={result.href} role="option">
              <span>{result.title}</span>
              <small>{result.subtitle}</small>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
