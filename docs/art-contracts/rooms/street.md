# Velvet / side entrance — proposed next-room art brief

- Contract version: 1. Asset ID: `street`. Role: `canonical-room` with simulation-owned overlays.
- Status: **draft-v2-polish approved by owner and active in ordinary feature play, 2026-09-14**. [Approval, activation and checks](../../visuals/street-activation/REPORT.md). The exact background, separate door/sign/bin layers, approved envelope and state-owned effects are active on `feature/state-driven-visuals`. Current envelope readability is accepted; further polish is deferred. [Historical draft and before/after images](../../visuals/reviewed-sources/street/draft-v2-polish/REPORT.md) remain unchanged. Merging and public deployment remain on hold.
- Basis: source checkpoint `0e761909be54e29985d93c5d25587fe0c9c2aef6`, on `feature/state-driven-visuals`.
- Velvet background validation is complete. The owner's personal visual review remains pending; its accepted polish backlog remains deferred. Local AI experiments, merging and public deployment remain on hold.

## Recommendation and location review

**Choose `street`, the playable “Velvet / side entrance”.** It is the first location reached from the taxi, establishes the venue from outside, and connects five routes. It pairs naturally with the approved bar interior. The existing asset plan already ranks it second, after the bar. Its six explicit anchors, three identified permanent entities and small set of runtime fixtures make it a bounded next production candidate. The meaningful side-door lock and wet exterior extend the approach to new gameplay states without requiring new characters or story content.

This is a judgment from authored routes, content and code, not player analytics. The inventory below covers all 17 rooms. Counts are from the current manifests and initialized world; runtime visitors and player-dropped items can add to them.

| Room          | Gameplay importance / role                           | Existing art and implementation readiness                                                                             |
| ------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| bar           | Seven-route social hub; current proof                | Approved canonical plate and sprite set; validation complete, personal review pending                                 |
| **street**    | **Five routes; arrival, return and alternate entry** | **Legacy exterior PNG; six anchors; three permanent entities, two runtime objects and one door; no approved plate**   |
| office        | Evidence and private conversations                   | Seven runtime objects and one door; no explicit anchors or registered artwork; desk/drawer visibility increases scope |
| loading-bay   | Timed witness/bus route and surveillance             | Six anchors; six runtime objects and one door; no registered artwork; camera/evidence and route occlusion add scope   |
| apartment     | Home, departure and motel connection                 | Four anchors; six runtime objects; no registered plate; legacy CSS treatment is not a retained room painting          |
| vestibule     | Four-route entry hub; Inez and handover              | Six runtime objects and shared side door; no explicit anchors or registered artwork                                   |
| stage         | Performance and route to loading bay                 | Seven runtime objects; no explicit anchors or registered artwork; equipment and NPC staging need work                 |
| salon         | Quiet social/relationship space                      | Five runtime objects; no explicit anchors or registered artwork; seating/threshold composition needs work             |
| kitchen       | Mara's repairs and work conversations                | Eight runtime objects; no explicit anchors or registered artwork; hatch and work surfaces need mapping                |
| landing       | Three-route upstairs connector                       | Five runtime objects and office door; no explicit anchors or registered artwork                                       |
| exchange-room | Exchange/witness content                             | Five runtime objects; no explicit anchors or registered artwork; contents and seating need mapping                    |
| archive       | Time-dependent evidence custody                      | Six initial runtime objects; no explicit anchors or registered artwork; evidence readability dominates                |
| kiosk         | Sheltered street relief                              | Five runtime objects; no explicit anchors or registered artwork; glass/menu/steam need treatment                      |
| cloakroom     | Clothing and storage                                 | Six runtime objects; no explicit anchors or registered artwork; garment custody needs treatment                       |
| washroom      | Supporting interactions and information              | Six runtime objects; no explicit anchors or registered artwork; mirror/text need treatment                            |
| taxi          | Opening and envelope pickup                          | Six runtime objects; no explicit anchors or registered artwork; one exit, less repeat-use value                       |
| motel         | Later destination and Room 06 threshold              | Five runtime objects; no explicit anchors or registered artwork; limited first-night scope                            |

