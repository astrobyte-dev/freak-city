# FREAK // CITY: executable Inform comparison

17 September 2026. Synthetic content; no campaign migration.

## Decision

**The architecture decision remains unresolved. Do not authorize a campaign migration or another open-ended parser expansion from this result.**

The precise missing evidence is: **can one reusable Inform conversation model handle question ownership, topic changes, uncertain/negative replies and ordinary follow-ups across new characters with materially less phrase-specific authoring than the current reducer?**

Inform demonstrably reduces ordinary object/custody work. It did not demonstrate a general language or conversation advantage here. Its successful supplied phrases required our grammar and context rules, and the final audit still found wrong-context dialogue and a custody error in custom refill code. Sable already demonstrates richer sourced evidence and calendar activity, but still rejects ordinary object and conversational language. Neither the existing investment nor Inform's reputation settles this question.

Browser feasibility is **not** the unresolved blocker: this exact compiled game ran locally in connected Chrome, restored a save after page reload, completed an off-screen task, and displayed a static-image overlay. Replacing the current React terminal and typed diagnostics with a production-quality VM interface remains untested work.

## What actually ran

- [Shared specification](SPEC.md), written before sample implementation.
- [Final Inform source](source/story.ni): 169 lines, compiled with Inform 7 10.1.2 and Inform 6.41 to [Glulx binary](build/story.ulx). Ran in Glulxe and bundled Quixe 2.2.1.
- First one-vessel/one-clerk source and execution: [source](evidence/one-instance.ni), [commands](evidence/one-instance-commands.json), [transcript](evidence/one-instance-transcript.txt). Only after that execution were mug and Kit added.
- Frozen two-instance initial [source](evidence/initial.ni) and [binary](evidence/initial.ulx); [verified initial results](evidence/initial-verified/results.json).
- One bounded semantic repair: [diff](evidence/repair.diff). Final [results](evidence/final-verified/results.json) and [additional audit commands](evidence/audit/commands.json). No game changes followed that audit.
- Current Sable **working-tree** reducer, schema validator and save API, imported without modification by [runner](check-sable.ts). [Results](evidence/sable-verified/results.json), per-case text transcripts and complete before/after JSON states are under `evidence/sable-verified/`. These are reducer/API checks, not new human browser playtests.
- Existing focused Sable tests also ran freshly: [107 passed](evidence/sable-existing-tests.txt). The ordinary-language failures below remain despite those passing regressions. Full repository build/visual gates were unnecessary because production was untouched.

All inputs are synthetic. The seven held-back paraphrases were authored after the first one-instance execution and initial two-instance source, and were first exercised against the frozen initial build. They are **held-back checks, not a genuinely blind human test**. One was subsequently addressed during the repair, so its final success is no longer evidence of unseen-language generalization.

## Measured behavior, defaults and custom work

**Library** means behavior provided by the installed engine/library; **declarations** instantiate/configure it; **custom** means experiment or Sable code. No optional Inform extensions were used.

