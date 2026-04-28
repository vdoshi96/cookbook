import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { RecipeImage } from "@/components/RecipeImage";
import { RecipeListingClient } from "@/components/RecipeListingClient";
import { resolveRegionImage } from "@/lib/curated-images";
import { getAllRegions, getRecipesByRegion, getRegionById } from "@/lib/data";

interface RegionPageProps {
  params: Promise<{ id: string }>;
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

export default async function RegionPage({ params }: RegionPageProps) {
  const { id } = await params;
  const region = getRegionById(id);

  if (!region) {
    notFound();
  }

  const recipes = getRecipesByRegion(region.id);
  const image = resolveRegionImage(region);

  return (
    <div className="page-shell listing-page">
      <p className="eyebrow">Region</p>
      <h1 className="section-title">{region.name}</h1>
      <RecipeImage kind="region" id={region.id} label={region.name} image={image} className="listing-hero-image" />
      <MarkdownBlock markdown={region.intro_markdown} />
      <RecipeListingClient recipes={recipes} />
    </div>
  );
}
