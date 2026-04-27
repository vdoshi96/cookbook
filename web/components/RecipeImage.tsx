import { getCuratedImage, type CuratedImageKind } from "@/lib/curated-images";

/* eslint-disable @next/next/no-img-element -- Curated source URLs are external references with attribution. */

interface RecipeImageProps {
  kind: CuratedImageKind;
  id: string;
  label: string;
  className?: string;
  showAttributionLink?: boolean;
}

export function RecipeImage({ kind, id, label, className, showAttributionLink = true }: RecipeImageProps) {
  const image = getCuratedImage(kind, id, label);
  const classNames = ["recipe-image", className].filter(Boolean).join(" ");

  if (!image.src) {
    return (
      <div className={classNames} role="img" aria-label={image.alt}>
        <span>{label}</span>
      </div>
    );
  }

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
