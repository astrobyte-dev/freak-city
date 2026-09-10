import art from "../docs/visuals/velvet-overlay-pilot/art-provenance.json";
import { newGame, advanceTime } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import type { VelvetPilot } from "../src/visuals/velvet-pilot";

const root = "docs/visuals/velvet-overlay-pilot/";
export const velvetPilot: VelvetPilot = {
  status: "draft",
  plateSha256:
    "8b5c100cebc6b363a02a0891970e3b92e596f4b6a4b7b862ea0462fc895130b1",
  assets: Object.fromEntries(
    Object.entries(art.assets).map(([id, a]) => [
      id,
      {
        ...a,
        file: root + a.file,
        reflection: { ...a.reflection, file: root + a.reflection.file },
      },
    ]),
  ),
};
export type PilotBand = "early" | "late" | "dawn";
export type EnvelopeState = "held" | "dropped" | "retaken";
export function velvetState(
  band: PilotBand = "early",
  envelope: EnvelopeState = "held",
) {
  let s = ensureWorld(newGame("NIGHT-0"));
  const commands = ["take envelope", "go outside", "go inside", "go bar"];
  if (envelope !== "held") commands.push("drop envelope");
  if (envelope === "retaken") commands.push("take envelope");
  for (const command of commands) {
    const r = executeCommand(s, command);
    if (!r.ok) throw new Error(`Review setup command failed: ${command}`);
    s = ensureWorld(r.state);
  }
  const time = { early: 1435, late: 1600, dawn: 1755 }[band];
  if (s.time > time) throw new Error("Review setup exceeded target time");
  advanceTime(s, time - s.time);
  if (s.world!.room !== "bar") throw new Error("Review did not reach Velvet");
  return { state: s, commands };
}