| Behavior | Inform: demonstrated and origin | Unchanged Sable: demonstrated | Remaining work / failure |
|---|---|---|---|
| Rooms, counter, taking, carrying, putting objects on supporters | Library action processing, scope, containment, taking, dropping, inventory and supporter placement; rooms/entities are declarations | Evidence objects use shared custody helpers, but drinks bypass that entity model | Inform's physical-world model is the clearest reusable benefit |
| Read photograph / examine cup | Library examine with authored description; READ alias and player-inspection flag added | Photograph inspection works and records provenance; `examine cup` is rejected | Reading must explicitly create a knowledge observation in either design |
| Sip, finish, persistent empty cup | Custom vessel kind, portion rules and beverage contents; cup persists through empty/refill | Canonical `sip coffee`, `finish cup` work; empty record persists | Inform does not supply this liquid/portion simulation. Sable calls an empty coffee cup a glass in LOOK/INVENTORY |
| `take another sip of coffee` / `put down the cup` | Added grammar plus reusable action/custody rules; both work | Both rejected; cup remains carried with unchanged portions | These exact Inform phrases are authored coverage, not inferred understanding |
| Two vessels at once | Cup and mug coexist; generic taking/sipping/finishing/placement rules reused, no separate action handlers | **Gap:** single `drink` slot. Ordering tea clears/replaces the previous cup, including a carried one | Inform instance cost is a declaration plus beverage/vocabulary. Refill still hard-coded to coffee/cup |
| Clear references / ambiguity | `take cup; examine it; sip it` works via library pronouns. `take vessel` asks cup or mug; answering mug changes only mug custody | Drink pronoun/entity behavior is not unified; analogous supported evidence routing exists | Explicit noun disambiguation is stronger than arbitrary conversational “that” |
| Complaint positive/negative | Custom opinion, pending-question and grammar, including exact `dosen't` spelling | Both required complaint replies rejected, without positive commitment | Sable's visible complaint question has a supplier topic but no dedicated saved opinion/question type |
| Drink offer / acceptance | Custom offer state and exact grammar; required forms work | `ask for another drink` and `yes ill have another coffee` rejected. Canonical TALK offer + YES works after restoring it | Neither engine inferred the supplied paraphrases by default |
| Interruptions / changing topic | LOOK, INVENTORY, reading retain pending complaint; explicit ASK music then `tell me more` follows music | Music follow-up works; pending drink survives actual save API | Final Inform audit: SHOW photo does not update topic; `tell me more` wrongly discusses missing lids |
| Misplaced yes / uncertainty | Repair prevents coffee acceptance becoming a threatening opinion and vice versa. Exact uncertainty forms clarify with unchanged opinion/company | Uncertain company preserves events, time and offers; negative company distinct from offer | Inform rejected/clarifying in-world actions still advance its custom tick; this violates the desired clock policy |
| Company offer / refusal | Custom properties and grammar distinguish offer/decline; neither schedules accompaniment | Both required phrases correctly recorded with original words, observer and time | Inform only keeps latest status; Sable keeps richer history. No accompaniment implementation in either tested situation |
| SHOW versus GIVE | Library supplies separate actions; **custom** semantics inspect on show, transfer unread on give, and explicit held-object guards | Both work; sourced inspections and custody are separate | Inform's default GIVE/SHOW are not an investigation/provenance model |
| Claim versus observation | Per-clerk claim/inspection flags remain separate; second clerk's flags independent | Attributed claim record remains distinct from inspected knowledge and corroborated receipt | Inform lacks Sable's source-chain graph, timestamps, upstream observation IDs and independently corroborated evidence |
| Delayed action away / later response | Custom per-clerk deadline on a simulation tick, called from library every-turn rules. Both clerks use it; completes in Yard and reports later | Restored pending decision and multi-day follow-through complete while at home; later private report works | Three-turn ledger check is much smaller than Sable's calendar, relay, reasons, staffed periods and once-only private update |
| Save and reload | VM/interpreter SAVE/RESTORE restores custom fields, custody, deadline and pending question; executed in terminal and Chrome | Production write/read/import validation restores pending question and event chain | Inform browser reload alone starts fresh; explicit restore required in this wrapper. Cross-build saves and migrations untested |
| Images / overlay / export | Local Quixe shell with synthetic SVG overlay and a custom visible-transcript download executed | Current React UI and existing export/archive already integrated in source | Overlay is presentation only, not state-driven art. Inform export does not preserve pre-reload transcript branches |

The library's Check/Carry out/Report action structure is useful precisely because validation can be separated from mutation. Our custom rules still need to use it consistently. The refill bug below is an experiment implementation defect, **not an inherent inability of Inform to preserve custody**. [Official action-processing documentation](https://ganelson.github.io/inform-website/book/WI_12_2.html).

## Failures retained, repair bounded

Initial sample defects included bare YES/NO reaching the library's rhetorical response, explicit coffee acceptance answering the complaint instead, and container listings saying “empty” despite positive numeric portions. The repair replaced conflicting bare-answer grammar, guarded the explicit semantic replies, represented actual beverage contents, added uncertainty clarification and custody guards, and accepted the correctly spelled negative alongside the supplied typo. It did not add a broad typo-correction or natural-language system.

