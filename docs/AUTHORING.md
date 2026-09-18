# Narrative production and expansion

## Visual authoring

Use [art contracts](art-contracts/README.md) and the [provider-neutral pipeline](PROVIDER-NEUTRAL-ART-PIPELINE.md). Canonical art accepts manual, local, hosted or external sources with the same review gates. Preserve editable PNGs and provenance; no original model or assistant memory is required. [Optional ComfyUI workflow](COMFYUI-VISUAL-WORKFLOW.md).

## Pipeline

1. Update the story bible. Separate immutable rules from a curated seed variation.
2. Update the character and voice bibles. State agenda, boundaries, memories and knowledge before drafting dialogue.
3. Draw the branch in the scene map. Name its entry, exit and mutually exclusive costs.
4. Add the scene card in `src/content/cards.ts`: purpose, current state, player/NPC knowledge, NPC beliefs and goals, hidden information, permitted/forbidden revelations, approaches, consequences, tension, pacing, conditions and callbacks.
5. Draft only that scene using the helpers in `src/content/scenes/helpers.ts`.
6. Read the dialogue without speaker labels. Revise lines that can easily move between characters. Include ordinary conversational friction; do not make every response an insight.
7. Check continuity: who can know each fact, how much time has passed, which object is present, and whether a person has already departed.
8. Make a hostile editorial pass. Cut redundant explanations; test whether each choice causes something beyond alternate wording. Document unresolved issues rather than praising a first draft.
9. Run build, QA and a relevant simulated route. Test both entry and non-entry. Test all boundaries skipped, implied-only, low trust, wrong seed and missing items.
10. Browser-play the edited route, then revise its ending/callbacks if the intended consequence is invisible.

The scene registry is divided into opening, encounters, consequences, endings and additional investigations. Splitting a group into more files does not require a UI change. `cards.ts` is deliberately separate so the production contract is reviewable before the prose.

## Add a scene

Add a card first. Then add a `Scene` to one of the registered groups:

```ts
s(
  "returned_letter",
  "The letter\nyou sent back.",
  "velvet",
  "INEZ / LOST PROPERTY",
  [
    say("inez", "You returned it unopened. Thank you.", {
      when: { memory: "inez", key: "register" },
    }),
    p("She puts the repaired bag on the shelf."),
  ],
  [
    c("leave_letter", "Leave her to her shift.", "floor", 2, [
      mem("inez", "returnedLetter", "Returned the misdelivered letter"),
      rel("inez", 1),
    ]),
  ],
);
```

Add an incoming choice. A hidden prerequisite normally hides the choice; `lockedText` keeps a closed route visible with a reason. Every non-ending must have an escape or equivalent route. Core evidence cannot depend on a romance/theme setting.

Themed passages must provide all three renderings:

```ts
p("A guest returns the collar with the membership token.", {
  theme: "symbolicOwnership",
  implied: "A guest returns the symbols of membership.",
  safe: "A guest checks out at the desk.",
});
```

These classify non-graphic authored material. A themed choice is available only under Allowed. To support Implied Only, offer a separate non-themed or summary route. Do not place excluded theme text in an untagged narration, item or delayed message.

## Add an NPC

1. Add the ID to `npcIds` in `engine/types.ts`. The NPC schema and base initialization derive from this roster.
2. Add the public character entry to `content/world.ts` (adult age, name, role, initials and description). The people panel derives from that registry.
3. Add full character/voice bibles, including genuinely useful bad conversational habits.
4. Assign only legitimate starting knowledge and beliefs in initialization. The existing base grants `header` for the four original staff/insiders; revise that default before adding a character who could not know it.
5. Set any initial NPC relationship matrix entries. Use sorted pair IDs or the `npcRelationship` effect.
6. Create a first scene with an ordinary need as well as an agenda. Add their ID to compatible thematic entries only where their integrity supports it.
7. Test a route that meets them and one that misses them. Verify they cannot report a private player decision they did not witness.

