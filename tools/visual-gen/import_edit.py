"""Import a manually corrected source as a new draft, preserving parent provenance."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
from PIL import Image
from generator import VERSION, retro_crunch, display_upscale
from layout_reference import digest
from contact_sheet import contact_sheet


def checked_file(root, record):
    path=(root/record["file"]).resolve()
    if not path.is_relative_to(root.resolve()) or digest(path.read_bytes())!=record["sha256"]:
        raise ValueError("Source provenance changed or leaves the candidate directory")
    return path


def import_edit(parent, edited, output, editor, tool, notes):
    if not all(v.strip() for v in (editor,tool,notes)):
        raise ValueError("Editor, tool and specific correction notes are required")
    parent,edited=Path(parent).resolve(),Path(edited).resolve()
    metadata_path=parent.with_suffix(".json")
    source=json.loads(metadata_path.read_text(encoding="utf-8"))
    if source["reviewStatus"] not in ("draft","reviewed") or digest(parent.read_bytes())!=source["sha256"]:
        raise ValueError("Import from an unchanged reviewable parent draft")
    settings=source["generationSettings"]
    image=Image.open(edited)
    if image.format!="PNG" or image.size!=(settings["width"],settings["height"]):
        raise ValueError("Edit a PNG source at the original generation dimensions; no implicit crop or resize")
    if image.mode in ("RGBA","LA") and image.getextrema()[-1]!=(255,255):
        raise ValueError("Room/scene sources must be opaque")
    records=[]
    for key in ("reference","layout","mask"):
        record=source.get("conditioning",{}).get(key)
        if record:
            records.append((record,checked_file(parent.parent,record)))
            if key=="mask":
                for mask in json.loads(records[-1][1].read_text())["regions"]:
                    records.append((mask,checked_file(parent.parent,mask)))
    identity={"parent":source["sha256"],"parentMetadata":digest(metadata_path.read_bytes()),"edited":digest(edited.read_bytes()),"editor":editor,"tool":tool,"notes":notes}
    run_id=digest(json.dumps(identity,sort_keys=True).encode())[:12]
    stage=Path(output).resolve()/"raw"/run_id
    if stage.exists():
        raise ValueError("Edited draft already exists; originals are never overwritten")
    stage.mkdir(parents=True)
    for record,path in records:
        destination=stage/record["file"]
        destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(path,destination)
    (stage/"provenance").mkdir()
    shutil.copyfile(parent,stage/"provenance/parent.png")
    shutil.copyfile(metadata_path,stage/"provenance/parent.json")
    (stage/"sources").mkdir(); shutil.copyfile(edited,stage/"sources/edited.png")
    pixels=retro_crunch(image,settings["pixelWidth"],settings["colors"],settings["contrast"])
    (stage/"pixels").mkdir(); pixels.save(stage/"pixels/edited.png")
    display=display_upscale(pixels,settings["displayWidth"])
    candidate=stage/f"{source['roomId']}__{source['role']}__edited.png"; display.save(candidate)
    meta={**source,"runId":run_id,"reviewStatus":"draft","authoritativeGeometry":False,"authoritativeArchitecture":False,
          "modelExecuted":False,"sourceModelExecuted":source.get("modelExecuted") or source.get("sourceModelExecuted",False),
          "sourceGeneratorVersion":VERSION,"createdAt":datetime.now(timezone.utc).isoformat(),"sha256":digest(candidate.read_bytes()),"rawBytes":candidate.stat().st_size,
          "sourceImage":{"file":"sources/edited.png","sha256":identity["edited"]},
          "pixelSource":{"file":"pixels/edited.png","sha256":digest((stage/"pixels/edited.png").read_bytes())},
          "structurePreservation":None,"regionPasses":[],
          "provenance":{"origin":"human-edit","parentCandidate":{"file":"provenance/parent.png","sha256":identity["parent"]},
                        "parentMetadata":{"file":"provenance/parent.json","sha256":identity["parentMetadata"]},
                        "manualEdits":[*source.get("provenance",{}).get("manualEdits",[]),{"editor":editor.strip(),"tool":tool.strip(),"notes":notes.strip(),"editedSourceSha256":identity["edited"]}]}}
    for key in ("approval","review","reviewNotes","optimization","asset"):
        meta.pop(key,None)
    candidate.with_suffix(".json").write_text(json.dumps(meta,indent=2)+"\n",encoding="utf-8")
    sheet=contact_sheet([{"path":str(candidate),"seed":source["seed"],"backend":"human-edit","metadata":meta}],stage.parents[1]/"review"/run_id/"contact-sheet.webp")
    return {"candidate":str(candidate),"contactSheet":str(sheet),"reviewStatus":"draft","modelExecuted":False}


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for field in ("parent","edited","output","editor","tool","notes"):
        parser.add_argument("--"+field,required=True)
    args=parser.parse_args()
    print(json.dumps(import_edit(**vars(args)),indent=2))
