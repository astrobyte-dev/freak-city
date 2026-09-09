# Velvet overlay pilot

**2026-09-09 · DRAFT OVERLAY ART / HUMAN REVIEW PENDING.** The room is approved and canonical on the feature branch. This bounded pilot adds one stable Mara sprite, two anonymous figures and five existing-object sprites to an opt-in review path in the real `LocationVisual`. Ordinary play uses the approved plate and retains schematic overlays until the pilot receives separate art approval.

[Open the focused review](visuals/velvet-overlay-pilot/review/index.html) · [Sprite sheet](visuals/velvet-overlay-pilot/sprite-sheet.png) · [Runtime evidence](visuals/velvet-overlay-pilot/review/runtime.json) · [Art provenance](visuals/velvet-overlay-pilot/art-provenance.json) · [Prompts](visuals/velvet-overlay-pilot/prompts.json).

## Approval and branch sequence

The owner explicitly approved the corrected 64-colour plate. Correction evidence and hash-bound human approval were committed and pushed first at `fdb3f4b05dd6845d5038ef8bb1c941cdfdbda800`; origin matched local HEAD. Existing promotion tooling then verified source, parent, manifest, crop, palette and exact 2× display before writing the canonical asset and typed approval flags. Promotion commit: `288ef7e`. [Canonical approval and locked room contract](VELVET-CANONICAL-APPROVAL.md).

No room image was generated or edited in this task. The high-resolution corrected source, earlier 48-colour masters and all experiment evidence remain preserved. PR #1 remains draft. Main and public Pages are outside this change.

## Art and identity

Three built-in imagegen calls created one full-body Mara reference and two distinct anonymous references. The service did not expose model/version/seed; these remain null. Each result unexpectedly contained a baked RGB checkerboard. The originals are preserved; deterministic neutral-background removal, largest-component isolation and nearest-neighbour reduction produce actual binary-alpha sprites. The reproducible script is `tools/visual-gen/velvet_overlay_art.py`. Native integer-pixel prop clusters and the final pencil pixels were authored manually. No model download or local inference occurred.

Mara's source contract is `src/content/world.ts`: age 32, rolled sleeves, a pencil behind one ear, always halfway through a task. Existing affordances additionally describe practical work boots. The sprite uses rolled cuffs, the pencil, empty hands and practical footwear. One 24 × 52 canvas and one 12-colour palette are used for all views and lighting. Hair contour, skin and clothing values necessarily drawn by the reference are **provisional visual choices**, not newly authored biography or approved identity facts. There is no portrait or identity turnaround in this pilot. The retained full-body source can support a later identity review; environment-scale approval must come first.

The anonymous figures use 18 × 40 canvases, back/side views and no identifying accessories. Existing busy occupancy draws five placements from these two fixed assets; sparse draws two; quiet draws none. Selection is stable by authored anonymous slot, separate from the explicit `mara` binding. Named identity never depends on an array index, random value, time or lighting.

Props: stool, chipped empty glass on its folded towel, amber pendant, lined bin, and the existing black envelope. Glass/stool/lamp/bin are non-portable scenery. The lamp has no simulated on/off switch; its bounded counter contribution follows visible fixture presence and existing lighting presentation. No switch, additional fixture or evidence was invented. The envelope is the custody proof: existing parser commands take it in the taxi, walk to the bar, drop it, then take it again. It is drawn only when visible directly in the bar, at an explicitly provisional floor contact. No unsupported glass pickup or fabricated evidence appearance is shown.

## Contacts, depth and light

All sprite rectangles, contacts and source dimensions are integer master pixels. The shared viewport scales the whole plate/composition together. Browser review verifies exactly 320 × 224 and 640 × 448; mobile uses the same viewBox and nearest-neighbour rendering.

Floor Mara preserves the old glyph's actual feet: old zone `(174,151)` plus its 16-pixel foot offset becomes `(174,167)`. Behind-counter staging uses `(77,134)` and the **same** sprite. These are alternative art placements of an already present NPC; no save field, pose state, room movement or schedule is created. The counter's six-vertex traced silhouette masks the hidden lower body. Front staging receives no counter mask. Floor and countertop clips restrict grounding to their own surfaces. Objects on the counter use a surface contact; the pendant uses a mounting origin. Bands sort first, then contact y, then stable ID.

