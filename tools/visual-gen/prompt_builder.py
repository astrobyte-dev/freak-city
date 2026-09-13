"""Role-aware, engine-agnostic prompt specification. No model imports."""
import re

ROLES = ("texture", "canonical-room", "scene-illustration", "overlay")
LAYERS = {"texture": "background-texture", "canonical-room": "background-architecture",
          "scene-illustration": "illustration", "overlay": "overlay-study"}


def safe_id(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", value):
        raise ValueError("Room and variant identifiers must be lowercase letters, digits and hyphens")
    return value


def validate_manifest(manifest, role):
    if role not in ROLES:
        raise ValueError(f"Unknown asset role: {role}")
    if manifest.get("role", role) != role:
        raise ValueError("Requested role differs from prepared manifest")
    conditioning = manifest.get("conditioning", {"mode": "text-only"})
    if conditioning.get("mode") != "text-only" or any(conditioning.get(k) is not None for k in ("reference", "mask", "layout")):
        raise ValueError("Manifest conditioning must start text-only; use --reference for a validated layout bundle. Masks and other modes are not implemented.")
    for field in ("requiredVisualFacts", "forbiddenVisualFacts"):
        if not isinstance(manifest.get(field), list) or not manifest[field]:
            raise ValueError(f"Manifest must provide {field}")
    if role == "texture":
        return  # v1 manifests remain supported.
    for field in ("staticArchitecture", "fixedFurniture", "dynamicObjects", "dynamicDoors", "npcZones",
                  "atmosphereZones", "foregroundZones", "sceneIllustrationHints", "requiredFacts", "forbiddenFacts", "bakedEntities"):
        if not isinstance(manifest.get(field), list):
            raise ValueError(f"Role manifest must provide {field}")
    facts = manifest["staticArchitecture"] + manifest["fixedFurniture"]
    if not facts or any(not isinstance(f, dict) or not f.get("text", "").strip() for f in facts):
        raise ValueError("Canonical architecture facts must be nonempty grounded text")
    fixed = [f["entityId"] for f in facts if f.get("entityId")]
    dynamic = manifest["dynamicObjects"] + manifest["dynamicDoors"]
    if len(set(fixed)) != len(fixed) or len(set(dynamic)) != len(dynamic) or set(fixed) & set(dynamic):
        raise ValueError("Canonical and dynamic fact separation is ambiguous")
    entities = {e["id"]: e for e in manifest.get("canonicalEntities", [])}
    for entity_id in fixed:
        e = entities.get(entity_id)
        if not e or e.get("portable") or e.get("owner") or e.get("kind") in ("Door", "Evidence", "InventoryItem", "Wearable", "Phone") or (e.get("open") is not None and not e.get("properties", {}).get("surface")):
            raise ValueError(f"Unsafe permanent entity: {entity_id}")
    if set(fixed) != {e["id"] for e in manifest["bakedEntities"]}:
        raise ValueError("Baked entity metadata must match permanent facts")
    if not manifest["requiredFacts"] or not manifest["forbiddenFacts"]:
        raise ValueError("Human review facts are required")


def build_prompt(manifest, variant=None, role="texture"):
    validate_manifest(manifest, role)
    room = safe_id(manifest["roomId"])
    if role == "canonical-room":
        if variant not in (None, "canonical"):
            raise ValueError("Canonical room identity cannot be regenerated per time band")
        variant = "canonical"
        state = {"timeBand": "canonical", "lighting": "neutral practical", "weather": "base"}
    else:
        variant = safe_id(variant or manifest.get("state", {}).get("timeBand", "early"))
        if variant not in manifest["timeVariants"] and variant != "base":
            raise ValueError(f"Unknown visual variant: {variant}")
        state = dict(manifest.get("state", {}))
        state["timeBand"] = variant
        state["lighting"] = {"early": "amber", "night": "amber", "late": "low", "closing": "work", "dawn": "morning", "day": "cold"}.get(variant, manifest["lighting"])
    style = manifest["styleGuide"]
    model_style = style.get("model", "32-bit pixel art, PS1 texture, grungy neo-noir, restrained colour, heavy shadow")
    family_style = style.get("familyModel", "Dirty charcoal and aged brass")
    room_style = style.get("roomModel", "32-bit pixel art, PS1, neo-noir")
    architecture = manifest.get("staticArchitecture", []) + manifest.get("fixedFurniture", [])
    required = list(manifest["requiredVisualFacts"] if role == "texture" else manifest["requiredFacts"])
    forbidden = list(manifest["forbiddenVisualFacts"] if role == "texture" else manifest["forbiddenFacts"])
    if role == "texture":
        model_prompt = (f"Empty abstract texture plate. {model_style}. {family_style}. "
                        f"{state['lighting']} light, {variant} mood. Empty object and character zones. Background texture only.")
    elif role == "canonical-room":
        physical = ", ".join(f.get("model", f["text"]) for f in architecture)
        model_prompt = (f"{room_style}. {manifest['roomIdentity']} interior. {physical}. "
                        "Wide deep establishing view, clear overlay space. No people, props, extra stairs or exits.")
        if manifest.get("weatherCompatibility") != "inside":
            model_prompt = model_prompt.replace(" interior.", " exterior.")
        required += [f["text"] for f in architecture]
        required += ["One canonical image across the night; no time-specific architecture variants.",
                     "Human must check all exits, staircase count, fixed placement and overlay composition."]
    elif role == "scene-illustration":
        if not manifest["sceneIllustrationHints"]:
            raise ValueError("Scene illustration requires an authored hint")
        hint = manifest["sceneIllustrationHints"][0]
        model_prompt = f"{style.get('sceneModel', room_style)}. {hint}. Cinematic framing, non-explicit, no text or logos."
        required = ["Illustrative view, not a parser map. Match major established world facts.",
                    "Adults only, non-explicit; scene, character presence and boundary review required."]
        forbidden = ["Contradictory major architecture, invented evidence, hidden discoveries or legible story text.",
                     "Explicit sexual activity, nudity, minors, branded logos or distracting fake text.",
                     "Obvious malformed anatomy; named character likeness or presence without scene review."]
    else:
        model_prompt = f"{room_style}. Isolated atmospheric haze layer study, dark field, no architecture, people, props or text."
        required = ["Atmospheric layer study only. A reviewed alpha mask and state binding are needed before shipping."]
        forbidden = ["Baked architecture, characters, evidence or other world facts."]
    review_contract = {"staticArchitecture": manifest.get("staticArchitecture", []),
                       "fixedFurniture": manifest.get("fixedFurniture", []),
                       "dynamicObjects": manifest.get("dynamicObjects", []), "dynamicDoors": manifest.get("dynamicDoors", []),
                       "exits": manifest.get("exits", []),
                       "composition": {"anchors": manifest.get("canonicalVisualAnchors", {}),
                                       "npcZones": manifest.get("npcZones", manifest.get("npcPlacementZones", [])),
                                       "atmosphereZones": manifest.get("atmosphereZones", []),
                                       "foregroundZones": manifest.get("foregroundZones", [])}}
    audit = "\n\n".join([
        f"ROLE: {role}", f"STYLE: {style['core']} {style['family']}",
        f"ROOM REFERENCE: {manifest['roomIdentity']}\n{manifest['canonicalArchitecture']}",
        "REQUIRED:\n" + "\n".join(required), "FORBIDDEN:\n" + "\n".join(forbidden),
        f"LAYER CONTRACT: {review_contract}", f"STATE (runtime layers): {state}",
        f"CONCEPT: {manifest['sceneConcept'] if role == 'texture' else role}",
        "COMPOSITOR: dynamic objects, stateful doors, evidence, named NPCs and time lighting remain simulation-driven.",
    ])
    return {"roomId": room, "variantId": variant, "role": role, "prompt": audit, "modelPrompt": model_prompt,
            "style": style, "requiredFacts": required, "forbiddenFacts": forbidden,
            "state": state, "layer": LAYERS[role], "authoritativeGeometry": False,
            "authoritativeArchitecture": False, "architectureReviewRequired": role == "canonical-room",
            "bakedEntities": manifest.get("bakedEntities", []) if role == "canonical-room" else [],
            "reviewContract": review_contract,
            "conditioning": manifest.get("conditioning", {"mode": "text-only"})}
