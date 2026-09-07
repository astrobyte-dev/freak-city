# First-night expansion — implementation report

THE PULL now uses positive narrative-interest, attraction-context, chemistry and thematic-engagement language. One architectural note defines its scope. HEAT remains interpersonal intensity; the mature taxonomy, exclusions and NPC boundaries are preserved.

## What changed

Four thirteen-beat relationship arcs add first encounters and closing returns. A run can deepen at most two companions. Nine shared/conditional scenes connect them to the existing evidence decision and apartment. Older choice destinations, seeded truths and short routes remain intact.

Mara’s overtime dilemma, Celeste’s staffing decision, Luca’s funding disclosure and inaccurate commitment, and Inez’s privacy/reputation conflict have delayed consequences. Small food, home, music and radio details return later. NPC pairs disagree on-screen and continue work off-screen. One rare Mara/Inez overlap requires both witnessed staffing choices.

The phone adds four authored reply threads, delayed answers, an entrance image and a voice-note transcript. A reply takes two simulation minutes; reading takes none. Reply IDs are validated and cannot be repeated to alter relationships.

## Evidence

- Production build and 80 simulation tests pass.
- 18 short scripted routes, 18 expanded routes, and 250 deterministic random walks complete.
- Scene coverage: 117/117; unvisited scenes: 0.
- Authored scene text: 24,119 words. Narrative QA: 0 errors; one reviewed conditional-ending flag.
- Chromium: 14 desktop/mobile accessibility scans, zero axe violations, no runtime errors or external requests.
- Browser checks include a full Mara/Celeste expansion, a personal phone reply, image display, reload, mobile overflow, plus the earlier all-exclusions route and save/erasure checks.

## Encountered length

Counts below include visible scene passages and actual revisits. Phone text available to read is reported separately in `artifacts/playtest-report.json`; it is not silently added to estimated reading time. Choice labels, journal reading, breaks and audio are excluded from the model.

| Companions     | Encountered words across seeds/styles | Choices | Model at 200 wpm + 15 sec/choice | Faster model at 250 wpm + 10 sec/choice |
| -------------- | ------------------------------------: | ------: | -------------------------------: | --------------------------------------: |
| Mara / Celeste |                         11,949–12,041 |      63 |                        75–76 min |                               58–59 min |
| Mara / Luca    |                         12,009–12,096 |      63 |                           76 min |                                  59 min |
| Mara / Inez    |                         12,161–12,179 |      63 |                           77 min |                                  59 min |
| Celeste / Luca |                         10,877–10,935 |      57 |                           69 min |                                  53 min |
| Celeste / Inez |                         11,428–11,503 |      61 |                        72–73 min |                                  56 min |
| Luca / Inez    |                         12,706–12,776 |      66 |                           80 min |                                  62 min |

The slower model places full routes around 69–80 minutes; faster readers may finish below an hour. These estimates are not human playtest results. Voluntary early departures remain shorter.

## Remaining review

The blind form is in [BLIND-PLAYTEST.md](BLIND-PLAYTEST.md). No human feedback has been invented. Actual pacing, recall, chemistry and willingness to return need external testing. Independent editing should check dialogue cadence and remaining explanatory narration.

Voice playback, typing/deletion animation and incoming-call interaction are still outside this implementation. NPC autonomy is authored event logic. Motel 27 remains a hook. The production build reports a large JavaScript chunk (approximately 561 kB before compression); splitting that bundle is a later loading-performance improvement.
