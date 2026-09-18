import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CommandTerminal } from "../src/components/CommandTerminal";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";

// Browser-only test harness: real terminal, deliberately delayed response delivery.
export const calls: string[] = [];
const pending: (() => void)[] = [];
export function respond() {
  pending.shift()?.();
}
function Fixture() {
  const [state, setState] = useState(() =>
    ensureWorld(newGame("INPUT-FIXTURE")),
  );
  return (
    <CommandTerminal
      state={state}
      onCommand={(command) => {
        calls.push(command);
        return new Promise<void>((resolve) =>
          pending.push(() => {
            setState((s) => executeCommand(s, command).state);
            resolve();
          }),
        );
      }}
    />
  );
}
export function mount() {
  document.getElementById("root")!.hidden = true;
  const container = document.createElement("div");
  document.body.append(container);
  createRoot(container).render(<Fixture />);
}
