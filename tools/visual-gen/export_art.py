"""Export a portable authoring bundle without inference or changing its inputs."""
import argparse
import hashlib
import json
from pathlib import Path


def export_art(source, contract, output, manifest=None, layout=None):
    inputs = {"source": Path(source), "artContract": Path(contract)}
    if manifest:
        inputs["worldManifest"] = Path(manifest)
    if layout:
        inputs["layout"] = Path(layout)
    names = {"source": "source" + inputs["source"].suffix.lower(),
             "artContract": "art-contract.md", "worldManifest": "world-manifest.json", "layout": "layout.json"}
    data = {key: path.read_bytes() for key, path in inputs.items()}
    if inputs["source"].suffix.lower() != ".png":
        raise ValueError("Export the retained source PNG, not a display thumbnail")
    if not data["artContract"].strip():
        raise ValueError("Export requires an art contract")
    destination = Path(output)
    destination.mkdir(parents=True, exist_ok=False)
    records = {}
    for key, raw in data.items():
        (destination / names[key]).write_bytes(raw)
        records[key] = {"file": names[key], "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}
    bundle = {"schemaVersion": 1, "purpose": "authoring input; no approval transferred to edited outputs", "files": records}
    (destination / "bundle.json").write_text(json.dumps(bundle, indent=2) + "\n", encoding="utf-8")
    return bundle


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "contract", "output"):
        parser.add_argument("--" + name, required=True)
    for name in ("manifest", "layout"):
        parser.add_argument("--" + name)
    print(json.dumps(export_art(**vars(parser.parse_args())), indent=2))
