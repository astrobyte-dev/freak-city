import { z } from "zod";
import { worldSchema } from "./world-types";
export const npcIds = ["mara", "celeste", "luca", "inez"] as const;
export type NPCId = (typeof npcIds)[number];
export const themes = [
  "romance",
  "socialPressure",
  "surveillance",
  "substanceUse",
  "powerExchange",
  "restraint",
  "symbolicOwnership",
  "performance",
  "fetishFashion",
  "humiliation",
  "aftercare",
] as const;
export type Theme = (typeof themes)[number];
export type Boundary = "allowed" | "implied" | "skip";
export const interests = [
  "curiosity",
  "candour",
  "privacy",
  "defiance",
  "connection",
  "ritual",
] as const;
export type Interest = (typeof interests)[number];
export type Category =
  | "mundane"
  | "mystery"
  | "humour"
  | "conflict"
  | "intimacy"
  | "investigation"
  | "pressure"
  | "unease";
export type Condition =
  | { flag: string; value?: boolean | string }
  | { fact: string }
  | { item: string }
  | { npc: NPCId; trust: number }
  | { before: number }
  | { after: number }
  | { composure: number }
  | { theme: Theme }
  | { interest: string; minimum: number }
  | { memory: NPCId; key: string; value?: string }
  | { belief: NPCId; key: string; value: string }
  | { trait: string }
  | { not: Condition }
  | { all: Condition[] };
export type Effect =
  | { type: "presence"; npc: NPCId; location: string }
  | { type: "when"; condition: Condition; then: Effect[]; otherwise?: Effect[] }
  | { type: "flag"; key: string; value: boolean | string }
  | { type: "dimension"; key: "heat" | "composure" | "nerve"; amount: number }
  | { type: "memory"; npc: NPCId; key: string; value: string }
  | { type: "belief"; npc: NPCId; key: string; value: string; source: string }
  | {
      type: "relationship";
      npc: NPCId;
      axis: "trust" | "affinity" | "suspicion";
      amount: number;
    }
  | {
      type: "npcRelationship";
      a: NPCId;
      b: NPCId;
      axis: "trust" | "affinity" | "suspicion";
      amount: number;
    }
  | { type: "knowledge"; who: "player" | NPCId; fact: string; source: string }
  | { type: "rumour"; id: string; text: string; faction: string }
  | { type: "faction"; id: string; amount: number }
  | { type: "schedule"; id: string; delay: number; effects: Effect[] }
  | { type: "cancel"; id: string }
  | {
      type: "message";
      from: string;
      text: string;
      theme?: Theme;
      fallback?: string;
      replyKey?: string;
      format?: "text" | "voice";
      attachment?: "velvetExterior";
    }
  | { type: "item"; id: string; remove?: boolean }
  | { type: "trait"; id: string; remove?: boolean }
  | { type: "moral"; key: string; amount: number }
  | { type: "pull"; key: Interest; amount: number }
  | { type: "attractor"; key: string; amount: number }
  | {
      type: "engagement";
      key: string;
      response: "explore" | "avoid" | "uncertain";
      context: string;
    }
  | { type: "lock" | "unlock"; scene: string };
