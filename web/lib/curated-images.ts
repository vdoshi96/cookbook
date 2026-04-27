export type CuratedImageKind = "recipe" | "section" | "region";

export interface CuratedImage {
  id: string;
  kind: CuratedImageKind;
  src: string | null;
  alt: string;
  sourceHref: string | null;
  sourceLabel: string | null;
}

const curatedImages: Record<string, CuratedImage> = {
  "recipe:nargisi-seekh-kebab": {
    id: "nargisi-seekh-kebab",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nargisi_Kofta.JPG",
    alt: "Nargisi kofta served in a dish.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Nargisi_Kofta.JPG",
    sourceLabel: "Wikimedia Commons"
  },
  "recipe:pakoras": {
    id: "pakoras",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pakora.JPG",
    alt: "A plate of pakoras.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Pakora.JPG",
    sourceLabel: "Wikimedia Commons"
  },
  "recipe:khumb-shabnam": {
    id: "khumb-shabnam",
    kind: "recipe",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mushroom_Tikka_Masala_by_Preeti_Tamilarasan.jpg",
    alt: "A mushroom curry in a serving bowl.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Mushroom_Tikka_Masala_by_Preeti_Tamilarasan.jpg",
    sourceLabel: "Wikimedia Commons"
  },
  "section:snacks-and-appetizers": {
    id: "snacks-and-appetizers",
    kind: "section",
    src: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pakoras.jpg",
    alt: "A plate of assorted pakoras.",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Pakoras.jpg",
    sourceLabel: "Wikimedia Commons"
  }
};

export function getCuratedImage(kind: CuratedImageKind, id: string, label: string): CuratedImage {
  const image = curatedImages[`${kind}:${id}`];

  if (image) {
    return image;
  }

  return {
    id,
    kind,
    src: null,
    alt: label,
    sourceHref: null,
    sourceLabel: null
  };
}
