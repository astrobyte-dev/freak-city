import { z } from "zod";

const instant = z.number().int().nonnegative();
export const commitmentEventKinds = [
  "accepted",
  "revised",
  "missed",
  "collected",
  "cancelled",
  "care-ended",
  "apologised",
  "reported",
  "inspected",
  "repaired",
] as const;
export const socialSchema = z.object({
  nextId: z.number().int().positive(),
  offer: z
    .object({
      template: z.string(),
      due: instant,
      limit: instant,
      at: instant,
      revision: z.number().int().nonnegative(),
      agreement: z.string().optional(),
    })
    .optional(),
  focus: z.boolean(),
  clarification: z
    .enum(["extension", "cancellation", "revision-choice"])
    .optional(),
  agreements: z
    .array(
      z.object({
        id: z.string(),
        template: z.string(),
        acceptedAt: instant,
        due: instant,
        limit: instant,
        revisions: z
          .array(z.object({ at: instant, due: instant, event: z.string() }))
          .min(1)
          .max(2),
        status: z.enum([
          "active",
          "fulfilled",
          "missed",
          "collected-late",
          "cancelled",
        ]),
        missedAt: instant.optional(),
        collectedAt: instant.optional(),
        cancelledAt: instant.optional(),
        careEndedAt: instant.optional(),
        apologyAt: instant.optional(),
        repairAt: instant.optional(),
        callback: z.string().optional(),
        reminder: z.string().optional(),
      }),
    )
    .max(1),
  events: z
    .array(
      z.object({
        id: z.string(),
        agreement: z.string(),
        kind: z.enum(commitmentEventKinds),
        at: instant,
        room: z.string(),
        actor: z.string(),
        detail: z.string(),
      }),
    )
    .max(40),
  observations: z
    .array(
      z.object({
        event: z.string(),
        npc: z.string(),
        at: instant,
        mode: z.enum(["witnessed", "heard", "inspected"]),
        detail: z.string(),
      }),
    )
    .max(60),
});
export type SocialState = z.infer<typeof socialSchema>;
export type Agreement = SocialState["agreements"][number];
export type SocialEvent = SocialState["events"][number];
export const emptySocial = (): SocialState => ({
  nextId: 1,
  focus: false,
  agreements: [],
  events: [],
  observations: [],
});
