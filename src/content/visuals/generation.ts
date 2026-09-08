// Development-side definitions. This module is never imported by the shipping app.
import { rooms } from "../spaces";
import { visualManifests } from "./manifest";
import { deriveVisualState } from "../../visuals/derive";
import type { GameState } from "../../engine/types";
export const styleGuide = {
  core: "32-bit retro pixel art; PS1 texture character; grungy neo-noir; heavy shadow; dirty neutral surfaces; selective magenta and electric cyan; melancholy after-hours atmosphere. No pixelation of UI text.",
  families: {
    velvet:
      "Expensive decay, dried wine, black, aged brass, wet stone. Most surfaces stay dark and neutral.",
    service:
      "Stained concrete, worn steel, utilitarian light, wet asphalt; no decorative cyberpunk circuitry.",
    domestic:
      "Old paint, dull appliances, cold morning colour, inexpensive practical light. Intimacy without glamour.",
    neutral:
      "Understated planar texture; no invented architecture, props or identifiable figures.",
  },
};
export function generationDefinition(
  roomId: string,
  initializedState: GameState,
) {
  if (!rooms[roomId]) throw new Error(`Unknown room: ${roomId}`);
  const state = structuredClone(initializedState);
  state.world!.room = roomId;
  const manifest = visualManifests[roomId];
  const visual = deriveVisualState(state);
  return {
    schemaVersion: 1,
    roomId,
    roomIdentity: rooms[roomId].name,
    canonicalArchitecture: rooms[roomId].description,
    exits: rooms[roomId].exits,
    // Facts are reference data, not permission to flatten changing props into a background.
    canonicalEntities: Object.values(state.world!.entities)
      .filter((e) => e.location === roomId)
      .map((e) => ({
        id: e.id,
        name: e.name,
        aliases: e.aliases,
        description: e.description,
        kind: e.kind,
      })),
    requiredVisualFacts: [
      "Background texture plate only: muted material, colour and ambient light.",
      "Reserve all canonical object and NPC zones for runtime compositing.",
      "Composition uses the 320 x 224 reference frame without cropping.",
    ],
    forbiddenVisualFacts: [
      "Any identifiable object, evidence, NPC, silhouette, door, window, staircase, sign or damage baked into the plate.",
      "Additional architecture or routes not represented in the canonical reference.",
      "Legible text, faces, nudity, sexual activity, branded logos or personal data.",
      "Current hidden facts, solved-mystery clues or state inferred from plot summaries.",
    ],
    styleGuide: {
      core: styleGuide.core,
      family: styleGuide.families[manifest.family],
      model:
        "32-bit pixel art, PS1 texture, grungy neo-noir, restrained colour, heavy shadow",
      familyModel:
        manifest.family === "domestic"
          ? "Dull paint and cold grey"
          : manifest.family === "service"
            ? "Stained concrete and muted steel"
            : "Dirty charcoal, muted burgundy, aged brass",
    },
    sceneConcept: `${manifest.family} material study for ${rooms[roomId].name}; flat texture and lighting only. Runtime sprites supply all recognizable world facts.`,
    lighting: visual.lighting,
    state: {
      time: state.time,
      timeBand: visual.timeBand,
      weather: visual.weather,
      lighting: visual.lighting,
      crowd: visual.crowdLevel,
      npcPresence: visual.npcPresence.map((n) => n.id),
      canonicalObjects: visual.canonicalObjects,
      openClosedState: visual.openedState,
      specialEvents: visual.specialEventState,
    },
    timeVariants: manifest.variants,
    weatherCompatibility: manifest.exposure,
    canonicalVisualAnchors: manifest.anchors,
    npcPlacementZones: manifest.npcZones,
    output: {
      formats: ["webp", "avif"],
      width: 640,
      height: 448,
      maximumBytes: 150_000,
      directory: "public/visuals/generated",
      initialStatus: "draft",
    },
  };
}
