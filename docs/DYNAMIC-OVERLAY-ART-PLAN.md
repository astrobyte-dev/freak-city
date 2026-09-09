# Dynamic overlay art plan

**Current implementation:** [Velvet overlay pilot](VELVET-OVERLAY-PILOT.md) now provides one draft Mara identity, two anonymous sprites, five existing-object sprites, integer contacts, polygon counter occlusion, bounded lighting and entity-owned reflections. The room is approved; overlay art remains pending human review and is opt-in in the review harness. This plan below is retained as the starting contract, with its earlier future-tense status now historical.

Status: art and integration plan only. No sprites, character likenesses, new simulation states or shipping bindings are created by this task.

Canonical rooms establish permanent structure. Cinematic illustrations may frame selected moments freely. Overlays express the existing simulation on top of a stable room. The current schematic overlays demonstrate synchronization but lack the material, palette and silhouette treatment needed beside richer plates.

## Master grid and anchors

Author all room assets on the **320 × 224** master grid. Display the canonical room at **640 × 448** using exact nearest-neighbour 2× scaling. Sprite sheets use integer source rectangles, no smooth resizing, no half-pixel translation. Mobile scales the entire composition consistently; it does not independently resize people and props.

Suggested initial sprite bounds are art budgets, not newly established character heights or physical measurements:

| Asset                               | Master-pixel bounds                                               | Placement origin                    | Initial variants                                                       |
| ----------------------------------- | ----------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Named NPC                           | 20–28 wide × 42–56 high near floor; authored smaller distant view | Foot contact at bottom centre       | Front/three-quarter/side/back as needed; idle and existing pose states |
| Anonymous patron                    | 16–24 × 36–52                                                     | Foot contact                        | A small reviewed silhouette set; standing/seated only where supported  |
| Stool                               | 12–18 × 18–24                                                     | Floor contact                       | Present; existing damaged state if represented                         |
| Glass                               | 3–6 × 6–10                                                        | Contact point on counter/table      | Existing whole/broken or filled states only                            |
| Lamp                                | 8–16 × 12–24                                                      | Fixture mounting or surface contact | Unlit/lit emission mask                                                |
| Bin                                 | 12–18 × 16–24                                                     | Floor contact                       | Existing open/closed/damage states only                                |
| Movable evidence                    | 3–12 × 3–12, entity specific                                      | Surface contact                     | Existing custody/location/visibility states                            |
| Stateful door                       | Per-opening polygon/rectangle                                     | Hinge plus threshold                | Existing open/closed; locked only if visibly distinct                  |
| Light / weather / reflection / haze | Room-sized indexed mask or small tile                             | Room origin plus clip region        | Existing exposure/weather/time and accessibility state                 |

Retain existing entity IDs as bindings. Extend reviewed composition data with `origin`, `sourceRect`, `depthBand`, `occlusionMask`, and surface/foot contact only in a later implementation. The room's NPC zones describe valid ground contacts; they are not random screen positions. Discrete authored near/mid/far sprite sizes prevent texture blur and arbitrary body distortion. Do not claim an exact perspective scale from the current nonmetric blockout.

Objects on the counter use a reviewed **surface anchor**, not the floor origin. Room-specific furniture masks must hide lower bodies or objects where appropriate. Validate anchor bounds against the plate and keep interaction descriptions in the existing text UI; tiny illegible sprite text must not become the only clue.

## Palette and surface treatment

Inherit the room's art-direction family from [VISUAL-STYLE.md](VISUAL-STYLE.md): public Velvet magenta/cyan/black, quieter private warmth, utilitarian service values, restrained apartment light. Each identity retains a small approved local palette; room lighting adds bounded tint through masks rather than replacing identity colours. Named characters should remain recognizable in early, late and dawn composites.

Start with 8–12 colours per character and 4–8 per small prop, selected from or reconciled with the room palette. These are budgets for a future asset pass, not an assertion that the whole layered composition already stays within 48 colours. Treat black silhouettes as shaded masses with a readable head/shoulder profile, clothing seams and selective reflected edge light. Use deliberate pixel clusters, textured midtones and restrained highlights. Avoid uniformly outlined rectangles, floating ellipses and arbitrary neon fills that look like debugging glyphs.

Match the plate's contrast, light direction and wear scale. Keep the actor's face/clothing focal detail below cinematic illustration detail. Place props against both dark and bright test patches; a glass needs a consistent rim/contact cue, not a glowing generic square. Ground shadows and optional reflections belong to the actor/prop and disappear with it.

## Stable named identities

Create one reviewed identity record for each existing important NPC (Mara, Celeste, Luca and Inez), keyed by canonical NPC ID. Its silhouette, hair shape, face references, proportions, signature clothing and palette are approved once. Do not infer new biographical or appearance facts from a generated bartender. Scene candidate 02 remains an anonymous stylistic reference until actual character compatibility is reviewed.

