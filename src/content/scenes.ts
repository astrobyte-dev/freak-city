import type { Scene } from "../engine/types";
import { openingScenes } from "./scenes/opening";
import { encountersScenes } from "./scenes/encounters";
import { consequencesScenes } from "./scenes/consequences";
import { endingsScenes } from "./scenes/endings";
import { additionalScenes } from "./scenes/additional";
import { maraArc } from "./relationships/mara";
import { celesteArc } from "./relationships/celeste";
import { lucaArc } from "./relationships/luca";
import { inezArc } from "./relationships/inez";
import { relationshipShared } from "./relationships/shared";
import { c, flag, p } from "./scenes/helpers";
export const scenes: Record<string, Scene> = Object.fromEntries(
  [
    ...openingScenes,
    ...encountersScenes,
    ...consequencesScenes,
    ...endingsScenes,
    ...additionalScenes,
    ...maraArc,
    ...celesteArc,
    ...lucaArc,
    ...inezArc,
    ...relationshipShared,
  ].map((s) => [s.id, s]),
);

// Add bridges without changing historical choice destinations in existing saves.
scenes.ledger.choices.unshift(
  c(
    "take_time",
    "Spend time with the people behind the decision.",
    "late_room",
    3,
    [],
    { when: { not: { flag: "lateExpanded" } } },
  ),
);
scenes.walk.choices.unshift(
  c(
    "keep_promises",
    "Return for the conversations you left unfinished.",
    "closing_room",
    4,
    [],
    {
      when: {
        all: [{ flag: "lateExpanded" }, { not: { flag: "closingComplete" } }],
      },
    },
  ),
);
scenes.walk.passages.unshift(
  p(
    "You have reached the doorway, not yet begun the walk. There is still time to return to the people you spent time with.",
    {
      when: {
        all: [{ flag: "lateExpanded" }, { not: { flag: "closingComplete" } }],
      },
    },
  ),
);
scenes.apartment.choices.unshift(
  c(
    "settle_home",
    "Let the ordinary details of the night catch up.",
    "home_callback",
    5,
    [flag("homeReturned")],
    { when: { flag: "lateExpanded" } },
  ),
);
for (const [npc, key, text] of [
  [
    "mara",
    "mara-break",
    "I should get a break later. Are you hoping to talk again, or should I make other plans?",
  ],
  [
    "celeste",
    "celeste-later",
    "I enjoyed having a conversation without an agenda for a few minutes. We can finish it later if time allows.",
  ],
  [
    "luca",
    "luca-later",
    "Back near the keys when you are done. A message, not a booking. I am learning.",
  ],
  [
    "inez",
    "inez-check",
    "Would you welcome one later check-in? Leaving your travel private is fine too.",
  ],
]) {
  scenes[`${npc}_r7`].onEnter ??= [];
  scenes[`${npc}_r7`].onEnter!.push({
    type: "schedule",
    id: `${npc}-phone-invite`,
    delay: 8,
    effects: [
      { type: "message", from: npc.toUpperCase(), text, replyKey: key },
    ],
  });
  scenes[`${npc}_r8`].passages.unshift(
    p(
      "Your earlier message is acknowledged without making you explain the delay. The conversation can begin from where you both are now.",
      { when: { flag: `${npc}PhoneReply`, value: "yes" } },
    ),
  );
  scenes[`${npc}_r8`].passages.unshift(
    p(
      "They remember that you asked to leave the conversation for another day. You check whether a brief return is welcome before sitting; they agree to that much.",
      { when: { flag: `${npc}PhoneReply`, value: "later" } },
    ),
  );
}
scenes.late_table.onEnter!.push({
  type: "message",
  from: "VELVET DESK",
  text: "The side entrance will be locked at closing. Use the lit front door when you leave.",
  attachment: "velvetExterior",
});
scenes.luca_r8.onEnter ??= [];
scenes.luca_r8.onEnter.push({
  type: "message",
  from: "LUCA",
  format: "voice",
  text: "There are now labels on all the keys. One label says UNKNOWN, which I maintain is progress. I am leaving the recorder here; the rest of tonight can remain a conversation.",
});

for (const passage of scenes.walk.passages.slice(1)) {
  const old = passage.when;
  passage.when = {
    all: [
      {
        not: {
          all: [{ flag: "lateExpanded" }, { not: { flag: "closingComplete" } }],
        },
      },
      ...(old ? [old] : []),
    ],
  };
}
scenes.celeste_r6.passages.push(
  p(
    "“I wanted your company,” she says. The admission changes the silence at the little table. She holds your gaze, then leaves you room to decide whether to move your chair closer.",
    {
      theme: "romance",
      implied:
        "She makes the personal invitation clear and leaves you room to answer.",
      safe: "She puts the work aside for the time she offered.",
    },
  ),
);
