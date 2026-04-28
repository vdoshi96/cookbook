import { getCuratedImage, type CuratedImage, type CuratedImageKind } from "@/lib/curated-images";

/* eslint-disable @next/next/no-img-element -- Curated source URLs are external references with attribution. */

interface RecipeImageProps {
  kind: CuratedImageKind;
  id: string;
  label: string;
  className?: string;
  image?: CuratedImage;
  showAttributionLink?: boolean;
}

export function RecipeImage({ kind, id, label, className, image: resolvedImage, showAttributionLink = true }: RecipeImageProps) {
  const image = resolvedImage ?? getCuratedImage(kind, id, label);
  const classNames = ["recipe-image", className].filter(Boolean).join(" ");

  return (
    <figure className={classNames}>
      <img src={image.src} alt={image.alt} loading="lazy" />
      {image.sourceHref && image.sourceLabel ? (
        <figcaption>
          {showAttributionLink ? <a href={image.sourceHref}>{image.sourceLabel}</a> : <span>{image.sourceLabel}</span>}
        </figcaption>
      ) : null}
    </figure>
  );
}
