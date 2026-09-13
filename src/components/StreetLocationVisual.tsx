// Exact owner-approved street layers; the simulation and loaded canonical plate gate every owner.
// The existing LocationVisual remains the fallback and renders all other gameplay objects.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LocationVisual } from "./LocationVisual";
import type { VisualDescriptor, VisualMode } from "../visuals/types";
import approved from "../content/visuals/street-overlay.json";
const composition = approved.composition;
type LayerName = keyof typeof approved.layers;
const href = (name: LayerName) =>
  `${import.meta.env.BASE_URL}${approved.layers[name].file}`;
const palette: Record<string, [string, number]> = {
  amber: ["#dea065", 0.07],
  low: ["#0b1f3a", 0.25],
  work: ["#d9ddd0", 0.13],
  morning: ["#9bbec4", 0.21],
  cold: ["#78aab1", 0.13],
};

export function StreetLocationVisual(props: {
  descriptor: VisualDescriptor;
  mode: VisualMode;
  preview?: boolean;
}) {
  const { descriptor: original, mode } = props;
  const shell = useRef<HTMLDivElement>(null);
  const [portal, setPortal] = useState<Element | null>(null);
  const [plateLoaded, setPlateLoaded] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const id = useId().replaceAll(":", "");
  const eligible =
    original.roomId === "street" &&
    original.baseArt?.sha256 === approved.plateSha256;
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
          figure?.getAttribute("data-base") === original.baseArt?.file &&
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
  }, [eligible, mode, original.roomId, original.baseArt?.file]);
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
  const layer = (name: LayerName, attrs: Record<string, unknown> = {}) => (
    <image
      key={name}
      data-street-layer={name}
      href={href(name)}
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
      className="street-art"
      data-active={active}
      data-art-door={hasDoor}
      data-art-sign={hasSign}
      data-art-bin={hasBin}
      data-art-envelope={hasEnvelope}
    >
      <style>{`
      .street-art[data-active="true"] .pixel-rain,.street-art[data-active="true"] .pixel-reflection{display:none}
      .street-art[data-art-door="true"] .visual-world [data-visual-entity="side_door"],
      .street-art[data-art-sign="true"] .visual-world [data-visual-entity="detail_street_sign"],
      .street-art[data-art-bin="true"] .visual-world [data-visual-entity="detail_street_bin"],
      .street-art[data-art-envelope="true"] .visual-object-register [data-visual-entity="envelope"]{display:none}
      .street-art-layers{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;pointer-events:none}
      .street-art-layers image{image-rendering:pixelated}
    `}</style>
      <LocationVisual
        {...props}
        descriptor={original}
        preview={props.preview}
      />
      {active &&
        portal &&
        createPortal(
          <svg
            className="street-art-layers"
            viewBox="0 0 320 224"
            shapeRendering="crispEdges"
            aria-hidden="true"
            data-status="approved"
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
                    href={href("envelope")}
                    x="158"
                    y="174"
                    width="10"
                    height="6"
                  />
                )}
              </mask>
            </defs>
            {hasSign && (
              <g className="street-owner" data-owner="detail_street_sign">
                {layer("sign-effect", {
                  "data-effect-owner": "detail_street_sign",
                })}
                {layer("sign")}
              </g>
            )}
            {hasDoor && (
              <g
                className="street-owner"
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
              <g className="street-owner" data-owner="detail_street_bin">
                <g clipPath={`url(#${id}-pavement)`}>
                  {layer("bin-effect", {
                    "data-effect-owner": "detail_street_bin",
                  })}
                </g>
                {layer("bin")}
              </g>
            )}
            {hasEnvelope && (
              <g className="street-owner" data-owner="envelope">
                <g clipPath={`url(#${id}-pavement)`}>
                  {layer("envelope-effect", {
                    "data-effect-owner": "envelope",
                  })}
                </g>
                <image
                  data-street-layer="envelope"
                  href={href("envelope")}
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
              <g data-street-weather="rain" mask={`url(#${id}-rain)`}>
                {layer("rain")}
              </g>
            )}
          </svg>,
          portal,
        )}
    </div>
  );
}
