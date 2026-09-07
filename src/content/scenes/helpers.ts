import type {
  Scene,
  Passage,
  Choice,
  Effect,
  NPCId,
  Condition,
} from "../../engine/types";
import { cards } from "../cards";
export const p = (text: string, extra: Partial<Passage> = {}): Passage => ({
  text,
  ...extra,
});
export const say = (
  speaker: NPCId,
  text: string,
  extra: Partial<Passage> = {},
): Passage => p(text, { speaker, ...extra });
export const flag = (key: string, value: boolean | string = true): Effect => ({
  type: "flag",
  key,
  value,
});
export const rel = (
  npc: NPCId,
  amount: number,
  axis: "trust" | "affinity" | "suspicion" = "trust",
): Effect => ({ type: "relationship", npc, axis, amount });
export const mem = (npc: NPCId, key: string, value: string): Effect => ({
  type: "memory",
  npc,
  key,
  value,
});
export const moral = (key: string, amount = 1): Effect => ({
  type: "moral",
  key,
  amount,
});
export const pull = (
  key:
    "curiosity" | "candour" | "privacy" | "defiance" | "connection" | "ritual",
  amount = 1,
): Effect => ({ type: "pull", key, amount });
export const engage = (
  key: string,
  response: "explore" | "avoid" | "uncertain" = "explore",
): Effect => ({
  type: "engagement",
  key,
  response,
  context: "authored choice",
});
export const item = (id: string): Effect => ({ type: "item", id });
export const dim = (
  key: "heat" | "composure" | "nerve",
  amount: number,
): Effect => ({ type: "dimension", key, amount });
export const msg = (from: string, text: string): Effect => ({
  type: "message",
  from,
  text,
});
export const know = (fact: string, source: string): Effect => ({
  type: "knowledge",
  who: "player",
  fact,
  source,
});
export const c = (
  id: string,
  label: string,
  to: string,
  minutes = 2,
  effects: Effect[] = [],
  extra: Partial<Choice> = {},
): Choice => ({ id, label, to, minutes, effects, ...extra });
export const unseen = (key: string): Condition => ({ not: { flag: key } });
export const s = (
  id: string,
  title: string,
  location: Scene["location"],
  kicker: string,
  passages: Passage[],
  choices: Choice[],
  extra: Partial<Scene> = {},
): Scene => ({
  id,
  title,
  location,
  kicker,
  chapter: "01 / THE CARBON COPY",
  category: cards[id].pacing,
  card: cards[id],
  passages,
  choices,
  ...extra,
});
