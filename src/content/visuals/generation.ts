// Development-side definitions. This module is never imported by the shipping app.
import { rooms } from "../spaces";
import { visualManifests } from "./manifest";
import { deriveVisualState } from "../../visuals/derive";
import type { GameState } from "../../engine/types";
import { assetRoles, type AssetRole } from "../../visuals/types";
export const styleGuide = {
  core: "32-bit pixel-map art; PS1 texture character; adult underground neo-noir nightlife; old-city architecture; expensive decay; crimson, deep red and dirty neutrals; selective hot pink and magenta, cyan as contrast; practical lamps, stained concrete, dirty brick, rain-slick pavement, haze and melancholy. Non-explicit atmosphere and implication. Clean modern UI typography.",
  families: {
    velvet:
      "Old-city red-light district; expensive decay, crimson, dried wine, black, aged brass, wet stone. Adult underground venues with technology as texture, not generic futuristic cyberpunk.",
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
  role: AssetRole = "texture",
) {
  if (!rooms[roomId]) throw new Error(`Unknown room: ${roomId}`);
  if (!assetRoles.includes(role))
    throw new Error(`Unknown asset role: ${role}`);
  const state = structuredClone(initializedState);
  state.world!.room = roomId;
  const manifest = visualManifests[roomId];
  const visual = deriveVisualState(state);
  const fixed = [
    ...manifest.staticArchitecture,
    ...manifest.fixedFurniture,
  ].flatMap((f) => (f.entityId ? [f.entityId] : []));
  const entities = Object.values(state.world!.entities).filter(
    (e) =>
      e.location === roomId ||
      (e.kind === "Door" && e.properties.otherSide === roomId),
  );
  for (const id of fixed) {
    const entity = entities.find((e) => e.id === id);
    if (
      !entity ||
      entity.portable ||
      entity.owner ||
      entity.kind === "Evidence" ||
      entity.kind === "Door" ||
      (entity.open !== undefined && !entity.properties.surface)
    )
      throw new Error(`Unsafe permanent architecture entity: ${roomId}/${id}`);
  }
  const dynamicDoors = entities
    .filter((e) => e.kind === "Door")
    .map((e) => e.id);
  const dynamicObjects = entities
    .filter((e) => e.kind !== "Door" && !fixed.includes(e.id))
    .map((e) => e.id);
  return {
    schemaVersion: 2,
    role,
    roomId,
    roomIdentity: rooms[roomId].name,
    canonicalArchitecture: rooms[roomId].description,
    exits: rooms[roomId].exits,
    staticArchitecture: manifest.staticArchitecture,
    fixedFurniture: manifest.fixedFurniture,
    dynamicObjects,
    dynamicDoors,
    npcZones: manifest.npcZones,
    atmosphereZones: manifest.atmosphereZones,
    foregroundZones: manifest.foregroundZones,
    sceneIllustrationHints: manifest.sceneIllustrationHints,
    requiredFacts: manifest.requiredFacts,
    forbiddenFacts: manifest.forbiddenFacts,
    generationPresets: manifest.generationPresets,
    bakedEntities: fixed.map((id) => {
      const e = state.world!.entities[id];
      return { id, location: e.location, open: e.open, locked: e.locked };
    }),
    // Optional adapter inputs are recorded explicitly; no reference-guidance dependency yet.
    conditioning: {
      mode: "text-only",
      reference: null,
      mask: null,
      layout: null,
    },
    // Facts are reference data, not permission to flatten changing props into a background.
    canonicalEntities: Object.values(state.world!.entities)
      .filter((e) => e.location === roomId)
      .map((e) => ({
        id: e.id,
        name: e.name,
        aliases: e.aliases,
        description: e.description,
        kind: e.kind,
        portable: e.portable,
        owner: e.owner,
        open: e.open,
        properties: e.properties,
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
      roomModel:
        manifest.family === "velvet"
          ? "32-bit pixel art, PS1, crimson noir"
          : manifest.family === "domestic"
            ? "32-bit pixel art, PS1, cold domestic noir"
            : "32-bit pixel art, PS1, industrial noir",
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
