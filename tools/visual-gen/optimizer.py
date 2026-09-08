"""Preserve the pixel grid: nearest-neighbour resize and lossless WebP."""
from pathlib import Path


def optimize(source, destination):
    from PIL import Image
    source, destination = Path(source), Path(destination)
    with Image.open(source) as image:
        if image.width * 7 != image.height * 10:
            raise ValueError("Canonical plate must have the 10:7 compositor aspect ratio. Regenerate; do not crop away world facts.")
        result = image.convert("RGB").resize((640, 448), Image.Resampling.NEAREST)
        result.save(destination, "WEBP", lossless=True, method=6)
    raw_bytes, optimized_bytes = source.stat().st_size, destination.stat().st_size
    if optimized_bytes > 150_000:
        destination.unlink()
        raise ValueError("Optimized asset exceeds 150 KB. Revisit the palette or texture density before approval.")
    return {"rawBytes": raw_bytes, "optimizedBytes": optimized_bytes, "reductionPercent": round((1 - optimized_bytes / raw_bytes) * 100, 2)}
