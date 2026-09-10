# Architecture

## Reviewed art boundary

The [provider-neutral art pipeline](PROVIDER-NEUTRAL-ART-PIPELINE.md) separates authoring provenance from the runtime registry. Static reviewed source images and repository art contracts survive any authoring tool or assistant. The game consumes only reviewed files and simulation-derived visual state. ComfyUI/ML/providers are optional development workstations and are absent from build/runtime dependencies.

THE PULL is a private narrative-interest, attraction-context, chemistry and thematic-engagement model; it is not an arousal-prediction or arousal-optimisation system.

## Modules and ownership

| Layer              | Source                    | Responsibility                                                                                                       |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| UI shell           | `src/App.tsx`             | Active panel, presentation settings, user input and save feedback                                                    |
| Presentational UI  | `src/components/`         | Atmosphere, modal focus behavior, phone, journal, inventory, map, people, settings and inspector                     |
| Domain schema      | `src/engine/types.ts`     | Discriminated effects/conditions, narrative contracts, recursive effect validation, save schema                      |
| Pure simulation    | `src/engine/game.ts`      | Seeded initialization, condition evaluation, choice commitment, knowledge grants, event delivery and rumour mutation |
| Narrative interest | `src/engine/pull.ts`      | Broad interest, saturation, contrast and cooldown                                                                    |
| Theme engagement   | `src/engine/themes.ts`    | Contextual thematic interpretation and compatible authored observations                                              |
| Content taxonomy   | `src/content/taxonomy.ts` | Explicit themes, subcategories, trust/privacy/orientation and NPC compatibility                                      |
| Authored story     | `src/content/scenes/`     | Modular scene groups and small authoring helpers; no UI state or network calls                                       |
| Canon and cast     | `src/content/world.ts`    | Curated variants, factual labels, item catalog and initial schedule                                                  |
| Scene contracts    | `src/content/cards.ts`    | Pre-draft scene purpose, knowledge limits and editorial intent                                                       |
| Persistence        | `src/engine/save.ts`      | Local autosave, normal bookmark, validated import/export and erasure                                                 |
| Sound              | `src/engine/audio.ts`     | Local Web Audio noise/bass; never part of deterministic state                                                        |
| QA                 | `scripts/`, `tests/`      | Graph checks, style heuristics, simulated campaigns and browser tests                                                |

React receives a complete `GameState` and renders it. Committing a choice clones the prior state. Content is data, not a chatbot or a chain of component side effects. There is no runtime generative API.

## Choice/consequence transaction

1. Resolve the current scene's choice ID.
2. Filter theme exclusions, hidden conditions and scene locks. Reject stale/unavailable choices.
3. Clone state and increment the action counter.
4. Apply authored immediate effects in order. Every effect adds a serialized explanation to the change log.
5. Advance the simulation clock by the disclosed action/commitment duration. Execute due events in chronological order, including nested follow-ups due within the same jump. Fired and cancelled IDs cannot fire again.
6. Run off-screen event consequences and rumour propagation.
7. Select the destination. Run first-entry effects once. Dawn is an explicit narrative jump to 06:00.
8. Authenticate seeded physical evidence when its envelope is opened.
9. Grant revealed facts from visible passages. A speaker cannot reveal an annotated fact they do not know.
10. Derive traits, choose at most one adaptive observation with pacing/boundary checks, and record scene/choice/time/effects in history.
11. The UI persists the complete state, then renders the next scene. Reading and opening panels consume no simulation time.

Supported effects: flags, dimensions, memories, beliefs, player/NPC knowledge, player/NPC relationships, NPC-to-NPC relationships, rumours, faction reputation, scheduling/cancellation, messages, items, traits, moral tendencies, broad interests, thematic engagement, aesthetic attractors, scene locks/unlocks.

The calendar's units are absolute minutes since Friday 00:00. `1428` is 23:48; `1460` is Saturday 00:20. Reading time is never inferred from a real clock. Core random variation uses a stable FNV-1a hash of the seed; the choice reducer contains no wall-clock or random calls. Random seed creation and ambient noise are explicitly outside the simulation.

## Knowledge and memory

`canon.truth` is objective campaign truth. `canon.player` contains verified or directly communicated facts; `canon.provenance` records how each was obtained. `npcs[id].knowledge` is each character's legitimate fact set. `npcs[id].beliefs` contains interpretations, source and time, including false interpretations. `canon.public` and `rumours` are public accounts that can diverge from truth.

A remembered event is separate from the meaning attributed to it. Inez's memory can contain “claimed Luca invited them.” Twenty-five minutes later, an explicitly scheduled report writes that claim into Luca's memory/beliefs. It does not write anything into Mara. Luca may later confront the contradiction, and an admission does not delete the original memory. This is tested.

Small memories include drink preference, sharing chips, repairing the fan, the interpretation of the token introduction and a music joke. Callbacks read only state the speaker can have observed. The player-facing relationship panel shows restrained qualitative impressions; the inspector contains the numbers and private beliefs.

`relationships` is a separate matrix keyed by sorted NPC pair IDs. For example, a transfer uncontested by an outside witness damages Mara/Celeste trust while the board gains faction standing. Those NPC relationships exist even if the protagonist never talks to either character.

## Saves and versions

Version 1 serializes the full domain state. Zod validates the version, required nested records, numeric ranges, recursive effects, entity tags and primitive types. Semantic validation rejects unavailable scenes, invalid choice history and objective truth that contradicts the seed. An additive development migration supplies the initial NPC relationship matrix for version-one saves created before that field existed. Later breaking changes must use explicit migration functions rather than silently guessing.

Invalid autosaves are not deleted or overwritten on initial load. An error is shown, and a deliberate new run/import resumes saving. Storage failure produces an export suggestion. Import size is limited before parsing in the UI and helper.

Normal mode: one autosave and one bookmark. Live Wire: one autosave; normal restore, bookmark creation and import are rejected in domain helpers, not merely hidden in the interface. Exports are plain JSON; no anti-tamper security is claimed. Browser developer tools can always edit a fully local game.

## Extension boundaries

Future cloud sync should use an explicit public-state projection and exclude `pull`, `engagement`, `attractors`, `boundaries`, and any choice transcript that can reveal them by default. No cloud adapter is implemented. A future generation adapter must receive already-authorized facts and themes, never the entire canon as dialogue context. It must not replace the deterministic authored spine.

## Relationship expansion

`src/content/relationships/` adds four thirteen-beat arcs and shared transitions. Two explicit commitment flags cap full first meetings; closing choices require a completed first encounter and disappear after the goodbye. New bridge choices preserve every existing historical destination, so version-one saves retain their routes. Existing shorter departures remain legal.

A recursively validated `when` effect evaluates its condition when delivered, including inside scheduled events. Its chosen effects run in order against current state. A `presence` effect updates the people panel on authored returns. Scene-entry effects still execute once. Personal continuity is recorded through memories, beliefs and named messages; it does not rewrite seeded truth.

`src/content/phone.ts` owns reply options. Optional message metadata supplies a reply key, a voice-transcript marker or the local entrance illustration. Reply lookup checks sender, key, previous response and boundaries. A valid personal reply consumes two simulation minutes and schedules an authored answer. Repeated or unknown reply IDs do nothing. Reading remains untimed. Voice notes are presented as transcripts; recorded voice playback is not implemented. The metadata is additive and optional in version-one saves.
