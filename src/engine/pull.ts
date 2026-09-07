// Private narrative interest shapes authored emphasis, attraction context and thematic callbacks.
import { createEngagement } from "./themes";
import { interests, type GameState, type Interest } from "./types";
const cues: Record<
  Interest,
  {
    theme?: "romance" | "socialPressure" | "surveillance";
    text: string;
    contrast: string;
  }
> = {
  curiosity: {
    text: "A filing drawer is open by an inch. Every other drawer is locked.",
    contrast:
      "For once, an open door leads to nothing more than a stock cupboard.",
  },
  candour: {
    text: "You notice the person who says “I don’t know” without checking who is listening.",
    contrast:
      "Someone starts to explain, thinks better of it, and admits they are tired.",
  },
  privacy: {
    theme: "surveillance",
    text: "The mirror above the door shows the landing, but not the alcove beside it.",
    contrast:
      "In the kitchen there are no mirrors. You had not noticed how much you were checking.",
  },
  defiance: {
    theme: "socialPressure",
    text: "There is no rope across the stairs. Everyone stops at exactly the same step anyway.",
    contrast:
      "A cleaner walks through the members-only door without slowing down.",
  },
  connection: {
    theme: "romance",
    text: "Someone has kept the chair beside them empty. They leave the decision to you.",
    contrast:
      "The spare chair is being used to hold a broken fan. You almost laugh.",
  },
  ritual: {
    text: "The host turns each receipt face down before returning it. A habit, or a rule.",
    contrast:
      "A cup goes down on a receipt and leaves a perfectly ordinary ring.",
  },
};
export function createPull(): GameState["pull"] {
  return {
    enabled: true,
    lastCue: null,
    entries: Object.fromEntries(
      interests.map((k) => [
        k,
        {
          interest: 0,
          certainty: 0,
          resistance: 0,
          familiarity: 0,
          saturation: 0,
          lastShown: -10,
          lastContext: "",
          neverGenerate: false,
        },
      ]),
    ),
  };
}
export function learn(s: GameState, key: Interest, amount: number) {
  const p = s.pull.entries[key];
  const theme = cues[key].theme;
  if (
    !s.pull.enabled ||
    p.neverGenerate ||
    (theme && s.boundaries[theme] !== "allowed")
  )
    return;
  p.interest = Math.max(-10, Math.min(10, p.interest + amount));
  p.familiarity++;
  p.certainty = Math.min(1, p.familiarity / 6);
  if (amount < 0) p.resistance++;
}
export function directObservation(
  s: GameState,
  category: string,
): string | null {
  for (const p of Object.values(s.pull.entries))
    p.saturation = Math.max(0, p.saturation - 0.25);
  if (
    !s.pull.enabled ||
    ["conflict", "intimacy"].includes(s.pacing.recent.at(-1) ?? "") ||
    s.turn % 3 !== 0
  )
    return null;
  const options = interests.filter((k) => {
    const p = s.pull.entries[k],
      theme = cues[k].theme;
    return (
      !p.neverGenerate &&
      p.interest > 0 &&
      s.turn - p.lastShown >= 5 &&
      p.saturation < 2 &&
      (!theme || s.boundaries[theme] === "allowed")
    );
  });
  options.sort((a, b) => {
    const score = (k: Interest) =>
      s.pull.entries[k].interest -
      s.pull.entries[k].saturation * 2 +
      (s.pull.entries[k].lastContext !== category ? 1 : 0);
    return score(b) - score(a);
  });
  const key = options[0];
  if (!key) return null;
  const p = s.pull.entries[key];
  p.lastShown = s.turn;
  p.saturation += 1.5;
  p.lastContext = category;
  s.pull.lastCue = key;
  return s.turn % 2 === 0 ? cues[key].contrast : cues[key].text;
}
export function forgetPull(s: GameState): GameState {
  const n = structuredClone(s);
  n.pull = createPull();
  n.pull.enabled = s.pull.enabled;
  n.attractors = {};
  n.engagement = createEngagement();
  n.pacing.observation = null;
  return n;
}
