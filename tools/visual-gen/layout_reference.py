"""Deterministic Velvet geometry contract. Art coordinates never modify parser geography."""
import argparse
import hashlib
import html
import io
import json
import math
from pathlib import Path


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=True) + "\n").encode("utf-8")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def world_facts(manifest):
    # Exclude mutable state (time, open doors, NPC presence) from static identity.
    return {key: manifest[key] for key in ("roomId", "canonicalArchitecture", "exits", "staticArchitecture", "fixedFurniture")}


def validate_layout(manifest):
    layout = manifest.get("layoutBlueprint")
    if not layout or layout["roomId"] != "bar" or manifest["roomId"] != "bar":
        raise ValueError("A versioned Velvet layout blueprint is required")
    if layout["frame"] != [320, 224] or layout["boundary"] != [0, 0, 320, 224]:
        raise ValueError("Layout must retain the 320 x 224 boundary contract")
    elements, routes = layout["elements"], layout["routes"]
    if len({e["id"] for e in elements}) != len(elements):
        raise ValueError("Duplicate permanent element")
    if {e["kind"] for e in elements} != {"staircase", "counter", "shelves", "window", "stage-view"} or len(elements) != 5:
        raise ValueError("Exactly one staircase and the four other permanent elements are required")
    expected_entities = {"counter": "counter", "shelves": "detail_bar_shelves", "window": "detail_bar_window"}
    expected_facts = {"staircase": ["staticArchitecture:0"], "stage-view": ["staticArchitecture:0"], "window": ["staticArchitecture:1"], "counter": ["fixedFurniture:0"], "shelves": ["fixedFurniture:1"]}
    for element in elements:
        if element.get("entityId") != expected_entities.get(element["kind"]) or element["facts"] != expected_facts[element["kind"]]:
            raise ValueError("Permanent elements must reference the correct fixed entity and world fact")
    stairs = next(e for e in elements if e["kind"] == "staircase")
    targets = [r["to"] for r in routes]
    if len(set(targets)) != len(targets) or set(targets) != {e["to"] for e in manifest["exits"]}:
        raise ValueError("Layout routes must match known parser exits exactly")
    if set(targets) != {"vestibule", "street", "landing", "kitchen", "stage", "salon", "archive"}:
        raise ValueError("Velvet geography changed; explicitly revise the layout contract")
    by_target = {r["to"]: r for r in routes}
    if any(by_target[target]["wall"] != wall for target, wall in (("vestibule", "south"), ("kitchen", "west"), ("stage", "east"))):
        raise ValueError("Layout contradicts known cardinal routes")
    if stairs["route"] != "landing" or stairs["beside"] != "salon" or by_target["landing"]["span"] != [stairs["box"][0], stairs["box"][2]]:
        raise ValueError("The single staircase must supply the upstairs route")
    if by_target["salon"]["wall"] != "north" or not 0 <= by_target["salon"]["span"][0] - stairs["box"][2] <= 16:
        raise ValueError("Staircase must be beside the salon")
    facts = {f"{group}:{index}" for group in ("staticArchitecture", "fixedFurniture") for index, _ in enumerate(manifest[group])}
    if {fact for e in elements for fact in e["facts"]} != facts:
        raise ValueError("Every permanent world fact must be represented")
    fixed = {f["entityId"] for group in ("staticArchitecture", "fixedFurniture") for f in manifest[group] if f.get("entityId")}
    represented = {e["entityId"] for e in elements if e.get("entityId")}
    if fixed != represented or represented & set(manifest["dynamicObjects"] + manifest["dynamicDoors"]):
        raise ValueError("Fixed furniture references must match; dynamic state cannot be baked")
    for e in elements + layout["reservations"]:
        x0, y0, x1, y1 = e["box"]
        if any(not isinstance(v, (int,float)) or isinstance(v,bool) or not math.isfinite(v) for v in e["box"]) or not 0 <= x0 < x1 <= 320 or not 0 <= y0 < y1 <= 224:
            raise ValueError("Element outside the room boundary")
    window = next(e for e in elements if e["kind"] == "window")
    if window["bottom"] < 90:
        raise ValueError("The street window must remain high")
    for r in routes:
        if r["wall"] not in ("north", "south", "east", "west") or bool(r.get("offCamera")) != (r["wall"] == "south"):
            raise ValueError("Only south/front routes are behind the cutaway camera")
        limit = 320 if r["wall"] in ("north", "south") else 224
        if not 0 <= r["span"][0] < r["span"][1] <= limit:
            raise ValueError("Route outside its wall")
    return layout


