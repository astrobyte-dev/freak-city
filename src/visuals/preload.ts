import { rooms } from "../content/spaces";
import { selectVisualAsset, visualAssets } from "../content/visuals/manifest";
import type { VisualAsset, VisualMode } from "./types";
export function neighbourAssets(
  roomId: string,
  variant: string,
  registry: VisualAsset[] = visualAssets,
) {
  // At most one likely adjacent image, never the whole district.
  for (const exit of rooms[roomId]?.exits ?? []) {
    const asset = selectVisualAsset(exit.to, variant, registry);
    if (asset) return [asset];
  }
  return [];
}
export function scheduleNeighbourPreload(
  roomId: string,
  variant: string,
  mode: VisualMode,
) {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (
    mode !== "on" ||
    document.hidden ||
    connection?.saveData ||
    (connection?.effectiveType && connection.effectiveType !== "4g") ||
    !window.requestIdleCallback
  )
    return () => {};
  const links: HTMLLinkElement[] = [];
  const idle = window.requestIdleCallback(() => {
    for (const asset of neighbourAssets(roomId, variant)) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "image";
      link.href = `${import.meta.env.BASE_URL}${asset.file}`;
      document.head.append(link);
      links.push(link);
    }
  });
  return () => {
    window.cancelIdleCallback(idle);
    links.forEach((link) => link.remove());
  };
}
