import { card, cards } from "../cards";
import type { Category, NPCId } from "../../engine/types";
export const arcPlans: Record<NPCId, [string, Category][]> = {
  mara: [
    ["Learn how Mara distinguishes useful help from supervision.", "mundane"],
    ["Remember a food preference without turning it into a clue.", "humour"],
    ["Discuss home and the practical cost of private space.", "intimacy"],
    ["Let a well-meant gesture become an unwanted rescue.", "conflict"],
    [
      "Choose between protecting an exhausted colleague and correcting an unfair shift record.",
      "pressure",
    ],
    [
      "Offer personal attention without making trust into permission.",
      "intimacy",
    ],
    ["Set an explicit expectation about a later break.", "mundane"],
    ["Return to a room changed by a staffing decision.", "conflict"],
    ["Bring back a small food memory several hours later.", "mundane"],
    [
      "Witness Mara and Luca disagree without appointing the player judge.",
      "conflict",
    ],
    ["Let the document decision alter a personal relationship.", "intimacy"],
    ["Repair the practical misunderstanding or accept distance.", "intimacy"],
    [
      "End with a bounded future invitation, not unconditional affection.",
      "mundane",
    ],
  ],
  celeste: [
    ["Let the proprietor fail at a small practical task.", "mundane"],
    ["Ask about a meal without making taste a class test.", "humour"],
    [
      "Reveal an ordinary leisure habit she dislikes having interpreted.",
      "mundane",
    ],
    [
      "Make first impressions and clothing assumptions contestable.",
      "pressure",
    ],
    [
      "Choose whether a worker gets relief at another worker’s expense.",
      "conflict",
    ],
    ["Negotiate a private social ritual with an unambiguous exit.", "intimacy"],
    ["Let a family interruption end a charged moment.", "mundane"],
    [
      "Return to Celeste after she has taken a decision without the player.",
      "pressure",
    ],
    ["Discover the human cost of a confidential financial favour.", "conflict"],
    [
      "Decline an offer without requiring Celeste to become a villain.",
      "intimacy",
    ],
    [
      "Discuss the document outcome without flattering the selected ending.",
      "conflict",
    ],
    [
      "Permit chemistry, uncertainty or a clear professional boundary.",
      "intimacy",
    ],
    [
      "Close with a specific promise the player can later hold her to.",
      "mundane",
    ],
  ],
  luca: [
    ["Make Luca useful and fallible away from his archive persona.", "humour"],
    ["Use a food disagreement to reveal how he mishears agreement.", "mundane"],
    ["Give a music preference a genuinely non-plot callback.", "intimacy"],
    ["Let Luca distribute a summary the player did not authorize.", "conflict"],
    [
      "Decide whether exposing a private benefactor serves accountability or pride.",
      "pressure",
    ],
    [
      "Share an adult social setting without presuming participation.",
      "intimacy",
    ],
    ["Set an availability expectation and allow a missed reply.", "mundane"],
    [
      "Find Luca working on a different task rather than waiting romantically.",
      "mundane",
    ],
    ["Make the ledger outcome cost something in the relationship.", "conflict"],
    [
      "Choose a correction that risks his reputation or the source’s.",
      "pressure",
    ],
    ["Distinguish an apology from a joke that avoids one.", "intimacy"],
    ["Offer company with a right to decline it.", "intimacy"],
    [
      "Return a remembered preference and leave an unfinished friendship.",
      "mundane",
    ],
  ],
  inez: [
    ["Explain Inez’s return through ordinary shift coverage.", "mundane"],
    ["Let a lost object matter without belonging to the mystery.", "humour"],
    [
      "Reveal what she listens to when she is not listening for others.",
      "mundane",
    ],
    [
      "Allow uncertainty in someone whose reputation depends on precision.",
      "conflict",
    ],
    [
      "Protect a confidence or correct a colleague’s damaging belief.",
      "pressure",
    ],
    [
      "Make home and transport a practical conversation rather than a secret.",
      "intimacy",
    ],
    [
      "Arrange a later handover without assuming friendship is availability.",
      "mundane",
    ],
    [
      "Return after Inez has independently acted on the shift problem.",
      "conflict",
    ],
    ["Bring back an ordinary object and a small admitted mistake.", "mundane"],
    [
      "Witness two adults negotiate an old resentment without resolving it for them.",
      "conflict",
    ],
    [
      "Let respect for refusal affect the warmth of a later conversation.",
      "intimacy",
    ],
    ["Accept a limited apology and refuse unwanted guardianship.", "intimacy"],
    [
      "Leave a future ordinary contact, not another mandatory mystery.",
      "mundane",
    ],
  ],
};
for (const [npc, plan] of Object.entries(arcPlans))
  plan.forEach(([purpose, pacing], i) => {
    const id = `${npc}_r${i + 1}`;
    cards[id] = card(
      purpose,
      pacing,
      [],
      {},
      {
        world:
          i < 7
            ? "After authentication, before the document decision; two companions can receive substantial time."
            : "After the document decision; selected companions have continued their own work.",
        goals: purpose,
        emotion:
          i < 7
            ? "Tired; interested in specific conduct, not universally attracted to the player."
            : "Changed by the player’s conduct and independently witnessed events.",
        hidden:
          "Other characters’ private conversations and uncommunicated player motives.",
        entry:
          i === 0
            ? "Selected as one of at most two companions."
            : i === 7
              ? "Previously selected companion; closing follow-up not yet completed."
              : `Previous ${npc} arc scene.`,
        exit:
          i === 6
            ? "Return to the next companionship decision."
            : i === 12
              ? "Return to closing handover."
              : "A choice writes memory, belief or an explicit interpersonal cost.",
        callbacks: [
          "Food or ordinary habit from an earlier scene",
          "The misunderstanding and attempted repair",
          "The document decision",
        ],
        tension: pacing === "intimacy" ? 3 : 1,
      },
    );
  });
for (const [id, purpose, pacing] of [
  [
    "late_room",
    "Let Velvet change after the first departures; offer time with a person.",
    "mundane",
  ],
  [
    "late_second",
    "Choose a second companion and relinquish the other full arcs.",
    "pressure",
  ],
  [
    "late_table",
    "Witness the leads’ ordinary disagreement after time apart.",
    "humour",
  ],
  [
    "late_accounts",
    "Separate a relationship promise from the evidence decision.",
    "conflict",
  ],
  [
    "closing_room",
    "Return to selected companions after the document decision.",
    "mundane",
  ],
  [
    "closing_second",
    "Make the final promised conversation possible; others have made plans.",
    "pressure",
  ],
  [
    "closing_table",
    "Let different pairs and different choices produce different goodbyes.",
    "intimacy",
  ],
  [
    "home_callback",
    "Give a mundane detail one final return before reflection.",
    "mundane",
  ],
] as [string, string, Category][])
  cards[id] = card(
    purpose,
    pacing,
    [],
    {},
    {
      goals: purpose,
      world:
        "Velvet Quarter only; a long single night, with commitments rather than a completionist checklist.",
      hidden: "Unwitnessed motives of people the player did not choose.",
      exit: "A player-selected companion or the next existing story beat.",
      callbacks: [
        "First and second companionship choice",
        "Missed messages and completed promises",
      ],
    },
  );
