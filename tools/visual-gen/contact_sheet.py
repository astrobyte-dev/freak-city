"""A labelled local comparison sheet; never a canonical room image."""
import math
from source_provenance import is_source_import
from pathlib import Path


def contact_sheet(candidates, destination):
    from PIL import Image, ImageDraw
    columns = min(4, len(candidates))
    if not columns:
        raise ValueError("A contact sheet needs candidates")
    rows = math.ceil(len(candidates) / columns)
    sheet = Image.new("RGB", (columns * 260, rows * 213 + 30), (19, 23, 30))
    draw = ImageDraw.Draw(sheet)
    role = candidates[0].get("metadata", {}).get("role", "texture")
    draw.text((12, 9), f"DRAFT / {role.upper()} / HUMAN REVIEW REQUIRED", fill=(225, 215, 190))
    for index, candidate in enumerate(candidates):
        x, y = (index % columns) * 260 + 8, (index // columns) * 213 + 35
        with Image.open(candidate["path"]) as raw:
            raw.thumbnail((244, 171), Image.Resampling.NEAREST)
            sheet.paste(raw.convert("RGB"), (x, y))
        external = is_source_import(candidate.get("metadata", {}))
        source_label = candidate.get("metadata", {}).get("sourceType", "source image").replace("external-reviewed-edit", "external edit")
        label = (f"{index+1:02} / {candidate['metadata']['generationSettings']['colors']} colours / {source_label}" if external
                 else f"{index+1:02} / seed {candidate['seed']} / {candidate['backend']}")
        draw.text((x, y + 177), label, fill=(225, 215, 190))
        settings = candidate.get("metadata", {}).get("generationSettings", {})
        if "controlnetConditioningScale" in settings:
            draw.text((x, y + 192), f"control {settings['controlnetConditioningScale']:.2f} / denoise {settings['strength']:.2f}", fill=(156,188,176))
        elif "strength" in settings:
            draw.text((x, y + 192), f"denoise {settings['strength']:.2f} / {settings['effectiveSteps']} effective steps", fill=(156, 188, 176))
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "WEBP", lossless=True)
    return destination
