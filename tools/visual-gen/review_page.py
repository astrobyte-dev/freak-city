"""Build a portable, role-aware draft review page from a generated batch."""
import argparse
import html
import json
import os
from pathlib import Path
from source_provenance import is_source_import


def review_page(batch, output):
    batch,output=Path(batch).resolve(),Path(output).resolve()
    output.mkdir(parents=True,exist_ok=True)
    candidates=[]
    for path in sorted(batch.glob("*.png")):
        if path.with_suffix(".json").exists():
            candidates.append((path,json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))))
    if not candidates:
        raise ValueError("No candidates with sidecars in batch")
    url=lambda path: html.escape(Path(os.path.relpath(path,output)).as_posix(),quote=True)
    text=lambda value: html.escape(str(value))
    role=candidates[0][1]["role"]
    parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
           f'<title>FREAK//CITY / {text(role)} review</title>',
           '<style>body{background:#15151c;color:#e7dbd5;font:16px/1.5 system-ui;margin:24px auto;padding:0 20px;max-width:1600px}h1,h2{font-weight:500}a{color:#a4d7cc}img{max-width:100%;height:auto;image-rendering:pixelated}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}figure{margin:0}article{padding:20px 0;border-top:1px solid #64444e}summary{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.warning{color:#f3c2d7}figcaption{font-size:14px}button,input{font:inherit}</style>',
           f'<h1>{text(role)} / draft review</h1><p class="warning">No image or runtime test binding on this page grants approval.</p>']
    if role=="canonical-room":
        parts += ['<p>Review the authoritative layout and facts, protected masks, candidate, and actual runtime composite. Reject invented geometry or props even inside editable surface regions. Runtime images are isolated tests with draft placements, not shipping assets.</p>']
        if (batch/"reference/top-down.svg").exists():
            parts.append(f'<details><summary>Labelled authoritative layout</summary><img src="{url(batch/"reference/top-down.svg")}" alt="Labelled layout"></details>')
    else:
        parts += ['<p>Review style, mood, adult silhouettes/anatomy, NPC correctness, boundaries and existing scene compatibility. Geometry is non-authoritative. These images have no approved shipping scene binding.</p>']
    for index,(path,meta) in enumerate(candidates,1):
        settings=meta["generationSettings"]
        source_label = meta.get("sourceType", "source image").replace("external-reviewed-edit", "external edit")
        label = f'{settings["colors"]} colours / {source_label}' if is_source_import(meta) else f'seed {meta["seed"]}'
        parts.append(f'<article><h2>{index:02} / {text(label)}'+(f' / denoise {settings["strength"]}' if "strength" in settings else '')+'</h2><div class="grid">')
        if meta.get("originalSource"):
            for key,label in (("originalSource","High-resolution source; original bytes"),("unquantizedMaster","320 master before palette and contrast")):
                parts.append(f'<figure><a href="{url(batch/meta[key]["file"])}"><img src="{url(batch/meta[key]["file"])}" alt="{label}"></a><figcaption>{label}</figcaption></figure>')
        if role=="canonical-room" and (batch/"reference/reference.png").exists():
            parts.append(f'<figure><img src="{url(batch/"reference/reference.png")}" alt="Unlabelled fixed geometry"><figcaption>Authoritative reference</figcaption></figure>')
        control=meta.get("conditioning",{}).get("control")
        if control:
            parts.append(f'<figure><img src="{url(batch/control["file"])}" alt="Deterministic structural Canny edges"><figcaption>Structural control / same reference</figcaption></figure>')
        parts.append(f'<figure><a href="{url(path)}"><img src="{url(path)}" alt="Draft candidate {index}"></a><figcaption>Generated / edited candidate</figcaption></figure>')
        runtime=output/f"runtime-{index:02}.png"
        if runtime.exists():
            parts.append(f'<figure><img src="{url(runtime)}" alt="Actual runtime test composite"><figcaption>Actual LocationVisual / unapproved test binding</figcaption></figure>')
        elif role=="canonical-room":
            parts.append('<p class="warning">Runtime composite pending; this page cannot satisfy the runtime review gate.</p>')
        for band in ("late","dawn","mobile","reference"):
            snapshot=output/f"runtime-{index:02}-{band}.png"
            if snapshot.exists():
                parts.append(f'<figure><img src="{url(snapshot)}" alt="Actual {band} runtime composite"><figcaption>{band} / unapproved test binding</figcaption></figure>')
        parts.append('<div><h3>Control / generation settings</h3><pre>'+text(json.dumps({"backend":meta["backend"],"model":meta["model"],"seed":meta["seed"],**{k:settings[k] for k in ("controlnetConditioningScale","strength","steps","effectiveSteps","guidanceScale","pixelWidth","displayWidth") if k in settings},"inferenceSeconds":meta.get("inferenceSeconds")},indent=2))+'</pre></div>')
        if role=="canonical-room":
            facts=meta["reviewContract"]["staticArchitecture"]+meta["reviewContract"]["fixedFurniture"]
            parts.append('<div><h3>Canonical facts</h3><ul>'+''.join(f'<li>{text(f["text"])}</li>' for f in facts)+'</ul><p>Routes: '+text(', '.join(e['to'] for e in meta['reviewContract']['exits']))+'</p></div>')
        parts.append('</div>')
        for key,label in (("originalSource","Original file"),("sourceImage","Framed source"),("unquantizedMaster","Unquantized master"),("pixelSource","Pixel master"),("uncompositedModelOutput","Model output before hard mask restoration")):
            if meta.get(key): parts.append(f'<a href="{url(batch/meta[key]["file"])}">{label}</a> · ')
        parts.append(f'<a href="{url(path.with_suffix(".json"))}">Original sidecar</a>')
        if role=="canonical-room":
            facts=meta["reviewContract"]["staticArchitecture"]+meta["reviewContract"]["fixedFurniture"]
            mask=meta.get("conditioning",{}).get("mask")
            if mask:
                parts.append('<details><summary>Region masks: white editable, black protected</summary><div class="grid">'+''.join(f'<figure><img src="{url(batch/r["file"])}" alt="{text(r["region"])} mask"><figcaption>{text(r["region"])}</figcaption></figure>' for r in mask["regions"] )+'</div></details>')
        parts.append('<details><summary>Review criteria and provenance</summary><pre>'+text(json.dumps({k:meta.get(k) for k in ("sourceType","architectureReviewState","framing","generationSettings","environment","requiredFacts","forbiddenFacts","conditioning","structurePreservation","provenance")},indent=2))+'</pre></details></article>')
    parts.append('</html>')
    destination=output/"index.html"; destination.write_text('\n'.join(parts),encoding="utf-8")
    return destination


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument("--batch",required=True); parser.add_argument("--output",required=True)
    args=parser.parse_args(); print(review_page(args.batch,args.output))
