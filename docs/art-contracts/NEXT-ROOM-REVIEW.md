# Next room after approved Velvet and street

**Recommendation: vestibule.** Review only, 2026-09-14, based on checkpoint `0128fe464f598ddef051441757ff11d747a053db`. [Proposed art brief](rooms/vestibule.md). No new artwork or activation is authorized by this recommendation.

**Subsequent owner instruction:** proceed with the vestibule brief and one complete unactivated draft. That [draft and its checks](../visuals/reviewed-sources/vestibule/draft-v1/REPORT.md) are now complete, pending visual review. The evidence and recommendation below retain their original pre-draft context.

The vestibule completes the direct **street → vestibule → bar** sequence between both approved locations. Its four routes make it useful for arrival, returning inside, cloakroom/washroom access and Inez's entry/handover presence. It also tests the interior side of the already implemented shared door. This is a production judgment from authored routes and simulation, not measured player traffic.

**Loading bay is the runner-up.** It has stronger independent plot pressure: the camera/ramp, Inez and Luca's work handover, the conditional witness encounter at 00:21–00:25 and the 00:26 bus departure. Six existing anchors and street's wet-material/effect approach help. However, it connects directly to only one approved room, adds service-road/ramp sightlines, two scheduled named figures without approved sprites, and camera/door/light/trolley/evidence state work. Its `loading_door` is a real closed/locked entity but neither authored exit names it as a traversal gate; an illustration must not falsely make it block the stage route. Those complications outweigh its anchor advantage for this next bounded pass.

The older asset plan ranks office third and loading bay fourth, but predates completion of the street-to-bar connection. Office remains valuable for evidence and private conversations; its desk/drawers, concealment, loose belongings and remote landing connection make it a larger next step. Vestibule is **medium effort, not ready-made**: it needs an authored layout, object anchors, an interior door view and eventually Inez identity work. Existing procedural character fallback can preserve true presence while character artwork is separately reviewed.

## All 15 remaining rooms

No remaining room has a registered approved canonical plate or a checked-in authored layout. Every room already has a manifest and procedural fallback. Counts below are the current non-door objects / doors in the initial world art contract, including shared doors; later custody and presence can add content. Anchors are explicit existing manifest anchors, not approved composition.

| Room          | Routes; anchors; objects/doors | Gameplay and continuity                                               | Relative next-pass effort / decision                                      |
| ------------- | ------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **vestibule** | **4; 0; 6/1**                  | **Directly joins both approved rooms; entry, Inez and branch routes** | **Medium: new layout/anchors, shared door, six objects; choose next**     |
| loading-bay   | 2; 6; 6/1                      | Timed witness and work handover; adjacent to street                   | High: surveillance, two scheduled figures, rain and sightlines; runner-up |
| office        | 1; 0; 7/1                      | Evidence/private conversations; reached through landing               | High: desk, drawers, hiding/contents, glasses and door                    |
| stage         | 2; 0; 7/0                      | Luca/performance and connection to loading bay; adjacent to bar       | High: equipment occlusion and new character identity                      |
| kitchen       | 1; 0; 8/0                      | Mara/repairs; bar hatch and approved Mara reference                   | Medium–high: hatch geometry and changing repair props                     |
| salon         | 1; 0; 5/0                      | Social/relationship scenes; open threshold beside bar                 | Medium–high: chair circle and pose/boundary staging                       |
| archive       | 1; 0; 6/0                      | Evidence release, custody and document work; adjacent to bar          | Medium–high: conditional contents and legibility                          |
| landing       | 3; 0; 5/1                      | Bar-to-office/exchange connector                                      | Medium: staircase continuity, door light and passing presence             |
| exchange-room | 1; 0; 5/0                      | Timed transfer and witness content; beyond landing                    | Medium–high: four chairs, box/contents and occupancy                      |
| kiosk         | 1; 0; 5/0                      | Street refuge and conversation                                        | Medium: sheltered glass, steam and local object effects                   |
| cloakroom     | 1; 0; 6/0                      | Coat/belongings; branches from vestibule                              | Medium: rack contents, custody and mirror appearance                      |
| washroom      | 1; 0; 6/0                      | Information and supporting interaction; off vestibule                 | Medium: mirror, partition, notice and fixture states                      |
| apartment     | 2; 4; 6/0                      | Home/departure and motel link                                         | Medium–high: appliance/container work and separate domestic palette       |
| taxi          | 1; 0; 6/0                      | Opening envelope pickup; directly precedes street                     | Medium: cabin/glass framing; less continuing route value                  |
| motel         | 1; 0; 5/0                      | Later destination beyond apartment                                    | Medium: separate setting; avoid invented Room 06 interior                 |

## Evidence and scope

Reviewed [rooms/entities/routes](../../src/content/spaces.ts), [affordances](../../src/content/affordances.ts), [permanent architecture](../../src/content/visuals/architecture.ts), [manifests and anchors](../../src/content/visuals/manifest.ts), [world-derived art contracts](../../src/content/visuals/generation.ts), [shipping registry](../../src/content/visuals/assets.json), [opening scenes](../../src/content/scenes/opening.ts), [Inez's relationship content](../../src/content/relationships/inez.ts) and [parser schedules/events](../../src/engine/parser.ts). The [older asset plan](../VISUAL-ASSET-PLAN.md) remains a broad inventory; this recommendation supersedes its immediate production order only.

Read-only `NIGHT-0` parser probes confirmed Inez in the vestibule at 00:14, absent from 00:15, back at 00:38 and gone at 03:00; the shared door closes/locks at 02:40. Loading bay probes confirmed scheduled Luca/Inez presence. These are baseline schedules, not unconditional art bindings: current simulation presence always wins. Story prose mentioning Mara or a passing man does not authorize permanent figures in a room plate.

Stop at the proposed brief for owner review. Approved street/Velvet artwork and accepted polish stay unchanged. Future scene framing follows the newly recorded [owner art-direction preference](../VISUAL-STYLE.md#future-scene-framing-preference). Local AI experiments, merging and public deployment remain on hold; all work stays in the background.
