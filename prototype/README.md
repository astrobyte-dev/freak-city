# FREAK // CITY — one-room graphical experiment

## Inactive experiment — 2026-09-17

The owner ended graphical point-and-click as the active development direction. This complete local experiment, including its code, tests, dependencies and playtest evidence, is retained. Do not continue navigation, graphical interfaces or visual asset work. The root text-led game is the active direction; see the [transition handoff](../docs/TEXT-LED-TRANSITION.md) for retained interaction findings, shared-engine work and the next proposed story milestone. All continuation recommendations below are historical. Existing artwork and personal saves remain untouched; everything stays local and uncommitted.

## Current milestone — conversational and investigative beat

The current local prototype now supports **answer Inez → open/read the invitation → show it → ask about its sender**. Its next story objective is to check the routing record; **the prototype still cannot traverse exits**. See [the current milestone report](MILESTONE.md) for source attribution, fresh verification, the visible Chrome transcript and screenshots.

Natural clicks cover the visible character/object shapes. All selections cancel queued approaches, including inventory selection. Latest feedback remains visible at 1366×768. Escape distinguishes dialogue closure from movement cancellation. Other belongings are explanatory text rather than disabled action buttons. A first invitation reading produces an existing, explicitly private evidence reflection; the misleading general Private thought button is gone.

The alias form uses the setup UI's existing normalization and 1–24 character limit. It sends typed data through a narrow engine transaction entry point and the existing authored alias-only reply. It is not a general conversation text box. No sender, schedule, relationship, new room or authored NPC speech has been invented.

Current checks:

```powershell
npm run check --prefix prototype
npm run test:browser --prefix prototype
```

The browser command now runs `beat-browser-check.ts` in an isolated automated context. The original `browser-check.ts` and its evidence remain retained as the first experiment's historical coverage; it is not the current test command. `test:beat` is an alias for the current browser check. Visible Chrome exploration is recorded separately from these automated results.

**Everything below describes the retained initial experiment. Its results are historical, not fresh results for the current milestone.**

Local, uncommitted development prototype, 2026-09-15. **Temporary shapes, not final artwork.** This is an experiment with a graphical frontend over the existing simulation, not a completed migration.

## Launch

From the repository root, with its existing npm dependencies installed:

```powershell
npm ci --prefix prototype --ignore-scripts
npm run dev --prefix prototype
```

Open **http://127.0.0.1:5174/__prototype/**. The server binds to loopback and uses a strict port. If that port is occupied, stop the previous prototype server, or explicitly pass another port and use its printed URL.

The separate Vite configuration rejects production builds. The normal game's entry, build configuration, package manifest and lockfile are unchanged. There is no link to this experiment in the normal game. Nothing in this prototype reads or writes autosaves, bookmarks or session drafts. Reload restarts the fixture.

### Try the room

1. Click floor beyond the bench to walk around it. Click a wall for unreachable feedback. Escape cancels walking; a new floor or target click replaces the pending approach.
2. Click the black envelope or its target-list button, then **Take envelope**. The player approaches the dry ledge before custody changes.
3. Use **Use envelope on ledge** in Inventory to put it back. Take it again.
4. Select Inez, then **Talk to Inez**. Close the conversation when ready.
5. With the envelope carried, select **Ask Inez to watch the envelope**. Review her actual terms, then choose **Yes, please** or **No, thanks**. Closing the panel alone does not accept or decline an offer.
6. After acceptance, take the envelope from the ledge. The existing agreement records witnessed collection.
7. **Private thought** shows existing internal commentary. **Wait one minute** advances the existing schedule; Inez leaves at 00:15. Walking, target selection and panel reading do not advance narrative time.

The coat and phone are shown as carried belongings; their wider interactions are outside this slice. Room exits are labelled in their canonical directions but do not travel to another room.

## Assessment and integration decision

**The existing TypeScript simulation supports this bounded graphical frontend without an engine rewrite.** It already owns physical custody, nested inventory, visibility, NPC schedules, authored dialogue, knowledge, NPC memory, commitments, consequences, boundaries and validation. The frontend holds one `GameState`; Phaser holds only presentation coordinates and an approach queue.

