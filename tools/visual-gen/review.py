"""Explicit role-specific human review contracts, shared by CLI promotion tests."""
import math
from prompt_builder import ROLES, LAYERS


def composition_review(source, composition):
    if not isinstance(composition, dict) or not isinstance(composition.get("anchors"), dict):
        raise ValueError("Canonical promotion requires a reviewed composition JSON")
    contract = source["reviewContract"]
    allowed = set(contract["dynamicObjects"] + contract["dynamicDoors"] + [e["id"] for e in source["bakedEntities"]])
    required = set(contract["dynamicDoors"]) | (set(contract["composition"]["anchors"]) & set(contract["dynamicObjects"]))
    if not required <= set(composition["anchors"]) or not set(composition["anchors"]) <= allowed:
        raise ValueError("Composition must cover dynamic anchors and doors using canonical entity IDs")
    glyphs = {"door", "window", "sign", "counter", "shelf", "stool", "light", "glass", "bin", "camera", "trolley", "fridge", "table", "kettle", "mug", "wall"}
    def coordinates(zone, point=False):
        fields = ("x", "y") if point else ("x", "y", "width", "height")
        if any(not isinstance(zone.get(k), (int, float)) or isinstance(zone[k], bool) or not math.isfinite(zone[k]) for k in fields):
            raise ValueError("Composition coordinates must be finite numbers")
        if not 0 <= zone["x"] <= 320 or not 0 <= zone["y"] <= 224:
            raise ValueError("Composition zone outside 320 x 224")
        if not point and (zone["width"] <= 0 or zone["height"] <= 0 or zone["x"] + zone["width"] > 320 or zone["y"] + zone["height"] > 224):
            raise ValueError("Composition zone outside 320 x 224")
    for entity_id, anchor in composition["anchors"].items():
        coordinates(anchor)
        if anchor.get("glyph") not in glyphs or (entity_id in contract["dynamicDoors"] and anchor["glyph"] != "door"):
            raise ValueError("Composition has an unsupported or mismatched glyph")
    for key in ("npcZones", "atmosphereZones", "foregroundZones"):
        zones = composition.get(key)
        if not isinstance(zones, list) or not zones or (key == "npcZones" and len(zones) < 4):
            raise ValueError("Composition needs four NPC positions and atmosphere/foreground zones")
        for zone in zones:
            coordinates(zone, point=key == "npcZones")
    return composition


def role_review(source, *, architecture=False, composition=None, non_explicit=False, illustration=None, reference_geometry=False):
    role = source.get("role", "texture")
    if role not in ROLES or source.get("layer") != LAYERS[role]:
        raise ValueError("Candidate has an invalid asset role/layer")
    if role == "overlay":
        raise ValueError("Overlay studies cannot ship until alpha masks and simulation bindings are reviewed")
    if role == "texture":
        return {"role": role}, {"backgroundOnly": True}
    if not non_explicit:
        raise ValueError("Non-explicit human review is required")
    if role == "canonical-room":
        if not architecture or source["variantId"] != "canonical" or source.get("authoritativeArchitecture") is not False:
            raise ValueError("Canonical architecture approval required; time variants cannot become room plates")
        conditioning = source.get("conditioning", {})
        guided = conditioning.get("mode") == "img2img"
        if guided and (not reference_geometry or not source.get("referenceGeometryReviewRequired") or not conditioning.get("layout", {}).get("sha256") or not conditioning.get("reference", {}).get("sha256")):
            raise ValueError("Reference geometry approval required: inspect the layout AND compare staircase, boundaries, every exit, counter, shelves and high window")
        facts = source["reviewContract"]["staticArchitecture"] + source["reviewContract"]["fixedFurniture"]
        fixed = {f["entityId"] for f in facts if f.get("entityId")}
        if fixed != {e["id"] for e in source["bakedEntities"]}:
            raise ValueError("Architecture metadata differs from fixed facts")
        review = {"architectureChecked": True, "compositionChecked": True, "nonExplicit": True}
        if guided:
            review.update(referenceGeometryChecked=True, layoutSha256=conditioning["layout"]["sha256"], referenceSha256=conditioning["reference"]["sha256"])
        return {"role": role, "authoritativeArchitecture": True, "bakedEntities": source["bakedEntities"],
                "composition": composition_review(source, composition)}, review
    if source.get("authoritativeGeometry") is not False or not isinstance(illustration, dict):
        raise ValueError("Scene illustration requires a non-authoritative authored scene binding")
    if not illustration.get("sceneId") or not illustration.get("caption", "").strip():
        raise ValueError("Illustration requires existing scene ID and accessible caption")
    for key, allowed in (("timeBands", {"early", "night", "late", "closing", "dawn", "day"}),
                         ("requiredNPCs", {"mara", "celeste", "luca", "inez"}),
                         ("themes", {"romance", "socialPressure", "surveillance", "substanceUse", "powerExchange", "restraint", "symbolicOwnership", "performance", "fetishFashion", "humiliation", "aftercare"})):
        values = illustration.get(key)
        if not isinstance(values, list) or not set(values) <= allowed or (key == "timeBands" and not values):
            raise ValueError(f"Invalid illustration {key}")
    return {"role": role, "authoritativeGeometry": False, "authoritativeArchitecture": False,
            "illustration": illustration}, {"nonExplicit": True}
