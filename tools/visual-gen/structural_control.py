"""Deterministic Canny derived only from the validated, unchanged room blockout."""
import io
import math
from pathlib import Path
from PIL import Image
from layout_reference import digest

MODE = "controlnet-inpaint"
ALGORITHM = "opencv-canny-rgb-v1"


def canny(reference):
    import cv2
    import numpy as np
    # Explicit RGB -> gray; fixed thresholds/aperture, no learned annotator or resize.
    gray=cv2.cvtColor(np.asarray(reference.convert("RGB")),cv2.COLOR_RGB2GRAY)
    return Image.fromarray(cv2.Canny(gray,20,40,apertureSize=3,L2gradient=False)).convert("RGB")


def control_bundle(reference, reference_record):
    import cv2
    image=canny(reference); buffer=io.BytesIO(); image.save(buffer,"PNG")
    data=buffer.getvalue()
    record={"file":"control/canny.png","sha256":digest(data),"pixelSha256":digest(image.tobytes()),
            "width":image.width,"height":image.height,"algorithm":ALGORITHM,"opencv":cv2.__version__,
            "lowThreshold":20,"highThreshold":40,"apertureSize":3,"L2gradient":False,
            "sourceReferenceSha256":reference_record["sha256"],"dynamicEntitiesEncoded":False}
    return image,record,{record["file"]:data}


def control_settings(options):
    value=getattr(options,"control_scales",None)
    if options.backend!="sdxl-controlnet":
        if value is not None: raise ValueError("Control scales require the sdxl-controlnet backend")
        return None
    if options.role!="canonical-room" or not options.reference or not options.regions:
        raise ValueError("ControlNet requires canonical-room, validated --reference and explicit --regions")
    if options.strengths is not None:
        raise ValueError("Hold denoising fixed during a control-strength comparison")
    if (options.pixel_width,options.display_width)!=(320,640):
        raise ValueError("Controlled canonical rooms require exact 320 -> 640 nearest-neighbour output")
    if options.device!="cuda" or not math.isfinite(options.guidance_scale) or not 1 < options.guidance_scale <= 12:
        raise ValueError("ControlNet requires CUDA and finite classifier-free guidance in (1,12]")
    values=[float(v) for v in value.split(",")] if value is not None else [0.5]*options.count
    if len(values)!=options.count or any(not math.isfinite(v) or not 0 < v <= 2 for v in values):
        raise ValueError("One finite control scale per candidate within (0,2] is required")
    if value is not None and len(set(values))!=len(values):
        raise ValueError("Control comparison scales must be distinct")
    from controlnet_backend import BASE_REVISION
    if options.revision and options.revision!=BASE_REVISION:
        raise ValueError("Production backend uses the documented pinned model revision")
    return values


def validate_control_provenance(root, conditioning):
    from import_edit import checked_file
    record=conditioning.get("control")
    if not isinstance(record,dict) or record.get("algorithm")!=ALGORITHM or record.get("dynamicEntitiesEncoded") is not False:
        raise ValueError("Missing or unsupported structural control provenance")
    if record.get("sourceReferenceSha256")!=conditioning["reference"]["sha256"]:
        raise ValueError("Control source reference hash differs from candidate reference")
    path=checked_file(Path(root),record)
    ref=checked_file(Path(root),conditioning["reference"])
    with Image.open(ref) as reference, Image.open(path) as control:
        expected=canny(reference)
        if (record.get("width"),record.get("height"))!=expected.size or control.size!=expected.size or control.convert("RGB").tobytes()!=expected.tobytes() or record.get("pixelSha256")!=digest(expected.tobytes()):
            raise ValueError("Control pixels differ from deterministic reference edges")
    if any(record.get(k)!=v for k,v in {"lowThreshold":20,"highThreshold":40,"apertureSize":3,"L2gradient":False}.items()):
        raise ValueError("Control algorithm parameters differ from recorded provenance")
    return path
