import { openingInteraction } from "./interaction-content";
import { z } from "zod";
import {
  drinkKind,
  interactionContext,
  responseMeaning,
  interactionMemory,
} from "./interaction-model";
import { validateVessel, isVessel } from "./vessels";
import { migrateTrial } from "./trial-migration";
export { drinkKind } from "./interaction-model";
import { entitySchema } from "../engine/world-types";
import { createTrialEntities, opening, rooms, TRIAL_TRUTH } from "./content";

const instant = z.number().int().nonnegative();
const actor = z.enum(["player", "sable", "vesper", "regulars", "silas"]);
export type Actor = z.infer<typeof actor>;
const observation = z.object({
  id: z.string(),
  at: instant,
  actor,
  mode: z.enum(["inspected", "heard", "own", "claim", "custody"]),
  subject: z.string(),
  detail: z.string(),
  source: z.string(),
  upstream: z.array(z.string()),
  evidence: z.array(z.string()),
});
const event = z.object({
  id: z.enum([
    "sable:relay",
    "sable:decide",
    "sable:medical-start",
    "sable:medical",
    "sable:notebook",
    "sable:return",
  ]),
  at: instant,
  status: z.enum(["pending", "fired", "cancelled"]),
});
const recipient = z.object({
  knowledge: z.array(z.string()),
  beliefs: z.record(
    z.object({ text: z.string(), source: z.string(), at: instant }),
  ),
});
export const roomId = z.enum(["bar", "shop", "booth", "home"]);
export const commandDiagnostic = z.object({
  command: z.string(),
  intent: z.string(),
  outcome: z.enum(["handled", "rejected", "clarified", "deferred"]),
  from: instant,
  to: instant,
  roomBefore: roomId,
  roomAfter: roomId,
  meaning: responseMeaning.optional(),
  changes: z.array(
    z.object({ field: z.string(), before: z.unknown(), after: z.unknown() }),
  ),
});
export const transcriptEntry = z.object({
  command: z.string().max(500),
  at: instant,
  lines: z.array(z.string()),
  failed: z.boolean(),
  room: roomId.optional(),
  startedAt: instant.optional(),
  startRoom: roomId.optional(),
  diagnostics: z.array(commandDiagnostic).optional(),
});
export const trialSchema = z.object({
  campaign: z.literal("sable-trial"),
  version: z.literal(1),
  revision: z.literal(3).default(3),
  seed: z.string().min(1).max(48),
  alias: z.string().min(1).max(24),
  adult: z.literal(true),
  time: instant,
  turn: instant,
  room: z.enum(["bar", "shop", "booth", "home"]),
  truth: z.record(z.string()),
  entities: z.record(entitySchema),
  observations: z.array(observation),
  nextId: instant,
  actors: z.object({
    player: recipient,
    sable: recipient,
    vesper: recipient,
    regulars: recipient,
    silas: recipient,
  }),
  events: z.array(event),
  preference: drinkKind.optional(),
  lastVesselId: z.string().optional(),
  objectFocus: z.array(z.string()).default([]),
  interactionMemory: interactionMemory.default({}),
  saveMigrations: z
    .array(
      z.object({
        from: z.number().int(),
        to: z.literal(3),
        detail: z.string(),
      }),
    )
    .default([]),
  thoughtsShown: z.array(z.string()).default([]),
  socialCount: instant,
  socialSeen: z.array(z.string()).default([]),
  companyOffers: z
    .array(
      z.object({
        at: instant,
        observer: z.literal("sable"),
        words: z.string(),
        status: z.literal("offered"),
      }),
    )
    .default([]),
  roleplay: z.enum(["allowed", "implied", "skip"]),
  treatment: z.array(
    z.object({
      at: instant,
      value: z.enum([
        "support",
        "disagree",
        "space",
        "silence",
        "pressure",
        "time",
      ]),
      observer: z.literal("sable"),
    }),
  ),
  receipt: z
    .object({
      id: z.string(),
      at: instant,
      path: z.enum(["direct", "vesper"]),
      sources: z.array(z.string()),
    })
    .optional(),
  decision: z
    .object({
      at: instant,
      course: z.enum(["formal", "document"]),
      reasons: z.array(z.string()),
      receipt: z.string(),
    })
    .optional(),
  completed: z
    .object({ at: instant, course: z.enum(["formal", "document"]) })
    .optional(),
  updateAt: instant.optional(),
  privateUntil: instant.optional(),
  away: z.boolean(),
  needsTime: z.boolean(),
  context: interactionContext.optional(),
  transcript: z.array(transcriptEntry),
});
export type TrialState = z.infer<typeof trialSchema>;
export type TrialEvent = TrialState["events"][number];
export function newTrial(alias = "Ash", seed = "SABLE-1"): TrialState {
  const recipient = () => ({ knowledge: [] as string[], beliefs: {} });
  return trialSchema.parse({
    campaign: "sable-trial",
    version: 1,
    alias: alias.trim() || "Ash",
    adult: true,
    seed,
    time: 1080,
    turn: 0,
    room: "bar",
    truth: { ...TRIAL_TRUTH },
    entities: createTrialEntities(),
    observations: [],
    nextId: 1,
    actors: {
      player: recipient(),
      sable: {
        knowledge: [],
        beliefs: {
          hospital: {
            text: "I was continuously hospitalized that year.",
            source: "implanted autobiographical account",
            at: 0,
          },
        },
      },
      vesper: recipient(),
      regulars: recipient(),
      silas: recipient(),
    },
    events: [],
    context: structuredClone(openingInteraction),
    socialSeen: [`${openingInteraction.topic}:question`],
    socialCount: 0,
    roleplay: "implied",
    treatment: [],
    away: false,
    needsTime: false,
    transcript: [
      {
        command: "",
        at: 1080,
        room: "bar",
        lines: [...opening],
        failed: false,
      },
    ],
  });
}
export function validateTrial(raw: unknown): TrialState {
  const s = trialSchema.parse(migrateTrial(raw));
  const fail = (condition: boolean, message: string) => {
    if (condition) throw new Error(message);
  };
  fail(
    JSON.stringify(Object.entries(s.truth).sort()) !==
      JSON.stringify(Object.entries(TRIAL_TRUTH).sort()),
    "Trial canon differs from its approved foundation.",
  );
  const expected = createTrialEntities();
  fail(
    Object.keys(expected).sort().join() !==
      Object.keys(s.entities).sort().join(),
    "Incomplete trial evidence model.",
  );
  for (const [id, e] of Object.entries(s.entities)) {
    fail(
      e.id !== id ||
        e.kind !== expected[id].kind ||
        e.properties.interaction !== expected[id].properties.interaction,
      "Invalid evidence identity.",
    );
    fail(
      ![
        ...Object.keys(rooms),
        ...Object.keys(s.actors),
        ...Object.keys(s.entities),
        "unplaced",
        "destroyed",
      ].includes(e.location),
      "Invalid custodian.",
    );
    fail(
      e.destroyed !== (e.location === "destroyed"),
      "Destroyed evidence has inconsistent custody.",
    );
    const seen = new Set([id]);
    let parent = s.entities[e.location];
    while (parent) {
      fail(seen.has(parent.id), "Containment cycle.");
      seen.add(parent.id);
      fail(parent.kind !== "Container", "Evidence inside a non-container.");
      parent = s.entities[parent.location];
    }
  }
  const ids = new Set<string>();
  for (const o of s.observations) {
    fail(
      ids.has(o.id) ||
        o.at > s.time ||
        o.evidence.some((id) => !s.entities[id]) ||
        o.upstream.some((id) => !ids.has(id)),
      "Invalid observation provenance.",
    );
    ids.add(o.id);
    if (o.mode === "heard" && o.subject === "contradiction")
      fail(!o.upstream.length, "Disclosure lacks inspected sources.");
  }
  fail(s.nextId <= s.observations.length, "Observation identity would repeat.");
  fail(
    new Set(s.events.map((e) => e.id)).size !== s.events.length,
    "Duplicate event identity.",
  );
  for (const e of s.events)
    fail(
      (e.status === "fired" && e.at > s.time) ||
        (e.status === "pending" && e.at < s.time),
      "Event status contradicts the clock.",
    );
  const eventAt = (id: TrialEvent["id"], at: number) => {
    const event = s.events.find((e) => e.id === id);
    fail(
      !event || event.at !== at || event.status === "cancelled",
      "Required consequence is missing or rescheduled.",
    );
  };
  const relayRequest = s.observations.find(
    (o) => o.actor === "vesper" && o.subject === "relay-request",
  );
  if (relayRequest) {
    eventAt("sable:relay", relayRequest.at + 1440);
    for (const id of ["trial-photo", "trial-listing"])
      fail(
        !relayRequest.upstream.some((source) =>
          s.observations.some(
            (o) =>
              o.id === source &&
              o.actor === "vesper" &&
              o.mode === "inspected" &&
              o.evidence.includes(id),
          ),
        ),
        "Relay request lacks Vesper's inspection.",
      );
  } else
    fail(
      s.events.some((e) => e.id === "sable:relay"),
      "Unrequested relay.",
    );
  if (s.receipt) {
    const r = s.observations.find((o) => o.id === s.receipt!.id);
    fail(
      !r ||
        r.actor !== "sable" ||
        r.subject !== "contradiction" ||
        r.at !== s.receipt.at ||
        s.receipt.sources.some((id) => !ids.has(id)),
      "Invalid Sable receipt.",
    );
    const sourceActor = s.receipt.path === "direct" ? "sable" : "vesper";
    for (const id of ["trial-photo", "trial-listing"])
      fail(
        !s.receipt.sources.some((source) =>
          s.observations.some(
            (o) =>
              o.id === source &&
              o.actor === sourceActor &&
              o.mode === "inspected" &&
              o.evidence.includes(id),
          ),
        ),
        "Receipt lacks actual inspection.",
      );
    eventAt("sable:decide", s.receipt.at + 10);
    if (s.receipt.path === "vesper")
      fail(
        !relayRequest ||
          s.receipt.at !== relayRequest.at + 1440 ||
          !s.events.some((e) => e.id === "sable:relay" && e.status === "fired"),
        "Relay has no delivered call.",
      );
  }
  if (s.decision)
    fail(
      !s.receipt ||
        s.decision.receipt !== s.receipt.id ||
        s.decision.at < s.receipt.at ||
        s.decision.at > s.time ||
        !s.decision.reasons.length,
      "Invalid decision history.",
    );
  if (s.decision) {
    fail(
      s.decision.at !== s.receipt!.at + 10,
      "Decision time differs from its scheduled activity.",
    );
    if (s.decision.course === "formal") {
      eventAt("sable:medical-start", s.decision.at + 4260);
      eventAt("sable:medical", s.decision.at + 4320);
    } else eventAt("sable:notebook", s.decision.at + 1440);
  }
  if (s.completed)
    fail(
      !s.decision ||
        s.completed.course !== s.decision.course ||
        s.completed.at !==
          s.decision.at + (s.decision.course === "formal" ? 4320 : 1440) ||
        s.completed.at > s.time,
      "Invalid outcome history.",
    );
  if (s.updateAt !== undefined)
    fail(
      !s.completed || s.updateAt < s.completed.at || s.updateAt > s.time,
      "Invalid update receipt.",
    );
  if (s.completed?.course === "formal")
    eventAt("sable:return", s.completed.at + 60);
  for (const e of s.events) {
    if (e.id === "sable:decide")
      fail(
        !s.receipt || (e.status === "fired") !== !!s.decision,
        "Decision event has no matching decision.",
      );
    if (["sable:medical-start", "sable:medical", "sable:return"].includes(e.id))
      fail(
        s.decision?.course !== "formal",
        "Medical activity lacks a formal decision.",
      );
    if (e.id === "sable:notebook")
      fail(
        s.decision?.course !== "document",
        "Notebook activity lacks a documentation decision.",
      );
    if (e.id === "sable:medical" || e.id === "sable:notebook")
      fail(
        (e.status === "fired") !== !!s.completed,
        "Completed event lacks its outcome.",
      );
  }
  fail(
    s.away !==
      (s.events.some(
        (e) => e.id === "sable:medical-start" && e.status === "fired",
      ) &&
        !s.events.some((e) => e.id === "sable:return" && e.status === "fired")),
    "Medical presence contradicts activity.",
  );
  for (const id of ["trial-report", "trial-notebook"])
    if (
      !s.observations.some(
        (o) => o.actor === "sable" && o.mode === "own" && o.subject === id,
      )
    )
      fail(
        s.entities[id].location !== "unplaced",
        "Outcome evidence appeared before creation.",
      );
  for (const [actor, data] of Object.entries(s.actors))
    for (const fact of data.knowledge) {
      fail(
        !s.observations.some(
          (o) =>
            o.actor === actor &&
            ((o.mode === "inspected" && o.evidence.includes(fact)) ||
              (o.mode === "own" && o.subject === fact) ||
              (o.subject === "hospital-account" &&
                fact === "hospital-account") ||
              (o.subject === "contradiction" &&
                fact === "credible-contradiction")),
        ) &&
          !(
            actor === "player" &&
            fact === "credible-contradiction" &&
            ["trial-photo", "trial-listing", "hospital-account"].every((id) =>
              data.knowledge.includes(id),
            )
          ),
        "Knowledge has no supported observation or communication.",
      );
    }
  for (const a of Object.values(s.actors))
    for (const belief of Object.values(a.beliefs))
      fail(belief.at > s.time, "Future belief.");
  fail(
    s.treatment.some((t) => t.at > s.time) ||
      s.transcript.some((t) => t.at > s.time),
    "Future interaction.",
  );
  for (const entity of Object.values(s.entities))
    validateVessel(entity, s.time);
  fail(
    !!s.lastVesselId &&
      (!s.entities[s.lastVesselId] ||
        !isVessel(s.entities[s.lastVesselId]) ||
        s.entities[s.lastVesselId].properties.servedAt === undefined),
    "Invalid last vessel reference.",
  );
  fail(
    s.objectFocus.some((id) => !s.entities[id]),
    "Invalid object focus.",
  );
  if (s.context) {
    fail(
      !Object.keys(s.actors).includes(s.context.interlocutor),
      "Invalid interlocutor.",
    );
    fail(
      s.context.references.some((id) => !s.entities[id]),
      "Invalid conversation reference.",
    );
    if (s.context.question?.vesselId)
      fail(
        !s.entities[s.context.question.vesselId] ||
          !isVessel(s.entities[s.context.question.vesselId]),
        "Invalid offered vessel.",
      );
  }
  fail(
    s.companyOffers.some((o) => o.at > s.time),
    "Future offer.",
  );
  fail(
    s.context?.question?.kind === "confirm-drink" &&
      !s.context.question.offered,
    "Drink offer has no named drink.",
  );
  for (const t of s.transcript)
    for (const d of t.diagnostics ?? [])
      fail(
        d.from > d.to || d.to > t.at,
        "Command diagnostics contradict the clock.",
      );
  return s;
}
