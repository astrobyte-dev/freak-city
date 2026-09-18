# Dynamic overlay art roadmap

Canonical plates supply the place; scene illustrations punctuate selected moments; runtime overlays supply what changes. The existing typed visual state and compositor remain the authority for presence, custody, doors, damage, time and weather. No new parser verbs or character sprite system are implemented here.

| Layer                                     | First art treatment                                                                               | Binding / review requirement                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Named NPC presence                        | Restrained readable silhouettes on the 320 master grid, consistent scale and ground contact       | Actual scheduled/present NPC; distinguish characters through reviewed shape/palette before designing final likenesses |
| Anonymous crowds / foreground silhouettes | Sparse reusable shapes with limited contrast and clear parser-object space                        | Crowd state and exposure; do not paint named characters into a generic crowd                                          |
| Props and evidence                        | Small pixel sprites with an outline/value hierarchy that remains readable over detailed materials | Canonical entity ID, actual location and ownership; hide removed/held evidence; never add decorative clue text        |
| Door states                               | Reviewed open/closed/locked masks aligned to actual openings                                      | Real door entity and state; decorative route openings are not invented stateful doors                                 |
| Lighting / signs                          | Tint/emission masks clipped to existing fixtures and surfaces                                     | Time/lighting state and existing sign; authored lettering separately, never model-generated story text                |
| Rain / reflections                        | Pixel-scale particles and restrained reflection masks                                             | Weather and outside/sheltered/window exposure; prevent indoor rain and false permanent wet damage                     |
| Smoke / haze                              | Low-opacity drifting masks with reduced-motion alternatives                                       | Atmosphere flags; a generic haze layer must not imply an unmodelled character smoking event                           |
| Temporary damage / clutter                | Local removable decals, deliberately distinct from permanent wear                                 | Existing consequence flags/entity damage; never baked into canonical surfaces                                         |

Use the same master grid, palette families, light direction and roughness as the plate. Review edge contrast against dark and bright material regions. Ground-contact shadows can belong to the sprite layer; they must leave with the actor. A glossy floor should receive an optional reflection layer derived from actual presence, not permanently painted people.

Before promoting a room: align entity anchors and four NPC zones to the chosen plate, inspect overlap at desktop/mobile scale, exercise early/late/dawn, open/closed, NPC removal, custody changes, Off and Reduced, and verify the image fallback. A pretty empty room is insufficient. The development review page pairs the layout/facts, candidate and real `LocationVisual` composite; its test binding is never written into the shipping registry.

Scene illustrations remain sparse: the current renderer already returns to the gameplay room and respects Off/Reduced and scene/presence/boundary bindings. Curate a few meaningful authored triggers; do not schedule an illustration for every parser action or room visit. A depicted bartender is an anonymous style stand-in until a reviewer confirms the actual character/scene compatibility.

## Deferred material/property game system

Retain the future idea that material and affordance properties can supply interactions: glass + breakable → BREAK/SHATTER; paper + flammable → BURN; container → OPEN/PUT/TAKE. That requires a separate simulation/parser design pass, consequence rules, tests and story compatibility. Visual art labels do not grant those verbs. No such gameplay changes are part of this task.
