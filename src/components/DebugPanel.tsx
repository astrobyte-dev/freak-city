import { parserGapReport } from "../engine/parser-report";
import { useState } from "react";
import type { GameState } from "../engine/types";
import { scenes } from "../content/scenes";
import {
  choose,
  advanceTime,
  newGame,
  availableChoices,
  choiceEnabled,
} from "../engine/game";
export function DebugPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  const [section, setSection] = useState("canon");
  const [eventId, setEventId] = useState("");
  const keys = [
    "canon",
    "relationships",
    "flags",
    "player",
    "npcs",
    "pull",
    "engagement",
    "attractors",
    "events",
    "rumours",
    "moral",
    "traits",
    "boundaries",
    "pacing",
    "history",
  ] as const;
  return (
    <>
      <p className="fine-print">
        Development only. Contains objective truths and spoilers. Mutations can
        create non-canonical states.
      </p>
      <div className="debug-controls">
        <label>
          Jump to scene
          <select
            value={state.scene}
            onChange={(e) => {
              const n = structuredClone(state);
              n.scene = e.target.value;
              onChange(n);
            }}
          >
            {Object.values(scenes).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Composure
          <input
            type="range"
            min="0"
            max="100"
            value={state.player.composure}
            onChange={(e) => {
              const n = structuredClone(state);
              n.player.composure = Number(e.target.value);
              onChange(n);
            }}
          />
        </label>
        <label>
          Seed
          <input
            defaultValue={state.seed}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onChange(newGame(e.currentTarget.value, state.mode));
            }}
          />
        </label>
        <button
          className="secondary-button"
          onClick={() => {
            const n = structuredClone(state);
            advanceTime(n, 15);
            onChange(n);
          }}
        >
          Advance 15 minutes
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const choice = availableChoices(state).find((c) =>
              choiceEnabled(state, c),
            );
            if (choice) onChange(choose(state, choice.id));
          }}
        >
          Simulate next valid choice
        </button>
      </div>
      <div className="debug-controls">
        <label>
          Scheduled event
          <select
            aria-label="Scheduled event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">Choose an event</option>
            {state.events
              .filter((e) => e.status === "pending")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {e.at}
                </option>
              ))}
          </select>
        </label>
        <button
          className="secondary-button"
          disabled={
            !state.events.some(
              (e) => e.id === eventId && e.status === "pending",
            )
          }
          onClick={() => {
            const e = state.events.find(
              (e) => e.id === eventId && e.status === "pending",
            );
            if (e) {
              const n = structuredClone(state);
              advanceTime(n, Math.max(0, e.at - n.time));
              onChange(n);
            }
          }}
        >
          Run through this event
        </button>
        <button
          className="secondary-button"
          onClick={() => onChange(newGame(state.seed, state.mode))}
        >
          Reset this seed
        </button>
      </div>
      <div className="debug-tabs">
        {keys.map((k) => (
          <button
            className={section === k ? "active" : ""}
            key={k}
            onClick={() => setSection(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <pre className="debug-json">
        {JSON.stringify(state[section as (typeof keys)[number]], null, 2)}
      </pre>
      {state.world && (
        <details>
          <summary>Parser gap report</summary>
          <p className="fine-print">
            Local command diagnostics. Export the save to reproduce failures
            with npm run parser:gaps.
          </p>
          <pre className="debug-json">
            {JSON.stringify(parserGapReport([state]), null, 2)}
          </pre>
        </details>
      )}
      <details>
        <summary>Current scene card</summary>
        <pre className="debug-json">
          {JSON.stringify(scenes[state.scene].card, null, 2)}
        </pre>
      </details>
    </>
  );
}
