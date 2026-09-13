# Velvet / the bar

- Contract version: 1; asset ID: `bar`; role: `canonical-room`.
- Status: exact corrected 64-colour plate approved 2026-09-09; locked. [Approval](../../visuals/velvet-architecture-cleanup/human-approval.json), [canonical record](../../VELVET-CANONICAL-APPROVAL.md).
- Authority: [spaces](../../../src/content/spaces.ts), [architecture](../../../src/content/visuals/architecture.ts), [layout](../../../src/content/visuals/layouts/bar.json), [registry/composition](../../../src/content/visuals/assets.json). The retained [world-manifest snapshot](../../visuals/velvet-architecture-cleanup/candidate/provenance/world-manifest.json) explains the source's original review basis.
- Source: [original.png](../../visuals/velvet-architecture-cleanup/candidate/sources/original.png), 1448 × 1086; SHA-256 `3b6bcb06d78bc43a636e782c082891842d0054c93be1073200826cbcd103c9f2`.
- [Pixel master](../../visuals/velvet-architecture-cleanup/candidate/pixels/64-colours.png), [display](../../../public/visuals/generated/bar--canonical-room--canonical--8b5c100cebc6.webp), [processing/provenance](../../visuals/velvet-architecture-cleanup/candidate/bar__canonical-room__canonical__64-colours.json).

## World facts

The main bar floor opens toward the small stage through the east passage. One staircase leads upstairs beside the quieter salon. The fixed counter and shelving occupy the left side; a high street-facing window is on the right. A service route leads toward the kitchen. Vestibule, street, landing, kitchen, stage, salon and archive routes remain those of the manifests; off-camera routes need no new visible door.

The simulation owns the towel/glass, stool, pendant, bin, black envelope and NPCs. Descriptive mentions of pencils/cups do not authorize extra baked props. The layout uses non-metric art coordinates; its front cutaway is a camera device, not an additional exit.

## Must preserve

Preserve the existing camera, room envelope, single central stair, left counter/shelving, high right window, east threshold and small recessed stage beyond it. Keep open floor reservations for entities, distressed surfaces, cyan/magenta identity, reflective tiles, the exact approved perspective and negative space. Keep the envelope as an existing simulation object, never a permanent room marking.

## Must not invent

No second stair, false rear panel/door, far-left glazing, in-room performance platform, new fixture, tap, loose bottle/vessel, route, text sign, person or evidence. Do not make the east opening into a wall or move the stage into this room. Do not redesign or regenerate Velvet. The approved source is the visual reference; older blockout renders explain facts rather than authorizing camera replacement.

## Camera / composition

The approved high-quality source is 1448 × 1086. The reviewed crop is `[4, 0, 1444, 1008]`, producing 1440 × 1008 (10:7). Remove only four pixels at either side and 78 at the bottom. No stretch, extension or automatic crop. Preserve approved runtime anchors in the registry. Overlay contacts/masks live in [velvet-pilot.ts](../../../src/visuals/velvet-pilot.ts); the counter silhouette masks actors behind it, and floor/surface clips bound reflections.

## Art direction

Grungy neon noir; distressed dark architecture with saturated magenta and cyan edges and broken reflective floor streaks. The room remains dominant. Environmental figures and props must use cohesive pixel clusters at the room's scale. Preserve the existing static emissive surfaces; lighting changes come from the compositor, not separately regenerated time-of-day rooms.

## Dynamic content that must not be baked in

No Mara, other named people, anonymous patrons, portable envelope, runtime stool/glass/lamp/bin or their reflections in the room plate. Only the reviewed counter, shelving and window bindings are declared baked in the registry. Occupancy, named presence, custody, fixture contribution, reflections and transient atmosphere follow simulation-derived descriptors. Static reflected neon is room material; an entity reflection belongs to that entity and disappears with it.

## Palette / pixel target

Opaque retained source PNG → explicit crop → nearest-neighbour 320 × 224 master → Pillow MEDIANCUT 64-colour treatment, contrast 1.15 → exact nearest-neighbour 640 × 448 display → lossless WebP. Approved master has 63 distinct colours after processing. 48-colour historical comparisons remain retained but are not the active plate. Display SHA-256: `8b5c100cebc6b363a02a0891970e3b92e596f4b6a4b7b862ea0462fc895130b1`.

## Review criteria

Compare high-quality source, framed source, pixel master, display and actual early/late/dawn/mobile compositions. Check architecture against all routes, including intentionally off-camera ones. Confirm no baked dynamic entities; require exact source/parent/manifest/master hashes, reproduced pixels and explicit human architecture/composition approval before promotion. Review at 320 and 640 widths and on mobile with Off/Reduced modes. Existing bright dawn neon is a known limitation, not permission to change the source.

## Maintenance / history

Retained source PNGs can be opened in any image editor and imported with `sourceType: manual-edit`. Preserve the parent bytes, contract and crop; a changed file receives a new draft and human review. No maintenance operation needs the original service. See [common pipeline](../../PROVIDER-NEUTRAL-ART-PIPELINE.md). Current authorization covers architecture/tooling only; future surgical bake-off results are experiments and cannot replace this plate.
