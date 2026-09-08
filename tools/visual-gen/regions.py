"""Masks follow visible blockout surfaces. Hard restoration protects structural pixels."""
import io
from PIL import Image, ImageChops, ImageDraw, ImageFilter
from layout_reference import geometry, digest, encoded, validate_layout

REGIONS = ("walls", "floor", "counter", "shelves", "stairs")
MATERIALS = {
    "walls": "Worn burgundy plaster and dirty brick surface, subtle pink and cyan reflected light",
    "floor": "Empty dark worn floor surface, restrained glossy pink and cyan reflections",
    "counter": "Bare aged wood bar surface, crimson lacquer, subtle brass patina",
    "shelves": "Empty fixed wood shelving surface, aged stain and worn edges",
    "stairs": "Worn single staircase materials, dark wood treads and muted brass edges",
}


def region_masks(manifest, names):
    layout = validate_layout(manifest)
    if not names or len(set(names)) != len(names) or not set(names) <= set(REGIONS):
        raise ValueError("Select distinct supported surface regions")
    owners = Image.new("L", (320,224), 0)
    draw = ImageDraw.Draw(owners)
    for points, _, region in geometry(layout, with_regions=True):
        draw.polygon(points, fill=REGIONS.index(region)+1 if region in REGIONS else 0)
        draw.line(points+[points[0]], fill=0, width=3)
    masks = {}
    for name in names:
        value = REGIONS.index(name)+1
        mask = owners.point(lambda p: 255 if p == value else 0)
        # Inset within each visible face; never blur across a silhouette or route.
        mask = mask.filter(ImageFilter.MinFilter(3))
        if not mask.getbbox():
            raise ValueError(f"Region {name} has no safe editable pixels")
        masks[name] = mask.resize((640,448), Image.Resampling.NEAREST)
    return masks


def union_mask(masks):
    union = Image.new("L", next(iter(masks.values())).size, 0)
    for mask in masks.values():
        union = ImageChops.lighter(union,mask)
    return union


def mask_bundle(manifest, names):
    masks=region_masks(manifest,names)
    files={}; records=[]
    for name,mask in masks.items():
        buffer=io.BytesIO(); mask.save(buffer,"PNG")
        filename=f"masks/{name}.png"; files[filename]=buffer.getvalue()
        records.append({"region":name,"file":filename,"sha256":digest(files[filename]),"editablePixels":mask.histogram()[255]})
    summary={"version":1,"mode":"regional-inpaint","white":"editable surface interior","black":"protected; restored exactly", "edgeInsetMasterPixels":2,
             "regions":records,"protectedFeatures":["room boundary","all routes","stair face edges and silhouette","counter footprint","window footprint and glass","stage relationship"]}
    files["masks/regions.json"]=encoded(summary)
    return masks, {"file":"masks/regions.json","sha256":digest(files["masks/regions.json"]),**summary}, files


def composite_region(generated, base, mask):
    if generated.size != base.size or mask.size != base.size or mask.mode != "L" or set(mask.getextrema()) - {0,255}:
        raise ValueError("Regional compositing requires matching dimensions and a binary mask")
    if any(count for i,count in enumerate(mask.histogram()) if i not in (0,255)):
        raise ValueError("Soft masks cannot guarantee protected pixels")
    return Image.composite(generated.convert("RGB"),base.convert("RGB"),mask)


def protected_difference(image, base, mask):
    difference = ImageChops.difference(image.convert("RGB"),base.convert("RGB"))
    protected = Image.composite(difference,Image.new("RGB",image.size),ImageChops.invert(mask))
    data=protected.tobytes()
    return sum(1 for i in range(0,len(data),3) if any(data[i:i+3]))


def restore_pixel_structure(pixels, reference_pixels, mask, colors):
    """Global palette/contrast may recolour protected pixels; restore them afterwards.

    Reserve their exact palette entries, then map edited surfaces to the remaining
    palette budget. This preserves both the geometry baseline and colour cap.
    """
    mask=mask.resize(pixels.size,Image.Resampling.NEAREST)
    base_colors=sorted({color for _,color in reference_pixels.getcolors(256)})
    if len(base_colors)>colors:
        raise ValueError("Palette budget cannot represent the protected baseline")
    palette=base_colors[:]
    for _,color in sorted(pixels.getcolors(pixels.width*pixels.height),reverse=True):
        if color not in palette and len(palette)<colors:
            palette.append(color)
    palette_image=Image.new("P",(1,1))
    palette_image.putpalette([channel for color in (palette+[palette[0]]*(256-len(palette))) for channel in color])
    mapped=pixels.quantize(palette=palette_image,dither=Image.Dither.NONE).convert("RGB")
    return composite_region(mapped,reference_pixels,mask)


def regional_generate(backend, spec, settings, seed, reference, masks):
    from generator import fixture_image
    current=reference.copy(); passes=[]
    for index,(name,mask) in enumerate(masks.items()):
        region_seed=(seed+1009*index) % 2**32
        prompt=f"32-bit pixel art, grungy PS1 texture. {MATERIALS[name]}. Surface detail only, no objects, doors, windows, people or text."
        region_spec={**spec,"modelPrompt":prompt}
        generated=backend.generate(region_spec,settings,region_seed,reference=current,mask=mask) if backend else fixture_image(region_seed,*reference.size)
        current=composite_region(generated,current,mask)
        passes.append({"region":name,"seed":region_seed,"modelPrompt":prompt,"strength":settings["strength"],"effectiveSteps":settings["effectiveSteps"]})
    return current,passes
