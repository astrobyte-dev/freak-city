import { entitySchema } from "../../src/engine/world-types";
import { createVessel } from "../../src/trial/vessels";
import { handleInteraction } from "../../src/trial/interactions";
import type {
  ActorDefinition,
  InteractionHost,
  InteractionState,
} from "../../src/trial/interaction-model";

// Synthetic declarations only. Neither these people nor this setting are canon.
export function interactionFixture() {
  const makeActor = (id: string, name: string): ActorDefinition => ({
    id,
    name,
    aliases: [name.toLowerCase()],
    topics: [
      {
        id: "notice",
        kind: "opinion",
        aliases: ["notice", "warning", "severe"],
        question: `${name}: Does the notice sound severe?`,
        positive: `${name}: I'll soften the notice.`,
        negative: `${name}: You find the notice harmless.`,
        followup: `${name}: The notice concerns missing spoons.`,
        judgments: { positive: ["severe"], negative: ["harmless"] },
      },
      {
        id: "image",
        kind: "evidence",
        aliases: ["image", "snapshot"],
        entityId: "snapshot",
        unseen: `${name}: Show me the snapshot first.`,
        claim: `${name}: That's your account; I haven't inspected it.`,
        followup: `${name}: I inspected the snapshot, but it has no date.`,
      },
    ],
    service: {
      vessels: ["cup", "mug"],
      counter: "counter",
      kinds: ["tea", "coffee", "water"],
      offer: `${name}: Tea, coffee or water?`,
      decline: `${name}: No drink ordered.`,
      served: {
        coffee: "Coffee is ready.",
        tea: "Tea is ready.",
        water: "Water is ready.",
      },
    },
  });
  const actors = [makeActor("rowan", "Rowan"), makeActor("kit", "Kit")];
  const state: InteractionState = {
    room: "bar",
    time: 10,
    objectFocus: [],
    entities: {
      cup: createVessel("cup", "cup", ["cup"]),
      mug: createVessel("mug", "mug", ["mug"]),
      counter: entitySchema.parse({
        id: "counter",
        name: "counter",
        aliases: ["counter"],
        kind: "Container",
        open: true,
        location: "bar",
        description: "A fixed counter.",
        properties: { supporter: true },
      }),
      bag: entitySchema.parse({
        id: "bag",
        name: "bag",
        aliases: ["bag"],
        kind: "Container",
        open: true,
        portable: true,
        location: "player",
        description: "A bag.",
      }),
      snapshot: entitySchema.parse({
        id: "snapshot",
        name: "snapshot",
        aliases: ["snapshot", "image"],
        kind: "Evidence",
        location: "bar",
        portable: true,
        description: "An undated snapshot.",
      }),
    },
  };
  const observations: {
    actor: string;
    mode: string;
    subject: string;
    words: string;
    entities: string[];
  }[] = [];
  const host: InteractionHost = {
    actors,
    beverages: ["tea", "coffee", "water"].map((kind) => ({
      kind: kind as "tea" | "coffee" | "water",
      aliases: [kind],
    })),
    present: () => state.room === "bar",
    observed: (actor, id) =>
      observations.some(
        (o) => o.actor === actor && o.subject === id && o.mode === "inspect",
      ),
    inspect: (actor, id) => {
      if (!host.observed(actor, id))
        observations.push({
          actor,
          mode: "inspect",
          subject: id,
          words: "Inspected original",
          entities: [id],
        });
    },
    record: (actor, mode, subject, words, entities) => {
      observations.push({ actor, mode, subject, words, entities });
    },
  };
  function command(text: string) {
    const result = handleInteraction(state, text, host);
    if (result && !result.failed) state.time += result.minutes ?? 0;
    return result;
  }
  return { state, host, actors, observations, command };
}
