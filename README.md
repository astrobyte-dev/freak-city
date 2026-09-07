# FREAK//CITY

**The city keeps receipts.** A local-first, mature noir parser interactive-fiction RPG. This playable first-night prototype follows an unsigned invitation into Velvet and asks who gets to hold the record of what happened there.

## Play locally

Node 22+ is recommended.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite (normally http://localhost:5173). The server also binds to your local network for phone testing. Nothing is published automatically.

```sh
npm run build
npm run preview
```

The production output is in `dist/` and can be served by any static host at its root. No backend, keys, database, accounts, external fonts, analytics, or live model are needed. Fonts, artwork and all narrative data are bundled locally. The development inspector is excluded from the production UI/bundle.

## The playable night

- 117 preserved authored encounters, conversation/relationship beats and outcomes, four major adult characters, three coherent invitation variants and four custody endings.
- Persistent rooms, connected exits, physical evidence, containers, doors and wearables. A typed command prompt drives exploration.
- Four extended relationship arcs, two substantial companions per night, closing returns and delayed personal callbacks.
- Taxi opening and alias; Velvet, side streets, apartment, and a Motel 27 continuation hook.
- Two competing deadlines. The exchange and the departing witness each proceed without you.
- Verified evidence, incomplete knowledge, NPC memories, mistaken beliefs, interpersonal relationships and a separate NPC relationship matrix.
- Moral dilemmas, emerging traits, explicit immediate/delayed effects, mutating/disputable rumours, and a persistent command/response transcript.
- In-world phone, belongings, wardrobe, district map and evidence journal.
- Optional romance, negotiated social rituals, mature fashion/context classification, boundaries and reflection. Everything is non-graphic.
- THE PULL privately models narrative interest, attraction context, chemistry and thematic engagement. HEAT expresses interpersonal intensity.
- Responsive interface, original noir artwork, local fonts, synthesized opt-in rain/bass, keyboard navigation, adjustable reading size and reduced-motion support.

The legacy branching-route benchmarks encountered approximately **10,900–12,800 words across 57–66 choices**, from about 24,100 words of authored scene text. At 200 words/minute plus 15 seconds per choice, the modeled duration is **69–80 minutes**. Faster readers can finish in approximately 53–62 minutes; shorter departures remain available. These are transparent estimates, not measured human play durations. The [blind feedback form](docs/BLIND-PLAYTEST.md) is ready for a first external playtest.

## Playing

Type what you want to do at the prompt. Choose an alias and confirm adulthood on your first command. Your commands and the city’s responses remain in a scrollable transcript. No numbered action menus are shown.

```text
look around
pick up the black envelope
open it
get invitation
put it in my coat
go outside
go inside
go bar
ask Mara about the invitation
ask her why she recognised it
```

The parser supports synonyms, conservative typo correction, contextual nouns, pronouns, prepositions and chained actions (`then` or `;`). Up/Down recall commands; Tab completes words, repeated Tab cycles, and Escape dismisses completion. `HELP` explains the language; `HINT` offers encounter help on request. Optional accessibility shortcuts are off by default in Settings.

`LOOK`, `HELP`, `INVENTORY`, `JOURNAL` and `MAP` cost no time. Travel, investigation, conversation and waiting do. NPCs follow their schedules; the exchange and bus departure happen independently. Rooms stay available for revisits, and evidence remains where you leave it. `SLEEP` at home ends the night, including an early departure without solving the invitation.

Use `PHONE`, `INVENTORY`, `JOURNAL` and `MAP` or the toolbar to open diegetic panels. Phone messages use a text composer. Wear clothing you physically carry. Escape closes dialogs. Boundaries and optional audio remain available from the sidebar. There is no runtime LLM and no communication with real people.

Normal mode has an autosave and one bookmark. Settings provides bookmark/restore and JSON import/export. **Live Wire** has one autosave and disables manual rewind/import. Its export is archival, not restorable within Live Wire. Changing the seed starts a fresh run, carrying explicit boundaries but clearing learned interests.

Try `NIGHT-0`, `NIGHT-1`, and `NIGHT-2` for three different invitation explanations. Same seed + same commands + same explicit preferences produce the same simulation.

## Privacy

Only this browser's `freak-city:v1:autosave` and `freak-city:v1:bookmark` keys are used. Preferences stay inside the local save; there is no transmission or analytics. Exported files contain the full private state, which the export UI explicitly states. Settings → THE PULL clears interests or disables adaptation; Settings → Delete local data removes this game's storage keys. Other applications' storage is untouched. Local saves are not encrypted against someone who can access your browser profile.

Explicit boundaries apply immediately. `SKIP` overrides interest and compatibility; `IMPLIED ONLY` uses equivalent summaries. The phone, current descriptions, transcript passages and authored interactions and surveillance decoration honor the applicable boundaries. Some taxonomy categories are architecture for future authored material, not a promise of scenes already present.

## Validate

```sh
npm run check       # production build, simulation tests, narrative QA, scripted + fuzz runs
npx playwright install chromium
npm run dev        # leave this running on port 5173
npm run test:browser
npm run format:check
```

Generated evidence is in `artifacts/` (including a machine-readable canon ledger, scene cards and scene graph from `npm run content`): narrative QA, playtest reports, browser report and desktop/mobile screenshots. Reports contain synthetic test identities only. The tests cover complete routes on different seeds, knowledge propagation, missed events, delayed effects, boundaries, cue cooldowns, saves, Live Wire and corrupt-save handling. Parser playtests run 12 complete command campaigns across the three seeds and four custody outcomes, validating each saved state. Browser checks exercise typed commands, history, completion, clarification, reload, panels and mobile/desktop accessibility. Legacy scene-based simulation tests remain as regression coverage.

Development only: **Ctrl+Shift+D** opens the inspector. View state, canonical secrets, scene cards and transcripts; jump scenes, change composure, advance time, change seed or simulate a choice. Scene jumps intentionally bypass entry logic and can create non-canonical debug states.

## Documentation

- [Parser pivot audit, implementation and authoring](docs/PARSER-PIVOT.md)

- [Expansion results and duration evidence](docs/EXPANSION-REPORT.md)
- [Blind human-playtest form](docs/BLIND-PLAYTEST.md)
- [Build decisions](docs/BUILD-PLAN.md)
- [Architecture and consequence propagation](docs/ARCHITECTURE.md)
- [Story bible](docs/STORY-BIBLE.md)
- [Character and voice bibles](docs/CHARACTERS.md)
- [THE PULL, boundaries and pacing](docs/THE-PULL.md)
- [Narrative authoring and expansion examples](docs/AUTHORING.md)
- [Editorial review and known limitations](docs/QA-AND-LIMITATIONS.md)
- [Artwork provenance and prompt](docs/ASSETS.md)

Next: expand the current relationships into a measured 60–90-minute chapter; commission human editorial/playtest passes; deepen NPC-to-NPC faction decisions; then develop the Motel 27 records thread. The other districts and DEJA//VU are future work.