def project(x, y, z=0):
    scale = 1 - 0.6 * y / 224
    return (round(160 + (x - 160) * scale), round(218 - 110 * y / 224 - z * scale))


def geometry(layout):
    """One projection for conditioning and labelled perspective. No random textures."""
    polygons = []
    def poly(points, color):
        polygons.append(([project(*p) for p in points], color))
    h = layout["wallHeight"]
    poly([(0, 0, 0), (320, 0, 0), (320, 224, 0), (0, 224, 0)], "#38282c")
    poly([(0, 224, 0), (320, 224, 0), (320, 224, h), (0, 224, h)], "#42252d")
    poly([(0, 0, 0), (0, 224, 0), (0, 224, h), (0, 0, h)], "#552c36")
    poly([(320, 224, 0), (320, 0, 0), (320, 0, h), (320, 224, h)], "#351d27")
    for route in layout["routes"]:
        if route.get("offCamera") or route["to"] == "landing":
            continue  # Upstairs is the stair endpoint, never a second floor/balcony.
        a, b = route["span"]
        wall, height = route["wall"], route["height"]
        points = [(a, 224, 0), (b, 224, 0), (b, 224, height), (a, 224, height)] if wall == "north" else [(0 if wall == "west" else 320, a, 0), (0 if wall == "west" else 320, b, 0), (0 if wall == "west" else 320, b, height), (0 if wall == "west" else 320, a, height)]
        poly(points, "#17151e")
    for element in sorted(layout["elements"], key=lambda e: -e["box"][3]):
        x0, y0, x1, y1 = element["box"]
        z = element["height"]
        kind = element["kind"]
        if kind == "staircase":
            # One solid flight, no rail/gallery/extra steps outside this footprint.
            poly([(x1, y0, 0), (x1, y1, z), (x1, y1, 0)], "#241c24")
            for step in reversed(range(element["steps"])):
                near = y0 + (y1-y0) * step / element["steps"]
                far = y0 + (y1-y0) * (step+1) / element["steps"]
                low, high = z * step / element["steps"], z * (step+1) / element["steps"]
                poly([(x0, near, low), (x1, near, low), (x1, near, high), (x0, near, high)], "#593840")
                poly([(x0, near, high), (x1, near, high), (x1, far, high), (x0, far, high)], "#967b70")
        elif kind in ("counter", "stage-view"):
            poly([(x0, y0, 0), (x1, y0, 0), (x1, y0, z), (x0, y0, z)], "#653442")
            poly([(x1, y0, 0), (x1, y1, 0), (x1, y1, z), (x1, y0, z)], "#492935")
            poly([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], "#947269")
        elif kind == "window":
            poly([(320, y0, element["bottom"]), (320, y1, element["bottom"]), (320, y1, z), (320, y0, z)], "#776671")
        elif kind == "shelves":
            poly([(0, y0, element["bottom"]), (0, y1, element["bottom"]), (0, y1, z), (0, y0, z)], "#231a23")
            for height in (element["bottom"], (z + element["bottom"])/2, z):
                poly([(0, y0, height), (10, y0, height), (10, y1, height), (0, y1, height)], "#95776b")
    return polygons


