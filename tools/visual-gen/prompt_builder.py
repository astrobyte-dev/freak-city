"""Engine-agnostic, auditable prompt specification. No model imports."""
import re


def safe_id(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", value):
        raise ValueError("Room and variant identifiers must be lowercase letters, digits and hyphens")
    return value


def build_prompt(manifest, variant=None):
    room = safe_id(manifest["roomId"])
    variant = safe_id(variant or manifest.get("state", {}).get("timeBand", "early"))
    if variant not in manifest["timeVariants"] and variant != "base":
        raise ValueError(f"Unknown visual variant: {variant}")
    for field in ("requiredVisualFacts", "forbiddenVisualFacts"):
        if not isinstance(manifest.get(field), list) or not manifest[field]:
            raise ValueError(f"Manifest must provide {field}")
    state = dict(manifest.get("state", {}))
    state["timeBand"] = variant
    state["lighting"] = {"early": "amber", "night": "amber", "late": "low", "closing": "work", "dawn": "morning", "day": "cold"}.get(variant, manifest["lighting"])
    style = manifest["styleGuide"]
    # Keep the actual model prompt short: CLIP truncates long prose. The complete
    # state and required/forbidden facts stay in the audit prompt and sidecar.
    model_style = style.get("model", "32-bit pixel art, PS1 texture, grungy neo-noir, restrained colour, heavy shadow")
    family_style = style.get("familyModel", "Dirty charcoal and aged brass")
    model_prompt = (
        f"Empty abstract texture plate. {model_style}. {family_style}. "
        f"{state['lighting']} light, {variant} mood. "
        "Empty object and character zones. Background texture only."
    )
    audit = "\n\n".join([
        f"STYLE: {style['core']} {style['family']}",
        f"ROOM (reference only, not baked objects): {manifest['roomIdentity']}\n{manifest['canonicalArchitecture']}",
        "REQUIRED:\n" + "\n".join(manifest["requiredVisualFacts"]),
        "FORBIDDEN:\n" + "\n".join(manifest["forbiddenVisualFacts"]),
        f"STATE (runtime layers): {state}",
        f"CONCEPT: {manifest['sceneConcept']}",
        "COMPOSITOR: canonical objects, NPCs, doors, windows, evidence and crowds are rendered separately.",
    ])
    return {"roomId": room, "variantId": variant, "prompt": audit, "modelPrompt": model_prompt,
            "style": style, "requiredFacts": manifest["requiredVisualFacts"], "forbiddenFacts": manifest["forbiddenVisualFacts"],
            "state": state, "layer": "background-texture"}
