# Mara / Velvet environmental sprite

- Contract version: 1; asset ID: `mara`; role: `named-character` (environmental overlay).
- Status: A- / human-approved direction, 2026-09-09, bounded Velvet pilot. [Approval and exact sprite/reflection hashes](../../visuals/velvet-overlay-pilot/human-approval.json).
- Authority: [world character description](../../../src/content/world.ts), [affordances](../../../src/content/affordances.ts), existing simulation schedule and [runtime binding](../../../src/visuals/velvet-pilot.ts).
- Retained [full-body source](../../visuals/velvet-overlay-pilot/sources/mara.png), [alpha cutout](../../visuals/velvet-overlay-pilot/sources/mara-cutout.png), [native pixel master](../../visuals/velvet-overlay-pilot/sprites/mara.png), [shipping raster](../../../public/visuals/velvet-overlay/sprites/mara.png), [provenance](../../visuals/velvet-overlay-pilot/art-provenance.json).
- Source SHA-256: `6345795611849ac72cd1838910136e2ba1bf2eb43c64471cebae6b5a29b7461c`; sprite SHA-256: `56136c2c3276d157c5edd9bd3d7b1d20945aaeae6d4c6e88c91afcf27435d534`.

## World facts

Mara is 32. Rolled sleeves, a pencil behind one ear, always halfway through a task. Existing affordances establish practical work boots. These facts are story authority. Hair, skin, clothing values and silhouette visible in the approved environmental sprite are retained visual choices; approval does not invent biography, ethnicity or a new identity turnaround.

## Must preserve

Use the same identifiable adult Mara in every supported room-lighting state: same proportions, hair contour, skin/clothing palette, rolled cuffs, pencil and practical footwear. Keep empty hands in this sprite. Preserve the actual approved 24 × 52 result; do not regenerate Mara or substitute a new face because a tool changes. Full-body source supports maintenance, not an authorized portrait production pass.

## Must not invent

No random character selection, time-based identity swap, new accessories, drink, evidence, occupation costume, pose/schedule state or other person. Anonymous patrons must never reuse Mara's sprite or imply any named character's presence. Do not generate Celeste, Luca or Inez.

## Camera / composition

One isolated full-body environmental figure with transparent background at 24 × 52 native pixels. Floor foot anchor `(174,167)`; alternative behind-counter art staging `(77,134)` uses the same sprite and hides its lower body through the counter polygon. Staging proves composition of an already present Mara; it is not a gameplay position or new schedule. Do not draw both placements simultaneously. Sort depth band, then contact y, then stable entity ID.

## Art direction

Restrained environmental pixel art that sits inside the distressed Velvet plate. Room-aware cyan/magenta edges, small warm pencil accent, legible silhouette without dominating the room. Anonymous 18 × 40 patrons use side/back views and lower opacity. Lighting may adjust RGB within the existing bounded tint, preserving shape and alpha.

## Dynamic content that must not be baked in

No room background, other person, prop, floor shadow or reflection in the character source. Mara renders only when descriptor `npcPresence` includes `mara`. Grounding is entity-owned. Hidden feet receive no floor reflection; absent or failed sprites remove their shadow/reflection together. Anonymous occupancy is independently derived from crowd level.

## Palette / pixel target

The retained original has a baked RGB checkerboard; retain it unchanged as evidence. A real alpha cutout and binary-alpha 24 × 52 PNG master are also retained. The provenance records crop `[281,22,746,1511]`, nearest reduction and the 12-colour palette. Native pencil pixels are manual cleanup. Shipping uses the exact master PNG with nearest scaling in the shared 320 × 224 viewBox; there is no separate interpolated display source. Reflection master is 24 × 17 with faded/striped alpha, stored separately.

## Review criteria

Check the exact sprite in 320/640 and mobile compositions, stable identity under lighting and behind-counter masking, actual early presence, late/dawn absence, subordinate anonymous occupancy and disappearance of source-owned reflection. Keep authoritative text available if art fails. The pencil's faintness on mobile, limited patron variety, cleaner prop clusters and approximate reflections are accepted polish backlog, not activation blockers.

## Maintenance / history

Do not rerun the original authoring model. A human may edit a copy of the retained cutout or native master in Aseprite/Krita/Photoshop, retain before/after PNGs and edit notes, reproduce pixel treatment/grounding, then seek review of the new exact pixels. [Manual maintenance procedures](../../PROVIDER-NEUTRAL-ART-PIPELINE.md#manual-edit-workflow). Original draft metadata remains historical; the separate approval records the later decision. The pilot authoring script is retained as a processing reference and must not overwrite the approved evidence during maintenance.
