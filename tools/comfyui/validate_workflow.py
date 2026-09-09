"""Offline checks of the prepared Kontext graph. Never contacts or runs ComfyUI."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools/visual-gen"))
from source_provenance import workflow_bytes


def validate(schema=None):
    folder = ROOT / "tools/comfyui"
    ui_path = folder / "workflows/velvet-kontext-dev-fp8-v1.json"
    api_path = ui_path.with_suffix(".api.json")
    ui = json.loads(workflow_bytes(ui_path.read_bytes()))
    api = json.loads(workflow_bytes(api_path.read_bytes()))
    contract = json.loads((folder / "velvet-kontext-test-contract.json").read_bytes())
    models = json.loads((folder / "kontext-model-proposal.json").read_bytes())
    assert hashlib.sha256((ROOT / contract["source"]).read_bytes()).hexdigest() == contract["sourceSha256"]
    assert ui["extra"]["freakCity"]["sourceSha256"] == contract["sourceSha256"]
    nodes = {n["id"]: n for n in ui["nodes"]}
    assert len(nodes) == len(ui["nodes"]) and set(map(str, nodes)) == set(api)
    link_ids = {l[0] for l in ui["links"]}
    assert len(link_ids) == len(ui["links"])
    for link_id, origin, origin_slot, target, target_slot, kind in ui["links"]:
        output = nodes[origin]["outputs"][origin_slot]
        inp = nodes[target]["inputs"][target_slot]
        assert kind == output["type"] == inp["type"]
        assert link_id in output["links"] and inp["link"] == link_id
        assert api[str(target)]["inputs"][inp["name"]] == [str(origin), origin_slot]
    for node in nodes.values():
        assert api[str(node["id"])]["class_type"] == node["type"]
        assert node["mode"] == 0  # Nothing bypassed or muted in the retained graph.
        for inp in node["inputs"]:
            assert inp["link"] in link_ids
    # Widget order comes from the core node definitions, including UI-only seed control.
    widget_names = {
        "LoadImage": ["image", None], "ImageCrop": ["width", "height", "x", "y"],
        "ImageScale": ["upscale_method", "width", "height", "crop"],
        "UNETLoader": ["unet_name", "weight_dtype"],
        "DualCLIPLoader": ["clip_name1", "clip_name2", "type", "device"],
        "VAELoader": ["vae_name"], "CLIPTextEncode": ["text"],
        "FluxGuidance": ["guidance"],
        "KSampler": ["seed", None, "steps", "cfg", "sampler_name", "scheduler", "denoise"],
        "SaveImage": ["filename_prefix"],
    }
    for node in nodes.values():
        names = widget_names.get(node["type"], [])
        assert len(names) == len(node["widgets_values"])
        for key, value in zip(names, node["widgets_values"]):
            if key is not None:
                assert api[str(node["id"])]["inputs"][key] == value
    assert api["1"]["inputs"]["image"] == contract["inputFilename"]
    assert api["7"]["inputs"]["text"] == contract["instruction"]
    assert api["12"]["inputs"]["seed"] == contract["settings"]["seed"]
    assert nodes[12]["widgets_values"][1] == "fixed"
    assert api["12"]["inputs"]["steps"] == contract["settings"]["steps"]
    assert api["11"]["inputs"]["guidance"] == contract["settings"]["fluxGuidance"]
    crop = contract["crop"]["bounds"]
    scale = contract["modelInputDimensions"][0] / (crop[2] - crop[0])
    assert scale == contract["modelInputDimensions"][1] / (crop[3] - crop[1])
    box = contract["target"]["sourceBounds"]
    expected = [math.floor((box[0] - crop[0]) * scale), math.floor((box[1] - crop[1]) * scale),
                math.ceil((box[2] - crop[0]) * scale), math.ceil((box[3] - crop[1]) * scale)]
    assert expected == contract["target"]["normalizedBounds"]
    model_names = {f["filename"] for f in models["files"]}
    assert model_names == {api["4"]["inputs"]["unet_name"], api["5"]["inputs"]["clip_name1"],
                           api["5"]["inputs"]["clip_name2"], api["6"]["inputs"]["vae_name"]}
    assert models["newDownloadBytes"] == sum(f["bytes"] for f in models["files"] if f["downloadRequiredOnInspectedWorkstation"])
    assert models["totalRequiredModelBytes"] == sum(f["bytes"] for f in models["files"])
    assert models["downloadApproval"] is None and models["inferenceApproval"] is None
    missing = []
    if schema:
        definitions = json.loads(Path(schema).read_bytes())
        model_inputs = {"unet_name", "clip_name1", "clip_name2", "vae_name", "image"}
        for node in api.values():
            spec = definitions[node["class_type"]]
            inputs = {**spec["input"].get("required", {}), **spec["input"].get("optional", {})}
            assert set(spec["input"].get("required", {})) <= set(node["inputs"])
            for name, value in node["inputs"].items():
                assert name in inputs, (node["class_type"], name)
                kind, *options = inputs[name]
                if isinstance(value, list):
                    upstream = api[value[0]]
                    assert definitions[upstream["class_type"]]["output"][value[1]] == kind
                elif isinstance(kind, list):
                    if value not in kind:
                        assert name in model_inputs, (node["class_type"], name, value)
                        missing.append(value)
                elif kind in ("INT", "FLOAT"):
                    assert isinstance(value, (int, float)) and not isinstance(value, bool)
                    if options:
                        assert options[0].get("min", -math.inf) <= value <= options[0].get("max", math.inf)
    return {"status": "static-validation-passed; inference-not-run", "nodes": len(nodes),
            "links": len(ui["links"]), "nodeSchemaChecked": bool(schema),
            "missingLocalInputs": sorted(set(missing)) if schema else None}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schema", help="Optional saved read-only /object_info node definitions")
    args = parser.parse_args()
    print(json.dumps(validate(args.schema), indent=2))
