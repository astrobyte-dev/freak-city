import { rooms } from "../spaces";
import type {
  Anchor,
  RoomVisualManifest,
  VisualAsset,
} from "../../visuals/types";
import { timeBands } from "../../visuals/types";
import assets from "./assets.json";
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
      a.status !== "draft" &&
      a.review?.backgroundOnly &&
      a.review.worldFactsChecked,
  );
  return (
    approved.find((a) => a.variant === variant) ??
    approved.find((a) => a.variant === "base")
  );
}
