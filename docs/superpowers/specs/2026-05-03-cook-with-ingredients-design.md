# Cook With Ingredients Design

**Date:** 2026-05-03
**Status:** Approved for spec review
**Repo:** cookbook

## Goal

Add a "Cook with what you have" feature that lets a visitor choose a few main ingredients and see recipes that use them. The feature should feel different from normal cookbook search: the user is not searching for a word, they are asking what they can cook from a small set of ingredients.

The experience should be ingredient-first, transparent about why each recipe appears, and conservative about regional ingredient families so the results feel useful rather than over-smart.

## Approved Product Decisions

- Use a hybrid result model: exact/all-selected ingredient matches first, then close matches.
- Ignore pantry staples, common aromatics, and spices for default matching and missing-ingredient explanations.
- Use curated typeahead chips. Do not allow arbitrary free-text ingredient chips in v1.
- Show matched and missing main ingredients on each recipe card.
- Build a dedicated page at `/cook-with`, rather than folding this into `/search`.
- Support common ingredient families conservatively, with both broad chips and specific chips where obvious.
- Use close-match threshold `max(1, floor(selectedIngredientCount / 2))`.
- Do not support quantities in v1.
- Do not include the full existing search filter set. Only include a chapter/dish-type filter using cookbook sections.
- Keep backend curation and matching metadata in the pipeline/data contract, then hand the frontend a simple static JSON file.

## User Experience

The page title should be a direct "cook from what you have" invitation. The primary control is a typeahead chip input backed by curated choices. Users type an ingredient or regional/common name, select a suggestion, and it becomes a chip.

The typeahead should suggest both broad and specific choices where the family is obvious:

- Broad: Seafood, Dal/Lentils, Gourds, Greens.
- Specific: Fish, Prawns, Chana Dal, Moong Dal, Potato, Eggplant, Paneer.

Users cannot add arbitrary chips in v1. If no curated suggestion matches, show a short "No matching ingredient" state and leave the input editable. The product can expand the curated list over time.

After at least one ingredient is selected, the page shows ranked recipe cards. Each card explains the match with concise text:

- Exact example: `Uses paneer, spinach, potato`
- Close example: `Uses paneer, potato · Also needs spinach`
- Count example is acceptable as supporting copy, but matched/missing names should be visible.

Missing ingredients must mean missing curated main ingredients only. Do not show salt, oil, water, chilli, cumin, garam masala, garlic, ginger, onions, or other excluded staple/noise ingredients as "missing."

The page may include a chapter selector so users can narrow by dish type, such as Vegetables, Fish and Seafood, Meat, Rice, Breads, Snacks and Appetizers, or Chutneys/Raitas. It should not include region, dietary, heat, time, technique, or occasion filters in v1.

## Data Contract

Add a new emitted file:

```text
/data/ingredient-matcher.json
```

Required shape:

```json
{
  "schema_version": 1,
  "chips": [
    {
      "id": "seafood",
      "label": "Seafood",
      "kind": "family",
      "family_id": null,
      "ingredient_slugs": [],
      "aliases": ["seafood"],
      "include_in_missing": false
    },
    {
      "id": "fish",
      "label": "Fish",
      "kind": "ingredient",
      "family_id": "seafood",
      "ingredient_slugs": ["fish", "fish-fillets"],
      "aliases": ["machhli", "machhali", "meen", "mahi"],
      "include_in_missing": true
    }
  ],
  "families": [
    {
      "id": "seafood",
      "label": "Seafood",
      "chip_ids": ["fish", "prawns"],
      "aliases": ["seafood"]
    }
  ],
  "excluded_ingredient_slugs": ["salt", "water", "ghee", "garam-masala"]
}
```

Contract rules:

- Selectable chip id and label.
- `kind` is `"ingredient"` for a specific chip and `"family"` for a broad chip.
- Ingredient slugs from `ingredients.json` that satisfy the chip.
- Aliases for typeahead matching.
- `family_id` is the owning family for ingredient chips and `null` for family chips.
- `families[].chip_ids` lists the ingredient chips satisfied by a broad family chip.
- Slugs excluded from default matching and missing-ingredient explanations.

