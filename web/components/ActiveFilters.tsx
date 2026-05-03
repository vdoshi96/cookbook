import { formatTagLabel } from "@/lib/format";
import type { RecipeFilters } from "@/lib/filters";

export function ActiveFilters({ filters }: { filters: RecipeFilters }) {
  const labels = [
    filters.region ? `Region: ${formatTagLabel(filters.region)}` : null,
    filters.mainIngredient ? `Main ingredient: ${formatTagLabel(filters.mainIngredient)}` : null,
    ...(filters.ingredients ?? []).map((ingredient) => `Contains: ${formatTagLabel(ingredient)}`),
    ...(filters.excludedIngredients ?? []).map((ingredient) => `Excludes: ${formatTagLabel(ingredient)}`),
    filters.maxTotalMinutes ? `Under ${filters.maxTotalMinutes} min` : null,
    filters.heatLevel ? `Heat ${filters.heatLevel}` : null,
    ...(filters.dietary ?? []).map((tag) => formatTagLabel(tag)),
    ...(filters.technique ?? []).map((tag) => formatTagLabel(tag))
  ].filter((label): label is string => Boolean(label));

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
