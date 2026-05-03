export function recipePath(id: string) {
  return `/recipes/${encodeURIComponent(id)}`;
}

export function sectionPath(id: string) {
  return `/sections/${encodeURIComponent(id)}`;
}

export function regionPath(id: string) {
  return `/regions/${encodeURIComponent(id)}`;
}

export function ingredientPath(slug: string) {
  return `/ingredients/${encodeURIComponent(slug)}`;
}

export function searchPath(query?: string) {
  if (!query) {
    return "/search";
  }

  return `/search?q=${encodeURIComponent(query)}`;
}

export function cookWithPath() {
  return "/cook-with";
}
