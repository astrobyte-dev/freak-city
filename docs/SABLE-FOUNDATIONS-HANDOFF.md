# Sable interaction foundations — completed bounded milestone

The TypeScript engine is retained for this milestone. The completed Inform comparison and its evidence remain unchanged. The proposed three-day Inform conversation experiment was **not started**. This is an isolated Sable implementation, not a permanent engine decision or a replacement campaign.

## Launch

The final compiled trial is running at **http://localhost:52747/sable-trial.html** in the connected Chrome profile. That origin has only this fresh test session; the existing port 5181 saves were not accessed. The visible session uses the synthetic alias Foundation.

From the repository, with its existing dependencies:

```powershell
node node_modules/vite/bin/vite.js build --config vite.sable.config.ts
node node_modules/vite/bin/vite.js preview --config vite.sable.config.ts --host 127.0.0.1 --port 52749 --strictPort
```

Open `http://localhost:52749/sable-trial.html`. Use an unused port for another isolated session. The explicit build writes `dist-sable`; the normal campaign build and its DEV-only `?trial=sable` route are unchanged. Development still supports `npm run dev -- --port 52749 --strictPort`, then `http://localhost:52749/?trial=sable`.

The running frozen verification copy is recorded in [verification-location.json](../artifacts/sable-foundations-20260917/verification-location.json). [Source hashes](../artifacts/sable-foundations-20260917/final-source-hashes.json) and [compiled asset hashes](../artifacts/sable-foundations-20260917/compiled-build-hashes.json) identify the uncommitted final build more precisely than its base commit label.

## Reused machinery and structural changes

| Area                  | Reused                                                                                                           | Changed                                                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Objects               | Existing `Entity` schema, `carriedBy`, `visibleAt`, containment, portability, destruction and custody validation | Cup and glass are stable container entities. Beverage kind, capacity, remaining portions and service time live on those entities. Removed the independently mutable `state.drink` and old drink-order/serving paths. `currentDrink` is a derived view only.                                                        |
| Actions               | Existing reducer, simulation clock, transcript diagnostics and validated save round trips                        | Shared object resolution and precondition checks handle taking, examining, sipping, finishing, putting down, containment, showing and giving. A single `fillVessel` action serves both orders and offer acceptance. It checks server presence, counter access, actual vessel custody and contents before mutation. |
| Conversation          | Existing authored text, sourced observations, actor knowledge and chapter adapters                               | Saved context now names interlocutor, subject, pending question/offer and referenced entity IDs. Diagnostics record response meaning and polarity. Complaint answers, service requests, specific acceptance/refusal, uncertainty, follow-ups and evidence claims resolve through one reusable dispatcher.          |
| Evidence and autonomy | Existing inspection/provenance graph, corroboration, calendar, decisions and off-screen events                   | Generic showing invokes the existing inspection hook; giving records custody without inspection. Attributed claims retain original qualifications and do not create observations. The richer chapter simulation remains authoritative.                                                                             |
| Content               | Existing Sable prose and topic vocabulary                                                                        | Topic aliases, judgments, questions, evidence responses and service wording are declarations in `interaction-content.ts`. Generic modules have no Sable/Kit/Rowan name checks. The opening explicitly voices its complaint question and places the readable menu on its actual counter.                            |

Harmless inspection does not replace the conversational subject. Named complaint answers deliberately return to that subject after a drink offer; they do not accept the drink. Pronouns with competing interpretations clarify. Ordering a second drink leaves the first vessel intact. An empty remote cup must be brought back; a new vessel is not silently substituted for its refill.

This is a reusable foundation inside the trial, not a claim that every older chapter-specific conversation branch has been converted. Hospital, accompaniment, decision and outcome adapters remain bounded chapter code.

## Demonstrated reuse

[Synthetic fixture declarations](../tests/fixtures/interaction-fixture.ts) introduce Rowan, Kit and a mug without adding parser branches. Both actors run the same opinion, follow-up, service, claim and show rules with independent observation records. Cup and mug coexist, clarify `sip drink`, and share take/sip/finish/drop/examine handling. These fixtures are not story canon.

Replay evidence: [Rowan](../artifacts/sable-foundations-20260917/reducer-evidence/synthetic-rowan.json), [Kit](../artifacts/sable-foundations-20260917/reducer-evidence/synthetic-kit.json). Every step includes its response, meaning, state and observations. The production trial also demonstrates simultaneous coffee and water using its existing drink vocabulary, without introducing food preparation or liquid mixing.

## Evidence and verification

The [engine-neutral specification](../experiments/inform-comparison/SPEC.md), prior exploratory transcripts and routing regressions supplied the semantic cases. The existing 107 Sable regressions were retained; 50 foundation/held-back checks were added. Assertions cover wording and opposite meanings, custody and contents, uncertainty versus execution, two vessels, explicit/bare acceptance, remote refills, closed bags, inspection interruptions, migration and reload.

Necessary adaptations are explicit: fresh service now places a vessel on the counter; the old `drink` assertions read the derived entity view; a correction does not discard an unfinished drink; diagnostics report entity changes. Revision-one fixture construction removes revision-three entities instead of merely deleting a nonexistent drink field. In the old browser transcript, repeated `water` creates two declared vessels, so later `sip water` and `take water` clarify. The refill check names and empties the cup first. A separate custom-alias refill check empties its glass before expecting an offer.

