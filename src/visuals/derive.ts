import type { GameState } from "../engine/types";
import { rooms } from "../content/spaces";
import { characters } from "../content/world";
import { isCarried, isVisible, presentNPCs } from "../engine/parser";
import { activityDescription } from "../engine/activity";
import {
  selectVisualAsset,
  visualManifests,
} from "../content/visuals/manifest";
import type {
  Lighting,
  TimeBand,
  VisualDescriptor,
  VisualOverrides,
} from "./types";
export function timeBandAt(minutes: number): TimeBand {
  const clock = ((minutes % 1440) + 1440) % 1440;
  if (clock >= 19 * 60) return "early";
  if (clock < 2 * 60) return "night";
  if (clock < 4 * 60) return "late";
  if (clock < 5 * 60) return "closing";
  if (clock < 7 * 60) return "dawn";
  return "day";
}
const lightByTime: Record<TimeBand, Lighting> = {
  early: "amber",
  night: "amber",
  late: "low",
  closing: "work",
  dawn: "morning",
  day: "cold",
};
/** Read-only projection. Caller supplies an initialized world, exactly as the parser does. */
export function deriveVisualState(
  state: GameState,
  preview: VisualOverrides = {},
): VisualDescriptor {
  const world = state.world;
  if (!world || !rooms[world.room])
    throw new Error("Visual state requires an initialized canonical room");
  const room = rooms[world.room];
  const manifest = visualManifests[room.id];
  const timeBand = preview.timeBand ?? timeBandAt(state.time);
  // The authored night is rainy. No weather simulation exists; do not invent a change.
  const weather = preview.weather ?? "rain";
  const canonicalObjects = Object.values(world.entities)
    .filter(
      (e) =>
        isVisible(state, e.id) &&
        !isCarried(state, e.id) &&
        !e.properties.onPerson,
    )
    .map((e) => ({
      id: e.id,
      name: e.name,
      aliases: [...e.aliases],
      kind: e.kind,
      location: e.location,
      open: e.open,
      locked: e.locked,
      damaged: e.properties.damaged === true,
      anchor:
        e.location === room.id ||
        (e.kind === "Door" && e.properties.otherSide === room.id)
          ? manifest.anchors[e.id]
          : undefined,
    }));
  const visualVariant = preview.visualVariant ?? timeBand;
  const overlays: VisualDescriptor["overlays"] = ["grain"];
  if (weather === "rain" && manifest.exposure !== "inside")
    overlays.push("rain", "reflection");
  // Haze is non-semantic atmosphere, never a depiction of drug use or a named character.
  if (["bar", "loading-bay"].includes(room.id)) overlays.push("haze");
  const people = presentNPCs(state);
  return {
    roomId: room.id,
    roomName: room.name,
    locationId: room.location,
    timeBand,
    weather,
    lighting: preview.lighting ?? lightByTime[timeBand],
    crowdLevel:
      room.id === "bar"
        ? ["early", "night"].includes(timeBand)
          ? "busy"
          : timeBand === "late"
            ? "sparse"
            : "quiet"
        : "quiet",
    atmosphere: `${manifest.family} / ${timeBand}`,
    npcPresence: people.map((id, index) => ({
      id,
      name: characters[id].name,
      ...manifest.npcZones[index],
    })),
    canonicalObjects,
    visibleEvidence: canonicalObjects
      .filter((e) => e.kind === "Evidence")
      .map((e) => e.id),
    doors: canonicalObjects.filter((e) => e.kind === "Door"),
    containers: canonicalObjects.filter((e) => e.kind === "Container"),
    damageState: Object.fromEntries(
      canonicalObjects.map((e) => [e.id, e.damaged]),
    ),
    openedState: Object.fromEntries(
      canonicalObjects
        .filter((e) => e.open !== undefined)
        .map((e) => [e.id, e.open!]),
    ),
    specialEventState: activityDescription(state, room.id),
    visualVariant,
    baseArt: selectVisualAsset(room.id, visualVariant),
    overlays:
      preview.overlay === "none"
        ? []
        : preview.overlay
          ? [preview.overlay]
          : overlays,
    manifest,
  };
}
