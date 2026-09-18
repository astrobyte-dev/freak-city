import { scheduleNeighbourPreload } from "../visuals/preload";
import { VelvetOverlayPilot } from "./VelvetOverlayPilot";
import { approvedVelvetPilot } from "../content/visuals/velvet-overlay";
import {
  pilotEnabled,
  deriveVelvetPilot,
  type VelvetPilot,
} from "../visuals/velvet-pilot";
import {
  memo,
  useEffect,
  useId,
  useState,
  useRef,
  type RefObject,
} from "react";
import type {
  VisualDescriptor,
  VisualMode,
  VisualObject,
} from "../visuals/types";
function ObjectSprite({ object }: { object: VisualObject }) {
  const a = object.anchor!;
  const { width: w, height: h } = a;
  let shape;
  switch (a.glyph) {
    case "wall":
      shape = (
        <>
          <rect width={w} height={h} fill="#332b30" />
          <path
            d="M0 20H320M0 40H320M0 60H320M0 80H320M0 100H320M30 0V20M95 20V40M160 40V60M225 60V80"
            stroke="#403338"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "door":
      shape = (
        <>
          <rect width={w} height={h} fill="#71614e" />
          <rect x="3" y="3" width={w - 6} height={h - 3} fill="#090e12" />
          <path
            d={
              object.open
                ? `M4 3L${w * 0.4} 12V${h - 5}L4 ${h - 1}Z`
                : `M4 4H${w - 4}V${h - 2}H4Z`
            }
            fill="#34393b"
          />
          <rect
            x={object.open ? w * 0.3 : w - 12}
            y={h * 0.56}
            width="3"
            height="4"
            fill="#b4a180"
          />
        </>
      );
      break;
    case "window":
      shape = (
        <>
          <rect width={w} height={h} fill="#625b52" />
          <rect x="3" y="3" width={w - 6} height={h - 6} fill="#38555b" />
          <path
            d={`M${w / 2} 0V${h}M0 ${h / 2}H${w}`}
            stroke="#25272d"
            strokeWidth="3"
          />
          <path
            d={`M8 6L${w * 0.45} ${h - 6}M${w * 0.55} 6L${w - 8} ${h - 6}`}
            stroke="#647375"
            strokeWidth="2"
            opacity=".5"
          />
        </>
      );
      break;
    case "sign":
      shape = (
        <>
          <rect
            width={w}
            height={h}
            fill="#14141b"
            stroke="#61444a"
            strokeWidth="2"
          />
          <text
            x={w / 2}
            y={h * 0.69}
            textAnchor="middle"
            fontSize={object.id.includes("street") ? 12 : 8}
            fill={object.id.includes("street") ? "#d77b9e" : "#c7b99a"}
          >
            {object.id.includes("street") ? "VELVET" : "BUS"}
          </text>
        </>
      );
      break;
    case "counter":
    case "table":
      shape = (
        <>
          <rect y="5" width={w} height={h - 5} fill="#30272a" />
          <rect width={w} height="7" fill="#84705a" />
          <path
            d={`M5 ${h}V${h + 17}M${w - 8} ${h}V${h + 17}`}
            stroke="#171d22"
            strokeWidth="6"
          />
          <path d={`M8 3H${w - 9}`} stroke="#af9470" />
        </>
      );
      break;
    case "shelf":
      shape = (
        <>
          <rect width={w} height={h} fill="#27252a" />
          <path
            d={`M0 0H${w}M0 ${h - 2}H${w}`}
            stroke="#85705b"
            strokeWidth="4"
          />
          {object.id.includes("shelves") &&
            [7, 21, 36, 51, 64, 81, 98].map((x, i) => (
              <path
                key={x}
                d={`M${x} 8V${h - 5}h7V8h-2V4h-3v4Z`}
                fill={i % 2 ? "#54605b" : "#514248"}
              />
            ))}
        </>
      );
      break;
    case "stool":
      shape = (
        <>
          <rect y="4" width={w} height="7" fill="#776052" />
          <path
            d={`M4 11V${h}M${w - 5} 11V${h}M4 ${h - 8}H${w - 5}`}
            stroke="#363b3c"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "light":
      shape = (
        <>
          <path d={`M${w / 2} 0V${h / 2}`} stroke="#79716a" strokeWidth="2" />
          <path d={`M4 ${h / 2}H${w - 4}L${w} ${h - 4}H0Z`} fill="#8a7454" />
          <rect y={h - 4} width={w} height="3" fill="#d5b176" />
        </>
      );
      break;
    case "glass":
    case "mug":
      shape = (
        <>
          <path d={`M0 0H${w}L${w - 2} ${h}H2Z`} fill="#81908c" opacity=".8" />
          <rect x="2" y="2" width={w - 4} height="3" fill="#bac3b8" />
        </>
      );
      break;
    case "bin":
    case "fridge":
      shape = (
        <>
          <rect
            width={w}
            height={h}
            fill={a.glyph === "fridge" ? "#7d8179" : "#384040"}
          />
          <path
            d={`M1 ${h * 0.35}H${w}M${w - 7} ${h * 0.46}v12`}
            stroke="#333a3c"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="3"
            width="2"
            height={h - 6}
            fill="#abb0a0"
            opacity=".35"
          />
        </>
      );
      break;
    case "camera":
      shape = (
        <>
          <path
            d={`M${w * 0.5} ${h * 0.65}v9h12`}
            fill="none"
            stroke="#797c74"
            strokeWidth="3"
          />
          <path d={`M0 0H${w}V${h * 0.6}L3 ${h}Z`} fill="#999b8a" />
          <rect y="3" width="4" height="7" fill="#131b20" />
        </>
      );
      break;
    case "trolley":
      shape = (
        <>
          <path
            d={`M7 0H${w - 7}V${h - 8}H7ZM7 ${h - 20}H${w - 7}`}
            fill="none"
            stroke="#6c7776"
            strokeWidth="4"
          />
          <rect x="4" y={h - 7} width="7" height="7" fill="#10191d" />
          <rect x={w - 11} y={h - 7} width="7" height="7" fill="#10191d" />
        </>
      );
      break;
    case "kettle":
      shape = (
        <>
          <path d={`M5 7H${w - 5}L${w} ${h - 3}H0Z`} fill="#92917e" />
          <path
            d={`M${w - 4} 7h7v12h-5M8 5h8`}
            stroke="#444d4d"
            strokeWidth="3"
            fill="none"
          />
        </>
      );
      break;
  }
  return (
    <g
      data-visual-entity={object.id}
      data-open={object.open}
      transform={`translate(${a.x} ${a.y})`}
    >
      <title>{`${object.name}${object.open === undefined ? "" : object.open ? " — open" : " — closed"}`}</title>
      {shape}
      {object.damaged && (
        <path
          d={`M0 0L${w} ${h}M${w} 0L0 ${h}`}
          stroke="#b2a58a"
          strokeWidth="2"
        />
      )}
    </g>
  );
}
function useAmbientMotion(
  mode: VisualMode,
  viewport: RefObject<HTMLDivElement | null>,
  roomId: string,
) {
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () =>
      setPaused(mode !== "on" || query.matches || document.hidden || !visible);
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      update();
    });
    if (viewport.current) observer.observe(viewport.current);
    update();
    query.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [mode, viewport, roomId]);
  return paused;
}
export const LocationVisual = memo(function LocationVisual({
  descriptor: d,
  mode,
  preview = false,
  overlayPilot = approvedVelvetPilot,
}: {
  descriptor: VisualDescriptor;
  mode: VisualMode;
  preview?: boolean;
  overlayPilot?: VelvetPilot;
}) {
  const id = useId().replaceAll(":", "");
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(
    () => scheduleNeighbourPreload(d.roomId, d.visualVariant, mode),
    [d.roomId, d.visualVariant, mode],
  );
  const [failed, setFailed] = useState<string[]>([]);
  const eligibleScene =
    mode !== "off" && d.sceneArt && !failed.includes(d.sceneArt.file)
      ? d.sceneArt
      : undefined;
  const cue = eligibleScene?.file;
  const [presentation, setPresentation] = useState(() => ({
    active: cue,
    seen: cue ? [cue] : [],
  }));
  useEffect(() => {
    setPresentation((previous) => {
      if (!cue || previous.seen.includes(cue))
        return previous.active === cue
          ? previous
          : { ...previous, active: undefined };
      return { active: cue, seen: [...previous.seen, cue] };
    });
    if (!cue) return;
    const timer = window.setTimeout(
      () =>
        setPresentation((previous) =>
          previous.active === cue
            ? { ...previous, active: undefined }
            : previous,
        ),
      6000,
    );
    return () => window.clearTimeout(timer);
  }, [cue]);
  const scene = presentation.active === cue ? eligibleScene : undefined;
  const asset =
    scene ??
    (d.baseArt && !failed.includes(d.baseArt.file) ? d.baseArt : undefined);
  const viewKey = `${d.roomId}:${scene?.file ?? "environment"}`;
  const paused = useAmbientMotion(mode, viewport, viewKey);
  const baked =
    asset?.role === "canonical-room"
      ? new Set(asset.bakedEntities?.map((e) => e.id))
      : new Set<string>();
  const composition =
    asset?.role === "canonical-room" ? asset.composition : undefined;
  const pilot =
    !scene && asset === d.baseArt && pilotEnabled(d, overlayPilot)
      ? overlayPilot
      : undefined;
  const pilotEntities = pilot ? deriveVelvetPilot(d, pilot) : [];
  const pilotObjects = new Set(
    pilotEntities.filter((e) => e.kind === "object").map((e) => e.id),
  );
  const atmosphere = (composition?.atmosphereZones ??
    d.manifest.atmosphereZones)[0];
  const anchored = d.canonicalObjects
    .map((e) =>
      composition &&
      (e.location === d.roomId || d.doors.some((door) => door.id === e.id))
        ? { ...e, anchor: composition.anchors[e.id] }
        : e,
    )
    .filter((e) => e.anchor && !baked.has(e.id))
    .sort(
      (a, b) =>
        Number(b.anchor?.glyph === "wall") - Number(a.anchor?.glyph === "wall"),
    );
  const other = d.canonicalObjects.filter((e) => !e.anchor);
  return (
    <figure
      className={`location-visual visual-${mode} lighting-${d.lighting}`}
      data-testid="location-visual"
      data-room={d.roomId}
      data-variant={d.visualVariant}
      data-paused={paused}
      data-base={asset?.file ?? "procedural"}
      data-asset-role={asset?.role ?? (asset ? "texture" : "procedural")}
    >
      {mode !== "off" && (
        <div
          ref={viewport}
          className="visual-viewport"
          aria-hidden="true"
          key={viewKey}
        >
          {asset && (
            <img
              className="visual-base"
              src={`${import.meta.env.BASE_URL}${asset.file}`}
              width={asset.width}
              height={asset.height}
              alt=""
              decoding="async"
              loading="eager"
              onError={() => setFailed((files) => [...files, asset.file])}
            />
          )}
          <svg
            viewBox="0 0 320 224"
            className="visual-world"
            shapeRendering="crispEdges"
            focusable="false"
          >
            <defs>
              <pattern
                id={`${id}-grit`}
                width="19"
                height="17"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="2"
                  y="4"
                  width="2"
                  height="1"
                  fill="#a39885"
                  opacity=".12"
                />
                <rect
                  x="12"
                  y="12"
                  width="3"
                  height="1"
                  fill="#03090e"
                  opacity=".5"
                />
              </pattern>
            </defs>
            {!asset && (
              <g data-layer="background">
                <rect
                  width="320"
                  height="224"
                  fill={
                    d.manifest.family === "domestic"
                      ? "#303538"
                      : d.manifest.family === "service"
                        ? "#292f32"
                        : "#29232b"
                  }
                />
                <path d="M0 179L320 171V224H0Z" fill="#171f26" />
                <path
                  d="M0 205L320 181M30 224L180 175M210 224L256 173"
                  stroke="#364044"
                  opacity=".5"
                />
                <rect width="320" height="224" fill={`url(#${id}-grit)`} />
              </g>
            )}
            {!scene && (
              <g data-layer="objects">
                {anchored
                  .filter((e) => !pilotObjects.has(e.id))
                  .map((e) => (
                    <ObjectSprite object={e} key={e.id} />
                  ))}
              </g>
            )}
            {!scene && !pilot && (
              <g data-layer="anonymous-atmosphere" opacity=".22">
                {Array.from(
                  {
                    length:
                      d.crowdLevel === "busy"
                        ? 5
                        : d.crowdLevel === "sparse"
                          ? 2
                          : 0,
                  },
                  (_, i) => (
                    <path
                      key={i}
                      transform={`translate(${atmosphere.x + ((i + 0.5) * atmosphere.width) / 5} ${atmosphere.y})`}
                      d="M0 0h7v9H0zM-4 11h15v31H-4z"
                      fill="#777472"
                    />
                  ),
                )}
              </g>
            )}
            {!scene && (
              <g data-layer="npcs">
                {d.npcPresence.map((n, index) =>
                  pilotEntities.some(
                    (e) => e.kind === "npc" && e.id === n.id,
                  ) ? null : (
                    <g
                      key={n.id}
                      data-visual-npc={n.id}
                      transform={`translate(${composition?.npcZones[index]?.x ?? n.x} ${composition?.npcZones[index]?.y ?? n.y})`}
                    >
                      <path
                        d="M-5-48H5V-37H-5ZM-9-34H9L14-4H-14ZM-9-4H-1V16H-9ZM2-4H10V16H2Z"
                        fill="#10171e"
                      />
                      <path
                        d="M-5-47H5V-43H-5M-9-33V-10"
                        stroke="#9b8a79"
                        strokeWidth="2"
                      />
                      <text
                        textAnchor="middle"
                        y="27"
                        fill="#e4d8be"
                        fontSize="8"
                      >
                        {n.name.split(" ")[0]}
                      </text>
                    </g>
                  ),
                )}
              </g>
            )}
            {!scene && !pilot && d.overlays.includes("reflection") && (
              <g
                data-layer="reflection"
                className="pixel-reflection"
                fill="#728c90"
                opacity=".32"
              >
                <path d="M30 196h74v2H30ZM119 211h49v2h-49ZM193 200h91v2h-91Z" />
                <path d="M198 187h31v3h-31ZM210 209h28v2h-28Z" fill="#a56079" />
              </g>
            )}
            <rect
              width="320"
              height="224"
              className="visual-light"
              data-layer="lighting"
            />
            {pilot && <VelvetOverlayPilot descriptor={d} pilot={pilot} />}
            {mode === "on" && d.overlays.includes("grain") && (
              <g data-layer="foreground" fill={`url(#${id}-grit)`}>
                {(
                  composition?.foregroundZones ?? d.manifest.foregroundZones
                ).map((zone, index) => (
                  <rect {...zone} key={index} />
                ))}
              </g>
            )}
          </svg>
          {!scene && mode === "on" && d.overlays.includes("rain") && (
            <div className="pixel-rain" data-layer="rain" />
          )}
          {!scene && mode === "on" && d.overlays.includes("haze") && (
            <div className="pixel-haze" data-layer="haze" />
          )}
          <div className="visual-edge" />
          <span className="visual-stamp">
            {scene ? "ILLUSTRATION" : preview ? "ART PREVIEW" : "THE QUARTER"} /{" "}
            {d.timeBand}
          </span>
        </div>
      )}
      <figcaption>
        {scene && (
          <p className="visual-presence">
            {scene.illustration?.caption} · Illustrated moment
          </p>
        )}
        <div className="visual-caption-line">
          <span>{d.roomName}</span>
          <span>
            {mode === "off"
              ? "TEXT VIEW"
              : d.manifest.proofOfConcept
                ? "WORLD STUDY"
                : "ROOM STUDY"}
          </span>
        </div>
        <p className="visual-presence">
          {d.npcPresence.length
            ? `Here: ${d.npcPresence.map((n) => n.name).join(", ")}.`
            : "No named characters here."}
        </p>
        <details className="visual-context">
          <summary>In view · {d.canonicalObjects.length} objects</summary>
          <ul>
            {d.canonicalObjects.map((e) => (
              <li key={e.id}>
                {e.name}
                {e.open === undefined ? "" : e.open ? " (open)" : " (closed)"}
                {e.damaged ? " (damaged)" : ""}
              </li>
            ))}
          </ul>
          {d.specialEventState && <p>{d.specialEventState}</p>}
          <p>
            Type what you want to try. The room description and parser remain
            your guide.
          </p>
        </details>
        {mode !== "off" && other.length > 0 && (
          <div className="visual-object-register" aria-hidden="true">
            {other.map((e) => (
              <span data-visual-entity={e.id} data-open={e.open} key={e.id}>
                {e.name}
                {e.open === undefined ? "" : e.open ? " · open" : " · closed"}
              </span>
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
});
