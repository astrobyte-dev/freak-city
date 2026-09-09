import type { VisualDescriptor } from "./types";

/** Review-only art input. Never a save field, NPC schedule, or gameplay location. */
export interface PilotSprite {
  file: string;
  width: number;
  height: number;
  sha256: string;
  reflection: { file: string; width: number; height: number; sha256: string };
}
export interface VelvetPilot {
  status: "draft";
  plateSha256: string;
  assets: Record<string, PilotSprite>;
  /** Both positions are staging proofs of the same present Mara, never simultaneous. */
  maraStaging?: "floor" | "behind-counter";
}
export interface PilotContact {
  x: number;
  y: number;
  surface: "floor" | "counter" | "fixture" | "raised";
  depthBand: number;
  occlusion?: "counter";
}
export interface PilotEntity {
  id: string;
  kind: "npc" | "anonymous" | "object";
  spriteId: string;
  sprite: PilotSprite;
  contact: PilotContact;
}

// Authored master-grid geometry. These polygons describe existing pixels only.
export const velvetCounter = "0,104 39,112 121,103 121,131 39,193 0,199";
export const velvetFloor = "0,204 39,194 123,131 134,123 320,123 320,224 0,224";
export const velvetCounterSurface = "0,104 82,103 121,103 39,118 0,117";
export const velvetContacts: Record<string, PilotContact> = {
  // Old glyph feet were at zone.y + 16. Floor migration preserves that contact.
  mara: { x: 174, y: 167, surface: "floor", depthBand: 1 },
  "mara-behind": {
    x: 77,
    y: 134,
    surface: "floor",
    depthBand: 0,
    occlusion: "counter",
  },
  detail_bar_stool: { x: 132, y: 167, surface: "floor", depthBand: 1 },
  detail_bar_glass: { x: 92, y: 108, surface: "counter", depthBand: 2 },
  detail_bar_light: { x: 91, y: 46, surface: "fixture", depthBand: 2 },
  detail_bar_bin: { x: 47, y: 194, surface: "floor", depthBand: 1 },
  envelope: { x: 194, y: 201, surface: "floor", depthBand: 1 },
};
export const velvetObjectBindings: Record<string, string> = {
  detail_bar_stool: "stool",
  detail_bar_glass: "glass",
  detail_bar_light: "lamp",
  detail_bar_bin: "bin",
  envelope: "envelope",
};
const patrons = [
  { x: 191, y: 140 },
  { x: 219, y: 147 },
  { x: 246, y: 152 },
  { x: 277, y: 161 },
  { x: 300, y: 174 },
];

export function pilotEnabled(
  d: VisualDescriptor,
  pilot?: VelvetPilot,
): pilot is VelvetPilot {
  return (
    !!pilot &&
    d.roomId === "bar" &&
    d.baseArt?.role === "canonical-room" &&
    d.baseArt.sha256 === pilot.plateSha256
  );
}
export function hasPilotReflection(entity: PilotEntity) {
  // No floor ghost for a hanging fixture, raised stair/stage, or hidden feet.
  return (
    entity.contact.surface !== "fixture" &&
    entity.contact.surface !== "raised" &&
    !entity.contact.occlusion
  );
}
export function deriveVelvetPilot(
  d: VisualDescriptor,
  pilot: VelvetPilot,
): PilotEntity[] {
  if (!pilotEnabled(d, pilot)) return [];
  const entities: PilotEntity[] = [];
  const add = (
    id: string,
    kind: PilotEntity["kind"],
    spriteId: string,
    contact: PilotContact,
  ) => {
    const sprite = pilot.assets[spriteId];
    if (sprite) entities.push({ id, kind, spriteId, sprite, contact });
  };
  // Explicit named identity binding: no index, random selector, time or clothing swap.
  if (d.npcPresence.some((n) => n.id === "mara")) {
    add(
      "mara",
      "npc",
      "mara",
      velvetContacts[
        pilot.maraStaging === "behind-counter" ? "mara-behind" : "mara"
      ],
    );
  }
  for (const o of d.canonicalObjects) {
    // A portable object moved onto a new container is not left at its old floor contact.
    if (o.location !== d.roomId || o.damaged) continue;
    const spriteId = velvetObjectBindings[o.id];
    if (spriteId) add(o.id, "object", spriteId, velvetContacts[o.id]);
  }
  const count = d.crowdLevel === "busy" ? 5 : d.crowdLevel === "sparse" ? 2 : 0;
  for (let i = 0; i < count; i++)
    add(`anonymous-${i}`, "anonymous", i % 2 ? "patron-b" : "patron-a", {
      ...patrons[i],
      surface: "floor",
      depthBand: 1,
    });
  return entities.sort(
    (a, b) =>
      a.contact.depthBand - b.contact.depthBand ||
      a.contact.y - b.contact.y ||
      a.id.localeCompare(b.id),
  );
}

export function pilotProblems(pilot: VelvetPilot): string[] {
  const errors: string[] = [];
  for (const id of [
    "mara",
    "patron-a",
    "patron-b",
    ...Object.values(velvetObjectBindings),
  ]) {
    const a = pilot.assets[id];
    if (
      !a ||
      !a.file ||
      !a.reflection?.file ||
      !/^[a-f0-9]{64}$/.test(a.sha256)
    )
      errors.push(`Invalid sprite ${id}`);
    if (
      a &&
      (!Number.isInteger(a.width) ||
        !Number.isInteger(a.height) ||
        a.width < 1 ||
        a.width > 28 ||
        a.height < 1 ||
        a.height > 56)
    )
      errors.push(`Invalid master bounds ${id}`);
  }
  for (const [id, c] of Object.entries(velvetContacts)) {
    if (
      !Number.isInteger(c.x) ||
      !Number.isInteger(c.y) ||
      c.x < 0 ||
      c.x > 320 ||
      c.y < 0 ||
      c.y > 224
    )
      errors.push(`Invalid contact ${id}`);
  }
  return errors;
}
