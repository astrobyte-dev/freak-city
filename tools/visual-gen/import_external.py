"""Import an external canonical source and palette comparisons as unapproved drafts.

No inference, implicit framing, shipping writes, or fabricated generation settings.
"""
import argparse
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path

from PIL import Image, ImageOps, __version__ as pillow_version
from generator import VERSION, retro_crunch, display_upscale
from layout_reference import digest
from prompt_builder import build_prompt
from contact_sheet import contact_sheet

SOURCE_TYPE = "external-reviewed-edit"


def opaque_image(data):
    with Image.open(io.BytesIO(data)) as image:
        if image.format not in ("PNG", "JPEG", "WEBP") or getattr(image, "n_frames", 1) != 1:
            raise ValueError("External sources must be single-frame PNG, JPEG or WebP")
        if image.convert("RGBA").getextrema()[-1] != (255, 255):
            raise ValueError("Canonical room sources must be opaque")
        return ImageOps.exif_transpose(image).convert("RGB")


def frame_source(image, crop):
    if crop is None:
        crop = [0, 0, image.width, image.height]
    if (len(crop) != 4 or any(type(v) is not int for v in crop)
            or not 0 <= crop[0] < crop[2] <= image.width
            or not 0 <= crop[1] < crop[3] <= image.height):
        raise ValueError("Crop must be four integer bounds inside the oriented source")
    width, height = crop[2] - crop[0], crop[3] - crop[1]
    if width * 7 != height * 10 or width < 320:
        raise ValueError("Explicit reviewed crop must be 10:7 and at least 320 pixels wide; no implicit stretch or crop")
    return image.crop(crop), list(crop)


def record(stage, path):
    return {"file": path.relative_to(stage).as_posix(), "sha256": digest(path.read_bytes()), "bytes": path.stat().st_size}


def checked_record(stage, item):
    path = (stage / item["file"]).resolve()
    if not path.is_relative_to(stage.resolve()) or digest(path.read_bytes()) != item["sha256"]:
        raise ValueError("External provenance changed or leaves the candidate directory")
    return path


def validate_external_provenance(stage, meta):
    """Check the retained input and reproduce framing/master/display before review."""
    stage = Path(stage).resolve()
    if (meta.get("sourceType") != SOURCE_TYPE or meta.get("backend") != SOURCE_TYPE
            or meta.get("modelExecuted") is not False or meta.get("model") is not None
            or meta.get("seed") is not None or not meta.get("architectureReviewRequired")):
        raise ValueError("External draft must retain honest source identity and architecture review requirements")
    provenance = meta["provenance"]
    if provenance.get("origin") != SOURCE_TYPE or not all(provenance.get(k, "").strip() for k in ("editor", "service", "notes")):
        raise ValueError("External editor, service and notes are required")
    for key in ("originalSource", "sourceImage", "unquantizedMaster", "pixelSource", "worldManifest"):
        checked_record(stage, meta[key])
    if provenance.get("parentSource"):
        checked_record(stage, provenance["parentSource"])
    manifest = json.loads(checked_record(stage, meta["worldManifest"]).read_text(encoding="utf-8"))
    spec = build_prompt(manifest, role="canonical-room")
    for key in ("roomId", "role", "variantId", "layer", "bakedEntities", "reviewContract", "requiredFacts", "forbiddenFacts"):
        if meta[key] != spec[key]:
            raise ValueError("External draft differs from its retained world contract")
    original = opaque_image(checked_record(stage, meta["originalSource"]).read_bytes())
    framing = meta["framing"]
    if not framing.get("notes", "").strip() or framing.get("method") != "explicit-crop":
        raise ValueError("External source requires documented framing")
    framed, crop = frame_source(original, framing["crop"])
    if framing["orientedSourceDimensions"] != list(original.size) or framing["framedDimensions"] != list(framed.size):
        raise ValueError("External framing dimensions changed")
    settings = meta["generationSettings"]
    if (settings.get("pixelWidth") != 320 or settings.get("displayWidth") != 640
            or settings.get("colors") not in (48, 64) or not math.isfinite(settings["contrast"])
            or not 0.5 <= settings["contrast"] <= 2
            or (settings.get("width"), settings.get("height")) != framed.size
            or settings.get("resampling") != "nearest-neighbour"
            or settings.get("quantization") != "Pillow MEDIANCUT"
            or meta.get("dimensions") != {"width": 640, "height": 448}
            or meta.get("pixelDimensions") != {"width": 320, "height": 224}):
        raise ValueError("External canonical outputs require 320 to 640 and 48/64 colours")
    expected = {
        "sourceImage": framed,
        "unquantizedMaster": framed.resize((320, 224), Image.Resampling.NEAREST),
        "pixelSource": retro_crunch(framed, 320, settings["colors"], settings["contrast"]),
    }
    for key, image in expected.items():
        with Image.open(checked_record(stage, meta[key])) as actual:
            if actual.size != image.size or actual.convert("RGB").tobytes() != image.tobytes():
                raise ValueError(f"External {key} does not reproduce its source and settings")
    return display_upscale(expected["pixelSource"], 640)


