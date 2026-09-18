import { entitySchema, type Entity } from "../engine/world-types";
import { carriedBy, visibleAt } from "../engine/custody";
import {
  drinkKind,
  type DrinkKind,
  type InteractionState,
  type InteractionResult,
} from "./interaction-model";

export function createVessel(id: string, name: string, aliases: string[] = []) {
  return entitySchema.parse({
    id,
    name,
    aliases,
    kind: "Container",
    description: `An ordinary ${name}.`,
    location: "unplaced",
    portable: true,
    open: true,
    properties: { interaction: "vessel", capacity: 3, remaining: 0 },
  });
}
export const isVessel = (e: Entity) => e.properties.interaction === "vessel";
export function vesselView(e?: Entity) {
  if (!e || !isVessel(e) || e.properties.servedAt === undefined)
    return undefined;
  return {
    id: e.id,
    name: e.name,
    kind: drinkKind.parse(e.properties.beverage),
    remaining: Number(e.properties.remaining),
    servedAt: Number(e.properties.servedAt),
    location: e.location,
  };
}
// Read-only compatibility view for consumers; never persisted or mutated.
export function currentDrink(
  s: Pick<InteractionState, "entities" | "lastVesselId">,
) {
  return vesselView(s.lastVesselId ? s.entities[s.lastVesselId] : undefined);
}
export function describeVessel(e: Entity) {
  const drink = vesselView(e);
  return drink?.remaining
    ? `Your ${drink.kind} is in the ${e.name}; ${drink.remaining} of ${e.properties.capacity} portions remain.`
    : `The ${e.name} is empty.`;
}
export function validateVessel(e: Entity, time: number) {
  if (!isVessel(e)) return;
  const { capacity, remaining, servedAt, beverage } = e.properties;
  if (
    e.kind !== "Container" ||
    !Number.isInteger(capacity) ||
    capacity !== 3 ||
    !Number.isInteger(remaining) ||
    Number(remaining) < 0 ||
    Number(remaining) > Number(capacity) ||
    e.open !== true
  )
    throw new Error("Invalid vessel capacity or contents.");
  if (servedAt !== undefined) {
    drinkKind.parse(beverage);
    if (
      !Number.isInteger(servedAt) ||
      Number(servedAt) < 0 ||
      Number(servedAt) > time ||
      e.location === "unplaced"
    )
      throw new Error("Invalid vessel service history.");
  } else if (
    remaining !== 0 ||
    beverage !== undefined ||
    e.location !== "unplaced"
  )
    throw new Error("Unserved vessel has contents or custody.");
}
export type ObjectAction = {
  verb:
    "take" | "examine" | "sip" | "finish" | "drop" | "put" | "open" | "close";
  id: string;
  destination?: string;
};
export const rejected = (
  text: string,
  intent = "interaction:blocked",
): InteractionResult => ({ lines: [text], failed: true, intent });
export const clarified = (
  text: string,
  intent = "interaction:clarify",
): InteractionResult => ({
  lines: [text],
  failed: true,
  clarified: true,
  intent,
});