The pipeline should validate that every referenced ingredient slug exists in `data/ingredients.json` unless it is explicitly marked as an alias only. Validation should fail loudly for stale slugs so taxonomy drift is caught during data generation.

## Curated Taxonomy Seed

The first curation pass should be conservative and reviewable. Suggested selectable chips:

- Proteins: Chicken, Lamb/Mutton, Fish, Prawns/Shrimp, Pork, Eggs.
- Dairy: Paneer, Yoghurt.
- Vegetables: Potato, Eggplant, Cauliflower, Peas, Okra, Tomato, Bell Pepper, Carrot, Cabbage, Mushrooms, Gourds, Bitter Gourd, Taro/Colocasia, Greens, Banana/Plantain, Jackfruit, Radish/Turnip.
- Pulses and grains: Rice, Dal/Lentils, Urad Dal, Chana Dal, Moong Dal, Toor/Arhar Dal, Masoor Dal, Chickpeas, Kidney Beans.
- Flavorful non-staples: Coconut, Nuts, Sweet Corn.

Useful aliases from the corpus and recipe vocabulary:

- Potato: aloo, batata, aloogadda, uralaikizhan.
- Eggplant: aubergine, brinjal, baigan, baingan, vankaya, vengkayya, kathirikkai, kathirakkai, vangi.
- Cauliflower: gobi, phoolgobi, phoolkopi, poongobi.
- Okra: bhindi, vendakkai, bheeda.
- Gourds: lauki, ghiy, kaddu, ash gourd, wax gourd, ribbed gourd, snake gourd.
- Taro/colocasia: arabi, arvi.
- Peas: matar.
- Greens: palak, keerai, methi, mustard greens.
- Chicken: murg, murgh, murga, koli, kozhi, kori, chooza.
- Lamb/mutton: gosht, maas, mutton, keema, raan, boti.
- Fish: machhli, machhali, machhi, maach, maachher, mahi, meen, chapa, ilish, hilsa, karimeen.
- Prawns: jhinga, jhinge, jhingri, royya, roya, royyaalu, chemeen, kolambi.
- Yoghurt: dahi, curd, yogurt.
- Dal: dhal, daal, arhar, toor, toovar, toover, moong, mung, urad, masoor, chana.
- Chickpeas: chana, chole, garbanzo.
- Kidney beans: rajma.
- Paneer: panir, Indian cottage cheese.
- Coconut: nariyal, kobari, thengai, thenga, copra.

Suggested default exclusions:

- Staples, liquids, and fats: salt, water, vegetable oil, ghee, mustard oil, sesame oil, groundnut oil, coconut oil, butter, vinegar.
- Aromatics and garnishes: onion, garlic, garlic paste, ginger, ginger paste, green chilli, dried red chilli, chilli powder, coriander leaves, mint leaves, curry leaves.
- Spices and masalas: turmeric, cumin, coriander, mustard seeds, fenugreek seeds, asafoetida, garam masala, chaat masala, black pepper, cloves, cinnamon, cardamom, bay leaves, mace, nutmeg, saffron, poppy seeds, kalonji, ajwain, fennel, amchoor.
- Generic baking/sweet/noise entries: sugar, jaggery, bicarbonate of soda, baking powder, flour, dough, breadcrumbs, rosewater, kewra water.
- Prepared/cross-recipe entries: chutneys, stock, rasam, spice mixtures.

Items needing human review during curation:

- Lossy slugs such as `skinless` that appear to represent chicken from display text.
- "or" slugs such as `turnips-or-potato` and `red-pepper-or-tomato`.
- Whether morels/guchhi appear as normalized ingredient slugs or only in recipe names.
- Whether lamb stock, bones, offcuts, and organs should satisfy "Lamb/Mutton."
- Whether broad Gourds is useful enough, while still keeping bitter gourd, bottle gourd, pumpkin/ash gourd, and snake/ribbed/wax gourds distinct.
- Whether Yoghurt should be selectable but downweighted when it is mostly a sauce/base ingredient.

