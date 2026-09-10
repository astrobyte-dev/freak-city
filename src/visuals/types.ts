import type { Entity } from "../engine/world-types";
import type { NPCId, Theme } from "../engine/types";
export const assetRoles = [
  "texture",
  "canonical-room",
  "scene-illustration",
  "overlay",
] as const;
export type AssetRole = (typeof assetRoles)[number];
export interface ArchitectureFact {
  text: string;
  model?: string;
  entityId?: string;
}
export interface VisualZone {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface VisualComposition {
  anchors: Record<string, Anchor>;
  npcZones: readonly { x: number; y: number }[];
  atmosphereZones: readonly VisualZone[];
  foregroundZones: readonly VisualZone[];
}
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
  /** Missing role means the original v1 texture contract. */
  role?: AssetRole;
  roomId: string;
  variant: string;
  status: "draft" | "reviewed" | "canonical";
  file: string;
  sha256: string;
  width: number;
  height: number;
  authoritativeArchitecture?: boolean;
  authoritativeGeometry?: boolean;
  bakedEntities?: {
    id: string;
    location: string;
    open?: boolean;
    locked?: boolean;
  }[];
  composition?: VisualComposition;
  illustration?: {
    sceneId: string;
    caption: string;
    timeBands: TimeBand[];
    requiredNPCs: NPCId[];
    themes: Theme[];
  };
  review?: {
    by: string;
    at: string;
    backgroundOnly?: true;
    worldFactsChecked: true;
    architectureChecked?: true;
    compositionChecked?: true;
    nonExplicit?: true;
  };
}
export interface RoomVisualManifest {
  roomId: string;
  family: "velvet" | "service" | "domestic" | "neutral";
  proofOfConcept: boolean;
  exposure: "outside" | "sheltered" | "inside";
  anchors: Record<string, Anchor>;
  staticArchitecture: readonly ArchitectureFact[];
  fixedFurniture: readonly ArchitectureFact[];
  dynamicObjects: readonly string[];
  dynamicDoors: readonly string[];
  atmosphereZones: readonly VisualZone[];
  foregroundZones: readonly VisualZone[];
  sceneIllustrationHints: readonly string[];
  requiredFacts: readonly string[];
  forbiddenFacts: readonly string[];
  generationPresets: Record<
    AssetRole,
    {
      pixelWidth: number;
      colors: number;
      contrast: number;
      displayWidth: number;
    }
  >;
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
  sceneArt?: VisualAsset;
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