Core assertion results were 20/31 initially and 25/31 after repair. Sable's different case set passed 15/26 checks, with one additional second-vessel gap recorded separately. **Do not use these as engine scores:** scenarios differ; several checks establish state safety only; aggregate fragments do not establish all response semantics. The independent audit matters more than the totals.

On the same seven held-back phrase forms, initial Inform passed 1/7, final Inform 2/7, and Sable 2/7. Final Inform still rejects:

- `have another sip of coffee`
- `set the cup down`
- `what do you mean by that`
- `I cannot accompany you`
- `take coffe`

Sable accepts the held-back company refusal and safely leaves the qualified answer unresolved; it fails the other five. Inform accepts the repaired negative and safely clarifies the qualified answer. These tiny, author-written sets are diagnostic examples, not language-coverage estimates.

Important final defects and limits:

1. **Remote refill:** take cup, go north, drop cup, return south, request another drink, answer bare `yes`. The cup teleports to the counter. The specific coffee-answer action has a presence guard; the shared bare-answer path does not. [Actual transcript](evidence/audit/refill-absent.txt).
2. **Wrong follow-up:** show photograph to Rowan, then `tell me more`; the response discusses the complaint. [Actual transcript](evidence/audit/photo-followup.txt). This resembles the original class of Sable context failures despite changing engine.
3. **Time on failed/clarified actions:** attempting to take the fixed counter advances the tick; a misplaced threat answer also advances it. Inform's default turn sequence and our custom clock need a single explicit policy. [Failed action](evidence/final-verified/failed-action-time.txt), [clarification](evidence/audit/misplaced-answer-time.txt).
4. **Small state model:** one current interlocutor/topic/question, per-clerk booleans/status, no pending-question stack, bounded claims, one-shot ledger activity, no trust/revision model or general NPC planner. Second instances demonstrate rule reuse, not a finished conversation framework.
5. **No natural-language inference:** supported phrases are grammar declarations. Negated unknown actions are safely rejected; arbitrary typos and paraphrases are not corrected automatically. Safe rejection and a relevant answer are different outcomes.

Harness failures are also preserved. The first terminal invocation passed CRLF through WSL, corrupting command parsing; `one-instance-transcript-crlf-failure.txt` is excluded. A Windows executable path error caused one run against the stale one-instance binary; `harness-stale-one-instance/` is excluded. An early save path was incorrectly relative to the story directory, and weak fragment assertions falsely marked that save case successful. `initial/` retains it. The corrected `initial-verified/` and `final-verified/` runs use physical save files, reject save failures, compare the complete pre-save and restored STATE blocks, and record binary SHA-256. Compiler syntax errors are retained separately and are not counted as player-language failures.

## Verified integration versus estimates

| Area | Verified now | Work estimate / untested assumption |
|---|---|---|
| Browser runtime | Same `.ulx` executes in Chrome through local Quixe; no server-side game engine | React hosting likely modest; replacing existing terminal input, accessibility, mobile behavior and scrolling is a separate medium-sized task |
| Presentation | Static SVG overlay opens/closes around the interpreter | State-driven images need a stable VM-to-view event/snapshot interface; no such bridge implemented or benchmarked here |
| Persistence | Named browser save survives reload; CLI saves restore exact pending state | Production autosave, import/export, corruption handling, save-version policy and branch archive need design. VM saves are not drop-in replacements for validated Sable JSON |
| Diagnostics | Custom STATE command exposes facts; harness records binary hashes and outputs | Structured JSON diagnostics/provenance inspector would require a supported output/bridge contract, not parsing narrative prose |
| Testing | Headless Glulxe accepts command scripts; same binary also ran in Quixe | CI can compile/run fixtures; accessibility and cross-interpreter checks remain separate. No whole-game performance/scaling result |
| Authoring | Kinds and action rules reuse vessel and clerk behavior | Dialogue remains custom. Current content data, Zod schemas and TypeScript rules cannot be used directly as Inform story code |
| Extensions | Only bundled Basic Inform, English Language and Standard Rules used | Any conversation/graphics/JavaScript extension must be separately pinned, licensed, compiled and tested against 10.1.2. Compatibility is unverified; no promise that an old extension works |