// Shared validation precedes all mutation. Visibility walks custody/closed parents.
export function actOnObject(
  s: InteractionState,
  action: ObjectAction,
  accessible = (id: string) => visibleAt(s.entities, id, s.room),
): InteractionResult {
  const e = s.entities[action.id];
  if (!e || !accessible(e.id))
    return rejected(
      "That object is not accessible here. Open its container or return to its actual location.",
    );
  const vessel = isVessel(e);
  if (action.verb === "examine")
    return {
      lines: [vessel ? describeVessel(e) : e.description],
      minutes: 0,
      intent: "object:examine",
    };
  if (action.verb === "take") {
    if (!e.portable) return rejected(`The ${e.name} stays where it is.`);
    if (carriedBy(s.entities, e.id))
      return rejected(`You are already carrying the ${e.name}.`);
    e.location = "player";
    return {
      lines: [`You take the ${e.name}.`],
      minutes: 1,
      intent: "object:take",
    };
  }
  if (action.verb === "sip" || action.verb === "finish") {
    if (!vessel) return rejected(`The ${e.name} is not a drink vessel.`);
    const drink = vesselView(e);
    if (!drink?.remaining)
      return rejected(
        `The ${e.name} is empty. You can request a refill when its server is present.`,
      );
    e.properties.remaining = action.verb === "sip" ? drink.remaining - 1 : 0;
    return {
      lines: [
        e.properties.remaining
          ? `You take a sip of ${drink.kind} from the ${e.name}.`
          : `You finish your ${drink.kind}; the empty ${e.name} remains ${carriedBy(s.entities, e.id) ? "in your hand" : "where it was"}.`,
      ],
      minutes: 1,
      intent: "object:consume",
    };
  }
  if (!carriedBy(s.entities, e.id))
    return rejected(`You need to be holding the ${e.name} first.`);
  if (action.verb === "open" || action.verb === "close") {
    if (e.kind !== "Container" || vessel)
      return rejected(`The ${e.name} has no closable lid.`);
    e.open = action.verb === "open";
    return {
      lines: [`You ${action.verb} your ${e.name}.`],
      minutes: 1,
      intent: "object:container",
    };
  }
  const destination = action.destination ?? s.room;
  if (destination !== s.room) {
    const target = s.entities[destination];
    if (
      !target ||
      target.kind !== "Container" ||
      !target.open ||
      !accessible(target.id)
    )
      return rejected("The destination must be open and accessible.");
    if (e.id === target.id || carriedBy(s.entities, target.id, e.id))
      return rejected(
        "An object cannot contain itself or its enclosing container.",
      );
  }
  e.location = destination;
  return {
    lines: [
      `You put down the ${e.name}${s.entities[destination] ? ` ${s.entities[destination].properties.supporter ? "on" : "inside"} the ${s.entities[destination].name}` : ""}.`,
    ],
    minutes: 1,
    intent: "object:put",
  };
}

export function fillVessel(
  s: InteractionState,
  id: string,
  kind: DrinkKind,
  counter: string,
  serverPresent: boolean,
  mode: "new" | "refill" = "new",
): InteractionResult {
  const e = s.entities[id];
  if (!serverPresent)
    return rejected("The person offering the drink is not here to serve it.");
  if (!e || !isVessel(e) || e.destroyed || !e.visible)
    return rejected("That vessel is not available for service.");
  if (!visibleAt(s.entities, counter, s.room))
    return rejected("Return to the serving counter for that order.");
  if (e.location !== "unplaced" && !visibleAt(s.entities, id, s.room))
    return rejected(`Bring the ${e.name} back within reach for a refill.`);
  if (Number(e.properties.remaining) > 0)
    return rejected(
      `The ${e.name} still contains a drink. Finish it or name another empty vessel; nothing was discarded.`,
    );
  if (mode === "refill" && e.properties.servedAt === undefined)
    return rejected(
      "That vessel hasn't held a drink yet. You can order one first.",
    );
  if (mode === "new" && e.location !== "unplaced" && e.location !== counter)
    return rejected(
      "Put the empty vessel on the counter for a fresh drink, or ask for a refill.",
    );
  const fresh = e.location === "unplaced";
  if (fresh) e.location = counter;
  e.properties.beverage = kind;
  e.properties.remaining = e.properties.capacity;
  e.properties.servedAt = s.time;
  s.lastVesselId = id;
  s.preference = kind;
  return {
    lines: [
      fresh
        ? `sets a ${e.name} of ${kind} within reach.`
        : mode === "refill"
          ? `refills the same ${e.name} with ${kind}.`
          : `rinses the empty ${e.name}, then pours your ${kind}.`,
    ],
    minutes: 2,
    intent: "service:fill",
  };
}
