import type { Metadata } from "next";
import Link from "next/link";
import { RecipeImage } from "@/components/RecipeImage";
import { resolveRegionImage } from "@/lib/curated-images";
import { getAllRegions } from "@/lib/data";
import { regionPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Regions"
};

export default function RegionsPage() {
  const regions = getAllRegions();

  return (
    <div className="page-shell browse-page">
      <header className="browse-page-header">
        <p className="eyebrow">Regions</p>
        <h1 className="section-title">Regions</h1>
        <p className="lede">
          Explore the regional threads that run through the cookbook, from royal kitchens and coastal cooking to everyday
          dishes rooted in local ingredients.
        </p>
      </header>

      <section className="page-section" aria-labelledby="regions-heading">
        <div className="section-heading">
          <p className="eyebrow">Regional map</p>
          <h2 id="regions-heading">Cookbook regions</h2>
        </div>
        <div className="region-grid">
          {regions.map((region) => {
            const image = resolveRegionImage(region);

            return (
              <Link aria-label={region.name} className="region-tile surface" href={regionPath(region.id)} key={region.id}>
                <RecipeImage
                  kind="region"
                  id={region.id}
                  label={region.name}
                  image={image}
                  className="region-tile-image"
                  showAttributionLink={false}
                />
                <h3>{region.name}</h3>
                <p>{region.intro_markdown}</p>
                <span>
                  {region.recipe_ids.length} {region.recipe_ids.length === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
