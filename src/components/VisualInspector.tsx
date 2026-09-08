import { generationDefinition } from "../content/visuals/generation";
import { useMemo, useState } from "react";
import type { GameState } from "../engine/types";
import { deriveVisualState } from "../visuals/derive";
import {
  lightings,
  overlayNames,
  timeBands,
  type VisualOverrides,
} from "../visuals/types";
import { LocationVisual } from "./LocationVisual";
export function VisualInspector({ state }: { state: GameState }) {
  const [overrides, setOverrides] = useState<VisualOverrides>({});
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
        <pre className="debug-json">
          {JSON.stringify(
            {
              required: generationDefinition(descriptor.roomId, state)
                .requiredVisualFacts,
              forbidden: generationDefinition(descriptor.roomId, state)
                .forbiddenVisualFacts,
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