def render_bundle(manifest):
    from PIL import Image, ImageDraw
    layout = validate_layout(manifest)
    image = Image.new("RGB", (320, 224), "#18151e")
    draw = ImageDraw.Draw(image)
    polygons = geometry(layout)
    for points, color in polygons:
        draw.polygon(points, fill=color)
        draw.line(points + [points[0]], fill="#221923", width=1)
    buffer = io.BytesIO()
    image.resize((640, 448), Image.Resampling.NEAREST).save(buffer, "PNG")
    reference = buffer.getvalue()
    # Review view stays legible at desktop size. Its annotations never condition SDXL.
    preview = Image.new("RGB", (1120, 550), "#14151c")
    preview.paste(image.resize((640, 448), Image.Resampling.NEAREST), (16, 48))
    pen = ImageDraw.Draw(preview)
    pen.text((16, 16), "VELVET / FIXED GEOMETRY v1 / REVIEW REQUIRED BEFORE SHIPPING", fill="#e8dad0")
    for index, e in enumerate(layout["elements"], 1):
        x, y = project((e["box"][0]+e["box"][2])/2, (e["box"][1]+e["box"][3])/2, e["height"])
        pen.ellipse((16+2*x-9, 48+2*y-9, 16+2*x+9, 48+2*y+9), fill="#e8d5a0")
        pen.text((16+2*x-3, 48+2*y-5), str(index), fill="#12121a")
        pen.text((680, 66 + 30*index), f"{index}. {e['label']}", fill="#e8dad0")
    for zone in layout["reservations"]:
        x0, y0, x1, y1 = zone["box"]
        pts = [project(x0,y0), project(x1,y0), project(x1,y1), project(x0,y1)]
        pts = [(16+2*x,48+2*y) for x,y in pts]
        pen.line(pts+[pts[0]], fill="#77b69d", width=2)
    for i, line in enumerate(["Green outlines: dynamic overlay reservations", "7 routes in top-down reference; no invented exits", "Front wall cut away for camera:", "  vestibule + outside remain behind camera", "No door leaves, figures, bottles, cups or evidence", "No mezzanine, gallery, booths or second stairs", "Coordinates are non-metric composition choices", "This reference is a generation contract, not art approval"]):
        pen.text((680, 270+i*25), line, fill="#a5b9b3")
    preview_buffer = io.BytesIO(); preview.save(preview_buffer, "PNG")
    # Top down: north at top, parser facts and route names alongside.
    svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="650" viewBox="0 0 1120 650">', '<rect width="1120" height="650" fill="#14151c"/>', '<g font-family="sans-serif" fill="#e8dad0">', '<text x="24" y="30" font-size="20">VELVET / TOP-DOWN GEOMETRY CONTRACT v1</text>', '<text x="24" y="57" font-size="13">Non-metric. North/back at top. Placement choices do not add parser geography.</text>', '<rect x="30" y="100" width="640" height="448" fill="#38282c" stroke="#c1a195" stroke-width="3"/>']
    for i, e in enumerate(layout["elements"], 1):
        x0,y0,x1,y1=e["box"]
        svg.append(f'<rect x="{30+2*x0}" y="{100+2*(224-y1)}" width="{max(8,2*(x1-x0))}" height="{2*(y1-y0)}" fill="#88636a" stroke="#d2b5a3"/>')
        svg.append(f'<text x="{38+2*x0}" y="{118+2*(224-y1)}">{i}</text>')
        svg.append(f'<text x="700" y="{112+28*i}" font-size="14">{i}. {html.escape(e["label"])}</text>')
        if e["kind"] == "staircase":
            for s in range(1,e["steps"]):
                y=100+2*(224-y0-(y1-y0)*s/e["steps"])
                svg.append(f'<path d="M {30+2*x0} {y} H {30+2*x1}" stroke="#d2b5a3"/>')
    for i,r in enumerate(layout["routes"]):
        a,b=r["span"]; wall=r["wall"]
        points = ((30+2*a,100 if wall=="north" else 548),(30+2*b,100 if wall=="north" else 548)) if wall in ("north","south") else ((30 if wall=="west" else 670,100+2*(224-a)),(30 if wall=="west" else 670,100+2*(224-b)))
        (x0,y0),(x1,y1)=points
        svg.append(f'<path d="M {x0} {y0} L {x1} {y1}" stroke="#c6a761" stroke-width="7"/>')
        svg.append(f'<text x="{(x0+x1)/2+5}" y="{(y0+y1)/2-9}" font-size="13" fill="#fff0bb">{chr(65+i)}</text>')
        svg.append(f'<text x="700" y="{310+27*i}" font-size="14">{chr(65+i)}. {html.escape(r["label"])}</text>')
    for z in layout["reservations"]:
        x0,y0,x1,y1=z["box"]
        svg.append(f'<rect x="{30+2*x0}" y="{100+2*(224-y1)}" width="{2*(x1-x0)}" height="{2*(y1-y0)}" fill="none" stroke="#77b69d" stroke-dasharray="6 4"/>')
    svg += ['<text x="30" y="591" font-size="14" fill="#77b69d">Dashed green: NPC / object / foreground reservations. Reference image omits annotations.</text>', '<text x="30" y="619" font-size="14">Gold marks traversal routes, not seven stateful door leaves. Upstairs is the one staircase.</text>', '</g></svg>']
    facts = world_facts(manifest)
    bundle = {"schemaVersion": 1, "layoutId": layout["id"], "layoutVersion": layout["version"], "authority": "generation-geometry-contract",
              "reviewStatus": "pending-human-layout-review", "blueprint": layout, "blueprintSha256": digest(encoded(layout)),
              "worldFacts": facts, "worldFactsSha256": digest(encoded(facts)),
              "reference": {"file": "reference.png", "sha256": digest(reference), "width": 640, "height": 448}}
    fact_lines = ["# Velvet fixed layout v1", "", layout["coordinatePolicy"], "", "Authoritative generation reference; pending human layout review, with no shipping approval.", "", "## Permanent elements", ""]
    for e in layout["elements"]:
        descriptions = []
        for f in e["facts"]:
            group,index=f.split(":"); descriptions.append(manifest[group][int(index)]["text"])
        fact_lines.append(f"- **{e['label']}** (`{e['id']}`): {'; '.join(descriptions)}. Art footprint `{e['box']}`; entity `{e.get('entityId', 'architectural relationship')}`.")
    fact_lines += ["", "## Routes", "", *[f"- **{r['label']}** → `{r['to']}`; {r['wall']} edge, span `{r['span']}`." for r in layout["routes"]], "", "West kitchen, east stage and south vestibule follow parser aliases. Other edge positions, the rectangular drawing envelope, camera and dimensions are explicit art choices. Route marks express traversal; no physical door state is asserted. Stage is a small distant view at the east opening. No upstairs balcony is implied.", "", "## Runtime reservations", "", *[f"- `{z['id']}`: {z['purpose']}; `{z['box']}`." for z in layout["reservations"]], "", "Bare counter and empty shelving exclude loose contents. NPCs, evidence, movable props (including glasses), stools, lamps, clock state, bins, stateful doors, damage, clutter, weather, crowds and lighting variation remain runtime layers. These drawing zones do not replace the shipping compositor's reviewed coordinates.", "", "Candidate 01 from seed 8317 informed clear floor and depth only; no generated pixels or invented gallery geometry were used."]
    return {"layout.json": encoded(bundle), "reference.png": reference, "perspective.png": preview_buffer.getvalue(), "top-down.svg": ("\n".join(svg)+"\n").encode(), "facts.md": ("\n".join(fact_lines)+"\n").encode()}


