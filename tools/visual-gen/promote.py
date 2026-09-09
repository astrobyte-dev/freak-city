#!/usr/bin/env python3
"""Promotion is an explicit human attestation, never the next automatic generation step."""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
from optimizer import optimize
from prompt_builder import safe_id
from review import role_review


def promote(candidate, reviewer, notes, root, allow_fixture=False, *, approve_architecture=False, composition=None, non_explicit=False, illustration=None, approve_reference_geometry=False):
    root, candidate = Path(root).resolve(), Path(candidate).resolve()
    source = json.loads(candidate.with_suffix(".json").read_text())
    room, variant = safe_id(source["roomId"]), safe_id(source["variantId"])
    if not reviewer.strip() or not notes.strip():
        raise ValueError("Human reviewer and review notes are required")
    if not source.get("requiredFacts") or not source.get("forbiddenFacts"):
        raise ValueError("Candidate lacks the layer review contract")
    if source.get("reviewStatus") not in ("draft", "reviewed"):
        raise ValueError("Candidate is not in a reviewable stage")
    if source.get("backend") == "fixture" and not allow_fixture:
        raise ValueError("This is a procedural test fixture, not SDXL output. Use --allow-fixture only for an intentional fixture review.")
    if hashlib.sha256(candidate.read_bytes()).hexdigest() != source["sha256"]:
        raise ValueError("Candidate differs from its generated sidecar; inspect the change before reviewing")
    if source.get("sourceType") == "external-reviewed-edit" or source.get("backend") == "external-reviewed-edit" or source.get("provenance", {}).get("origin") == "external-reviewed-edit":
        from import_external import validate_external_provenance
        from PIL import Image
        expected = validate_external_provenance(candidate.parent, source)
        with Image.open(candidate) as actual:
            if actual.size != expected.size or actual.convert("RGB").tobytes() != expected.tobytes():
                raise ValueError("External display does not reproduce its retained source")
    if source.get("provenance",{}).get("origin")=="human-edit":
        from import_edit import checked_file
        for key in ("parentCandidate","parentMetadata"):
            checked_file(candidate.parent,source["provenance"][key])
        checked_file(candidate.parent,source["sourceImage"])
        if not source["provenance"].get("manualEdits"):
            raise ValueError("Manual corrections require edit provenance")
    if source.get("conditioning", {}).get("mode") in ("img2img", "regional-inpaint", "controlnet-inpaint"):
        keys = ("layout", "reference", "mask") if source["conditioning"]["mode"] in ("regional-inpaint","controlnet-inpaint") else ("layout", "reference")
        for key in keys:
            record = source["conditioning"][key]
            reference_path = (candidate.parent / record["file"]).resolve()
            if not reference_path.is_relative_to(candidate.parent) or hashlib.sha256(reference_path.read_bytes()).hexdigest() != record["sha256"]:
                raise ValueError("Reference bundle differs from the candidate provenance")
            if key == "mask":
                for region in json.loads(reference_path.read_text())["regions"]:
                    mask_path=(candidate.parent/region["file"]).resolve()
                    if not mask_path.is_relative_to(candidate.parent) or hashlib.sha256(mask_path.read_bytes()).hexdigest()!=region["sha256"]:
                        raise ValueError("Regional mask differs from candidate provenance")
        if source["conditioning"]["mode"]=="controlnet-inpaint":
            from structural_control import validate_control_provenance
            validate_control_provenance(candidate.parent,source["conditioning"])
    role_fields, review_fields = role_review(source, architecture=approve_architecture, composition=composition, non_explicit=non_explicit, illustration=illustration, reference_geometry=approve_reference_geometry)
    role = role_fields["role"]
    pixel_source = candidate
    if source.get("pixelSource"):
        pixel_source = (candidate.parent / source["pixelSource"]["file"]).resolve()
        if not pixel_source.is_relative_to(candidate.parent) or hashlib.sha256(pixel_source.read_bytes()).hexdigest() != source["pixelSource"]["sha256"]:
            raise ValueError("Pixel source differs from its sidecar or leaves the candidate directory")
        from PIL import Image
        from generator import display_upscale
        with Image.open(pixel_source) as pixels, Image.open(candidate) as display:
            expected = display_upscale(pixels, display.width)
            if expected.size != display.size or expected.convert("RGB").tobytes() != display.convert("RGB").tobytes():
                raise ValueError("Pixel source does not reproduce the reviewed display candidate")
    registry_path = root / "src/content/visuals/assets.json"
    registry = json.loads(registry_path.read_text())
    if any(a["roomId"] == room and a.get("role", "texture") == role and a["variant"] == variant and
           (role != "scene-illustration" or a.get("illustration", {}).get("sceneId") == role_fields["illustration"]["sceneId"]) for a in registry):
        raise ValueError("An asset already occupies this variant. Existing approved art is never automatically replaced; review a new variant or deliberately retire the old registry entry in git.")
    destination = root / "public/visuals/generated"
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        optimized = Path(temporary) / "plate.webp"
        display_width = source.get("generationSettings", {}).get("displayWidth", 640)
        # v1 textures retain their original shipping size; v2 uses the reviewed preset.
        stats = optimize(pixel_source, optimized, display_width)
        digest = hashlib.sha256(optimized.read_bytes()).hexdigest()
        filename = f"{room}--{role}--{variant}--{digest[:12]}.webp"
        target = destination / filename
        review = {"by": reviewer.strip(), "at": date.today().isoformat(), "worldFactsChecked": True, **review_fields}
        entry = {"roomId": room, "variant": variant, "status": "canonical", "file": f"visuals/generated/{filename}", "sha256": digest, "width": display_width, "height": round(display_width * 7 / 10), "review": review, **role_fields}
        # Preserve raw pixels and original metadata. Canonical provenance is local;
        # only the reviewed plate and compact attestation enter the shipping tree.
        provenance = {**source, **role_fields, "reviewStatus": "canonical", "approval": review, "reviewNotes": notes, "optimization": stats, "asset": entry}
        canonical = root / ".visuals/generated/canonical" / filename
        canonical.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            raise ValueError("Optimized destination already exists; refusing to overwrite")
        shutil.copyfile(optimized, canonical)
        canonical.with_suffix(".json").write_text(json.dumps(provenance, indent=2) + "\n")
        shutil.copyfile(optimized, target)
        try:
            registry_path.write_text(json.dumps([*registry, entry], indent=2) + "\n")
        except Exception:
            target.unlink()
            raise
    return {"asset": entry, "optimization": stats}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", required=True, help="Exact raw PNG path; original is preserved")
    parser.add_argument("--reviewer", required=True, help="Public name or alias, never credentials")
    parser.add_argument("--notes", required=True)
    parser.add_argument("--approve-world-facts", action="store_true", help="I inspected required/forbidden facts and confirmed this is an empty texture plate")
    parser.add_argument("--allow-fixture", action="store_true")
    parser.add_argument("--approve-architecture", action="store_true")
    parser.add_argument("--approve-reference-geometry", action="store_true", help="I approved the layout and checked the candidate and any structural control image against its fixed geometry, including all exits")
    parser.add_argument("--composition", help="Human-adjusted 320 x 224 overlay placement JSON")
    parser.add_argument("--non-explicit", action="store_true")
    parser.add_argument("--illustration", help="Authored scene binding JSON; existing scene ID, caption, timeBands, requiredNPCs, themes")
    args = parser.parse_args()
    if not args.approve_world_facts:
        parser.error("Human inspection and --approve-world-facts are required; generation does not grant approval")
    try:
        print(json.dumps(promote(args.candidate, args.reviewer, args.notes, Path(__file__).resolve().parents[2], args.allow_fixture,
              approve_architecture=args.approve_architecture, approve_reference_geometry=args.approve_reference_geometry, composition=json.loads(Path(args.composition).read_text()) if args.composition else None,
              non_explicit=args.non_explicit, illustration=json.loads(Path(args.illustration).read_text()) if args.illustration else None), indent=2))
    except (ValueError, OSError, KeyError) as error:
        print(f"Promotion failed: {error}", file=sys.stderr)
        sys.exit(1)
