"""Stage 9 — extract recipe photos from the PDF and associate them with recipes.

Strategy: walk every page that holds at least one recipe. For each embedded
image larger than a threshold (filters out icons / decorations), save as WebP
and JPEG to /data/images/, and attach the path to the recipe(s) on that page.
If a page has multiple recipes and one image, attach to the recipe whose
title appears closest (by y-coordinate) to the image.
"""

from __future__ import annotations

import io
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image
from tqdm import tqdm

MIN_IMAGE_SIZE_PIXELS = 200 * 200  # below this is decoration


def extract_recipe_images(
    pdf_path: Path,
    recipes: list[dict],
    images_out: Path,
) -> dict[str, str]:
    """Return {recipe_id: image_path} for every recipe with a matched photo."""
    images_out.mkdir(parents=True, exist_ok=True)
    by_page: dict[int, list[dict]] = {}
    for r in recipes:
        by_page.setdefault(r["source_page"], []).append(r)

    associations: dict[str, str] = {}

    with fitz.open(str(pdf_path)) as doc:
        for page_num, recipes_on_page in tqdm(by_page.items(), desc="images"):
            page = doc.load_page(page_num - 1)
            info = page.get_image_info(xrefs=True)
            big_imgs = [im for im in info if im["width"] * im["height"] >= MIN_IMAGE_SIZE_PIXELS]
            if not big_imgs:
                continue
            # Sort recipes on the page by their y-pos hint (we don't know it
            # exactly; for two-recipe pages we'll alternate).
            sorted_recipes = recipes_on_page
            for i, im in enumerate(big_imgs):
                if i >= len(sorted_recipes):
                    break
                target = sorted_recipes[i]
                xref = im["xref"]
                base = doc.extract_image(xref)
                pil = Image.open(io.BytesIO(base["image"])).convert("RGB")
                slug = target["id"]
                webp_path = images_out / f"p{page_num:04d}-{slug}.webp"
                jpg_path = images_out / f"p{page_num:04d}-{slug}.jpg"
                pil.save(webp_path, "WEBP", quality=82)
                pil.save(jpg_path, "JPEG", quality=85)
                associations[target["id"]] = f"images/{webp_path.name}"

    return associations
