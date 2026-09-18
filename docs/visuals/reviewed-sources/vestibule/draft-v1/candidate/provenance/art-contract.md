# Vestibule — proposed art brief

- Contract version: 1. Asset ID: `vestibule`; role: `canonical-room` plus state-owned overlays.
- Approval scope: **brief for owner review only, 2026-09-14**. [Room selection and evidence](../NEXT-ROOM-REVIEW.md). No artwork generated or activated.
- Authority: [room/routes/entities](../../../src/content/spaces.ts), [affordances](../../../src/content/affordances.ts), [architecture partition](../../../src/content/visuals/architecture.ts), [parser schedules](../../../src/engine/parser.ts), [character facts](../../../src/content/world.ts).
- Retained source/master/display/provenance: none for this room. Approved [street](../../visuals/street-activation/REPORT.md) and [Velvet](../../VELVET-CANONICAL-APPROVAL.md) supply visual continuity, not new geography.

## World facts

A narrow dried-wine corridor: bar ahead, working toilets left, cloakroom right, street behind through `side_door`. Warm air and wet wool contrast with the exterior. A dry bench faces the entrance; its leg has a paper shim. There is a toilet notice, orange portable heater, shut entry book, reinforced paper bag and a dry ledge away from rain.

## Must preserve

Keep all four routes and the same shared door identity as street. Match the established worn materials, dark midtones and restrained magenta/cyan venue light; use dried-wine walls as the room's own identity. The ledge and bench are dry. Existing street/Velvet pixels, envelope identity/readability and accepted polish remain unchanged.

## Must not invent

No new rooms, windows, stairs, reception desk, queue, permanently present people or readable private entries. Inez's chair is mentioned in prose but has no separate fixed entity/anchor: reserve staging space and resolve it explicitly with the layout/character treatment, rather than silently adding fixed furniture. No timed heater controls, book-opening animation or bag contents unsupported by state.

## Camera / composition

Propose one slightly elevated three-quarter corridor view from near the side entrance toward the bar. Keep left/right routes legible, reserve a near-edge view of the interior door face, and leave space for Inez and floor/ledge items. Exact placement, contacts and occlusion require a new authored layout; do not mirror the street plate or infer a full bar interior through the passage.

## Art direction

An intimate, practical entrance between the rainy exterior and public bar. Worn painted surfaces, restrained warm light and readable depth; no outdoor rain sheet or wet-street reflections across the dry interior. The separate [future scene-framing preference](../../VISUAL-STYLE.md#future-scene-framing-preference) does not call for a feet-focused view or a new scene here.

## Dynamic content that must not be baked in

Only the corridor shell and established route openings belong in the background; the current fixed-entity allowlist is empty.

| Owner                                           | Separate treatment / required behavior                                                                                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `side_door`                                     | Interior open/closed views; open-state light/contact follows it. It is stored in `street` with `otherSide: vestibule`; use that shared entity, never a duplicate.                                                                |
| `ledge`                                         | Independent dry surface/container and contact; items placed on it follow actual containment. Include it even though the basic manifest's five detail objects omit this sixth world object.                                       |
| `detail_vestibule_bench`                        | Bench and paper shim together; independent contact shadow.                                                                                                                                                                       |
| `detail_vestibule_notice`                       | Authored “TOILETS ON THE LEFT” / “CURRENTLY”; text remains accessible in UI.                                                                                                                                                     |
| `detail_vestibule_heater`                       | Element/guard and any local light together; remove effects if absent/damaged.                                                                                                                                                    |
| `detail_vestibule_book`, `detail_vestibule_bag` | Shut book/ENTRY cover and reinforced bag; no invented contents or private names.                                                                                                                                                 |
| Actual NPCs and dropped objects                 | Inez (56; keys, glove in coat pocket) only when present. No approved Inez sprite exists: retain procedural fallback until a separate identity treatment is reviewed. Envelope/other items and contacts follow their own custody. |

## Palette / pixel target

Propose the approved rooms' 320 × 224 master, 64-colour treatment, contrast 1.15 and exact nearest-neighbour 640 × 448 display. Transparent objects/effects remain separate native layers. No source crop or final palette exists yet.

## Review criteria

Check arrival and all routes; shared door open/closed, 02:40 lock and escape via bar → street; Inez present/absent/return/departure (baseline 00:15/00:38/03:00); envelope on floor/ledge → leave/return → take; save/reload; object absence/damage and missing-image effects. Compare desktop/mobile, On/Reduced/Off and dry-surface contacts. Recheck both approved rooms unchanged. Actual presence and custody override schedule examples and scene prose.

## Maintenance / history

Existing: room facts, six world objects, shared door, schedule, generic zones and fallback. Needed after brief approval: layout/anchors and masks, one clean source/imported plate, interior door views, object/effect layers and state composites; Inez artwork requires its own identity review. Retain sources, editable layers, hashes and approval through the [existing import workflow](../../PROVIDER-NEUTRAL-ART-PIPELINE.md). Stop here for review; no generation, activation or gameplay changes in this pass.
