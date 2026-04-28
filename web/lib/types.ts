export interface IngredientLine {
  qty_metric: string | null;
  qty_imperial: string | null;
  qty_count: string | null;
  item: string;
  notes: string | null;
}

export interface CrossReference {
  name: string;
  page: number;
  id: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  section_id: string;
  section_name: string;
  origin_region_id: string;
  origin_region_name: string;
  prep_minutes: number;
  prep_notes: string | null;
  cook_minutes: number;
  cook_notes: string | null;
  serves: number;
  heat_level: number;
  dietary_tags: string[];
  technique_tags: string[];
  occasion_tags: string[];
  ingredients: IngredientLine[];
  instructions: string[];
  cross_refs: CrossReference[];
  source_page: number;
  image: string | null;
}

export interface SectionStartHere {
  id: string;
  rationale: string;
}

export interface Section {
  id: string;
  name: string;
  intro_markdown: string;
  page_range: [number, number];
  recipe_ids: string[];
  start_here: SectionStartHere[];
  hero_image: string | null;
}

export interface Region {
  id: string;
  name: string;
  intro_markdown: string;
  recipe_ids: string[];
  map_coords: {
    lat: number;
    lng: number;
  } | null;
  hero_image: string | null;
}

export interface IngredientRecord {
  slug: string;
  display_name: string;
  recipe_ids: string[];
  count: number;
}

export type TagKind = "dietary" | "technique" | "occasion";

export interface TagRecord {
  slug: string;
  kind: TagKind;
  recipe_ids: string[];
  count: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: "uses";
}

export interface FrontMatterSection {
  title: string;
  markdown: string;
}

export interface RegionsOverviewSection extends FrontMatterSection {
  map_image: string | null;
}

export interface FrontMatter {
  introduction: FrontMatterSection;
  history: FrontMatterSection;
  ayurveda: FrontMatterSection;
  regions_overview: RegionsOverviewSection;
  notes_on_recipes: FrontMatterSection;
}

export interface StartHereRecipe {
  id: string;
  rationale: string;
  recipeName: string;
}
