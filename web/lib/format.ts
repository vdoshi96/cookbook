import type { IngredientLine } from "./types";

export function formatTotalTime(prepMinutes: number, cookMinutes: number) {
  const total = prepMinutes + cookMinutes;

  if (total < 60) {
    return `${total} min`;
  }

  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export function formatHeatLevel(level: number) {
  if (level <= 0) {
    return "No heat";
  }

  if (level === 1) {
    return "Mild";
  }

  if (level === 2) {
    return "Medium";
  }

  return "Hot";
}

export function formatTagLabel(tag: string) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatIngredientLine(ingredient: IngredientLine) {
  const quantities = [ingredient.qty_metric, ingredient.qty_imperial, ingredient.qty_count].filter(Boolean);
  const quantityText = quantities.length > 0 ? `${quantities.join(" / ")} ` : "";
  const notesText = ingredient.notes ? `, ${ingredient.notes}` : "";

  return `${quantityText}${ingredient.item}${notesText}`;
}
