import { rooms } from "../spaces";
import type {
  Anchor,
  RoomVisualManifest,
  VisualAsset,
} from "../../visuals/types";
import { timeBands } from "../../visuals/types";
import assets from "./assets.json";
import {
  architecture,
  fixedFurniture,
  illustrationHints,
} from "./architecture";
import { roomAffordances } from "../affordances";
import { approvedAsset } from "../../visuals/asset-contract";
const a = (
  glyph: Anchor["glyph"],
  x: number,
  y: number,
  width: number,
  height: number,
): Anchor => ({ glyph, x, y, width, height });
// Coordinates are compositional, not new geography. Entity IDs are validated against the world.
const anchors: Record<string, Record<string, Anchor>> = {
  street: {
    detail_street_wall: a("wall", 0, 15, 320, 125),
    side_door: a("door", 197, 65, 54, 112),
    detail_street_window: a("window", 51, 74, 87, 54),
    detail_street_sign: a("sign", 167, 35, 108, 21),
    detail_street_awning: a("shelf", 180, 58, 90, 8),
    detail_street_bin: a("bin", 282, 149, 22, 33),
  },
  bar: {
    detail_bar_window: a("window", 253, 29, 47, 27),
    detail_bar_shelves: a("shelf", 29, 69, 117, 28),
    detail_bar_light: a("light", 167, 19, 23, 36),
    counter: a("counter", 12, 148, 229, 36),
    detail_bar_glass: a("glass", 94, 131, 11, 17),
    detail_bar_stool: a("stool", 166, 172, 26, 35),
    detail_bar_bin: a("bin", 17, 184, 18, 21),
  },
  "loading-bay": {
    loading_door: a("door", 35, 57, 107, 119),
    camera: a("camera", 217, 31, 24, 14),
    "detail_loading-bay_trolley": a("trolley", 183, 138, 44, 46),
    "detail_loading-bay_sign": a("sign", 273, 75, 35, 21),
    "detail_loading-bay_bench": a("stool", 250, 160, 62, 27),
    "detail_loading-bay_light": a("light", 156, 39, 21, 15),
  },
  apartment: {
    detail_apartment_window: a("window", 161, 30, 85, 65),
    detail_apartment_fridge: a("fridge", 21, 82, 52, 101),
    detail_apartment_table: a("table", 112, 153, 172, 29),
    detail_apartment_chair: a("stool", 85, 163, 26, 37),
  },
};
export const visualManifests: Record<string, RoomVisualManifest> =
  Object.fromEntries(
    Object.values(rooms).map((room) => [
      room.id,
      {
        roomId: room.id,
        family:
          room.id === "apartment"
            ? "domestic"
            : room.id === "loading-bay"
              ? "service"
              : ["velvet", "upstairs", "street"].includes(room.location)
                ? "velvet"
                : "neutral",
        proofOfConcept: !!anchors[room.id],
        exposure: ["street", "loading-bay"].includes(room.id)
          ? "outside"
          : room.id === "kiosk"
            ? "sheltered"
            : "inside",
        anchors: anchors[room.id] ?? {},
        staticArchitecture: architecture[room.id] ?? [],
        fixedFurniture: fixedFurniture[room.id] ?? [],
        dynamicObjects: [
          ...new Set([
            ...Object.keys(anchors[room.id] ?? {}),
            ...(roomAffordances[room.id] ?? []).map(
              ([key]) => `detail_${room.id}_${key}`,
            ),
          ]),
        ].filter(
          (id) =>
            ![
              ...(architecture[room.id] ?? []),
              ...(fixedFurniture[room.id] ?? []),
            ].some((fact) => fact.entityId === id) &&
            anchors[room.id]?.[id]?.glyph !== "door",
        ),
        dynamicDoors: [
          ...new Set([
            ...room.exits.flatMap((exit) => (exit.door ? [exit.door] : [])),
            ...Object.entries(anchors[room.id] ?? {})
              .filter(([, a]) => a.glyph === "door")
              .map(([id]) => id),
          ]),
        ],
        atmosphereZones: [{ x: 30, y: 100, width: 260, height: 64 }],
        foregroundZones: [{ x: 0, y: 180, width: 320, height: 44 }],
        sceneIllustrationHints: illustrationHints[room.id] ?? [
          `Quiet environmental introduction to ${room.name}; no invented event or hidden discovery`,
        ],
        requiredFacts: [
          "One stable room identity across all time bands; preserve established exit relationships.",
          "Leave named characters, stateful doors and movable objects to runtime layers.",
          "Keep overlay placement zones usable at desktop and mobile sizes.",
        ],
        forbiddenFacts: [
          "Extra staircases, balconies, fireplaces or gameplay-significant exits absent from the world reference.",
          "Named NPCs, evidence, player belongings, readable story text, temporary damage or changing plot props baked into architecture.",
          "Invented booth seating or altered window placement not supported by this room's reference.",
          "Explicit sexual activity, nudity, minors, branded logos or hidden mystery facts.",
        ],
        generationPresets: {
          texture: {
            pixelWidth: 320,
            colors: 48,
            contrast: 1.3,
            displayWidth: 320,
          },
          "canonical-room": {
            pixelWidth: 320,
            colors: 48,
            contrast: 1.15,
            displayWidth: 640,
          },
          "scene-illustration": {
            pixelWidth: 320,
            colors: 64,
            contrast: 1.1,
            displayWidth: 512,
          },
          overlay: {
            pixelWidth: 320,
            colors: 48,
            contrast: 1.0,
            displayWidth: 512,
          },
        },
        npcZones: [
          { x: 260, y: 160 },
          { x: 143, y: 140 },
          { x: 78, y: 152 },
          { x: 297, y: 135 },
        ],
        variants: timeBands,
        decorativeLayers: ["rain", "reflection", "grain", "haze"],
        foreground: "texture",
      } satisfies RoomVisualManifest,
    ]),
  );
export const visualAssets = assets as VisualAsset[];
export function selectVisualAsset(
  roomId: string,
  variant: string,
  registry = visualAssets,
) {
  const approved = registry.filter(
    (a) =>
      a.roomId === roomId &&
      approvedAsset(a) &&
      ["texture", "canonical-room"].includes(a.role ?? "texture"),
  );
  return (
    approved.find(
      (a) => a.role === "canonical-room" && a.variant === "canonical",
    ) ??
    approved.find((a) => a.variant === variant) ??
    approved.find((a) => a.variant === "base")
  );
}
