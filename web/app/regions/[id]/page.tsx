import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSideSheet } from "@/components/FilterSideSheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllRegions, getRecipesByRegion, getRegionById } from "@/lib/data";
import { applyRecipeFilters, getRecipeFilterOptions, parseRecipeFilters } from "@/lib/filters";

interface RegionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return getAllRegions().map((region) => ({ id: region.id }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { id } = await params;
  const region = getRegionById(id);

  return {
    title: region?.name ?? "Region"
  };
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

export default async function RegionPage({ params, searchParams }: RegionPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const region = getRegionById(id);

  if (!region) {
    notFound();
  }

  const filters = parseRecipeFilters(toSearchParams(resolvedSearchParams));
  const recipes = getRecipesByRegion(region.id);
  const filteredRecipes = applyRecipeFilters(recipes, filters);
  const filterOptions = getRecipeFilterOptions(recipes);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Region</p>
      <h1 className="section-title">{region.name}</h1>
      <div className="region-map surface" aria-label={`${region.name} map coordinates`}>
        <span>Lat {region.map_coords.lat.toFixed(2)}</span>
        <span>Lng {region.map_coords.lng.toFixed(2)}</span>
      </div>
      <MarkdownBlock markdown={region.intro_markdown} />

      <form className="listing-layout">
        <div className="desktop-filters">
          <FilterSidebar options={filterOptions} filters={filters} />
        </div>
        <div>
          <FilterSideSheet options={filterOptions} filters={filters} />
          <ActiveFilters filters={filters} />
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe.id} />
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