export interface Passage {
  kind?: "world" | "speech" | "phone" | "system";
  from?: string;
  text: string;
  speaker?: NPCId;
  when?: Condition;
  theme?: Theme;
  implied?: string;
  safe?: string;
  reveals?: string[];
}
export interface Choice {
  id: string;
  label: string;
  hint?: string;
  to: string;
  minutes: number;
  effects?: Effect[];
  when?: Condition;
  theme?: Theme;
  lockedText?: string;
  approach?: "honest" | "reckless" | "curious" | "guarded" | "neutral";
}
export interface SceneCard {
  purpose: string;
  world: string;
  playerKnowledge: string[];
  npcKnowledge: Partial<Record<NPCId, string[]>>;
  npcBeliefs: Partial<Record<NPCId, string>>;
  goals: string;
  emotion: string;
  hidden: string;
  mayReveal: string[];
  mustNotReveal: string[];
  approaches: string[];
  consequences: string[];
  tension: number;
  pacing: Category;
  entry: string;
  exit: string;
  callbacks: string[];
}
export interface Scene {
  boundaryGate?: { themes: Theme[]; summary: string; exit: string };
  id: string;
  chapter: string;
  title: string;
  location: "taxi" | "street" | "velvet" | "upstairs" | "apartment" | "motel";
  category: Category;
  kicker: string;
  passages: Passage[];
  choices: Choice[];
  card: SceneCard;
  ending?: boolean;
  onEnter?: Effect[];
}
const relationshipSchema = z.object({
  trust: z.number(),
  affinity: z.number(),
  suspicion: z.number(),
});
const npcSchema = z.object({
  memories: z.record(z.object({ value: z.string(), at: z.number() })),
  beliefs: z.record(
    z.object({ value: z.string(), source: z.string(), at: z.number() }),
  ),
  knowledge: z.array(z.string()),
  relationship: relationshipSchema,
  location: z.string(),
});
const pullEntry = z.object({
  interest: z.number(),
  certainty: z.number(),
  resistance: z.number(),
  familiarity: z.number(),
  saturation: z.number(),
  lastShown: z.number(),
  lastContext: z.string(),
  neverGenerate: z.boolean(),
});
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({
      flag: z.string(),
      value: z.union([z.boolean(), z.string()]).optional(),
    }),
    z.object({ fact: z.string() }),
    z.object({ item: z.string() }),
    z.object({ npc: z.enum(npcIds), trust: z.number().finite() }),
    z.object({ before: z.number().finite() }),
    z.object({ after: z.number().finite() }),
    z.object({ composure: z.number().finite() }),
    z.object({ theme: z.enum(themes) }),
    z.object({ interest: z.string(), minimum: z.number().finite() }),
    z.object({
      memory: z.enum(npcIds),
      key: z.string(),
      value: z.string().optional(),
    }),
    z.object({ belief: z.enum(npcIds), key: z.string(), value: z.string() }),
    z.object({ trait: z.string() }),
    z.object({ not: conditionSchema }),
    z.object({ all: z.array(conditionSchema) }),
  ]),
);

