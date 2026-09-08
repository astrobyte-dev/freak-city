"""A labelled local comparison sheet; never a canonical room image."""
import math
from pathlib import Path


def contact_sheet(candidates, destination):
    from PIL import Image, ImageDraw
    columns = min(4, len(candidates))
    if not columns:
        raise ValueError("A contact sheet needs candidates")
    rows = math.ceil(len(candidates) / columns)
    sheet = Image.new("RGB", (columns * 260, rows * 213 + 30), (19, 23, 30))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 9), "DRAFT CANDIDATES / HUMAN REVIEW REQUIRED", fill=(225, 215, 190))
    for index, candidate in enumerate(candidates):
        x, y = (index % columns) * 260 + 8, (index // columns) * 213 + 35
        with Image.open(candidate["path"]) as raw:
            raw.thumbnail((244, 171), Image.Resampling.NEAREST)
            sheet.paste(raw.convert("RGB"), (x, y))
        label = f"{index+1:02} / seed {candidate['seed']} / {candidate['backend']}"
        draw.text((x, y + 177), label, fill=(225, 215, 190))
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(destination, "WEBP", lossless=True)
    return destination
