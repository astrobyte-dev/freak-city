import { z } from "zod";
import { createTrialEntities } from "./content";
import { drinkKind } from "./interaction-model";

const oldDrink = z
  .object({
    kind: drinkKind,
    servedAt: z.number().int().nonnegative(),
    remaining: z.number().int().min(0).max(3),
    location: z.enum(["bar", "shop", "booth", "home", "player"]),
  })
  .strict();
const introduced = ["trial-cup", "trial-glass", "trial-counter", "trial-menu"];
/** Only known older revisions migrate. Never infer inspection, a reply, or a new drink. */
export function migrateTrial(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  if (input.revision === 3) {
    if (Object.hasOwn(input, "drink"))
      throw new Error("Revision 3 cannot contain a second drink authority.");
    return raw;
  }
  if (
    input.revision !== undefined &&
    input.revision !== 1 &&
    input.revision !== 2
  )
    throw new Error("Unsupported trial save revision.");
  const s = structuredClone(input);
  if (!s.entities || typeof s.entities !== "object") return raw;
  const entities = s.entities as ReturnType<typeof createTrialEntities>,
    defaults = createTrialEntities();
  for (const id of introduced) if (!entities[id]) entities[id] = defaults[id];
  for (const [id, e] of Object.entries(entities))
    if (defaults[id] && !e.aliases?.length) e.aliases = defaults[id].aliases;
  if (s.drink !== undefined) {
    const drink = oldDrink.parse(s.drink);
    const id =
      drink.kind === "tea" || drink.kind === "coffee"
        ? "trial-cup"
        : "trial-glass";
    if (entities[id].location !== "unplaced")
      throw new Error(
        "Legacy drink conflicts with an existing vessel; save retained for inspection.",
      );
    const vessel = entities[id];
    // The old record knew only the room; preserve that custody rather than inventing a counter placement.
    vessel.location = drink.location;
    Object.assign(vessel.properties, {
      beverage: drink.kind,
      remaining: drink.remaining,
      servedAt: drink.servedAt,
    });
    s.lastVesselId = id;
  }
  delete s.drink;
  if (s.context && typeof s.context === "object") {
    const c = s.context as Record<string, unknown>;
    c.interlocutor ??= "sable"; // All saved contexts in revisions 1/2 belonged to this actor.
    c.references ??= [];
    if (c.question && typeof c.question === "object") {
      const q = c.question as Record<string, unknown>;
      q.subject ??=
        c.topic ??
        (q.kind === "confirm-drink" || q.kind === "choose-drink"
          ? "drink"
          : "investigation");
      if (q.kind === "confirm-drink" && s.lastVesselId)
        q.vesselId ??= s.lastVesselId;
    }
  }
  s.revision = 3;
  s.saveMigrations = [
    {
      from: input.revision ?? 1,
      to: 3,
      detail:
        "Validated the legacy drink, moved it into a stable vessel entity, and made context ownership explicit. Original transcript and evidence history retained.",
    },
  ];
  return s;
}
