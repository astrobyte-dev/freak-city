// Isolated review component. This file is never imported by the shipping app.
// The review runner injects it into its own headless requests only.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LocationVisual } from "../src/components/LocationVisual";
import type {
  VisualAsset,
  VisualComposition,
  VisualDescriptor,
  VisualMode,
} from "../src/visuals/types";
import metadata from "../docs/visuals/reviewed-sources/street/draft-v1/candidate/street__canonical-room__canonical__64-colours.json";
import composition from "../docs/visuals/reviewed-sources/street/draft-v1/composition.json";

const root = "docs/visuals/reviewed-sources/street/draft-v1";
export const streetDraftAsset: VisualAsset = {
  roomId: "street",
  role: "canonical-room",
  variant: "canonical",
  status: "draft",
  file: `${root}/candidate/street__canonical-room__canonical__64-colours.png`,
  sha256: metadata.sha256,
  width: 640,
  height: 448,
  bakedEntities: metadata.bakedEntities,
  composition: composition as VisualComposition,
};
const palette: Record<string, [string, number]> = {
  amber: ["#dea065", 0.07],
  low: ["#0b1f3a", 0.25],
  work: ["#d9ddd0", 0.13],
  morning: ["#9bbec4", 0.21],
  cold: ["#78aab1", 0.13],
};

