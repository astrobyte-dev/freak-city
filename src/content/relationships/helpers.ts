import "./cards";
import type { NPCId, Passage, Scene, Choice, Effect } from "../../engine/types";
import { p, s, say, c, flag } from "../scenes/helpers";
export {
  p,
  say,
  c,
  flag,
  rel,
  mem,
  moral,
  pull,
  engage,
  dim,
  msg,
} from "../scenes/helpers";
const speakers: Record<string, NPCId> = {
  M: "mara",
  C: "celeste",
  L: "luca",
  I: "inez",
};
export function prose(text: string): Passage[] {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((t) => {
      const who = speakers[t.slice(0, 1)];
      return who && t[1] === ":" ? say(who, t.slice(2).trim()) : p(t.trim());
    });
}
export function arc(
  npc: NPCId,
  n: number,
  title: string,
  text: string,
  choices: Choice[],
  extra: Partial<Scene> = {},
): Scene {
  return s(
    `${npc}_r${n}`,
    title,
    npc === "inez" ? "street" : "velvet",
    `${npc.toUpperCase()} / ${n < 8 ? "AFTER HOURS" : "CLOSING TIME"}`,
    prose(text),
    choices,
    {
      ...extra,
      onEnter: [
        {
          type: "presence",
          npc,
          location:
            npc === "inez"
              ? "door"
              : npc === "celeste"
                ? "office"
                : npc === "mara"
                  ? "kitchen"
                  : "main room",
        },
        ...(extra.onEnter ?? []),
      ],
    },
  );
}
export const next = (npc: NPCId, n: number) => `${npc}_r${n + 1}`;
export const belief = (
  npc: NPCId,
  key: string,
  value: string,
  source: string,
): Effect => ({ type: "belief", npc, key, value, source });
export const later = (
  id: string,
  delay: number,
  effects: Effect[],
): Effect => ({ type: "schedule", id, delay, effects });
export const finish = (npc: NPCId): Choice[] => [
  c("keep_company", "Return to the room.", "late_second", 3, [
    flag(`${npc}_firstDone`),
  ]),
  c("make_space", "Take a quiet minute before going back.", "late_second", 5, [
    flag(`${npc}_firstDone`),
    { type: "dimension", key: "composure", amount: 5 },
  ]),
];
export const close = (npc: NPCId): Choice[] => [
  c("finish_talk", "Let the conversation end here.", "closing_second", 3, [
    flag(`${npc}_closed`),
  ]),
  c("thanks_talk", "Thank them for the time.", "closing_second", 4, [
    flag(`${npc}_closed`),
    {
      type: "memory",
      npc,
      key: "goodbye",
      value: "Thanked me for the time without asking for more",
    },
  ]),
];
