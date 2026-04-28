import type { Metadata } from "next";
import { AlphabeticalReference, type ReferenceEntry } from "@/components/AlphabeticalReference";
import { getAllRecipes } from "@/lib/data";
import { recipePath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Directory"
};

function directoryEntries(): ReferenceEntry[] {
  return getAllRecipes().map((recipe) => ({
    id: recipe.id,
    label: recipe.name,
    href: recipePath(recipe.id),
    columns: [
      { label: "Recipe", value: recipe.name },
      { label: "Chapter", value: recipe.section_name },
      { label: "Region", value: recipe.origin_region_name }
    ]
  }));
}

export default function DirectoryPage() {
  return (
    <div className="page-shell reference-page">
      <header className="browse-page-header">
        <p className="eyebrow">Reference</p>
        <h1 className="section-title">Recipe Directory</h1>
        <p className="lede">All recipes in one alphabetical directory.</p>
      </header>
      <AlphabeticalReference entries={directoryEntries()} label="directory" />
    </div>
  );
}
