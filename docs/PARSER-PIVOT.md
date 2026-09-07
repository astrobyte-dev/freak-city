# Parser interaction redesign

FREAK//CITY now uses persistent spaces and a typed command prompt. The player can leave an encounter, revisit a room, change custody of an object, and spend time while the rest of the city continues. This supersedes the scene/button interaction described in the original build plan and duration reports.

## Preservation audit

The existing implementation separated simulation from presentation unusually well. The following systems were retained:

| Existing architecture                                        | Integration in parser play                                                                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 117 authored scenes and their scene cards                    | Preserved in their original content files. Indexed as encounters, dialogue, relationship beats, environmental/event sequences, phone content and outcomes.                                  |
| Conditions and effect algebra                                | `meets`, `applyEffects`, choice availability and boundaries still govern authored effects.                                                                                                  |
| World seeds and objective canon                              | Same three invitation variants; physical routing proof authenticates only the seeded sender.                                                                                                |
| Knowledge, provenance, beliefs, NPC memory and relationships | Evidence reading/sharing and authored dialogue use the existing records. Player allegations remain beliefs, not objective facts.                                                            |
| Rumours and NPC-to-NPC relationships                         | Original delayed reports, mutations and faction consequences still run.                                                                                                                     |
| THE PULL and pacing                                          | Meaningful interactions retain authored learning effects and filtered observations. Reading and parser errors do not train preferences.                                                     |
| Scheduled events                                             | Existing exchange, witness departure, delayed messages and off-screen decisions remain. Additional presence events supply room schedules.                                                   |
| Boundaries                                                   | Existing passage filters, scene gates and theme restrictions apply. Stored transcript passages retain boundary metadata so tightening a boundary hides previously displayed optional prose. |
| Saves, bookmarks, imports and Live Wire                      | Original version-1 envelope and storage keys retained. A validated optional `world` extension holds spatial state and transcript. Legacy saves receive a world when opened.                 |
| Noir artwork, typography, audio and diegetic panels          | Retained; the prompt and transcript replace the main choice controls.                                                                                                                       |

The old `choose` engine and historical content edges remain available to regression tests and the developer inspector. The player UI does not call `choose`. The parser does not translate input into a numbered choice or require players to advance through a scene graph to travel.

`artifacts/parser-content-migration.json` accounts for every scene, its room anchor, category and retained authored continuations. `scripts/parser-playtest.ts` regenerates it. This index preserves the full source graph; it is not a claim that every legacy passage has been independently editorially rewritten. Existing prose is reused where an encounter applies, with parser-specific handling for spatial entry, deferred follow-ups, the ledger decision and early departures. Legacy passages sometimes describe several incidental actions within a single authored beat; these remain bounded authored sequences.

## World and actions

`src/content/spaces.ts` defines 17 persistent rooms within six locations, connected exits, and physical entities. NPC locations stay in the existing simulation state, so there is one authority for presence. Entities distinguish objects, containers, doors, wearables, evidence, phones and inventory items. They store visibility, custody, ownership, open/locked/worn/destroyed state, aliases, properties, supported verbs and factual disclosures.

Containers form a checked graph. Closed contents are out of reach. Nested possessions remain in inventory; giving or dropping a container moves its contents with it. Objects are never recreated by revisiting a room. The original and redacted ledger have different custody states. Showing a photograph cannot establish the docket's custody evidence. Destroying evidence affects witnesses and prevents its further physical use without erasing what someone already learned.

`src/engine/language.ts` handles lexical normalization, synonyms, typo tolerance (including adjacent transpositions), grammar and safe command splitting. `src/engine/parser.ts` provides an expandable deterministic handler registry. Actions resolve entities against the current room and inventory. A tied noun match creates a saved clarification with candidate IDs and the original command. Its answer resumes the command; errors roll back its partial changes and stop the remaining chain.

All requested core verbs are implemented. Additional atmosphere verbs include SMELL, SIT, SEARCH, KNOCK and TEAR. HELP and HINT are explicit requests, and default UI does not expose action suggestions. Tab operates on entry text and does not execute anything. Empty Tab retains ordinary focus navigation.

Conversation uses authored intent aliases and conservative phrase matching from `src/content/parser-content.ts`. It understands explicit topics, natural questions, contextual follow-ups, accusation, apology and flirting. Unsupported topics receive a useful response rather than invented dialogue. Each NPC's unfinished conversation persists when the player leaves. Authored target beats that belong elsewhere are deferred to their room; replying never teleports the player. Long first and closing relationship encounters use the original memory, belief, agenda, phone and boundary effects.

The parser is a deterministic grammar with authored topic coverage, not unrestricted natural-language understanding. Ambiguous or unsupported phrasing should be expanded with an intent alias or specific handler as playtesting identifies it. Negative statements are checked separately so fuzzy matching does not silently turn a refusal into agreement.

## Time and presence

Actions use a single simulation clock. Movement spends travel time before arrival, so a player on the stairs at an event's deadline is still absent. LOOK/HELP/INVENTORY/JOURNAL/MAP are free; manipulation usually costs one minute, conversations and investigation cost more, and WAIT accepts minutes or a clock time. Input errors and clarification are free.

At 00:20, physical presence in the exchange room records attendance; elsewhere, the existing absence consequences apply. At the loading bay, the witness is available from 00:21 to the 00:26 departure. Her absence persists after departure. The routing envelope and ledger arrive at the service table after the exchange. The side entrance closes late; the front entrance remains usable.

NPCs move between work areas, the bay and off-duty locations using scheduled presence effects. The original exchange and witness events also move them. Authored dialogue cannot summon an absent speaker. FOLLOW waits for an actual move, follows only a connected accessible exit, and reports losing sight when the NPC gets ahead. This is deliberately local following, not omniscient pathfinding.

## Save integrity

The world schema preserves entity state, visited rooms, active and unfinished encounters, pronoun context, pending clarification, command history, transcript and optional shortcuts. Import validation rejects unavailable rooms, incomplete entity sets, invalid identities or locations, containment cycles, inconsistent worn items, mismatched inventory custody and invalid encounter references. Existing objective-canon and historical-effect validation remains in place.

Transcript conditions are evaluated when an encounter occurs; only rendered passages and their boundary alternatives are stored. Boundary filtering is applied again at display time. No runtime model, analytics or network service is added.

## Validation and authoring

Run:

```sh
npm run check
# With the dev server running:
npm run test:browser
```

Parser tests cover verb/noun synonyms, typos, pronouns, clarification and its save round trip, contextual doors, containers and custody, conversation topics, allegations and knowledge propagation, time costs, NPC movement, missed/attended events, boundaries, unsupported commands, seeded evidence and all four endings. Command tests also traverse all four first relationship encounters, a closing return, and interrupted conversations. Scripted parser campaigns use actual typed strings and validate every resulting save. Original simulation, relationship, narrative-QA and legacy route suites remain intact.

Browser checks cover desktop/mobile layout, a persistent transcript, alias entry, Up/Down history, Tab completion, noun clarification, reload, panel access, a typed phone message and axe scans. Reports and screenshots are in `artifacts/parser-*`.

To extend the world, add a room/exit or entity to `spaces.ts`. To extend a physical capability, add a handler to `actionHandlers`. To extend conversation understanding, add aliases to `intentAliases`, or add a condition-aware topic in `conversationStart`. Authored conversation effects continue to live beside their original content. Physical affordances that advance a relationship beat must first execute their physical action (for example, holding Luca's lamp or putting Inez's mitten on the ledge). New content should describe the current space without implying unexplained travel or invisible custody changes.