The held-back set was authored after the first 143 passing checks, not by a blind human tester. Its first run passed eight of nine assertions. The remaining assertion incorrectly demanded that “That sounds harmless” infer an earlier complaint after a drink-topic change. The final check tests that wording during the complaint, and separately requires clarification after the offer. One generic pronoun clarification was added. [Initial held-back output](../artifacts/sable-foundations-20260917/held-back-initial.txt) is preserved; later success is not presented as untouched held-back performance.

The fresh **visible compiled-build** opening run preceded the repository gates. It has 45 submissions: **39 handled, four clarified, two rejected**. These are outcome categories, not 45 successful executions. It demonstrates both acceptance forms, reload during an identified offer, simultaneous held vessels, remote refill rejection and recovery, qualified claim versus showing, a menu interruption during evidence discussion, and an unsupported request.

- [Final visible transcript](../artifacts/sable-foundations-20260917/visible-final/sable-playtest-transcript.md)
- [Matching diagnostic export — spoilers](../artifacts/sable-foundations-20260917/visible-final/sable-playtest-diagnostics-SPOILERS.json)
- [Exact export-match verification](../artifacts/sable-foundations-20260917/reducer-evidence/visible-export-verification.json)
- [Opening screenshot](../artifacts/sable-foundations-20260917/visible-final/01-opening.png) and [final export screenshot](../artifacts/sable-foundations-20260917/visible-final/04-export.png)

| Final verification                     | Result                                                                                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiled isolated trial and TypeScript | Passed                                                                                                                                                                                                           |
| Focused Sable tests                    | 157 passed                                                                                                                                                                                                       |
| `npm run check`                        | Passed: 1,264 tests in 18 files; narrative QA zero errors, existing motel reachability review flag; deterministic playtests, content index, 12 parser campaigns, 60 natural-language campaigns, embodiment audit |
| `npm run test:browser`                 | Passed; 11 accessibility scans plus original campaign input, panels, drafts, IME, reload and mobile checks                                                                                                       |
| Four existing Sable browser chains     | Passed direct/formal, direct/document, Vesper/formal, Vesper/document; eight accessibility scans, bookmark/draft/reload and legacy storage isolation                                                             |
| Export/browser gate                    | Passed; exact exports, archive boundaries, legacy import, unrelated-data isolation, two accessibility scans                                                                                                      |
| `npm run format:check`                 | Flags only unchanged `docs/design/text-opening-transition/engine-review.json` and `verification.json`; changed/new files pass their separate check                                                               |

Gate logs: [check](../artifacts/sable-foundations-20260917/gate-check-final.txt), [browser](../artifacts/sable-foundations-20260917/gate-browser.txt), [four chains](../artifacts/sable-foundations-20260917/sable-chains-gate.txt), [exports](../artifacts/sable-foundations-20260917/sable-export-verified.txt), [format](../artifacts/sable-foundations-20260917/gate-format.txt). Gates ran in a separate copy because existing scripts overwrite reports. Initial failures remain separate: the first regression run, foundation assertions, held-back run, production-route setup, missing `artifacts` directory in the verification copy, and stale export-gate expectations. None was erased or relabelled as successful exploration.

## Opening contract, saves and limits

The [authored promise inventory](../artifacts/sable-foundations-20260917/reducer-evidence/opening-promises.json) connects ten questions/actions/objects to executable checks. [Seven advertised control checks](../artifacts/sable-foundations-20260917/reducer-evidence/opening-controls.json) supplement it. [Manual prose review](../artifacts/sable-foundations-20260917/opening-prose-review.md) covers contextual implications and scenery. This is authored inventory and human-style review, not automated extraction that understands every implied possibility.

Revision 1/2 saves undergo explicit migration to revision 3, preserving vessel contents, actual room/held custody, transcript, evidence history and pending context. Revision 3 rejects duplicate drink authority, invalid contents, inconsistent custody and invalid references. Reading an older stored save backs up its exact bytes under `<save-key>:preserved:N` before autosave can replace it. Backup failure blocks loading/rewrite; invalid saves remain intact. Imported files remain on disk. Migration never invents missing old diagnostics or inspections. Preserved backups intentionally remain available after a restart.

The language layer handles finite action frames, authored vocabulary, ordinary paraphrases, bounded spelling correction and explicit ambiguity. It does not promise unrestricted natural-language understanding. Complex polarity can clarify rather than execute; multi-object requests ask for one object. Drink portions are three abstract units; no pouring, mixing, spilling, recipes or general food simulation exists. An active conversational context expires after travel or 30 simulation minutes; harmless inspection and reload do not spend that time. Synthetic actors demonstrate foundation reuse, not full production scheduling integration.

[Preservation audit](../artifacts/sable-foundations-20260917/preservation.json): 1,386 baseline files, no missing files, 13 authorized existing files changed (including the isolated build output ignore), no frozen-source mismatch, no Inform or original-campaign changes. New work is confined to trial foundations, fixtures, tests, reporting, the explicit local build entry and this handoff. No dependencies, runtime AI services, new story branches, commits, pushes or deployment were added.

Reproduce the focused checks with `npx vitest run tests/sable-foundations.test.ts tests/sable-foundations-held-back.test.ts`; generate synthetic evidence with `npx tsx scripts/sable-foundations-evidence.ts`. Existing Sable browser scripts accept `PLAYTEST_URL`, `SABLE_TRIAL_PATH=/sable-trial.html` and `SABLE_REPORT_DIR` for isolated compiled-build verification. Use a separate checkout/copy for repository gates if prior generated reports must remain untouched.
