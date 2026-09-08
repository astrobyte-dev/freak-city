# Autonomous interaction pass

The pre-pass playable build is commit `6d0bbfa`, tagged `parser-pivot-checkpoint`. The working folder originally had no Git repository, so the checkpoint includes the complete existing project. Changes after that checkpoint deepen interaction within the existing 17 rooms. The 117-scene manuscript, four central characters, three seed explanations and four custody outcomes are retained.

## What changed

- A conservative surface grammar accepts ordinary orientation questions, phrasal actions, polite wrappers, casual spelling, object/person context, natural conversational questions, durations in words and seconds, and distance-preserving FOLLOW. Refusals are recognized before action matching; hypothetical consequential questions ask for a decision without executing it.
- Authored DENY, THANK, REASSURE, CHALLENGE, TEASE, JOKE, AGREE and CHANGE SUBJECT responses supplement the existing conversations. A bare yes asks which part; it cannot select an agreement. Unsupported TELL claims remain attributed beliefs, never verified facts. Repeated social responses cannot farm relationship gains.
- Ninety-three mundane details, including four NPC clothing details, enrich the existing map. Every room has at least five new objects with descriptions and appropriate atmospheric interactions. No mandatory evidence was added to rubbish or furnishings.
- A presentation adapter adjusts 24 inherited scenes that narrated unsolicited movement, custody, disclosures or assent. Original prose remains in its source files. Inez offers a chair and leaves the mitten within reach; taking and placing it are separate commands. Reciprocal questions and small conversational gestures remain part of authored exchanges to avoid one-sentence command loops.
- WATCH tracks accumulated observation at 30 seconds, two minutes and five minutes. It stops when its subject leaves. LISTEN offers authored audible detail. Evidence about an NPC's work routine requires actually watching it in the appropriate room. Time spent observing can miss another event.
- The scheduler now leaves modest traces of work: a cleaned counter, corrected handover note, restocked cups and coiled stage cables. Inez and Luca compare equipment-return arrangements if they meet at the loading bay. Reassuring Mara after the transfer can bring her quiet break forward.
- THINK and REMEMBER use the player's verified facts, provenance and previously displayed speech, with boundary filtering applied again. Relationship interpretation remains qualitative. Remembering cannot expose an unseen seed answer or trigger an old scene choice.
- New saves retain fractional time, observation totals, timed discourse references, hint levels, message distinctions and command outcomes. Revision-one parser saves gain the new scenery and fields while retaining original object locations, custody, canon and history.
- The command input offers touch history/completion, session-local drafts, composition and repeat-submit guards, retained failed input, and scroll-position preservation. Phone drafts survive panels/reloads; failed sends keep their text and explain the failure. Deleting local game data also removes drafts.
- Commands, NPC speech, world prose, phone messages and system responses have distinct but restrained presentation. HELP teaches ordinary communication. Repeated HINT requests add context without listing moral solutions.
- Production JavaScript separates application/story code, shared dependencies and validation. The largest chunk is approximately 405 KB rather than the checkpoint's approximately 624 KB. This removes the large-chunk warning; it is not a claim that total download size decreased.

## Validation and artifacts

The completed pass passed 908 unit/regression tests, 12 original parser campaigns, 60 natural-language campaigns (1,470 commands, zero failures), and 11 production-browser accessibility scans with zero violations or runtime errors. Build, formatting and whitespace checks passed. Machine-readable totals are in `artifacts/interaction-validation.json`.

`npm run check` includes build, unit/regression tests, narrative QA, legacy deterministic/fuzz campaigns, content indexing, 12 original parser campaigns, 60 natural-language campaigns and the embodiment audit. The natural campaigns combine five player styles, three seeds and four custody outcomes; each typed command and resulting save is validated. Unit coverage separately probes every room's new details, hundreds of refusal combinations, omissions, typo handling, pronouns, knowledge, fractional timing, embodied custody and report classification.

`npm run test:browser` checks desktop, 390px and 320px phone layouts, reduced keyboard space, touch history/completion, draft reloads, IME, failed sends, reading-position retention, deletion, panels and accessibility. A reduced browser viewport approximates keyboard space; it does not emulate an actual iOS/Android keyboard or replace real-device testing.

Generated reports contain synthetic test runs:

- `artifacts/parser-natural-playthroughs.json`: completed natural-language campaigns and transcripts.
- `artifacts/parser-gap-report.json`: command outcomes and room/object coverage.
- `artifacts/parser-embodiment-audit.json`: all 117 scenes, entry effects, suspect passages, targeted edits and retained conversation texture.
- `artifacts/parser-browser-report.json` and `parser-*.png`: browser and accessibility evidence.

The embodiment audit is an editorial aid, not proof that every remaining narrator action has ideal granularity. Existing authored moral outcomes still summarize several acts already authorized by the chosen intent. The legacy Motel graph retains its conditional-exit review flag; parser tests verify the unconditional physical route home.

## Turning human input into an authoring fix

Export the run in Settings after playing, then analyze that local file:

```sh
npm run parser:gaps -- /path/to/exported-save.json /tmp/parser-gaps.json
```

The same report is available under the development inspector. It groups failed verbs, missing nouns, unsupported topics, ambiguity and atmospheric fallback frequency; it lists rooms with fewer than five authored details and objects relying on generic responses. No telemetry or external service is involved. An exported save contains the player's words and private state; inspect it locally before sharing.

For a failure, preserve the seed and preceding commands, then choose the smallest correction:

1. Surface phrasing or a duration: `src/engine/natural-language.ts`.
2. Verb aliases or grammar: `src/engine/language.ts`.
3. Names and physical affordances: `src/content/affordances.ts` / `spaces.ts`.
4. A specific existing narrative intention: `src/content/parser-content.ts`.
5. A harmless conversational reply: `src/content/social-responses.ts`, with any state gate in the parser.
6. A consequential new capability: an explicit action handler with custody, presence, knowledge, boundary and time checks.

Add a test for the actual failed wording and an adversarial near-neighbour when its meaning matters. Preserve the original manuscript when correcting parser presentation; add a targeted adapter edit and regenerate the audit. Adding entities to an already shipped revision requires an explicit migration, not a validator that silently recreates missing evidence.

## What remains for the blind playtest

This remains a deterministic authored parser, not unrestricted language understanding. Automation verifies known phrases and state transitions, not whether an unfamiliar player can intuit the right level of detail. The first human pass should particularly assess unsupported but reasonable phrasing, the naturalness of conversational follow-ups, whether observation feels worth its time, reading fatigue, and how well the mobile keyboard behaves on a real device. No new district or full Motel chapter was started.
