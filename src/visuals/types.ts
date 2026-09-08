import type { Entity } from "../engine/world-types";
import type { NPCId } from "../engine/types";
export const timeBands = [
  "early",
  "night",
  "late",
  "closing",
  "dawn",
  "day",
] as const;
export type TimeBand = (typeof timeBands)[number];
export const lightings = ["amber", "low", "cold", "work", "morning"] as const;
export type Lighting = (typeof lightings)[number];
export type VisualMode = "on" | "reduced" | "off";
export type Weather = "rain" | "dry";
export const overlayNames = ["rain", "reflection", "grain", "haze"] as const;
export type Overlay = (typeof overlayNames)[number];
export interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
  glyph:
    | "door"
    | "window"
    | "sign"
    | "counter"
    | "shelf"
    | "stool"
    | "light"
    | "glass"
    | "bin"
    | "camera"
    | "trolley"
    | "fridge"
    | "table"
    | "kettle"
    | "mug"
    | "wall";
}
export interface VisualAsset {
  roomId: string;
  variant: string;
  status: "draft" | "reviewed" | "canonical";
  file: string;
  sha256: string;
  width: number;
  height: number;
  review?: {
    by: string;
    at: string;
    backgroundOnly: true;
    worldFactsChecked: true;
  };
}
export interface RoomVisualManifest {
  roomId: string;
  family: "velvet" | "service" | "domestic" | "neutral";
  proofOfConcept: boolean;
  exposure: "outside" | "sheltered" | "inside";
  anchors: Record<string, Anchor>;
  npcZones: readonly { x: number; y: number }[];
  variants: readonly TimeBand[];
  decorativeLayers: readonly Overlay[];
  foreground: "texture";
}
export interface VisualObject extends Pick<
  Entity,
  "id" | "name" | "aliases" | "kind" | "location" | "open" | "locked"
> {
  anchor?: Anchor;
  damaged: boolean;
}
export interface VisualDescriptor {
  roomId: string;
  roomName: string;
  locationId: string;
  timeBand: TimeBand;
  weather: Weather;
  lighting: Lighting;
  crowdLevel: "quiet" | "sparse" | "busy";
  atmosphere: string;
  npcPresence: { id: NPCId; name: string; x: number; y: number }[];
  canonicalObjects: VisualObject[];
  visibleEvidence: string[];
  doors: VisualObject[];
  containers: VisualObject[];
  damageState: Record<string, boolean>;
  openedState: Record<string, boolean>;
  specialEventState: string;
  visualVariant: string;
  baseArt?: VisualAsset;
  overlays: Overlay[];
  manifest: RoomVisualManifest;
}
/** Art direction only. Never applied to simulation or stored in saves. */
export interface VisualOverrides {
  timeBand?: TimeBand;
  lighting?: Lighting;
  weather?: Weather;
  visualVariant?: string;
  overlay?: Overlay | "none";
}