## Matching And Ranking

For each recipe, derive a recipe main-ingredient set:

1. Start with `recipe.ingredients[].item`.
2. Normalize to existing ingredient slugs using the same pipeline normalization rules used by `ingredients.json`.
3. Remove `excluded_ingredient_slugs`.
4. Map remaining slugs to matching chips and families.

When a user selects chips:

1. Expand each selected chip to its acceptable ingredient slugs.
2. A recipe is an exact match if every selected chip is satisfied.
3. A recipe is a close match if it satisfies at least `max(1, floor(selectedCount / 2))` selected chips.
4. Exclude recipes below that threshold.

Sort order:

1. Exact matches before close matches.
2. Higher matched selected-chip count before lower count.
3. Fewer missing main ingredients before more missing main ingredients.
4. Stable recipe name/id tie-break.

For card explanations:

- `matched` = selected chips satisfied by the recipe.
- `missing` = curated main chips used by the recipe that the user did not select, limited to a small number for readability.
- Never include excluded slugs as missing.
- Prefer chip labels over raw slugs.

## Backend Implementation Notes

Backend owns the curation source and emitted contract. Suggested implementation:

- Add a curated config file under `pipeline/data/`, for example `ingredient-matcher.yml`.
- Add Pydantic models in `pipeline/src/cookbook_pipeline/schema.py`.
- Add a stage/helper near Stage 8 indexes that builds and validates the matcher output.
- Emit `/data/ingredient-matcher.json` in Stage 10 with the other validated static data.
- Add tests for config validation, stale slug detection, family expansion, exclusions, and a few representative recipes.

Keep curation data easy to review in diffs. YAML is preferable for human-edited taxonomy, while emitted JSON remains the frontend contract.

## Frontend Agent Handoff

Frontend should not re-curate regional ingredient knowledge. It should consume the emitted matcher JSON.

Build:

- Route: `/cook-with`.
- Data inputs: `/data/ingredient-matcher.json`, `/data/recipes.json`, `/data/sections.json`.
- Controls: curated typeahead chip input, selected-chip row, clear/remove actions, chapter selector.
- Results: recipe cards with exact/close grouping implied by ranking, matched ingredients, and missing main ingredients.
- Navigation: add a discoverable link from appropriate site navigation, home/search entry points, or both.

States to implement:

- No ingredients selected: invite the user to add main ingredients.
- No typeahead match: explain that only curated ingredients are available for now.
- No recipe results: suggest removing a chip or changing chapter.
- Results: show ranked recipe cards and match explanations.

Ranking pseudocode:

```ts
const minimumCloseMatches = Math.max(1, Math.floor(selectedChips.length / 2));

for (const recipe of recipes) {
  const matched = selectedChips.filter((chip) => recipeSatisfiesChip(recipe, chip));
  const exact = matched.length === selectedChips.length;

  if (!exact && matched.length < minimumCloseMatches) continue;

  const missing = recipeMainChips(recipe).filter((chip) => !selectedChipSet.has(chip.id));

  results.push({ recipe, exact, matched, missing });
}

results.sort(byExactThenMatchedCountThenMissingCountThenName);
```

Expected frontend tests:

- Typeahead returns aliases and labels, and does not allow arbitrary chips.
- Broad family chip matches child ingredients.
- Specific chip does not accidentally match sibling ingredients.
- Ranking puts exact matches before close matches.
- Threshold behavior: 3 selected allows 1 match; 4 selected requires 2.
- Excluded staples/spices do not appear as missing ingredients.
- Chapter filter narrows results without changing ingredient ranking semantics.
- Page smoke test renders empty, no-match, and results states.

## Verification

Backend verification should include:

- `cd pipeline && pytest`
- Targeted tests for matcher config validation and emitted JSON schema.
- A spot check that representative user inputs work: `potato + paneer`, `fish + coconut`, `chana dal + rice`, `eggplant + yoghurt`.

Frontend verification should include:

- Existing web test suite.
- New ranking/typeahead unit tests.
- A browser check at `/cook-with` for desktop and mobile layouts.