For any proposed Inform architecture, **the Inform VM must be the sole authoritative owner of custody, simulation time, beliefs, provenance, NPC tasks and dialogue state**. React may retain settings, draft text, view preferences and a transcript archive, and render immutable VM outputs. It must not independently advance a Sable reducer or maintain authoritative copies of the same world facts. UI actions submit commands to the VM; snapshots flow outward. This bridge is a proposal, not a verified implementation.

Existing React styling, static art, content text, boundary preferences and test scenarios could remain as assets or adapters. The parser/reducer, custody mutations, event queue, source/receipt rules, save schema, actor context and most diagnostics would require a semantic port or replacement. Existing text would still need adaptation to Inform response/rule syntax. This is a substantial cost because those are game-specific systems an adventure parser does not supply, not merely because code has already been written.

Quixe officially supports browser Glulx execution and persistent named saves; our test verifies the bundled version's relevant subset. The current upstream release is newer than the bundled 2.2.1 and was **not** substituted. [Quixe documentation](https://eblong.com/zarf/glulx/quixe/). Inform's ordinary figure mechanism puts images into narrative flow; persistent arrangements need additional presentation work. Our HTML overlay bypasses that flow and proves only static-shell coexistence. [Inform figures](https://ganelson.github.io/inform-website/book/WI_23_6.html).

TADS was consulted only as a design reference. Its actor-owned TopicEntry objects, separate Show/Give/Yes/No topic types, conditional alternatives and conversation nodes suggest a reusable structure for questions and follow-ups. Its documentation also explicitly leaves the application's NPC knowledge model to the game. No TADS code was built, and no TADS capability is counted as an Inform demonstration. [TADS conversation reference](https://www.tads.org/t3doc/doc/techman/t3conv.htm).

## Bounded next implementation step — not started

Authorize a **maximum three developer-day conversation-model experiment in this directory**, using the two existing synthetic clerks and one newly declared clerk. No campaign content, new engine or production parser expansion.

Build one actor/topic/question abstraction with explicit addressee, pending question, topic-switch policy, polarity/uncertainty, and reusable follow-up selection; use the TADS design concepts without importing another runtime. Put preconditions on shared actions so bare and explicit acceptance cannot diverge. Apply a consistent no-time-on-clarification policy. Stop after one repair round.

Before implementation, freeze a small independently authored input set and record which grammar and topic declarations each new character requires. Compare authoring changes and semantic failures against the existing Sable fixtures, not against raw accepted-command totals. Success means the third clerk requires data/declarations only, all required state invariants hold, and there are no wrong-target commitments/custody changes across the agreed unseen scenarios. If this cannot be achieved within the bound, retain the TypeScript engine and invest in the same explicit dialogue model plus unified vessel entities. If it can, the next decision can weigh that measured conversation-authoring gain against the untested React/save bridge cost. This recommendation does not authorize that work automatically.

## Preservation and tool record

No applicable `AGENTS.md` was present in the repository or checked ancestors. CONTRIBUTING, Sable handoff, current source and latest exploratory/repair evidence were read. Existing dirty and untracked work was preserved. [Preservation check](evidence/preservation.json): **1,049 inventoried tracked/untracked baseline files, zero changed/missing, zero new files outside this experiment**. No root dependency/configuration edits, existing browser-save access, installs to global locations, commits, pushes, publishing or deployment.

Tool versions, sources, hashes, browser evidence and launch/replay instructions: [TOOLING.md](TOOLING.md), [README.md](README.md), [build hashes](evidence/build-hashes.json). The official [Inform site](https://ganelson.github.io/inform-website/) links to the [10.1.2 release](https://github.com/ganelson/inform/releases/tag/v10.1.2) used here; compiler invocation follows its [command-line documentation](https://ganelson.github.io/inform/inform7/M-cu.html).
