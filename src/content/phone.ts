import type { Effect } from "../engine/types";
interface Reply {
  id: string;
  text: string;
  effects: Effect[];
}
interface Thread {
  from: string;
  options: Reply[];
}
export const phoneReplies: Record<string, Thread> = Object.fromEntries(
  (
    [
      [
        "mara",
        "MARA",
        "mara-break",
        "I will look for you before I leave.",
        "I need to finish something else. Please take your break.",
        "I will be near the kitchen if I am still here. Please don’t rush someone else for me.",
      ],
      [
        "celeste",
        "CELESTE",
        "celeste-later",
        "I would like to finish our conversation.",
        "Let’s leave the rest for another day.",
        "Understood. I have a call to finish first. An invitation can survive a delay.",
      ],
      [
        "luca",
        "LUCA",
        "luca-later",
        "I would like to talk again after this.",
        "I need a quiet end to the night.",
        "Thanks for saying what you actually have time for. I am still sorting the keys.",
      ],
      [
        "inez",
        "INEZ",
        "inez-check",
        "A later check-in would be welcome.",
        "I would prefer to leave travel private.",
        "Understood. I will keep to the arrangement you asked for.",
      ],
    ] as const
  ).map(([npc, from, key, yes, no, answer]) => [
    key,
    {
      from,
      options: [
        {
          id: "yes",
          text: yes,
          effects: [
            { type: "flag", key: `${npc}PhoneReply`, value: "yes" },
            { type: "memory", npc, key: "phoneReply", value: yes },
            {
              type: "schedule",
              id: `${key}-answer`,
              delay: 14,
              effects: [{ type: "message", from, text: answer }],
            },
          ],
        },
        {
          id: "later",
          text: no,
          effects: [
            { type: "flag", key: `${npc}PhoneReply`, value: "later" },
            { type: "memory", npc, key: "phoneReply", value: no },
            {
              type: "schedule",
              id: `${key}-answer`,
              delay: 14,
              effects: [
                {
                  type: "message",
                  from,
                  text: "Thank you for telling me. No explanation needed; leave the conversation here for tonight.",
                },
              ],
            },
          ],
        },
      ],
    },
  ]),
);
