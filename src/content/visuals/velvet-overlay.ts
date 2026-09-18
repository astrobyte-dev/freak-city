import assets from "./velvet-overlay.json";
import type { VelvetPilot } from "../../visuals/velvet-pilot";

/** Owner-approved on 2026-09-09; matches only the locked Velvet plate. */
export const approvedVelvetPilot: VelvetPilot = {
  status: "approved-direction",
  plateSha256:
    "8b5c100cebc6b363a02a0891970e3b92e596f4b6a4b7b862ea0462fc895130b1",
  assets,
};