def import_external(manifest, source, output, editor, service, notes, framing_notes,
                    crop=None, colors=(48, 64), contrast=1.15, parent_source=None, edit_prompt=None):
    if not all(isinstance(v, str) and v.strip() for v in (editor, service, notes, framing_notes)):
        raise ValueError("Editor, service, source notes and framing notes are required")
    if (not colors or any(type(c) is not int or c not in (48, 64) for c in colors)
            or len(set(colors)) != len(colors) or not math.isfinite(contrast) or not 0.5 <= contrast <= 2):
        raise ValueError("Use distinct 48/64 palettes and finite contrast 0.5..2")
    manifest_bytes = Path(manifest).read_bytes()
    spec = build_prompt(json.loads(manifest_bytes), role="canonical-room")
    source = Path(source)
    source_bytes = source.read_bytes()
    image = opaque_image(source_bytes)
    framed, crop = frame_source(image, crop)
    parent_bytes = Path(parent_source).read_bytes() if parent_source else None
    if parent_bytes:
        opaque_image(parent_bytes)
    identity = {"source": digest(source_bytes), "manifest": digest(manifest_bytes), "crop": crop,
                "colors": list(colors), "contrast": contrast, "editor": editor, "service": service,
                "notes": notes, "framingNotes": framing_notes, "editPrompt": edit_prompt,
                "parent": digest(parent_bytes) if parent_bytes else None, "pipeline": VERSION,
                "pillow": pillow_version}
    run_id = digest(json.dumps(identity, sort_keys=True).encode())[:12]
    stage = Path(output).resolve() / "raw" / run_id
    stage.mkdir(parents=True, exist_ok=False)  # Never overwrite original or earlier experiments.
    for folder in ("sources", "pixels", "provenance"):
        (stage / folder).mkdir()
    original = stage / "sources" / ("original" + source.suffix.lower())
    original.write_bytes(source_bytes)
    (stage / "provenance/world-manifest.json").write_bytes(manifest_bytes)
    framed.save(stage / "sources/framed.png")
    framed.resize((320, 224), Image.Resampling.NEAREST).save(stage / "pixels/unquantized.png")
    parent_record = None
    if parent_bytes:
        parent_path = stage / "provenance" / ("parent-source" + Path(parent_source).suffix.lower())
        parent_path.write_bytes(parent_bytes)
        parent_record = record(stage, parent_path)
    created_at = datetime.now(timezone.utc).isoformat()
    results = []
    for palette in colors:
        master = retro_crunch(framed, 320, palette, contrast)
        pixel_path = stage / f"pixels/{palette}-colours.png"
        master.save(pixel_path)
        candidate = stage / f"{spec['roomId']}__canonical-room__canonical__{palette}-colours.png"
        display_upscale(master, 640).save(candidate)
        meta = {**spec, "prompt": edit_prompt, "modelPrompt": None, "reviewBrief": spec["prompt"],
                "sourceType": SOURCE_TYPE, "backend": SOURCE_TYPE, "model": None, "seed": None,
                "modelExecuted": False, "sourceGeneratorVersion": VERSION, "runId": run_id,
                "createdAt": created_at, "reviewStatus": "draft", "architectureReviewState": "pending-human-review",
                "conditioning": {"mode": "external-edit", "reference": None, "mask": None, "layout": None},
                "originalSource": record(stage, original), "sourceImage": record(stage, stage / "sources/framed.png"),
                "unquantizedMaster": record(stage, stage / "pixels/unquantized.png"),
                "pixelSource": record(stage, pixel_path), "worldManifest": record(stage, stage / "provenance/world-manifest.json"),
                "sha256": digest(candidate.read_bytes()), "rawBytes": candidate.stat().st_size,
                "dimensions": {"width": 640, "height": 448}, "pixelDimensions": {"width": 320, "height": 224},
                "framing": {"method": "explicit-crop", "crop": crop, "orientedSourceDimensions": list(image.size),
                            "framedDimensions": list(framed.size), "notes": framing_notes,
                            "orientation": "EXIF transpose before coordinates; original bytes retained"},
                "generationSettings": {"operation": "pixel-processing-only", "width": framed.width, "height": framed.height,
                                       "pixelWidth": 320, "displayWidth": 640, "colors": palette, "contrast": contrast,
                                       "resampling": "nearest-neighbour", "quantization": "Pillow MEDIANCUT", "pillowVersion": pillow_version},
                "provenance": {"origin": SOURCE_TYPE, "editor": editor, "service": service, "notes": notes,
                               "modelVersion": None, "sourceCreatedAt": None, "parentSource": parent_record,
                               "editPrompt": edit_prompt, "modelExecutedDuringImport": False}}
        candidate.with_suffix(".json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
        validate_external_provenance(stage, meta)
        results.append({"path": str(candidate), "metadata": meta, "seed": None, "backend": SOURCE_TYPE})
    contact_sheet(results, Path(output).resolve() / "review" / run_id / "contact-sheet.webp")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("manifest", "source", "output", "editor", "service", "notes", "framing-notes"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--crop", type=int, nargs=4, metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"))
    parser.add_argument("--colors", type=int, nargs="+", default=[48, 64])
    parser.add_argument("--contrast", type=float, default=1.15)
    parser.add_argument("--parent-source")
    parser.add_argument("--edit-prompt-file")
    args = vars(parser.parse_args())
    prompt_file = args.pop("edit_prompt_file")
    args["edit_prompt"] = Path(prompt_file).read_text(encoding="utf-8") if prompt_file else None
    print(json.dumps([{"candidate": r["path"], "reviewStatus": "draft"} for r in import_external(**args)], indent=2))