All rooms have generated manifests, default placement zones and procedural fallback. **Only the bar has a checked-in authored layout blueprint and registered canonical artwork.** “Manifest exists” does not mean layout or art approval exists. Street offers the best combination of importance, a retained visual reference and existing placement work; loading-bay is the strongest alternative on implementation readiness, but has a larger changing-object set.

Sources: [room definitions](../../../src/content/spaces.ts), [manifests](../../../src/content/visuals/manifest.ts), [registry](../../../src/content/visuals/assets.json), [existing production priorities](../../VISUAL-ASSET-PLAN.md), [generation definitions](../../../src/content/visuals/generation.ts).

## Established room facts and routes

The room description establishes rain over the taxi's tyre marks, a glowing side entrance beneath a narrow awning, the loading bay behind the building and a lit soup kiosk across the road. [Street affordances](../../../src/content/affordances.ts) establish old brick worn smooth at shoulder height, damp mortar, frosted club glass that admits shapes and light but no clear faces, the VELVET sign and a street bin containing a folded broken umbrella. Searching the bin describes flyers and a paper cup, with nothing identifying.

| Route                         | Established relationship                                  | Image constraint                                                                             |
| ----------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `inside` → `vestibule`        | Side entrance beneath awning; shared `side_door`          | Reserve a usable opening and independent door layer                                          |
| `loading bay` → `loading-bay` | Behind building; east alias                               | Indicate continuation, not a second copy of the loading bay                                  |
| `kiosk` → `kiosk`             | Across the road                                           | Keep the across-road relationship; any distant treatment is subordinate and provisional      |
| `home` → `apartment`          | West route                                                | Street continuation; no apartment interior or newly invented doorway                         |
| `front door` → `bar`          | Separate direct entry, still usable after side door locks | Keep route legible through composition and text; do not invent a second stateful door entity |

Not every route needs a visible doorway. Exact facade dimensions, camera angle and off-camera route placement require layout review. Do not infer a visible bar interior through the frosted window or relocate the bar's high window to make the two pictures appear to be reverse views.

## Permanent scenery allowed in the plate

The [architecture partition](../../../src/content/visuals/architecture.ts) explicitly permits these entity bindings:

| Entity                 | Permanent treatment                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `detail_street_wall`   | Old brick facade, shoulder-height wear and damp mortar; wear must not resemble new damage or clue markings |
| `detail_street_window` | Frosted club window; indistinct light only, no faces or permanent figures                                  |
| `detail_street_awning` | Narrow awning and metal edge over the side entrance                                                        |

Pavement, wet surface texture and the building's noninteractive structure supply environmental context. Keep the door opening clear for its overlay. Permanent wet material is appropriate to the authored rainy night; animated rain, variable light and entity reflections remain runtime layers. A sign's emitted reflection must not remain painted on the ground if that sign is absent or damaged.

No new shopfronts, alleys, stairs, balconies, cars, queue barriers, decorative clues, CCTV, bus stop or extra lamps. Camera and bus-stop detail belong to the loading bay. Taxi tyre marks in prose do not establish a permanently parked taxi here. The legacy image's extra architectural choices are not world authority.

## Changing characters, objects and effects

“Runtime object” is an art partition, not permission to make an object portable or grant a new interaction.

