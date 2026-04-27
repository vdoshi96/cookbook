import { formatTagLabel } from "@/lib/format";
import type { RecipeFilterOptions, RecipeFilters } from "@/lib/filters";

interface FilterSidebarProps {
  options: RecipeFilterOptions;
  filters: RecipeFilters;
}

export function FilterSidebar({ options, filters }: FilterSidebarProps) {
  return (
    <aside className="filter-sidebar surface" aria-label="Recipe filters">
      <h2>Filter</h2>
      <div className="filter-group">
        <h3>Region</h3>
        {options.regions.map((region) => (
          <label key={region.id}>
            <input type="radio" name="region" value={region.id} defaultChecked={filters.region === region.id} />
            {region.name}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Dietary</h3>
        {options.dietary.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="dietary" value={tag} defaultChecked={filters.dietary?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Technique</h3>
        {options.techniques.map((tag) => (
          <label key={tag}>
            <input type="checkbox" name="technique" value={tag} defaultChecked={filters.technique?.includes(tag)} />
            {formatTagLabel(tag)}
          </label>
        ))}
      </div>
      <button className="text-button" type="submit">
        Apply filters
      </button>
    </aside>
  );
}
