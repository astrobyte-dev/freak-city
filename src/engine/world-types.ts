import { z } from "zod";

export const entitySchema = z.object({
  id: z.string(),
  kind: z.enum([
    "Object",
    "Container",
    "Door",
    "Wearable",
    "Evidence",
    "Phone",
    "InventoryItem",
  ]),
  name: z.string(),
  aliases: z.array(z.string()),
  description: z.string(),
  location: z.string(),
  visible: z.boolean().default(true),
  owner: z.string().optional(),
  portable: z.boolean().default(false),
  open: z.boolean().optional(),
  locked: z.boolean().optional(),
  worn: z.boolean().optional(),
  destroyed: z.boolean().default(false),
  properties: z
    .record(z.union([z.string(), z.boolean(), z.number()]))
    .default({}),
  verbs: z.array(z.string()).default([]),
  facts: z.array(z.string()).default([]),
});
export type Entity = z.infer<typeof entitySchema>;
export const transcriptPassageSchema = z.object({
  text: z.string(),
  kind: z.enum(["world", "speech", "phone", "system"]).optional(),
  from: z.string().optional(),
  speaker: z.enum(["mara", "celeste", "luca", "inez"]).optional(),
  theme: z
    .enum([
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
    ])
    .optional(),
  implied: z.string().optional(),
  safe: z.string().optional(),
});
export const worldSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().min(1).max(2).default(1),
  subMinute: z.number().int().min(0).max(59).default(0),
  references: z
    .record(z.object({ id: z.string(), at: z.number(), room: z.string() }))
    .default({}),
  lastStatement: z
    .object({
      npc: z.enum(["mara", "celeste", "luca", "inez"]),
      text: z.string(),
      at: z.number(),
      room: z.string(),
      theme: transcriptPassageSchema.shape.theme,
      safe: z.string().optional(),
      implied: z.string().optional(),
    })
    .optional(),
  observations: z.record(z.number().nonnegative()).default({}),
  hints: z.record(z.number().int().nonnegative()).default({}),
  room: z.string(),
  previousRoom: z.string().optional(),
  entities: z.record(entitySchema),
  visitedRooms: z.array(z.string()),
  conversations: z.record(z.string()).default({}),
  encounters: z.record(z.string()),
  consumed: z.array(z.string()),
  lastObject: z.string().optional(),
  lastPerson: z.string().optional(),
  lastFemale: z.string().optional(),
  lastMale: z.string().optional(),
  lastTopic: z.string().optional(),
  pending: z
    .object({
      command: z.string(),
      noun: z.string(),
      candidates: z.array(z.string()),
    })
    .optional(),
  transcript: z.array(
    z.object({
      command: z.string().max(500),
      at: z.number().int().nonnegative(),
      room: z.string(),
      passages: z.array(transcriptPassageSchema),
      failed: z.boolean().optional(),
      outcome: z
        .enum([
          "handled",
          "fallback",
          "refusal",
          "ambiguous",
          "unsupported-verb",
          "missing-noun",
          "unsupported-topic",
          "blocked",
        ])
        .optional(),
      verb: z.string().optional(),
      seconds: z.number().nonnegative().optional(),
    }),
  ),
  commandHistory: z.array(z.string().max(500)),
  quickActions: z.boolean().default(false),
});
export type WorldState = z.infer<typeof worldSchema>;
export interface Exit {
  name: string;
  aliases: string[];
  to: string;
  minutes: number;
  door?: string;
}
export interface Room {
  id: string;
  name: string;
  location: "taxi" | "street" | "velvet" | "upstairs" | "apartment" | "motel";
  description: string;
  exits: Exit[];
  smell: string;
  sound: string;
}
export interface Location {
  id: Room["location"];
  name: string;
  rooms: string[];
}
