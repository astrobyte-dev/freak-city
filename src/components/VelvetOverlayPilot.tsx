import { useId, useState } from "react";
import type { VisualDescriptor } from "../visuals/types";
import {
  deriveVelvetPilot,
  hasPilotReflection,
  velvetCounter,
  velvetCounterSurface,
  velvetFloor,
  type VelvetPilot,
} from "../visuals/velvet-pilot";

/** Approved environment art; presence and grounding belong to descriptor entities. */
export function VelvetOverlayPilot({
  descriptor: d,
  pilot,
}: {
  descriptor: VisualDescriptor;
  pilot: VelvetPilot;
}) {
  const uid = useId().replaceAll(":", "");
  const [failed, setFailed] = useState<string[]>([]);
  const entities = deriveVelvetPilot(d, pilot).filter(
    (e) => !failed.includes(e.spriteId),
  );
  const tint =
    d.lighting === "low"
      ? [0.88, 0.92, 1]
      : d.lighting === "morning"
        ? [0.94, 1, 1]
        : d.lighting === "amber"
          ? [1, 0.98, 0.95]
          : [0.98, 1, 1];
  const href = (file: string) => `${import.meta.env.BASE_URL}${file}`;
  return (
    <g data-layer="velvet-overlay-pilot" data-review-status={pilot.status}>
      <defs>
        <mask
          id={`${uid}-counter`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="320"
          height="224"
        >
          <rect width="320" height="224" fill="white" />
          <polygon points={velvetCounter} fill="black" />
        </mask>
        <clipPath id={`${uid}-floor`}>
          <polygon points={velvetFloor} />
        </clipPath>
        <clipPath id={`${uid}-surface`}>
          <polygon points={velvetCounterSurface} />
        </clipPath>
        <filter
          id={`${uid}-tint`}
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <feColorMatrix
            type="matrix"
            values={`${tint[0]} 0 0 0 0 0 ${tint[1]} 0 0 0 0 0 ${tint[2]} 0 0 0 0 0 1 0`}
          />
        </filter>
      </defs>
      {entities.some((e) => e.id === "detail_bar_light") && (
        <g
          data-light-owner="detail_bar_light"
          clipPath={`url(#${uid}-surface)`}
        >
          <path
            d="M74 102H101L108 109L79 115L70 110Z"
            fill="#d3a16e"
            opacity={d.lighting === "low" ? 0.06 : 0.1}
          />
        </g>
      )}
      <g data-layer="entity-grounding">
        {entities.filter(hasPilotReflection).map((e) => (
          <g
            key={e.id}
            data-grounding-owner={e.id}
            clipPath={`url(#${uid}-${e.contact.surface === "counter" ? "surface" : "floor"})`}
          >
            <image
              data-reflection-owner={e.id}
              href={href(e.sprite.reflection.file)}
              x={e.contact.x - Math.floor(e.sprite.width / 2)}
              y={e.contact.y}
              width={e.sprite.reflection.width}
              height={e.sprite.reflection.height}
              style={{ imageRendering: "pixelated" }}
              preserveAspectRatio="none"
            />
            <path
              data-contact-owner={e.id}
              transform={`translate(${e.contact.x} ${e.contact.y})`}
              d={
                e.kind === "npc" || e.kind === "anonymous"
                  ? "M-6-1H5V1H8V2H-7V1H-9V0H-6Z"
                  : "M-5-1H4V0H6V1H-6V0H-5Z"
              }
              fill="#0b0812"
              opacity=".48"
            />
          </g>
        ))}
      </g>
      {entities.map((e) => {
        const { sprite: a, contact: c } = e;
        return (
          <g
            key={e.id}
            data-visual-npc={e.kind === "npc" ? e.id : undefined}
            data-visual-entity={e.kind === "object" ? e.id : undefined}
            data-anonymous-patron={e.kind === "anonymous" ? e.id : undefined}
            data-sprite-id={e.spriteId}
            data-sprite-sha256={a.sha256}
            data-contact={`${c.x},${c.y}`}
            data-surface={c.surface}
            data-depth-band={c.depthBand}
            data-occlusion={c.occlusion ?? "none"}
            mask={c.occlusion ? `url(#${uid}-counter)` : undefined}
            opacity={e.kind === "anonymous" ? 0.76 : 1}
          >
            <image
              href={href(a.file)}
              x={c.x - Math.floor(a.width / 2)}
              y={c.surface === "fixture" ? c.y : c.y - a.height}
              width={a.width}
              height={a.height}
              preserveAspectRatio="none"
              style={{ imageRendering: "pixelated" }}
              filter={`url(#${uid}-tint)`}
              onError={() =>
                setFailed((prev) =>
                  prev.includes(e.spriteId) ? prev : [...prev, e.spriteId],
                )
              }
            />
          </g>
        );
      })}
    </g>
  );
}
