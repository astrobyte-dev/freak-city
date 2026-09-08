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


def promote(candidate, reviewer, notes, root, allow_fixture=False):
    root, candidate = Path(root).resolve(), Path(candidate).resolve()
    source = json.loads(candidate.with_suffix(".json").read_text())
    room, variant = safe_id(source["roomId"]), safe_id(source["variantId"])
    if not reviewer.strip() or not notes.strip():
        raise ValueError("Human reviewer and review notes are required")
    if source.get("layer") != "background-texture" or not source.get("requiredFacts") or not source.get("forbiddenFacts"):
        raise ValueError("Candidate lacks the background layer review contract")
    if source.get("reviewStatus") not in ("draft", "reviewed"):
        raise ValueError("Candidate is not in a reviewable stage")
    if source.get("backend") == "fixture" and not allow_fixture:
        raise ValueError("This is a procedural test fixture, not SDXL output. Use --allow-fixture only for an intentional fixture review.")
    if hashlib.sha256(candidate.read_bytes()).hexdigest() != source["sha256"]:
        raise ValueError("Candidate differs from its generated sidecar; inspect the change before reviewing")
    registry_path = root / "src/content/visuals/assets.json"
    registry = json.loads(registry_path.read_text())
    if any(a["roomId"] == room and a["variant"] == variant for a in registry):
        raise ValueError("An asset already occupies this variant. Existing approved art is never automatically replaced; review a new variant or deliberately retire the old registry entry in git.")
    destination = root / "public/visuals/generated"
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        optimized = Path(temporary) / "plate.webp"
        stats = optimize(candidate, optimized)
        digest = hashlib.sha256(optimized.read_bytes()).hexdigest()
        filename = f"{room}--{variant}--{digest[:12]}.webp"
        target = destination / filename
        review = {"by": reviewer.strip(), "at": date.today().isoformat(), "backgroundOnly": True, "worldFactsChecked": True}
        entry = {"roomId": room, "variant": variant, "status": "canonical", "file": f"visuals/generated/{filename}", "sha256": digest, "width": 640, "height": 448, "review": review}
        # Preserve raw pixels and original metadata. Canonical provenance is local;
        # only the reviewed plate and compact attestation enter the shipping tree.
        provenance = {**source, "reviewStatus": "canonical", "approval": review, "reviewNotes": notes, "optimization": stats, "asset": entry}
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
    args = parser.parse_args()
    if not args.approve_world_facts:
        parser.error("Human inspection and --approve-world-facts are required; generation does not grant approval")
    try:
        print(json.dumps(promote(args.candidate, args.reviewer, args.notes, Path(__file__).resolve().parents[2], args.allow_fixture), indent=2))
    except (ValueError, OSError, KeyError) as error:
        print(f"Promotion failed: {error}", file=sys.stderr)
        sys.exit(1)
