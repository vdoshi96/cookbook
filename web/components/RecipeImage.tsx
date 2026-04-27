import { getCuratedImage, type CuratedImageKind } from "@/lib/curated-images";

/* eslint-disable @next/next/no-img-element -- Curated source URLs are external references with attribution. */

interface RecipeImageProps {
  kind: CuratedImageKind;
  id: string;
  label: string;
  className?: string;
}

export function RecipeImage({ kind, id, label, className }: RecipeImageProps) {
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
          <a href={image.sourceHref}>{image.sourceLabel}</a>
        </figcaption>
      ) : null}
    </figure>
  );
}
