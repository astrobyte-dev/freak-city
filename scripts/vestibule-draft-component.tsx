// Review-only adapter. Never imported by the shipping application.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LocationVisual } from "../src/components/LocationVisual";
import type {
  VisualAsset,
  VisualComposition,
  VisualDescriptor,
  VisualMode,
} from "../src/visuals/types";
import composition from "../docs/visuals/reviewed-sources/vestibule/draft-v1/composition.json";
import metadata from "../docs/visuals/reviewed-sources/vestibule/draft-v1/candidate/vestibule__canonical-room__canonical__64-colours.json";

const root = "docs/visuals/reviewed-sources/vestibule/draft-v1";
export const vestibuleDraftAsset: VisualAsset = {
  roomId: "vestibule",
  role: "canonical-room",
  variant: "canonical",
  status: "draft",
  file: `${root}/candidate/vestibule__canonical-room__canonical__64-colours.png`,
  sha256: metadata.sha256,
  width: 640,
  height: 448,
  bakedEntities: [],
  composition: composition as VisualComposition,
};
const owners = [
  ["ledge", "ledge"],
  ["detail_vestibule_bench", "bench"],
  ["detail_vestibule_notice", "notice"],
  ["detail_vestibule_heater", "heater"],
  ["detail_vestibule_book", "book"],
  ["detail_vestibule_bag", "bag"],
] as const;
const palette: Record<string, [string, number]> = {
  amber: ["#dea065", 0.07],
  low: ["#0b1f3a", 0.25],
  work: ["#d9ddd0", 0.13],
  morning: ["#9bbec4", 0.21],
  cold: ["#78aab1", 0.13],
};

export function VestibuleDraftVisual(props: {
  descriptor: VisualDescriptor;
  mode: VisualMode;
  preview?: boolean;
}) {
  const { descriptor: original, mode } = props;
  const eligible = original.roomId === "vestibule";
  const descriptor = eligible
    ? { ...original, baseArt: vestibuleDraftAsset }
    : original;
  const shell = useRef<HTMLDivElement>(null);
  const [portal, setPortal] = useState<Element | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const id = useId().replaceAll(":", "");
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const update = () => {
      const figure = el.querySelector(".location-visual");
      const img = el.querySelector<HTMLImageElement>(".visual-base");
      setPortal(el.querySelector(".visual-viewport"));
      setLoaded(
        !!(
          eligible &&
          figure?.getAttribute("data-base") === vestibuleDraftAsset.file &&
          img?.complete &&
          img.naturalWidth
        ),
      );
    };
    const observer = new MutationObserver(update);
    observer.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-base", "src"],
    });
    el.addEventListener("load", update, true);
    el.addEventListener("error", update, true);
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("load", update, true);
      el.removeEventListener("error", update, true);
    };
  }, [eligible, mode]);
  const active = eligible && loaded && mode !== "off";
  const visible = (key: string) =>
    original.canonicalObjects.find((e) => e.id === key && !e.damaged);
  const local = (key: string) => {
    const e = visible(key);
    return e?.location === "vestibule" ? e : undefined;
  };
  // Shared side_door is stored in street; descriptor.doors supplies its other-side visibility.
  const door = original.doors.find((e) => e.id === "side_door" && !e.damaged);
  const doorLayer = door?.open ? "door-open" : "door-closed";
  const hasDoor = active && !!door && !failed.includes(doorLayer);
  const shown = owners.filter(
    ([owner, layer]) => active && local(owner) && !failed.includes(layer),
  );
  const hasLedge = shown.some(([owner]) => owner === "ledge");
  const envelope = visible("envelope");
  const placement =
    envelope?.location === "vestibule"
      ? "floor"
      : envelope?.location === "ledge" && hasLedge
        ? "ledge"
        : undefined;
  const hasEnvelope = active && !!placement && !failed.includes("envelope");
  const position = placement
    ? composition.envelope[placement]
    : composition.envelope.floor;
  const fail = (name: string) =>
    setFailed((old) => (old.includes(name) ? old : [...old, name]));
  const layer = (name: string, effectOwner?: string) => (
    <image
      key={name}
      data-vestibule-layer={name}
      data-effect-owner={effectOwner}
      href={`/${root}/layers/${name}.png`}
      width="320"
      height="224"
      onError={() => fail(name)}
    />
  );
  const envelopeImage = (handler = true) => (
    <image
      data-vestibule-layer={handler ? "envelope" : undefined}
      href={`/${root}/layers/envelope.png`}
      x={position.x}
      y={position.y}
      width="10"
      height="6"
      onError={handler ? () => fail("envelope") : undefined}
    />
  );
  const [tint, opacity] = palette[original.lighting] ?? palette.amber;
  const hidden = [
    ...(hasDoor ? ["side_door"] : []),
    ...shown.map(([owner]) => owner),
    ...(hasEnvelope ? ["envelope"] : []),
  ];
  return (
    <div
      ref={shell}
      className="vestibule-draft"
      data-active={active}
      data-envelope-placement={hasEnvelope ? placement : "none"}
      data-status="draft-unactivated"
    >
      <style>{`.vestibule-draft-layers{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none}.vestibule-draft-layers image{image-rendering:pixelated}${hidden.map((owner) => `.vestibule-draft .visual-world [data-visual-entity="${owner}"],.vestibule-draft .visual-object-register [data-visual-entity="${owner}"]{display:none}`).join("")}`}</style>
      <LocationVisual
        {...props}
        descriptor={descriptor}
        preview={eligible || props.preview}
      />
      {active &&
        portal &&
        createPortal(
          <svg
            className="vestibule-draft-layers"
            viewBox="0 0 320 224"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={`${id}-floor`}>
                <polygon
                  points={composition.floorPolygon
                    .map((p) => p.join(","))
                    .join(" ")}
                />
              </clipPath>
              <mask id={`${id}-objects`} style={{ maskType: "alpha" }}>
                {hasDoor && layer(doorLayer)}
                {shown.map(([, name]) => layer(name))}
                {hasEnvelope && envelopeImage(false)}
              </mask>
            </defs>
            {hasDoor && (
              <g
                className="vestibule-owner"
                data-owner="side_door"
                data-open={door!.open}
              >
                {door!.open && (
                  <g clipPath={`url(#${id}-floor)`}>
                    {layer("door-open-effect", "side_door")}
                  </g>
                )}
                {layer(doorLayer)}
              </g>
            )}
            {shown.map(([owner, name]) => (
              <g className="vestibule-owner" data-owner={owner} key={owner}>
                {layer(`${name}-effect`, owner)}
                {layer(name)}
              </g>
            ))}
            {hasEnvelope && (
              <g
                className="vestibule-owner"
                data-owner="envelope"
                data-location={envelope!.location}
              >
                {layer(`envelope-${placement}-effect`, "envelope")}
                {envelopeImage()}
              </g>
            )}
            <rect
              width="320"
              height="224"
              fill={tint}
              opacity={opacity}
              mask={`url(#${id}-objects)`}
            />
          </svg>,
          portal,
        )}
    </div>
  );
}