Each identity can have:

1. A compact turnaround and palette reference, checked against existing authored description.
2. Small environment sprites for the views actually used by room compositions.
3. Optional portrait/illustration references sharing the same identity.
4. Explicitly authored outfit/pose/state variations, only where current content supports them.

Load stable sprite IDs from this record; never generate or randomly choose a named person's appearance at runtime. Anonymous crowds use a separate reusable set and must not masquerade as a named person or introduce named presence. If anonymous variation is needed later, use a stable selection for a given encounter; changing room renders must not continuously reshuffle visible bodies.

## State, occlusion and layer rules

Proposed draw order is plate → surface light/reflection masks → back wall fixtures/door leaf → distant actors/props → middle actors/props → foreground occluders → restrained atmosphere. Within the same floor band, sort by reviewed foot-contact y, with explicit overrides for raised stage/stairs and furniture surfaces. Depth is a rendering rule, not new simulated geography.

Split foreground counter/stair/door-frame silhouettes into reviewed occlusion masks when needed. An actor behind the counter loses the lower body to the counter mask; an actor standing in front must remain visible. Do not use a universal rectangular crop. A movable object's reflection must be removed when it is carried or removed; evidence may not persist as decoration after custody changes.

Only a real stateful door entity receives open/closed/locked art. Velvet's seven routes are not seven stateful door leaves: none of its current exits is bound to a Door entity. Opening silhouettes and off-camera routes remain the canonical layout's responsibility. Any future door sprite is bound to existing entity state, not a visual guess that a dark opening ought to be lockable.

Light masks clip to actual fixture/surface regions. Rain belongs outside or beyond the high window under the existing exposure rules. Reflections cannot imply indoor rain or a person who has left. Smoke/haze must use existing atmosphere state and must not imply an unmodelled smoking event. Reduced mode uses a still or gentler layer; Off keeps the current text-first fallback. Do not introduce flashing or essential information conveyed only by animation.

## Small first implementation, later

After one room plate and its geometry are approved, author a Velvet pilot: one approved named NPC identity and a few views, two anonymous silhouettes, stool/glass/lamp/bin sprites, and one clipped light/reflection study. Include evidence only for an actual existing visible entity. This is the next **overlay** task, not work performed in the ControlNet bake-off.

Review the real `LocationVisual` composites at 320 and 640, mobile, early/late/dawn, empty/crowded, present/absent NPC, moved/held/removed object, and Off/Reduced. Check foot contact, counter occlusion, stable identity, room exits, evidence readability and absence of invented narrative information. Art approval and reviewed anchor data precede any replacement of the current fallback glyphs.

The shipping pipeline remains ordinary static WebP/PNG assets, source rectangles, masks and typed state. No generator, model weights, random face synthesis or network inference enters the browser.

## Evidence from the external Velvet plate, 2026-09-09

The [external-edit review](EXTERNAL-EDIT-REVIEW.md) now supplies actual 48/64-colour early/late/dawn/mobile composites against a much richer glossy neon room. These establish several concrete pilot requirements beyond the earlier schematic blockout:

- **Separate emission from material.** Bright baked tubes, lamp pools, window colour and their floor streaks survive the dawn wash. A general tint cannot control them independently. Prepare bounded emission/reflection masks or an albedo/emission split for the existing lighting presentation; do not invent new gameplay light states. Audit all baked fixtures against the dynamic lamp before approval.
- **Make contact/reflections part of the actor asset contract.** The glossy floor makes their absence conspicuous. Ground shadow and optional vertically attenuated reflection must share the actor/prop's existence, pose, depth, clipping and visibility. A reflection cannot remain after its source leaves or changes custody.
- **Migrate the current NPC origin explicitly.** Today's schematic glyph has feet at `npcZone.y + 16`, not at the zone origin, and its head begins at `y - 48`. Converting to bottom-centre origins without adjusting composition data would move every character. Record that migration when the first real sprite lands.
- **Review actual surface scale.** The current 11 × 17 glass and 23 × 36 lamp are oversized against this plate. Use the smaller sprite budgets above with reviewed counter/mounting contacts; merely moving the old glyphs is insufficient. Keep the text register authoritative for tiny or unanchored details.
- **Require a counter occlusion proof.** The new floor placement works as a presence demonstration, but the renderer has no counter mask to hide a bartender's lower body. Include a separate behind-counter placement test before claiming the pilot supports that staging.

The stronger plate remains draft; these are requirements for the later small overlay pilot. No sprite library, lighting-mask implementation, simulation change or shipping anchor replacement was made in this evaluation.
