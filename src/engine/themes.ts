import { scenes } from "../content/scenes";
import { taxonomy } from "../content/taxonomy";
import type { GameState } from "./types";
export function createEngagement(): GameState["engagement"] {
  return Object.fromEntries(
    taxonomy.map((t) => [
      t.id,
      {
        interest: 0,
        familiarity: 0,
        certainty: 0,
        resistance: 0,
        uncertainty: 0,
        intensity: 0,
        contexts: [],
        orientation: t.orientation,
        trustDependency: t.trust,
        privacy: t.privacy,
        neverGenerate: false,
        lastShown: -10,
        saturation: 0,
      },
    ]),
  );
}
export function learnTheme(
  s: GameState,
  id: string,
  response: "explore" | "avoid" | "uncertain",
  context: string,
) {
  const t = taxonomy.find((t) => t.id === id),
    p = s.engagement[id];
  if (
    !s.pull.enabled ||
    !t ||
    !p ||
    s.boundaries[t.theme] === "skip" ||
    p.neverGenerate
  )
    return;
  p.familiarity++;
  p.contexts = [...new Set([...p.contexts, context])];
  if (response === "explore") p.interest = Math.min(10, p.interest + 1);
  if (response === "avoid") {
    p.resistance++;
    p.interest = Math.max(-10, p.interest - 2);
  }
  if (response === "uncertain") p.uncertainty++;
  p.certainty = Math.max(0, Math.min(1, (p.familiarity - p.uncertainty) / 8));
  p.intensity = Math.min(3, Math.floor(p.familiarity / 4));
}
export function thematicObservation(s: GameState, category: string) {
  for (const p of Object.values(s.engagement))
    p.saturation = Math.max(0, p.saturation - 0.25);
  if (
    !s.pull.enabled ||
    s.turn % 4 !== 0 ||
    ["conflict", "intimacy"].includes(s.pacing.recent.at(-1) ?? "") ||
    !["velvet", "upstairs"].includes(scenes[s.scene].location)
  )
    return null;
  const privateContext =
    category === "intimacy" ||
    scenes[s.scene].category === "intimacy" ||
    [
      "terms",
      "hidden",
      "carbon_case",
      "proxy_case",
      "letter_case",
      "source_call",
    ].includes(s.scene);
  const choices = taxonomy.filter((t) => {
    const p = s.engagement[t.id];
    return (
      p &&
      (p.privacy !== "private" || privateContext) &&
      s.boundaries[t.theme] === "allowed" &&
      !p.neverGenerate &&
      p.interest >= 2 &&
      p.certainty >= 0.25 &&
      s.turn - p.lastShown >= 6 &&
      p.saturation < 2 &&
      t.compatible.some(
        (id) =>
          scenes[s.scene].passages.some((line) => line.speaker === id) &&
          s.npcs[id].relationship.trust >= p.trustDependency,
      )
    );
  });
  const t = choices.sort(
    (a, b) =>
      s.engagement[b.id].interest -
      s.engagement[b.id].saturation -
      (s.engagement[a.id].interest - s.engagement[a.id].saturation),
  )[0];
  if (!t) return null;
  const p = s.engagement[t.id];
  p.lastShown = s.turn;
  p.saturation += 1.5;
  return s.turn % 8 === 0 ? t.contrast : t.observation;
}
