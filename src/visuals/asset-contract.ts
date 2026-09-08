import { assetRoles, type VisualAsset } from "./types";

/** Used by runtime selection as well as build checks; legacy v1 means texture. */
export function approvedAsset(a: VisualAsset): boolean {
  const role = a.role ?? "texture";
  if (
    !assetRoles.includes(role) ||
    !["reviewed", "canonical"].includes(a.status) ||
    !a.review?.by?.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(a.review.at) ||
    !a.review.worldFactsChecked
  )
    return false;
  if (role === "texture")
    return a.review.backgroundOnly === true && !a.authoritativeArchitecture;
  if (role === "canonical-room")
    return (
      a.variant === "canonical" &&
      a.authoritativeArchitecture === true &&
      a.review.architectureChecked === true &&
      a.review.compositionChecked === true &&
      a.review.nonExplicit === true &&
      !!a.composition?.anchors &&
      Array.isArray(a.composition.npcZones) &&
      a.composition.npcZones.length >= 4 &&
      !!a.composition.atmosphereZones?.length &&
      !!a.composition.foregroundZones?.length &&
      Array.isArray(a.bakedEntities)
    );
  if (role === "scene-illustration")
    return (
      a.authoritativeGeometry === false &&
      !a.authoritativeArchitecture &&
      a.review.nonExplicit === true &&
      !!a.illustration?.caption?.trim() &&
      !!a.illustration.sceneId &&
      Array.isArray(a.illustration.timeBands) &&
      Array.isArray(a.illustration.requiredNPCs) &&
      Array.isArray(a.illustration.themes)
    );
  // Raster overlay generation is an authoring role. Shipping requires a future mask/state binding contract.
  return false;
}