| Binding                              | Required treatment and limits                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `side_door`                          | Separate open and closed appearances. Initially open/unlocked; ordinary commands can close/reopen it. At 02:40 (`time >= 1600`), parser processing closes and locks it. Locked and unlocked closed doors may share pixels; communicate lock state through existing text rather than inventing a padlock or warning sign. Preserve the alternate front route. |
| `detail_street_sign`                 | Separate VELVET sign with hand-authored lettering and optional owned emission/reflection. It is nonportable scenery, not currently a switchable lighting appliance. Its hum does not establish flickering or a broken letter.                                                                                                                                |
| `detail_street_bin`                  | Separate street-bin sprite; umbrella detail may belong to that sprite. Do not scatter its described contents into independent objects or depict clue-bearing flyers. Do not substitute the bar bin as though the two entities were identical.                                                                                                                |
| Dropped items, especially `envelope` | Use actual visibility, location and custody. Held/contained items must not remain on pavement. Reuse the approved envelope master only as a candidate with reviewed street scale/contact; its bar-specific placement/reflection is not portable approval. Other portable items may be dropped here too; retain text/generic fallback for items without art.  |
| Named NPCs                           | No fresh-start named NPC is placed here and the explicit parser schedule has no street destination. Do not add Inez as a permanent doorkeeper or Mara as a street resident. If a valid saved/event state has a present NPC, preserve `npcPresence` and generic/text fallback; any later character artwork requires a demonstrated state and identity review. |
| Anonymous people                     | Current `crowdLevel` is always `quiet` outside the bar. No waiting queue, passing couple or patron sprites in this first scope. Illustration hints and narrative mentions do not create crowd state.                                                                                                                                                         |
| Rain and reflections                 | Rain is currently fixed by the authored-night descriptor, not a changing weather simulation. Street is `outside`; rain and generic reflection layers exist. Need composition-aware awning/doorway shelter and pavement masks for a refined pass. No rain-through-roof effect, permanent human reflection, dry-weather storyline or automatic puddle physics. |

Sources: [door entity](../../../src/content/spaces.ts), [parser schedules and door closure](../../../src/engine/parser.ts), [visual derivation](../../../src/visuals/derive.ts), [current renderer](../../../src/components/LocationVisual.tsx). Relationship prose does not override canonical room occupancy or create unmodelled props.

## Proposed camera and art direction

One stable establishing view, composed on the 320 × 224 grid: frosted window on the left, side entrance right of centre beneath the awning, sign above and bin to the right; leave readable pavement for dropped objects and any valid NPC presence. This follows current compositional anchors, not surveyed geography. The across-road kiosk and alternate front route may remain partly or wholly off-camera if the reviewed layout and text keep their relationships clear.

Current anchor rectangles are useful starting reservations, **not approved final pixels**: door `[197,65,54,112]`, window `[51,74,87,54]`, sign `[167,35,108,21]`, awning `[180,58,90,8]`, bin `[282,149,22,33]`. Reconcile perspective, depth and contact masks before image production; preserve a clear door silhouette and a foreground drop zone. Do not copy the bar's floor polygons or character positions.

Use the [Exteriors family](../../VISUAL-STYLE.md): distressed old-city brick and wet pavement, dirty readable midtones, deep shadow, restrained pink/magenta and cyan spill from the established venue lighting. Keep the atmosphere compatible with Velvet's approved interior without turning the street into futuristic cyberpunk. No readable text beyond authored VELVET lettering and no identifiable person behind the frosted glass.

Proposed treatment for consistency with the approved bar: opaque retained PNG, explicitly reviewed 10:7 framing, 320 × 224 master, **64-colour / contrast 1.15** treatment and exact nearest-neighbour 640 × 448 lossless display. This is a brief proposal; the generic canonical preset remains 48 colours and is not changed here. Transparent overlays use their own native pixel canvas and alpha, not the opaque-room crop process. No crop coordinates or final palette are approved until a source exists.

## Original pre-production inventory (historical)