Raised stair/stage contacts explicitly suppress floor reflections, and the floor clip excludes the stair area. There is no current simulation-backed bar staging on stairs or the recessed stage, so no invented raised-actor demonstration or claim of completed stair sprite art is made. The counter is the necessary foreground occluder for this pilot.

Mara's source RGB/alpha remains fixed across states. A bounded per-channel light multiplier changes values by at most 12%; it preserves alpha, proportions, hair and clothing. The pilot renders after the room wash to avoid tinting her twice. Early-state low/morning light studies are explicitly labelled **art lighting studies**, not claims that Mara's schedule places her in Velvet at dawn. Actual late/dawn schedule composites remain separate.

## Owned grounding and reflections

Every eligible actor/object emits its own contact shadow and a vertically flipped, height-compressed raster reflection. Alpha starts below 25%, fades with distance and breaks into restrained horizontal bands. Each reflection is clipped to floor or countertop, uses the same identity and disappears when its source is absent, carried, moved away, damaged or fails to load. A hanging lamp or actor with hidden feet receives no floor double. The reflection is a small authored echo, not a second person.

The renderer consumes the existing descriptor only. No parser, world entity, schedule, gameplay event, scene or save schema changed. Damaged objects fall back to the existing depiction; no unreviewed damage variants were added.

## Runtime review

Eleven real compositor captures are retained. The harness walks through actual parser movement and custody commands, advances existing time and binds the approved shipping plate through the normal registry. It adds only the opt-in draft overlay configuration.

| Capture                     | Actual state / purpose                                                      |
| --------------------------- | --------------------------------------------------------------------------- |
| Early 640 and 320           | 23:55, Mara, five anonymous placements; exact master/display context        |
| Late anonymous              | 02:40, no named NPCs, two anonymous placements                              |
| Dawn empty                  | 05:15, no named NPCs, no anonymous occupants; scenery remains               |
| Envelope present / retaken  | Real drop/take commands; envelope and reflection disappear together         |
| Behind counter              | Same early state and same Mara sprite; alternate art staging                |
| Low / morning light studies | Same early state and identity, explicit existing visual lighting overrides  |
| Mobile                      | 390-pixel viewport, 358-pixel contained composition, no horizontal overflow |
| Canonical runtime           | Normal feature runtime: approved plate, draft overlay option disabled       |

The harness also checks Off, Reduced, image loading, all named/anonymous IDs, exact sprite hashes, nearest-neighbour CSS, dimensions, unchanged registry and failure cleanup. A failed Mara image removes its reflection while her authoritative text presence remains. Browser control was unavailable in the workstation session; the project's installed Playwright path supplies the actual browser evidence.

## Asset budget

The approved canonical WebP is 52,040 bytes. Eight draft sprites total 3,292 bytes, with 2,118 bytes of reflection rasters (5,410 bytes combined); exact sprite/reflection sizes and hashes are in the [provenance inventory](visuals/velvet-overlay-pilot/art-provenance.json). Source references, cutouts and screenshots are portable review evidence, not runtime downloads. The draft files live under `docs/visuals/velvet-overlay-pilot`, with no shipping sprite registry binding or production asset request.

## Remaining visual issues and review gate

Validation passed: **1,008 JavaScript tests, 57 Python tests, full `npm run check`, normal and Pages-path builds, formatting and visual asset validation**. The eleven compositor captures and review-page controls passed browser checks. Source/sprite/reflection hashes, binary alpha, portable links and the unchanged exact 2× canonical display also passed. [Validation record](visuals/velvet-overlay-pilot/validation.json). Pages-path validation is a local build only.

The room remains dominant. Mara's pencil is visible as a few warm pixels at display scale, but weak on mobile. Her small body and face are less legible than the full reference; approve the actual 24 × 52 result, not just the large source. The two anonymous figures repeat across five busy slots and share a 40-pixel height; a later perspective/pose pass may improve their depth variety. The stool, pendant and bin have cleaner clusters than the heavily distressed plate. Reflections are intentionally faint and approximate; they do not reproduce the floor's detailed light streaks. Baked neon stays bright in dawn, an existing room-lighting limitation preserved by the room lock.

The next step is **human review of Mara's candidate identity, native sprites, placement/occlusion and grounding**. Then decide whether to approve this bounded pilot for feature-runtime activation and whether any targeted manual pixel corrections are needed. Do not automatically expand to other characters, rooms or props; do not regenerate Velvet, merge or deploy.
