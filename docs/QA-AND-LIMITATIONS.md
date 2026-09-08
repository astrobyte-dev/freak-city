# QA, editorial review and limits

## Automated evidence

Run `npm run check`, then `npm run test:browser` against the development server. Reports are regenerated into `artifacts/`; read them rather than relying on a stale count in prose.

Simulation assertions cover six complete archetypes across seeded campaigns, deterministic state, all four endings, knowledge propagation, lies and contradictions, mundane memory callbacks, missed events, chronological nested consequences, cancellation, rumour mutation/correction, low-composure exits, contextual interest/cooldown, absolute theme exclusions, full save restoration, Live Wire restrictions, corruption and storage failures. Additional tests cover compatible interest-gated branches, each seeded investigation, NPC relationships and traits.

The playtest script also covers all six companion pairs across three seeds, including guarded choices, exclusions and a rare overlap. It performs 250 deterministic randomized walks, rejects dead ends and overlong loops, validates saves after every choice, and reports coverage. It uses higher PRNG bits for action selection: the initial low-bit modulo implementation correlated with branch counts and only sampled two endings. That was a test-harness weakness, corrected before final reporting.

Parser browser checks exercise typed commands, physical navigation, phone drafts and failures, journal/inventory/map/boundaries, history/completion, reloads, transcript reading position, composition, local deletion, and narrow/reduced-height phone viewports. They collect runtime errors and run axe across desktop/mobile screens. Full endings are covered by deterministic command campaigns. Passing axe is not a claim of universal accessibility or a substitute for assistive-technology testing. See [the interaction pass](INTERACTION-PASS.md) for current parser coverage and remaining human-playtest questions.

## Narrative QA

The validator checks references, age declarations, effect schemas, scene-card availability, card information contracts, passage/message boundary fallbacks, reachable scene graph, obvious dead ends, identical consequences, repeated dialogue across speakers, stock generated phrases, excessive ellipses, long dialogue turns and long scenes.

A review flag is not automatically an error. The Motel scene has mutually exclusive exits conditioned on a previously selected ending. This is intentional: all legal incoming paths have exactly one ending flag. Simulation and browser tests exercise that invariant. A forged development scene jump can violate it; the debugger explicitly warns that jumps bypass narrative entry requirements.

The validator does **not** claim to detect all information leaks, cleverness, metaphors, personality contradictions, psychological plausibility or prose that “sounds generated.” These require the character bibles, scene cards and human editorial judgment. It flags evidence; it does not score literary quality as an objective truth.

## Critical revisions made

- Early code displayed future branch titles as generic locked choices. Hidden prerequisites now hide the choice; only deliberate closed-route messages stay visible.
- The minimum upstairs commitment did not initially account for an unusually early arrival. It now always consumes the witness window, with the actual duration shown.
- A loading-bay photograph description initially asserted a 00:19 timestamp even when found earlier. The photograph now makes a limited custody claim; the witness docket supplies the timestamp.
- “Dawn” initially inherited the previous scene's clock. It now advances to 06:00 and delivers all due consequences.
- A message originally said the box moved before midnight; the verified docket says before the 00:20 transfer. Wording now matches the actual evidence.
- Arrival notices could have repeated on hub revisits. First-entry effects execute only once.
- The browser save test initially compared JSON strings and failed on schema-normalized key ordering. It now compares complete parsed state; no domain data was lost.
- Low-contrast captions and red buttons found by axe were revised, with reruns retained in the browser report.
- Scene-card revelation lists were brought into alignment with explicit signature/board-copy revelations, and the QA check now prevents those omissions.
- Seed variation now has separate investigations and consequences, rather than stopping at a different sender paragraph: Mara/Luca's carbon dispute, Celeste's casting-vote plan, and Inez's living intended recipient.

## Voice/hostile edit notes

Mara's strongest passages are practical interruptions and unglamorous care: the wet mat, missing screw, shift and drink. Her confession avoids a polished theory of herself until a concrete omission has been established. Celeste's pressure is precise wording and inherited authority; she can concede a point without becoming universally compliant. Luca's humor creates friction, including a joke that fails and a grievance about a microwave. Inez is allowed to answer too literally and to puncture her own grand-sounding comparison with a cost explanation.

The invitation answer is given directly once authenticated. Motel 27 extends the story but does not replace that answer with another withheld riddle. The final document decision has four different costs, not a renamed good/evil choice. Optional intimacy never grants mandatory evidence. Refusing publication has a cost too: delay and incomplete corroboration.

The prose still benefits from an independent human voice/continuity pass. The existing edit is an implementation-time editorial pass, not external playtester feedback.

## Known limitations

- **Duration:** full two-companion routes now model 69–80 minutes at 200 words/minute plus 15 seconds per choice; faster reading can produce a shorter run. This is not yet a human-verified 60–90-minute slice. Route reports separate encountered words from total authored words; the total is not a claim that one player reads every branch. Human play duration has not been measured.
- **City simulation:** the scheduler, rumours and relationship matrix work, but NPC autonomy is curated event logic, not a general social planner. Wider faction networks and independent long-term agendas need expansion.
- **Adult taxonomy:** classification and contextual controls are implemented; some categories have no dedicated scene. All authored material stays non-graphic.
- **Pacing:** authored macro structure plus conditional micro-observations. There is no autonomous whole-scene director or generative dialogue.
- **Phone:** text messages, authored personal replies, delayed answers, a local entrance image and voice-note transcripts work. Recorded voice playback, animated typing/deletion, complex group-chat simulation and incoming-call interaction remain future work.
- **Save UX:** normal mode has one bookmark rather than a multi-slot manager. Local JSON is not encrypted or tamper-proof. No cross-device sync or offline service-worker cache is provided.
- **Audio:** a small opt-in ambience layer, not a mastered soundtrack or full foley suite. Silence remains a complete play mode.
- **Art:** one original exterior image, CSS location treatments and abstract portraits, not a full location/character illustration set.
- **Wardrobe:** presentation changes access assumptions and initial impressions; a full clothing economy is out of scope.
- **QA coverage:** automated routes and Chromium browser checks are implemented. Safari/Firefox, real screen-reader use and an external human playtest are still needed.
- **Future content:** Motel 27 is a hook. Other districts and DEJA//VU are not playable yet.

## Next production step

Run a blind human playtest using `docs/BLIND-PLAYTEST.md`. The relationship expansion is implemented and simulated; tune its pacing from actual elapsed time, recall, voluntary stopping and descriptions of character chemistry. An independent voice pass should examine repeated narrator explanations of agency and uneven dialogue cadence. Keep the Motel hook unchanged until that feedback has been reviewed.