| Already exists                                                                                           | What remains before production/activation                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/velvet-exterior.png`, 1536 × 1024 RGB; [recorded origin/prompt](../../ASSETS.md)                 | Assess as a mood/composition reference after brief review. It is not in the canonical registry and has no approved street composition, palette master or dynamic separation. Its provenance describes photographic treatment and a fixed door/sign, so it cannot simply be promoted as a gameplay plate. No visual inspection was performed in this background brief pass. |
| Street manifest, six anchors, static/dynamic partition, four default NPC zones, text/procedural fallback | An authored street layout, reviewed route placements, revised contacts, occlusion/shelter/pavement masks and scene-specific drop positions                                                                                                                                                                                                                                 |
| Shared room importer, provenance retention, pixel processor and promotion guards                         | New draft clean architectural source/master/display and eventual hash-bound review evidence; preserve all source bytes and edit history                                                                                                                                                                                                                                    |
| Procedural door/sign/bin glyphs, generic NPCs and rain/reflection/light layers                           | Dedicated door open/closed art, authored sign and street bin; object-owned effects aligned to the new plate                                                                                                                                                                                                                                                                |
| Approved envelope sprite and bar-specific sprite/reflection implementation                               | Street-specific binding and failure handling. `pilotEnabled` explicitly requires `roomId === "bar"` and the bar plate hash; it is not a general multiroom sprite system. Generalize or add a bounded room configuration later, preserving bar behavior.                                                                                                                    |
| Bar-only authored layout and deterministic layout tool                                                   | Street layout support if using that tool: `layout_reference.py` currently rejects non-bar blueprints. The manual/external import route remains available; no local model is required.                                                                                                                                                                                      |

Legacy PNG SHA-256, read without displaying the image: `fe50b7befc4a5525d8bf33efd42c54dcb3fc4ea27ff6bcf3e5fef8e4a62bac30`. Runtime references: [bar-only sprite gate](../../../src/visuals/velvet-pilot.ts), [layout tool](../../../tools/visual-gen/layout_reference.py), [provider-neutral workflow](../../PROVIDER-NEUTRAL-ART-PIPELINE.md).

## Required state review contract

| Case                                                                            | Required result                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial arrival; open/unlocked side door                                        | Permanent plate matches facts; door passage remains clear; no invented people                                                                                                      |
| Close then open side door before 02:40                                          | Only door/owned spill changes; wall, awning and window remain stable                                                                                                               |
| Advance across 02:40; attempt `go inside`, then `go front door`                 | Closed/locked side door; text explains refusal and alternate entry; front route still reaches bar                                                                                  |
| Envelope held → dropped → leave/return → retaken; save/reload                   | Ground sprite and owned reflection follow actual custody with no ghost or loss of save state                                                                                       |
| Other dropped item or item hidden in a container                                | No false envelope substitution; accurate text/fallback and visibility                                                                                                              |
| Empty street; any separately demonstrated valid NPC-present state               | Empty remains empty; a named figure appears only for actual presence and leaves with its effects. NPC-present art review is conditional, not authorization to alter schedules.     |
| Early 23:55 / night 00:20 / late 02:40 / closing 04:20 / dawn 05:15 / day 07:40 | One geometry; existing amber/amber/low/work/morning/cold light mapping; rain remains authored. Door closure occurs in the late band, not at the start of the band named “closing”. |
| Sign/bin absent or damaged; permanent-entity mismatch                           | Development-only defensive cases where necessary. No intact ghost or orphaned reflection; canonical fallback guards remain. Do not invent gameplay verbs to produce these states.  |
| 320/640 widths, 390-pixel viewport, On/Reduced/Off, image failure               | Exact pixel scaling, no overflow, readable text, safe fallback, no orphaned shadow/reflection; rain respects shelter                                                               |

For the original brief, in-memory parser probes verified initial door state, closing/reopening, envelope drop/take, the 02:40 lock, failed side entry and successful front entry. The subsequent authorized [draft pass](../../visuals/reviewed-sources/street/draft-v1/REPORT.md) retained one generated source, imported masters, authored overlays and headless composites. No artwork was activated, and no existing browser or desktop was controlled.

## Review boundary and maintenance

The owner has approved **draft-v2-polish: layout, exterior plate, overlays and state composites** for feature activation. The [activation record](../../visuals/street-activation/REPORT.md) supersedes the original draft-stage statements above. Current envelope readability is accepted and further polish deferred. No new cinematic illustration or character library is included. Choose the next improvement with the owner; merging, public deployment and local AI experiments remain on hold.

Retain source PNGs, optional layered editor files, explicit crop, masters, overlays/masks, parent hashes and workflow/edit notes under the [common ownership and maintenance process](../../PROVIDER-NEUTRAL-ART-PIPELINE.md). Changed images remain drafts. Do not reuse stale handoff instructions to restart AI experiments or modify the approved bar.
