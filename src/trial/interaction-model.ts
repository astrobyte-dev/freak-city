import { z } from "zod";
import type { Entity } from "../engine/world-types";

export const drinkKind = z.enum([
  "tea",
  "coffee",
  "water",
  "alcohol-free special",
  "gin special",
]);
export type DrinkKind = z.infer<typeof drinkKind>;
export const interactionContext = z.object({
  kind: z.enum([
    "decision",
    "update",
    "drink",
    "hospital",
    "social",
    "roleplay",
    "evidence",
  ]),
  room: z.enum(["bar", "shop", "booth", "home"]),
  at: z.number().int().nonnegative(),
  interlocutor: z.string(),
  topic: z.string().optional(),
  references: z.array(z.string()).default([]),
  question: z
    .object({
      kind: z.enum([
        "choose-drink",
        "confirm-drink",
        "consider-options",
        "hospital-part",
        "opinion",
        "service-choice",
        "favour",
      ]),
      subject: z.string(),
      offered: drinkKind.optional(),
      vesselId: z.string().optional(),
      serviceMode: z.enum(["new", "refill"]).optional(),
    })
    .optional(),
});
export type InteractionContext = z.infer<typeof interactionContext>;
export const responseMeaning = z.object({
  kind: z.enum([
    "object",
    "opinion",
    "request",
    "accept",
    "decline",
    "uncertain",
    "followup",
    "claim",
    "topic",
    "unknown",
    "social",
  ]),
  interlocutor: z.string().optional(),
  subject: z.string().optional(),
  polarity: z.enum(["positive", "negative", "uncertain"]).optional(),
  entities: z.array(z.string()).default([]),
  serviceMode: z.enum(["new", "refill"]).optional(),
  tone: z.literal("explicit-teasing").optional(),
});
export type ResponseMeaning = z.infer<typeof responseMeaning>;
// Where a failed verb or object resolution gave up; the wording is separate.
export const failureStage = z.enum([
  "unknown-word",
  "unknown-verb",
  "not-here",
  "not-a-thing",
  "partial",
  "refused",
]);
export const failure = z.object({
  stage: failureStage,
  token: z.string().optional(),
});
export type Failure = z.infer<typeof failure>;
// Presentation memory, not a second authority for objects or evidence.
export const interactionMemory = z.object({
  replies: z.record(z.number().int().nonnegative()).default({}),
  opinions: z.record(z.enum(["positive", "negative"])).default({}),
  served: z.array(z.string()).default([]),
  declined: z.array(z.string()).default([]),
});
export interface InteractionState {
  entities: Record<string, Entity>;
  room: InteractionContext["room"];
  time: number;
  context?: InteractionContext;
  preference?: DrinkKind;
  lastVesselId?: string;
  objectFocus: string[];
  alias?: string;
  interactionMemory?: z.infer<typeof interactionMemory>;
}
export interface InteractionResult {
  lines: string[];
  minutes?: number;
  failed?: boolean;
  clarified?: boolean;
  intent?: string;
  meaning?: ResponseMeaning;
  deferred?: boolean;
  failure?: Failure;
}
export interface TopicDefinition {
  id: string;
  aliases: string[];
  kind: "opinion" | "evidence" | "subject";
  question?: string;
  positive?: string;
  negative?: string;
  followup: string;
  entityId?: string;
  unseen?: string;
  claim?: string;
  corroborated?: string;
  external?: boolean;
  judgments?: { positive: string[]; negative: string[] };
  hesitation?: string;
  teasing?: string;
  changed?: { positive: string; negative: string };
  repeated?: string;
  repeatOpinion?: string;
  details?: { aliases: string[]; response: string }[];
}
export interface ActorDefinition {
  id: string;
  name: string;
  aliases: string[];
  topics: TopicDefinition[];
  social?: { thanks: string; company: string; goodbye: string };
  service?: {
    vessels: string[];
    counter: string;
    kinds: DrinkKind[];
    offer: string;
    decline: string;
    served: Partial<Record<DrinkKind, string>>;
    hesitation?: string;
    confirmNew?: string;
    confirmRefill?: string;
    noClean?: string;
  };
}
export interface BeverageDefinition {
  kind: DrinkKind;
  aliases: string[];
  variant?: { words: string[]; kind: DrinkKind };
}
export interface InteractionHost {
  actors: ActorDefinition[];
  beverages: BeverageDefinition[];
  present: (actor: string) => boolean;
  accessible?: (id: string) => boolean;
  observed: (actor: string, id: string) => boolean;
  corroborated?: (actor: string, id: string) => boolean;
  inspect: (actor: string, id: string) => void;
  record: (
    actor: string,
    mode: "claim" | "opinion" | "custody" | "preference",
    subject: string,
    words: string,
    entities: string[],
  ) => void;
  afterShow?: (actor: string, id: string) => string[];
}
