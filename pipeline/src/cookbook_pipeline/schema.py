"""Pydantic v2 models for every JSON file the pipeline emits.

The models are the single source of truth for the data contract. Field names,
types, and nullability here MUST match the design spec §6.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    qty_metric: str | None = None
    qty_imperial: str | None = None
    qty_count: str | None = None
    item: str
    notes: str | None = None


class CrossRef(BaseModel):
    name: str
    page: int
    id: str | None = None  # filled in by Stage 5


class Recipe(BaseModel):
    schema_version: int = 1
    id: str
    name: str
    subtitle: str | None = None
    section_id: str
    section_name: str
    origin_region_id: str
    origin_region_name: str
    prep_minutes: int | None = None
    prep_notes: str | None = None
    cook_minutes: int | None = None
    cook_notes: str | None = None
    serves: int | None = None
    heat_level: int = Field(ge=0, le=3)
    dietary_tags: list[str] = Field(default_factory=list)
    technique_tags: list[str] = Field(default_factory=list)
    occasion_tags: list[str] = Field(default_factory=list)
    ingredients: list[Ingredient]
    instructions: list[str]
    cross_refs: list[CrossRef] = Field(default_factory=list)
    source_page: int
    image: str | None = None


class StartHerePick(BaseModel):
    id: str
    rationale: str


class Section(BaseModel):
    id: str
    name: str
    intro_markdown: str
    page_range: tuple[int, int]
    recipe_ids: list[str]
    start_here: list[StartHerePick] = Field(default_factory=list)
    hero_image: str | None = None


class SectionsFile(BaseModel):
    schema_version: int = 1
    sections: list[Section]


class MapCoords(BaseModel):
    lat: float
    lng: float


class Region(BaseModel):
    id: str
    name: str
    intro_markdown: str
    recipe_ids: list[str]
    map_coords: MapCoords | None = None


class RegionsFile(BaseModel):
    schema_version: int = 1
    regions: list[Region]


class IngredientEntry(BaseModel):
    display_name: str
    recipe_ids: list[str]
    count: int


class IngredientsFile(BaseModel):
    schema_version: int = 1
    ingredients: dict[str, IngredientEntry]


class TagEntry(BaseModel):
    kind: str  # "dietary" | "technique" | "occasion"
    recipe_ids: list[str]
    count: int


class TagsFile(BaseModel):
    schema_version: int = 1
    tags: dict[str, TagEntry]


class GraphEdge(BaseModel):
    from_: str = Field(alias="from")
    to: str
    kind: str = "uses"

    model_config = {"populate_by_name": True}


class GraphFile(BaseModel):
    schema_version: int = 1
    edges: list[GraphEdge]
    used_in: dict[str, list[str]]


class FrontMatterSection(BaseModel):
    title: str
    markdown: str


class RegionsOverview(FrontMatterSection):
    map_image: str | None = None


class FrontMatterFile(BaseModel):
    schema_version: int = 1
    introduction: FrontMatterSection
    history: FrontMatterSection
    ayurveda: FrontMatterSection
    regions_overview: RegionsOverview
    notes_on_recipes: FrontMatterSection


class RecipesFile(BaseModel):
    schema_version: int = 1
    recipes: list[Recipe]