Phaser 4.2.1 is pinned in this directory's own lockfile. Current official documentation supports the features used here: a [Scene with its own render/update lifecycle](https://docs.phaser.io/phaser/concepts/scenes), [pointer input](https://docs.phaser.io/phaser/concepts/input), and [FIT scaling with logical game coordinates](https://docs.phaser.io/phaser/concepts/scale-manager). The [official installation documentation](https://docs.phaser.io/phaser/getting-started/installation) describes npm installation and bundled TypeScript definitions. These sources were checked on 2026-09-15; the installed types and visible-browser run verify the APIs actually used.

Phaser was selected for rendering, input and the animation loop. Its physics is unnecessary for this first click-to-walk slice: a small room-specific navigation grid plus continuous segment checks handles three rectangular obstacles and a 14-unit player radius. This does not create a second narrative simulation. React remains the normal-game shell; the prototype uses a small DOM shell for accessible controls and a native conversation dialog.

### Important provisional seam

`src/engine/parser.ts` exports `actionHandlers`, but they are **not a complete structured transaction API**. Calling them alone would omit transaction cloning/rollback, commitment interception, scheduled timing, callbacks, reference updates and transcript processing. `executeCommand` owns those operations.

`simulation.ts` exposes typed action IDs and explicit target IDs to the graphical frontend. Its small, fixed command mapping invokes that complete transaction, using stable entity IDs or explicit nouns rather than UI labels, generated prose or pronouns. The one contextual acknowledgement is offered only for an actual pending Inez offer. Focused tests cover each mapping, consequences, save validity and rejection. There is no free-text command field in the prototype.

This is a compatibility bridge, not the long-term action API. Before expanding to more rooms, extract the existing transaction around a resolved structured action, and have both parser and graphical adapters use it. That extraction should preserve the same commitment and validation hooks. This experiment does not establish that a whole-game port is trivial.

## Reused systems and preserved holds

- Fixture setup calls `ensureWorld(newGame("NIGHT-0"))`, then legally takes the envelope, exits the taxi, enters the vestibule and places the envelope on the ledge. `validateSave` validates the resulting state. No free inventory, teleport, fabricated agreement or schedule override is used.
- `isVisible`, `isCarried`, `presentNPCs` and the current entity locations determine targets and inventory. Taking, placing and agreeing go through the existing engine. Acceptance leaves the envelope on the ledge, owned by the player; witnessed collection updates the existing agreement.
- Approach happens before dispatch. Arrival rechecks target presence and position; dispatch checks current action availability. New input cancels the previous approach. Unreachable destinations return feedback without consequential dispatch.
- Engine passage boundary filtering remains in force. Conversation UI projects exact Inez speech, avoiding the old scene's exterior staging; the full original passage sequence remains in the engine transcript. Private reflection has its own label and never becomes an NPC utterance or knowledge grant. The private-thought audition proposals are unused.
- Four-route topology remains bar ahead, toilets left, cloakroom right, street behind. Coordinates, proportions and the temporary character silhouettes are provisional. No generated/reviewed art is imported, registered or activated.
- The vestibule artwork activation hold remains intact. Existing artwork, normal-game source, personal storage and all prior local work were left untouched. No commit, push, deployment, reset, stash or discard occurred.

## Retained initial verification

| Check                                | Result                                                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prototype TypeScript + focused tests | 11 passed                                                                                                                                                                    |
| Visible Chromium prototype UI        | Passed; movement, obstacle clearance, targeting, approach, repeat input, inventory, conversation, acceptance/refusal, collection, unavailable NPC, reload and mobile scaling |
| Storage instrumentation              | Zero storage API calls; synthetic autosave, bookmark and session draft unchanged                                                                                             |
| Prototype accessibility scan         | Zero desktop WCAG A/AA violations; this is not full accessibility certification                                                                                              |
| Repository `npm run check`           | Passed: build, 1,098 tests, narrative QA, deterministic/fuzz playtest, content export, 12 parser campaigns, 60 natural-language campaigns and embodiment audit               |
| Repository `npm run format:check`    | Passed                                                                                                                                                                       |
| Normal-game `npm run test:browser`   | Passed, including 11 accessibility scans and the existing desktop/mobile/input/save checks                                                                                   |
| Pre-existing file preservation       | SHA-256 comparison: 880 files checked, zero changes; branch remains `feature/state-driven-visuals`                                                                           |

