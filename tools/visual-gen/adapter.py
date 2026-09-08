#!/usr/bin/env python3
"""Manifest -> PromptSpec -> CandidateAsset[]. No implicit promotion."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import sys
from prompt_builder import build_prompt, ROLES
from generator import VERSION, MODEL, SDXLTurbo, fixture_image, retro_crunch, display_upscale
from contact_sheet import contact_sheet
from layout_reference import load_reference


def reference_settings(options):
    reference = getattr(options, "reference", None)
    matrix, strength = getattr(options, "strengths", None), getattr(options, "strength", None)
    if not reference:
        if matrix is not None or strength is not None:
            raise ValueError("Strength settings require --reference")
        return None
    if options.role != "canonical-room":
        raise ValueError("Layout img2img currently supports canonical-room only")
    if matrix is not None and strength is not None:
        raise ValueError("Use --strength or --strengths, not both")
    values = [float(v) for v in matrix.split(",")] if matrix is not None else [0.5 if strength is None else strength] * options.count
    if len(values) != options.count or any(not math.isfinite(v) or not 0 < v <= 1 or int(options.steps*v) < 1 for v in values):
        raise ValueError("One strength per candidate required, within (0,1], with steps * strength >= 1")
    if matrix is not None and len({int(options.steps*v) for v in values}) != len(values):
        raise ValueError("Matrix strengths must produce distinct effective step counts")
    return values


def seed_for(base, index):
    if not 0 <= base <= 2**32 - 1 or index < 0:
        raise ValueError("Seed must be an integer in 0..4294967295")
    return (base + index) % 2**32


def generate(manifest, options):
    spec = build_prompt(manifest, options.variant, options.role)
    preset = {"pixelWidth": 320, "colors": 48, "contrast": 1.3, "displayWidth": 320,
              **manifest.get("generationPresets", {}).get(options.role, {})}
    for field, key in (("pixel_width", "pixelWidth"), ("colors", "colors"), ("contrast", "contrast"), ("display_width", "displayWidth")):
        if getattr(options, field) is None:
            setattr(options, field, preset[key])
    if not 1 <= options.count <= 32 or not 1 <= options.steps <= 4:
        raise ValueError("Count must be 1..32 and SDXL Turbo steps 1..4")
    if options.width % 64 or options.height % 64 or not 256 <= options.width <= 1024 or not 256 <= options.height <= 1024:
        raise ValueError("Dimensions must be multiples of 64, between 256 and 1024")
    if not 32 <= options.pixel_width <= 640 or not 2 <= options.colors <= 256 or not 0.5 <= options.contrast <= 2:
        raise ValueError("Invalid pixel-width, palette or contrast settings")
    if options.guidance_scale != 0:
        raise ValueError("SDXL Turbo requires --guidance-scale 0; negative prompts are not enforced")
    if not options.pixel_width <= options.display_width <= 2048:
        raise ValueError("Display width must be between pixel width and 2048")
    seed_for(options.seed, 0)
    strengths = reference_settings(options)
    reference, reference_files = None, None
    matrix = getattr(options, "strengths", None) is not None
    if strengths is not None:
        reference, conditioning, reference_files = load_reference(manifest, options.reference, options.width, options.height)
        spec["conditioning"] = conditioning
        spec["referenceGeometryReviewRequired"] = True
    settings = {"width": options.width, "height": options.height, "steps": options.steps, "guidanceScale": 0,
                "pixelWidth": options.pixel_width, "colors": options.colors, "contrast": options.contrast,
                "displayWidth": options.display_width, "resampling": "nearest",
                "revision": options.revision, "requestedDevice": options.device}
    if strengths is not None:
        settings.update(strengths=strengths, seedStrategy="shared-matrix" if matrix else "incrementing",
                        strengthMeaning="denoising; higher means less reference retention")
    identity = {"spec": spec, "settings": settings, "seed": options.seed, "count": options.count, "backend": options.backend, "version": VERSION}
    run_id = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()[:12]
    root = Path(options.output).resolve()
    stage = root / ("plans" if options.dry_run else "raw") / run_id
    if stage.exists():
        raise ValueError(f"Run {run_id} already exists. Use another output directory or seed; original candidates are never overwritten.")
    stage.mkdir(parents=True)
    (stage / "prompt-spec.json").write_text(json.dumps(spec, indent=2) + "\n")
    if reference_files:
        (stage / "reference").mkdir()
        for filename, data in reference_files.items():
            (stage / "reference" / filename).write_bytes(data)
    if options.dry_run:
        (stage / "dry-run.json").write_text(json.dumps({**identity, "reviewStatus": "draft", "modelExecuted": False}, indent=2) + "\n")
        print(f"Dry run: {stage}. No image model was imported or executed.")
        return []
    backend = SDXLTurbo(options.device, options.allow_cpu, options.revision, options.offline, reference=reference) if options.backend == "sdxl" else None
    candidates = []
    for index in range(options.count):
        seed = seed_for(options.seed, 0 if matrix else index)
        candidate_settings = dict(settings)
        if strengths is not None:
            candidate_settings.update(strength=strengths[index], effectiveSteps=int(options.steps*strengths[index]))
        name = f"{spec['roomId']}__{spec['role']}__{spec['variantId']}__candidate-{index+1:02}"
        path = stage / f"{name}.png"
        raw = backend.generate(spec, candidate_settings, seed) if backend else fixture_image(seed, options.width, options.height)
        pixels = retro_crunch(raw, options.pixel_width, options.colors, options.contrast)
        image = display_upscale(pixels, options.display_width)
        image.save(path, "PNG")
        pixel_source = None
        if options.display_width != options.pixel_width:
            pixel_path = stage / "pixels" / f"{name}.png"
            pixel_path.parent.mkdir(exist_ok=True)
            pixels.save(pixel_path, "PNG")
            pixel_source = {"file": f"pixels/{name}.png", "sha256": hashlib.sha256(pixel_path.read_bytes()).hexdigest()}
        metadata = {**spec, "seed": seed, "model": MODEL if backend else "procedural-fixture (NOT SDXL)",
                    "generationSettings": candidate_settings, "dimensions": {"width": image.width, "height": image.height},
                    "pixelDimensions": {"width": pixels.width, "height": pixels.height}, "pixelSource": pixel_source,
                    "createdAt": datetime.now(timezone.utc).isoformat(), "sourceGeneratorVersion": VERSION,
                    "reviewStatus": "draft", "backend": options.backend, "modelExecuted": bool(backend),
                    "environment": backend.environment if backend else {"device": "cpu", "purpose": "pipeline test"},
                    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "rawBytes": path.stat().st_size, "runId": run_id}
        path.with_suffix(".json").write_text(json.dumps(metadata, indent=2) + "\n")
        candidates.append({"path": str(path), "seed": seed, "backend": options.backend, "metadata": metadata})
    sheet = contact_sheet(candidates, root / "review" / run_id / "contact-sheet.webp")
    print(json.dumps({"runId": run_id, "candidates": len(candidates), "contactSheet": str(sheet), "modelExecuted": bool(backend)}, indent=2))
    return candidates


def arguments(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", default=".visuals/generated")
    parser.add_argument("--variant")
    parser.add_argument("--role", choices=ROLES, default="texture")
    parser.add_argument("--count", type=int, default=4)
    parser.add_argument("--seed", type=int, default=2741)
    parser.add_argument("--steps", type=int, default=2)
    parser.add_argument("--guidance-scale", type=float, default=0)
    parser.add_argument("--width", type=int, default=640)
    parser.add_argument("--height", type=int, default=448)
    parser.add_argument("--pixel-width", type=int)
    parser.add_argument("--display-width", type=int)
    parser.add_argument("--colors", type=int)
    parser.add_argument("--contrast", type=float)
    parser.add_argument("--backend", choices=["sdxl", "fixture"], default="sdxl")
    parser.add_argument("--device", choices=["cuda", "cpu"], default="cuda")
    parser.add_argument("--allow-cpu", action="store_true")
    parser.add_argument("--revision", help="Pin a model revision for stronger reproducibility")
    parser.add_argument("--reference", help="Validated deterministic layout.json bundle; canonical-room only")
    parser.add_argument("--strength", type=float, help="Img2img denoising strength: higher retains less geometry")
    parser.add_argument("--strengths", help="Comma-separated comparison matrix; one shared seed, count must match")
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


if __name__ == "__main__":
    try:
        opts = arguments()
        generate(json.loads(Path(opts.manifest).read_text()), opts)
    except (ValueError, RuntimeError, OSError, ImportError, KeyError) as error:
        print(f"Visual generation failed: {error}", file=sys.stderr)
        sys.exit(1)