export function StreetDraftVisual(props: {
  descriptor: VisualDescriptor;
  mode: VisualMode;
  preview?: boolean;
  layersRoot?: string;
}) {
  const { descriptor: original, mode } = props;
  const layersRoot = props.layersRoot ?? root;
  const shell = useRef<HTMLDivElement>(null);
  const [portal, setPortal] = useState<Element | null>(null);
  const [plateLoaded, setPlateLoaded] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const id = useId().replaceAll(":", "");
  const eligible =
    original.roomId === "street" &&
    streetDraftAsset.bakedEntities!.every((b) =>
      original.canonicalObjects.some(
        (e) =>
          e.id === b.id &&
          e.location === b.location &&
          !e.damaged &&
          e.open === b.open &&
          e.locked === b.locked,
      ),
    );
  const descriptor = eligible
    ? { ...original, baseArt: streetDraftAsset }
    : original;
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    const update = () => {
      const viewport = el.querySelector(".visual-viewport");
      const figure = el.querySelector(".location-visual");
      const image = el.querySelector<HTMLImageElement>(".visual-base");
      setPortal(viewport);
      setPlateLoaded(
        !!(
          eligible &&
          figure?.getAttribute("data-base") === streetDraftAsset.file &&
          image?.complete &&
          image.naturalWidth
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
  }, [eligible, mode, original.roomId]);
  const active = eligible && plateLoaded && mode !== "off";
  const object = (key: string) =>
    original.canonicalObjects.find(
      (e) => e.id === key && e.location === "street" && !e.damaged,
    );
  const door = object("side_door");
  const doorKey = door?.open ? "door-open" : "door-closed";
  const hasDoor = active && !!door && !failed.includes(doorKey);
  const hasSign =
    active && !!object("detail_street_sign") && !failed.includes("sign");
  const hasBin =
    active && !!object("detail_street_bin") && !failed.includes("bin");
  const hasEnvelope =
    active && !!object("envelope") && !failed.includes("envelope");
  const fail = (name: string) =>
    setFailed((previous) =>
      previous.includes(name) ? previous : [...previous, name],
    );
  const layer = (name: string, attrs: Record<string, unknown> = {}) => (
    <image
      key={name}
      data-draft-layer={name}
      href={`/${layersRoot}/layers/${name}.png`}
      x="0"
      y="0"
      width="320"
      height="224"
      onError={() => fail(name)}
      {...attrs}
    />
  );
  const [tint, opacity] = palette[original.lighting] ?? palette.amber;
  const pts = (points: number[][]) => points.map((p) => p.join(",")).join(" ");
  return (
    <div
      ref={shell}
      className="street-draft"
      data-active={active}
      data-art-door={hasDoor}
      data-art-sign={hasSign}
      data-art-bin={hasBin}
      data-art-envelope={hasEnvelope}
    >
      <style>{`
      .street-draft[data-active="true"] .pixel-rain,.street-draft[data-active="true"] .pixel-reflection{display:none}
      .street-draft[data-art-door="true"] .visual-world [data-visual-entity="side_door"],
      .street-draft[data-art-sign="true"] .visual-world [data-visual-entity="detail_street_sign"],
      .street-draft[data-art-bin="true"] .visual-world [data-visual-entity="detail_street_bin"],
      .street-draft[data-art-envelope="true"] .visual-object-register [data-visual-entity="envelope"]{display:none}
      .street-draft-layers{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none}
      .street-draft-layers image{image-rendering:pixelated}
    `}</style>
      <LocationVisual
        {...props}
        descriptor={descriptor}
        preview={eligible || props.preview}
      />
      {active &&
        portal &&
        createPortal(
          <svg
            className="street-draft-layers"
            viewBox="0 0 320 224"
            shapeRendering="crispEdges"
            aria-hidden="true"
            data-status="draft-unactivated"
          >
            <defs>
              <clipPath id={`${id}-pavement`}>
                <polygon points={pts(composition.pavementPolygon)} />
              </clipPath>
              <mask
                id={`${id}-rain`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="320"
                height="224"
              >
                <rect width="320" height="224" fill="white" />
                <polygon
                  data-mask="awning-shelter"
                  points={pts(composition.shelterPolygon)}
                  fill="black"
                />
                <polygon points={pts(composition.windowPolygon)} fill="black" />
              </mask>
              <mask id={`${id}-objects`} style={{ maskType: "alpha" }}>
                {hasDoor && layer(doorKey)}
                {hasSign && layer("sign")}
                {hasBin && layer("bin")}
                {hasEnvelope && (
                  <image
                    href={`/${layersRoot}/layers/envelope.png`}
                    x="158"
                    y="174"
                    width="10"
                    height="6"
                  />
                )}
              </mask>
            </defs>
            {hasSign && (
              <g className="draft-owner" data-owner="detail_street_sign">
                {layer("sign-effect", {
                  "data-effect-owner": "detail_street_sign",
                })}
                {layer("sign")}
              </g>
            )}
            {hasDoor && (
              <g
                className="draft-owner"
                data-owner="side_door"
                data-open={door!.open}
              >
                {door!.open && (
                  <g clipPath={`url(#${id}-pavement)`}>
                    {layer("door-open-effect", {
                      "data-effect-owner": "side_door",
                    })}
                  </g>
                )}
                {layer(doorKey)}
              </g>
            )}
            {hasBin && (
              <g className="draft-owner" data-owner="detail_street_bin">
                <g clipPath={`url(#${id}-pavement)`}>
                  {layer("bin-effect", {
                    "data-effect-owner": "detail_street_bin",
                  })}
                </g>
                {layer("bin")}
              </g>
            )}
            {hasEnvelope && (
              <g className="draft-owner" data-owner="envelope">
                <g clipPath={`url(#${id}-pavement)`}>
                  {layer("envelope-effect", {
                    "data-effect-owner": "envelope",
                  })}
                </g>
                <image
                  data-draft-layer="envelope"
                  href={`/${layersRoot}/layers/envelope.png`}
                  x="158"
                  y="174"
                  width="10"
                  height="6"
                  onError={() => fail("envelope")}
                />
              </g>
            )}
            <rect
              width="320"
              height="224"
              fill={tint}
              opacity={opacity}
              mask={`url(#${id}-objects)`}
            />
            {mode === "on" && original.overlays.includes("rain") && (
              <g data-draft-weather="rain" mask={`url(#${id}-rain)`}>
                {layer("rain")}
              </g>
            )}
          </svg>,
          portal,
        )}
    </div>
  );
}

export function StreetPolishedDraftVisual(props: {
  descriptor: VisualDescriptor;
  mode: VisualMode;
  preview?: boolean;
}) {
  return (
    <StreetDraftVisual
      {...props}
      layersRoot="docs/visuals/reviewed-sources/street/draft-v2-polish"
    />
  );
}