Repository build/test/campaign gates ran against a byte-for-byte temporary copy of the existing tracked/untracked files, with the existing dependency directory and read-only Git revision lookup. The final normal-browser gate targeted the original repository's dev server on port 5175; its script ran from the temporary copy so reports stayed isolated. An earlier temporary-server pass blocked linked font assets; the final pass used the normal font serving path. Generated gate reports therefore did not overwrite pre-existing reports. The new prototype has its own separate check because the root TypeScript and Vitest configurations intentionally do not include it. Node 24.14.0/npm from this workstation were used; the repository recommends Node 22, which was not separately exercised.

Narrative QA retains its existing non-failing motel conditional-exit review flag. Browser testing used fresh Playwright contexts, including a visible Chromium window for the prototype; the browser connector had no available browser. No personal browser profile was used. During development, the checks caught an invalid ARIA label, a test-only injected helper error and a mobile test resize race; the final run includes their corrections.

### Evidence

- [Room screenshot](evidence/01-room.png)
- [Existing conversation](evidence/02-conversation.png)
- [Accepted agreement](evidence/03-agreement.png)
- [Collected envelope](evidence/04-collected.png)
- [390px layout](evidence/05-mobile.png)
- [Visible-browser results and sampled movement path](evidence/browser-results.json)
- [Repository gate output](evidence/repository-check.txt), [format output](evidence/repository-format.txt), [normal browser output](evidence/normal-browser.txt)
- [Preservation result](evidence/preservation.json)

To repeat the prototype checks from the repository root:

```powershell
npm run check --prefix prototype
# With the prototype server running; opens a fresh visible Chromium session:
npm run test:browser --prefix prototype
npm exec -- prettier --check "prototype/*.ts" "prototype/*.json" "prototype/*.html" "prototype/*.css" "prototype/*.md"
```

Playwright's Chromium must already be installed (`npx playwright install chromium` if needed). The browser check writes only this directory's synthetic evidence. `PROTOTYPE_URL` can override its default URL.

## Files added

All additions are under `prototype/`; no pre-existing file was edited.

| Files                                                                                | Purpose                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | Isolated dependency, development entry and checks                        |
| `simulation.ts`                                                                      | Fixture, state projections, availability and typed compatibility adapter |
| `navigation.ts`                                                                      | Footprint clearance and room navigation                                  |
| `room.ts`                                                                            | Phaser room, temporary shapes, player movement and arrival checks        |
| `main.ts`, `style.css`                                                               | Context actions, inventory, dialogue and event log                       |
| `integration.test.ts`, `browser-check.ts`                                            | Focused integration and visible UI verification                          |
| `README.md`, `licenses/`, `evidence/`                                                | Handoff, dependency notices and verification evidence                    |

## Limits and conclusion

This demonstrates comfortable basic movement and state-owned object/NPC interaction in one modern-world room. It supports continuing the graphical-adventure direction in a bounded next step.

It does not yet prove a full inventory-puzzle campaign, multi-room navigation, isometric occlusion, production artwork, character animation, touch-first interaction comfort or long-term performance. Navigation uses coarse fixed furniture footprints; NPCs use presence anchors rather than pathfinding or character collision. Other room details and existing conversation branches are not fully exposed. The narrow conversation panel closes presentation only; it does not invent a story goodbye. There is one existing safekeeping arrangement, with no new intimacy, consent, attraction, rumour or AI system. Consequences persist only in the in-memory `GameState` for this session; persistence is deliberately disabled.

The strongest result is that custody, NPC memory and agreement consequences already survive a graphical input layer. The next architectural investment would be the shared structured transaction API, followed by authored navigation/interaction anchors for one additional room—subject to the owner's next scope decision and existing holds.
