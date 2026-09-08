import { useMemo, useState } from "react";
import type { GameState } from "../engine/types";
import { deriveVisualState } from "../visuals/derive";
import {
  lightings,
  overlayNames,
  timeBands,
  assetRoles,
  type AssetRole,
  type VisualOverrides,
} from "../visuals/types";
import { LocationVisual } from "./LocationVisual";
export function VisualInspector({ state }: { state: GameState }) {
  const [overrides, setOverrides] = useState<VisualOverrides>({});
  const [role, setRole] = useState<AssetRole>("canonical-room");
  const descriptor = useMemo(
    () => deriveVisualState(state, overrides),
    [state, overrides],
  );
  const fields = {
    timeBand: timeBands,
    lighting: lightings,
    weather: ["rain", "dry"],
    visualVariant: ["base", ...timeBands],
    overlay: ["none", ...overlayNames],
  } as const;
  return (
    <details data-testid="visual-inspector">
      <summary>Visual state / art direction</summary>
      <p className="fine-print">
        Preview only. Overrides affect this preview, never gameplay, NPC
        locations, object visibility or saves. Closing the inspector discards
        them.
      </p>
      <div className="debug-controls">
        {Object.entries(fields).map(([key, options]) => (
          <label key={key}>
            Preview {key}
            <select
              aria-label={`Preview ${key}`}
              value={overrides[key as keyof VisualOverrides] ?? ""}
              onChange={(e) =>
                setOverrides((current) => ({
                  ...current,
                  [key]: e.target.value || undefined,
                }))
              }
            >
              <option value="">Simulation / default</option>
              {options.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="secondary-button" onClick={() => setOverrides({})}>
          Reset visual preview
        </button>
      </div>
      <div className="visual-debug-preview">
        <LocationVisual descriptor={descriptor} mode="reduced" preview />
      </div>
      <details>
        <summary>Required / forbidden visual facts</summary>
        <label>
          Asset role
          <select
            aria-label="Asset role"
            value={role}
            onChange={(e) => setRole(e.target.value as AssetRole)}
          >
            {assetRoles.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <pre className="debug-json">
          {JSON.stringify(
            {
              role,
              required:
                role === "texture"
                  ? [
                      "Empty material/lighting texture; all recognizable objects remain runtime layers.",
                    ]
                  : role === "scene-illustration"
                    ? [
                        "Non-explicit authored illustration; match major world facts and the scene/NPC/boundary binding.",
                      ]
                    : role === "overlay"
                      ? [
                          "Atmospheric layer study; reviewed masks and simulation bindings required before shipping.",
                        ]
                      : descriptor.manifest.requiredFacts,
              forbidden:
                role === "texture"
                  ? [
                      "Recognizable architecture, people, objects, evidence or damage baked into the texture.",
                    ]
                  : role === "scene-illustration"
                    ? [
                        "Contradictory major geography, invented evidence, hidden discoveries, explicit imagery or minors.",
                      ]
                    : role === "overlay"
                      ? [
                          "Baked architecture, people or gameplay-significant props.",
                        ]
                      : descriptor.manifest.forbiddenFacts,
              staticArchitecture: descriptor.manifest.staticArchitecture,
              fixedFurniture: descriptor.manifest.fixedFurniture,
              dynamicObjects: descriptor.manifest.dynamicObjects,
              dynamicDoors: descriptor.manifest.dynamicDoors,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <pre className="debug-json">
        {JSON.stringify({ ...descriptor, manifest: undefined }, null, 2)}
      </pre>
    </details>
  );
}
