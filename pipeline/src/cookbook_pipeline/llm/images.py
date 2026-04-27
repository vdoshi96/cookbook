"""Image helpers for the pipeline.

Provides encode_image_for_api(), which reads a PNG file and returns a
base64-encoded string safe to pass to the Anthropic Messages API.

The API enforces a 5 MB limit on base64-encoded image data (5,242,880 bytes).
If the raw PNG exceeds that, we re-encode it as JPEG at decreasing quality
until it fits, falling back to downscaling if compression alone isn't enough.
"""

from __future__ import annotations

import base64
import io
from pathlib import Path

_API_LIMIT_BYTES = 5_242_880  # 5 MiB


def encode_image_for_api(img_path: Path) -> tuple[str, str]:
    """Return (media_type, base64_data) for the image at *img_path*.

    If the raw PNG fits within the 5 MiB API limit it is returned as-is
    (media_type="image/png"). Otherwise it is recompressed as JPEG until it
    fits (media_type="image/jpeg").
    """
    raw = img_path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    if len(b64) <= _API_LIMIT_BYTES:
        return "image/png", b64

    # Need to compress. Import PIL here so the dependency is optional at
    # module import time (avoids hard failures if PIL is absent elsewhere).
    from PIL import Image  # noqa: PLC0415

    img = Image.open(io.BytesIO(raw)).convert("RGB")

    # Try JPEG at descending quality levels.
    for quality in (85, 70, 55, 40, 25):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        if len(b64) <= _API_LIMIT_BYTES:
            return "image/jpeg", b64

    # Last resort: scale the image down by 50% and retry at quality=40.
    w, h = img.size
    img = img.resize((w // 2, h // 2), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=40, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return "image/jpeg", b64
