import type { Passage } from "../engine/types";

/** Parser presentation edits only. The original 117-scene manuscript stays intact.
 * Small reciprocal questions remain conversation texture; custody, disclosures,
 * movement and consequential assent must follow an explicit player command. */
export const embodimentEdits: Record<string, [string, string][]> = {
  door: [
    [
      "She notices the invitation when you turn your phone around. Stops pressing the tape.",
      "Her attention moves between the arrivals book and the doorway. The tape sticks to her thumb.",
    ],
    [
      "That says delivery. Not printing.",
      "If yours is a delivery, keep its timestamp. Printing and delivery aren't the same thing.",
    ],
    [
      "Her finger taps 23:41 once. She returns to the bag, but she has lost her place.",
      "She taps the book once, then returns to the bag.",
    ],
  ],
  mara: [
    [
      "You keep hold of it while she reads the invitation. She does not ask to touch the screen.",
      "She leaves room on the dry end of the counter. She does not ask to touch your phone.",
    ],
  ],
  kitchen: [
    [
      "Mara takes you through a door marked DRY STORE.",
      "The door is marked DRY STORE.",
    ],
    [
      "You find the eighth under your shoe. She takes it with an expression of disproportionate relief.",
      "The eighth screw glints under the table. Mara retrieves it with an expression of disproportionate relief.",
    ],
    [
      "Thank you. Honestly. I was going to have to move the fridge.",
      "There it is. Honestly. I thought I was going to have to move the fridge.",
    ],
    [
      "For a little while the only decisions are whether to use the salt and which of you should hold the casing steady.",
      "The chips and the loose fan casing leave two modest possibilities open.",
    ],
    [
      "The fan starts. Both of you stop talking to hear whether it will stay started.",
      "She checks the fan's loose casing, then leaves it waiting for another pair of hands.",
    ],
  ],
  quiet: [
    [
      "You sit close enough to hear her over the noise from the hall.",
      "The empty chair is close enough for conversation over the noise from the hall.",
    ],
  ],
  celeste: [
    [
      "You tell her that it was not.",
      "She lets the question stand without supplying your answer.",
    ],
  ],
  sender: [
    [
      "You put the routing record on the table.",
      "The routing record gives you something specific to ask about.",
    ],
  ],
  street: [
    [
      "You take a photograph anyway. The corner of the frame catches a clock above the shutter.",
      "The clock above the shutter would fit into a photograph of the ramp.",
    ],
  ],
  listening: [
    [
      "You take them. The first sound is someone opening a window.",
      "He holds one earcup outward; the first audible sound is someone opening a window.",
    ],
  ],
  source_call: [
    ["You put your phone away.", "They wait for an answer about recording."],
  ],
  confession: [
    [
      "You tell him that is fair.",
      "He waits to see whether you think that is fair.",
    ],
  ],
  mara_r4: [
    [
      "You haven't touched anything. You tell her that.",
      "You haven't touched anything. She notices that herself.",
    ],
  ],
  mara_r6: [
    [
      "Mara takes the bins to the service door. You follow with the smaller bag because she actually asks.",
      "Mara leaves the bins beside the service door. A smaller bag is tied and ready beside them.",
    ],
  ],
  mara_r8: [
    [
      "You put it on the hook she points to. The remembered routine is small but immediate.",
      "She points to the hook. The remembered routine is small but immediate.",
    ],
  ],
  mara_r9: [
    [
      "You tell her about a thing in your apartment that does something equally pointless. The comparison becomes an argument over which machine is more irritating, then wanders into stories about landlords who answer the wrong question.",
      "She invites a comparison from your apartment, then complains about landlords who answer the wrong question.",
    ],
  ],
  mara_r12: [
    [
      "You tell her what the moment felt like. She listens, asks one question, then admits she had heard a different intention.",
      "She asks what the moment felt like to you, then admits she may have heard a different intention.",
    ],
  ],
  celeste_r12: [
    [
      "When you hand back the glasses, your fingers do not quite meet. The gap is brief and noticeable. She puts them in their case, shuts it, and gives you time to choose an answer that belongs to you.",
      "She opens the glasses case and gives you time to choose an answer that belongs to you.",
    ],
  ],
  luca_r2: [
    [
      "You tell him what you want. He begins to hand you the wrong sandwich, catches himself, and asks you to repeat it.",
      "He begins to offer a sandwich, catches himself, and asks what you would prefer.",
    ],
  ],
  luca_r3: [
    [
      "He seems grateful when you give him something ordinary to remember.",
      "He seems willing to remember something ordinary, if you choose to tell him.",
    ],
  ],
  luca_r4: [
    [
      "You tell him the member heard a commitment.",
      "He seems to hear the commitment in his own account.",
    ],
  ],
  inez_r1: [
    [
      "She gives you a chair that seems to have been designed to discourage conversation. You sit anyway.",
      "She offers a chair that seems to have been designed to discourage conversation. It is there if you want it.",
    ],
  ],
  inez_r2: [
    [
      "You move the mitten where its owner might actually see it.",
      "The mitten is still in the box, waiting for a decision about where its owner might see it.",
    ],
  ],
  inez_r11: [
    ["You tell her you know where you live.", "She waits for your answer."],
  ],
  inez_r12: [
    [
      "You hand over the cup if it is still on the ledge. The sister puts it into the bag with more care than its appearance seems to warrant.",
      "The sister retrieves the cup from the ledge and puts it into the bag with more care than its appearance seems to warrant.",
    ],
  ],
  late_accounts: [
    [
      "You sit at the clear table, read the terms again and let the decision become yours.",
      "The clear table leaves space to read the terms again before deciding.",
    ],
  ],
};
export function parserPassages(scene: string, passages: Passage[]): Passage[] {
  return passages.map((p) => {
    let text = p.text;
    for (const [before, after] of embodimentEdits[scene] ?? [])
      text = text.replace(before, after);
    const result = { ...p, text };
    if (scene === "door" && p.reveals?.includes("header")) result.reveals = [];
    return result;
  });
}