No JSX dialogue edits are needed. Character portraits can begin as abstract silhouettes. An authored portrait must be non-explicit and respect any relevant content boundaries.

## Add a mature-theme subcategory

For example, classify gloves as fashion and personal presentation, while keeping consent and personality grounded in the character to their wearer:

```ts
{
  id: 'fashion.gloves.formal',
  name: 'Gloves as formal presentation',
  theme: 'fetishFashion',
  context: 'social presentation, explicit permission for personal interaction',
  orientation: 'observe',
  privacy: 'either',
  trust: 0,
  compatible: ['celeste'],
  observation: 'She takes off her gloves before reading the receipt.',
  contrast: 'The gloves have been borrowed to carry a broken light bulb.',
}
```

Add this object to `taxonomy.ts`. The engagement profile and reflection UI derive from the registry. Associate an authored choice with `engage('fashion.gloves.formal', 'explore')`, `avoid` or `uncertain`. The helper records an explicit thematic response in its narrative context. The parent boundary remains authoritative. New top-level themes also need a boundary enum/schema/default and UI label; adding a subcategory under an existing theme does not.

Use contextual subdivisions rather than a Boolean for a broad adult concept. Do not auto-escalate intensity, reinterpret refusal as interest or override character compatibility. A field being available in the taxonomy does not authorize unreviewed runtime content.

## Add a delayed consequence

```ts
{
  type: 'schedule',
  id: 'inez-reports-returned-letter',
  delay: 12,
  effects: [
    {
      type: 'belief',
      npc: 'luca',
      key: 'returnedLetter',
      value: 'The player returned the letter without publishing it.',
      source: 'Inez directly told Luca after her shift',
    },
    {
      type: 'message',
      from: 'Luca',
      text: 'inez told me about the letter. thanks for asking first.',
    },
  ],
}
```

Use stable event IDs for exactly-once delivery. The same ID cannot be scheduled again after firing. For repeats, use distinct occurrence IDs and a deliberate design, not wall-clock randomness. Test one minute before and exactly at the deadline, large time jumps, cancellation and save restoration. Belief propagation must name a plausible source; it is not a global flag broadcast.

## Add a seed variant

Extend the variant union and `variants` registry, update the deterministic selection table in `newGame`, and define the sender, motive, intended recipient, physical proof, legitimate knowledge and compatible secret. Add matching scene conditions and a distinct investigation consequence. Never combine secrets with an unconstrained random picker.

Changing the selection table changes the mapping of existing seeds. Treat that as a save-version/migration decision. Provide a test fixture for each variant, verify the same input remains reproducible, and reject a save whose objective truth disagrees with its mapping.

Current fixtures: `NIGHT-0` (carbon), `NIGHT-1` (dead letter), `NIGHT-2` (proxy). Tests also sample many arbitrary seeds rather than assuming fixture names determine the result.

## Conditions and knowledge annotations

Conditions support flags, player facts, items, relationships, composure, time, explicit theme allowance, thematic interest, NPC memories, NPC beliefs, traits, negation and conjunction. Write the smallest condition that represents actual causality. Do not use a global secret flag as a substitute for a character knowing that secret.

Use `reveals: ['factId']` on a passage that gives the player a factual statement. Its scene card must permit that revelation. A speaking NPC must have the fact in their own knowledge set or the simulation rejects the transition. Use unverified belief/rumour wording when a character is mistaken. Automated annotations do not understand arbitrary prose: the continuity pass must still look for unannotated leaks.

## Debugging a distant callback

Open the development inspector with Ctrl+Shift+D. Find the choice in `history`, inspect its serialized effects, then locate the event ID in `events`. Inspect recipient memory/belief timestamps and their `source` fields. Finally inspect the destination condition and scene card. This yields a traceable chain from choice to consequence without reconstructing every earlier conversation manually.