// Effects are validated recursively on save import; unknown discriminators fail closed.
export const effectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("presence"),
      npc: z.enum(npcIds),
      location: z.string(),
    }),
    z.object({
      type: z.literal("when"),
      condition: conditionSchema,
      then: z.array(effectSchema),
      otherwise: z.array(effectSchema).optional(),
    }),
    z.object({
      type: z.literal("flag"),
      key: z.string(),
      value: z.union([z.boolean(), z.string()]),
    }),
    z.object({
      type: z.literal("dimension"),
      key: z.enum(["heat", "composure", "nerve"]),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("memory"),
      npc: z.enum(npcIds),
      key: z.string(),
      value: z.string(),
    }),
    z.object({
      type: z.literal("belief"),
      npc: z.enum(npcIds),
      key: z.string(),
      value: z.string(),
      source: z.string(),
    }),
    z.object({
      type: z.literal("relationship"),
      npc: z.enum(npcIds),
      axis: z.enum(["trust", "affinity", "suspicion"]),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("npcRelationship"),
      a: z.enum(npcIds),
      b: z.enum(npcIds),
      axis: z.enum(["trust", "affinity", "suspicion"]),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("knowledge"),
      who: z.enum(["player", ...npcIds]),
      fact: z.string(),
      source: z.string(),
    }),
    z.object({
      type: z.literal("rumour"),
      id: z.string(),
      text: z.string(),
      faction: z.string(),
    }),
    z.object({
      type: z.literal("faction"),
      id: z.string(),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("schedule"),
      id: z.string(),
      delay: z.number().nonnegative(),
      effects: z.array(effectSchema),
    }),
    z.object({ type: z.literal("cancel"), id: z.string() }),
    z.object({
      type: z.literal("message"),
      from: z.string(),
      text: z.string(),
      theme: z.enum(themes).optional(),
      fallback: z.string().optional(),
      replyKey: z.string().optional(),
      format: z.enum(["text", "voice"]).optional(),
      attachment: z.literal("velvetExterior").optional(),
    }),
    z.object({
      type: z.literal("item"),
      id: z.string(),
      remove: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("trait"),
      id: z.string(),
      remove: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("moral"),
      key: z.string(),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("pull"),
      key: z.enum(interests),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("attractor"),
      key: z.string(),
      amount: z.number().finite(),
    }),
    z.object({
      type: z.literal("engagement"),
      key: z.string(),
      response: z.enum(["explore", "avoid", "uncertain"]),
      context: z.string(),
    }),
    z.object({ type: z.enum(["lock", "unlock"]), scene: z.string() }),
  ]),
);
export const stateSchema = z.object({
  version: z.literal(1),
  world: worldSchema.optional(),
  seed: z.string().min(1).max(48),
  variant: z.enum(["carbon", "proxy", "deadletter"]),
  scene: z.string(),
  alias: z.string().min(1).max(24),
  started: z.boolean(),
  mode: z.enum(["normal", "livewire"]),
  time: z.number().int().nonnegative(),
  turn: z.number().int().nonnegative(),
  flags: z.record(z.union([z.boolean(), z.string()])),
  player: z.object({
    heat: z.number().min(0).max(100),
    composure: z.number().min(0).max(100),
    nerve: z.number().min(0).max(100),
  }),
  npcs: z.object(
    Object.fromEntries(npcIds.map((id) => [id, npcSchema])) as Record<
      NPCId,
      typeof npcSchema
    >,
  ),
  relationships: z.record(relationshipSchema),
  canon: z.object({
    truth: z.record(z.string()),
    player: z.array(z.string()),
    provenance: z.record(z.string()),
    public: z.record(z.string()),
  }),
  inventory: z.array(z.string()),
  wardrobe: z.enum(["coat", "formal", "workwear"]),
  traits: z.array(z.string()),
  moral: z.record(z.number()),
  factions: z.record(z.number()),
  rumours: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      faction: z.string(),
      stage: z.number(),
      corrected: z.boolean(),
      at: z.number(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      at: z.number(),
      status: z.enum(["pending", "fired", "cancelled"]),
      effects: z.array(effectSchema),
    }),
  ),
  messages: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      text: z.string(),
      at: z.number(),
      read: z.boolean(),
      theme: z.enum(themes).optional(),
      fallback: z.string().optional(),
      replyKey: z.string().optional(),
      format: z.enum(["text", "voice"]).optional(),
      attachment: z.literal("velvetExterior").optional(),
      replied: z.boolean().optional(),
    }),
  ),
  boundaries: z.object({
    romance: z.enum(["allowed", "implied", "skip"]),
    socialPressure: z.enum(["allowed", "implied", "skip"]),
    surveillance: z.enum(["allowed", "implied", "skip"]),
    substanceUse: z.enum(["allowed", "implied", "skip"]),
    powerExchange: z.enum(["allowed", "implied", "skip"]),
    restraint: z.enum(["allowed", "implied", "skip"]),
    symbolicOwnership: z.enum(["allowed", "implied", "skip"]),
    performance: z.enum(["allowed", "implied", "skip"]),
    fetishFashion: z.enum(["allowed", "implied", "skip"]),
    humiliation: z.enum(["allowed", "implied", "skip"]),
    aftercare: z.enum(["allowed", "implied", "skip"]),
  }),
  engagement: z.record(
    z.object({
      interest: z.number(),
      familiarity: z.number(),
      certainty: z.number(),
      resistance: z.number(),
      uncertainty: z.number(),
      intensity: z.number(),
      contexts: z.array(z.string()),
      orientation: z.enum(["observe", "participate", "either"]),
      trustDependency: z.number(),
      privacy: z.enum(["private", "either"]),
      neverGenerate: z.boolean(),
      lastShown: z.number(),
      saturation: z.number(),
    }),
  ),
  pull: z.object({
    enabled: z.boolean(),
    entries: z.record(pullEntry),
    lastCue: z.string().nullable(),
  }),
  attractors: z.record(z.number()),
  pacing: z.object({
    recent: z.array(z.string()),
    observation: z.string().nullable(),
  }),
  locked: z.array(z.string()),
  visited: z.array(z.string()),
  history: z.array(
    z.object({
      scene: z.string(),
      choice: z.string(),
      to: z.string(),
      at: z.number(),
      changes: z.array(z.string()),
    }),
  ),
});
export type GameState = z.infer<typeof stateSchema>;
