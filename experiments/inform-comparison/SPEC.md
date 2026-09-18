# Engine-neutral comparison contract (written before implementation)

Synthetic setting: Test Cafe and Yard; clerk Rowan; later clerk Kit. These are evaluation fixtures, not FREAK // CITY canon.

1. A fixed counter supports a portable cup with three portions of coffee and a readable photograph. Taking changes custody, examining describes contents, sipping removes one portion, finishing removes all portions, and putting down moves the same vessel to the room. Empty vessels persist. Adding a mug of tea must reuse those rules, permit both vessels to coexist, and clarify ambiguous references.
2. Rowan asks whether a supplier complaint sounds threatening. A negative response, including `no it dosen't sound threatening`, records a negative opinion; `yes very threatening` records a positive opinion. Uncertainty must not become agreement. Inspection/inventory interrupts without answering. A topic change supersedes the immediate question; `tell me more` follows the current subject. Asking for another drink opens an offer; `yes ill have another coffee` accepts only a relevant offer.
3. Show photograph: recipient inspects, player retains custody. Give photograph: recipient gains custody, no automatic inspection. A spoken claim has an attributed claim record, not an observation. Read photograph establishes only player inspection. Repeated inspection must not create duplicate facts. Kit uses the same custody/inspection rules but has independent knowledge.
4. Request a clerk to check a ledger. Completion occurs after three successful timed actions even in another location; later asking about the ledger reports completion, never prematurely. Looking, inventory and diagnostics are untimed in the desired contract. Unsupported/ambiguous text should not advance time. An offer `I could come with you` is an offer only; `I can't come with you` declines; uncertain company clarifies. Neither changes the clerk's independent task.
5. Save while a question and a ledger check are pending. Change state, restore, verify pending context and deadline return; continue away and receive the completed report once appropriate. No wall-clock advancement. Persistence belongs exclusively to the isolated sample.
6. Required language probes also include `take another sip of coffee`, `put down the cup`, `ask for another drink`, and `tell me more`. Run canonical commands as controls. Record output AND state; parser recognition alone is insufficient.

## Method and bounds

Build first with one vessel/person, compile and run smoke checks, then add second instances. Freeze that initial build and failures before one bounded repair round. Hold back a small paraphrase file until the initial build executes; these are author-created held-back checks, not a blind human test. Stop phrase tuning after the repair round and report remaining failures.

Run existing Sable through its actual reducer and validated save API with supported analogous situations (Sable/Vesper and photograph/listing). Do not transplant synthetic story into production. Explicitly mark differences: Sable's richer calendar/provenance and Inform's small three-turn timer are not equivalent amounts of simulation. Report absent second-vessel support as a gap, not a failed command implementation.

Distinguish standard library defaults, authored declarations, custom rules, and unimplemented behavior. Keep measured behavior separate from migration estimates. Inform VM would own ALL world facts in an Inform architecture; React would only render outputs/send commands. No mirrored authoritative custody, clock or beliefs.