def write_bundle(manifest, destination):
    files = render_bundle(manifest)
    destination = Path(destination)
    for name, data in files.items():
        path = destination / name
        if path.exists() and path.read_bytes() != data:
            raise ValueError("Layout output differs; choose a new version/directory rather than overwriting a reference")
    destination.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        (destination / name).write_bytes(data)
    return destination / "layout.json"


def load_reference(manifest, source, width, height):
    from PIL import Image
    validate_layout(manifest)
    source = Path(source).resolve()
    bundle = json.loads(source.read_text(encoding="utf-8"))
    expected = render_bundle(manifest)
    # Re-rendering checks provenance and actual pixels, not just a self-claimed hash.
    if bundle != json.loads(expected["layout.json"]):
        raise ValueError("Stale or altered layout reference; regenerate from the current manifest and blueprint")
    path = (source.parent / bundle["reference"]["file"]).resolve()
    if not path.is_relative_to(source.parent) or path.read_bytes() != expected["reference.png"]:
        raise ValueError("Reference pixels do not match the deterministic layout")
    image = Image.open(path).convert("RGB")
    if image.size != (width,height):
        raise ValueError("Reference dimensions must match generation exactly; no cropping or silent resizing")
    conditioning = {"mode": "img2img", "reference": {**bundle["reference"], "file": "reference/reference.png"},
                    "layout": {"id": bundle["layoutId"], "version": bundle["layoutVersion"], "file": "reference/layout.json",
                               "sha256": digest(encoded(bundle)), "blueprintSha256": bundle["blueprintSha256"], "worldFactsSha256": bundle["worldFactsSha256"], "reviewStatus": bundle["reviewStatus"]}, "mask": None}
    return image, conditioning, expected


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    print(write_bundle(json.loads(Path(args.manifest).read_text(encoding="utf-8")), args.output).resolve())
