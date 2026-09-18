# Sable chapter trial — local playable handoff

**17 September 2026 · isolated development entry · no publication**

**Current continuation:** the first exploratory playtest's export and conversation repairs are implemented locally. See the [repair report](design/sable-playtest-review/REPORT.md) for the visible Export playtest button, separate readable/diagnostic downloads, preserved branch history, conversation fixes, fresh verification and remaining language limits. Verification below records the earlier chapter implementation; it remains retained evidence.

The approved first chain is implemented locally. The original invitation/ledger campaign remains the default. The [transition document](NEW-STORY-TRANSITION.md#implementation-authorization--17-september-2026) records Corey's accepted canon and amendments; the earlier proposal remains an audit, not current approval questions.

## Launch and spoiler-light playtest

From the project directory:

```powershell
npm run dev -- --port 5181 --strictPort
```

Open **http://localhost:5181/?trial=sable**. The local server is running on that port at handoff. **http://localhost:5181/** opens the original campaign. The Sable entry is development-only; production builds keep the existing campaign.

1. Enter an alias and confirm adulthood. Talk to Sable, order a drink or ask about their evening. Their friendship with you is established; your feelings and attraction are not prescribed.
2. Ask about their memories. Explore the shop and inspect what you find. You can show evidence directly to Sable, or ask Vesper to relay their own inspection. Taking or giving something alone does not mean anyone read it.
3. Let Sable make their next step. Their reasons are spoken. Disagreement, silence and refusing help are valid responses; there is no hidden kindness score to optimize.
4. Return for ordinary conversation between developments. At home, **REST UNTIL TOMORROW** or the clearly labelled optional button advances to the next evening at 18:00. Consequences run during that jump. Reading, considering replies, reloading and time away from the application do not move the clock.
5. Ask about the investigation and, when Sable is ready, ask to **TALK PRIVATELY**. If they are away or off duty, return during a staffed evening. The update waits for privacy and their presence.

HELP lists supported language. LOOK, THINK, JOURNAL and INVENTORY are untimed. Examples: `ask Sable about their memories`, `show photo to Sable`, `ask Vesper to tell Sable`, `I disagree`, `say nothing`, `I can't help`, `take your time`, `wait for two hours`. Adult social themes default to implied-only and can be changed in Trial settings without affecting access to the investigation.

Both the examination and documentation are substantial outcomes. A later playthrough can explore the alternative by paying attention to Sable's stated priorities and time needs. Neither resolves the whole conspiracy. This segment ends with a completed activity and a useful next question; there is no later chapter hidden behind a correct reply.

## Implemented scope and behavior

- One identified photograph and its independently produced provenance/event listing, plus a carried satchel, a possible medical report and a possible notebook. Custody, closed containers, showing, explicit inspection, transfer and destruction are modeled. Already acquired information survives loss of an original.
- An explicitly heard hospital account establishes why the photograph matters. Direct showing or an explicitly requested Vesper call creates Sable's sourced receipt. The call arrives after 24 simulation hours. Merely showing Vesper something, reporting a conversation or asking a hypothetical does not send it onward.
- Sable deliberates for ten simulation minutes, including while the player is absent. An early quiet evening supports an independent examination with explained steps and a right to stop; busy service or Sable's acknowledged desire for time supports documentation. Recorded reasons remain attached to the decision. Pressure does not unlock an examination, and refusal does not cancel Sable's independent activity.
- Examination follow-through occurs 72 hours after the decision; documentation after 24 hours. Medical travel/shift cover and a return one hour after the report are tracked. The report only records a finding compatible with intervention and unresolved alternatives. The notebook separates recollection from observation and identifies authentication of the photographer's lot/date as a bounded next step.
- A private, once-only update names the first transmission path, elapsed simulation time, treatment actually heard, decision and completed outcome. If the player used both transmission paths, a later Vesper report is also acknowledged. Repeated visits and reloads do not repeat the update or create extra evidence.
- Ordinary conversation, remembered drink preference, Sable's adult social interests and boundaries, humour and private THINK/evidence reactions sit alongside the mystery. Private thought and settings never teach NPCs facts. No Regular learns the investigation without a supported communication; no surveillance route is present.

## Integration and preservation

The complete pre-integration working tree was copied to `C:\Users\thr3e\AppData\Local\FreakCityBackups\pre-sable-20260917-195810\tree`: **54,878 files, 5.348 GiB**, including ignored local files, dependencies, artwork, evidence and prototype. Robocopy reported zero failures or mismatches. Git metadata was excluded from that file copy; the original repository remains in place, with HEAD/status and SHA-256 hashes of the 929 tracked/untracked files captured in the adjacent `baseline.json`. Browser profiles and personal saves were not opened or copied; browser checks use isolated synthetic contexts.

The implementation reuses the existing language parser/normalizer, entity schema and extracted custody/event-queue primitives. The original parser and scheduler use those same helpers without changing their semantics. A small trial reducer owns this single situation, its cast, provenance, authored replies and validation. It does not widen the original four-person campaign's enums, remap seeds, replace its scenes or introduce a general NPC planner.

Trial autosave, bookmark and draft keys begin `freak-city:sable-trial:v1:`. Legacy save/import validation is separate; cross-campaign imports are rejected. Invalid trial saves remain intact until an explicit replacement or deletion; export is available. Trial deletion does not remove legacy autosave, bookmark or draft keys. This trial has normal bookmarks/import/export only; the original campaign's Live Wire behavior is preserved.

The full repository checks run in a separate verification copy at `C:\Users\thr3e\AppData\Local\FreakCityBackups\sable-verification-20260917-201807`, so their hard-coded artifact outputs do not overwrite existing review evidence. It contains the current local code, not a HEAD-only checkout. Dependencies are reused without installation.

## Fresh verification

Fresh final counts and preservation results are recorded in [verification.json](design/sable-trial-review/verification.json). Read them alongside the [browser results](design/sable-trial-review/browser-results.json) and four exported command transcripts in that directory. Earlier project reports remain historical.

- Four complete actual-text-interface browser playthroughs: direct/formal, direct/documentation, Vesper/formal and Vesper/documentation. Desktop/mobile screenshots and eight accessibility scans; no browser errors. Includes a pending-event reload, unsent draft restoration, once-only update, trial bookmark restoration, deletion isolation and return to the original campaign.
- Focused engine/save tests cover all four chains, absent player, silent non-disclosure, exact relay time, destroyed/transferred/closed evidence, unsupported rumors, explicit receipt/source history, natural refusal, private thought, deterministic time jumps, invalid saves and missing events, duplicate prevention and legacy storage isolation.
- Required `npm run check`: build, all unit/regression tests, narrative QA, simulation campaigns, content indexing, twelve parser campaigns, sixty natural-language campaigns and embodiment audit.
- Required original `npm run test:browser`: eleven accessibility scans plus desktop/mobile parser, drafts, touch controls, IME, scroll retention, phone, clarification, panels and reload checks.
- Repository-wide formatting check retains two **pre-existing** warnings: `docs/design/text-opening-transition/engine-review.json` and `verification.json`. Their baseline hashes are unchanged; they were not reformatted. All files added or edited for the Sable implementation pass formatting.

## Changed files and limits

| Files                                                                                                     | Purpose                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/trial/content.ts`, `state.ts`, `engine.ts`                                                           | Approved truth, authored content, bounded state/decision/transmission/activity chain, typed commands and semantic validation.    |
| `src/trial/save.ts`, `TrialApp.tsx`, `trial.css`                                                          | Separate persistence and local text interface with adult gate, boundaries, optional time advances and no wall-clock progression. |
| `src/engine/custody.ts`, `event-queue.ts`; small edits to existing `game.ts` and `parser.ts`              | Share existing custody and deterministic event-ordering/identity behavior; retain prior uncommitted changes.                     |
| `src/main.tsx`                                                                                            | Explicit development-only `?trial=sable` entry; default remains original app.                                                    |
| `tests/sable-trial.test.ts`, `scripts/sable-trial-browser.ts`                                             | Reproducible synthetic unit and actual-interface checks.                                                                         |
| `docs/NEW-STORY-TRANSITION.md`, this handoff, `WORKSTATION-HANDOFF.md`, `docs/design/sable-trial-review/` | Accepted decisions, local handoff and fresh evidence.                                                                            |

The parser covers this authored situation, not arbitrary conversation. Use named objects/people when an interrupted reply is ambiguous. The trial's repeating 18:00–22:00 availability is a small local schedule, not a weekly city simulator. There is one independent practitioner arrangement, no playable clinic or detailed medical diagnosis. No full relationship or romance route is claimed. The same trial seed has no randomized alternate canon.

Deferred: Nessa's testimony, Curator records, dream-led entry, Index rumors as a playable route, leaks/cover stories, Sable finding the print independently, copying/selling evidence, confrontation, legal/audit alternatives, withdrawal, credibility sabotage, flight, retaliation, restoration, Ball/party, demolition and later endings. Photograph custody cannot be bypassed by creating a second copy. Existing art, inactive prototype, personal saves and all publication/artwork holds remain preserved. No dependencies installed; no commit, push or deployment. No new authorial decision blocks playtesting this segment.
