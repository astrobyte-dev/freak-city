import { writeFileSync, mkdirSync } from "node:fs";
import { newGame } from "../src/engine/game";
import { relationshipContinuity } from "../src/content/relationships/continuity";
import { scenes } from "../src/content/scenes";
mkdirSync("artifacts", { recursive: true });
const ledgers = ["NIGHT-0", "NIGHT-1", "NIGHT-2"].map((seed) => {
  const s = newGame(seed);
  return {
    seed,
    variant: s.variant,
    objectiveTruth: s.canon.truth,
    playerKnowledge: s.canon.player,
    npcKnowledge: Object.fromEntries(
      Object.entries(s.npcs).map(([id, n]) => [id, n.knowledge]),
    ),
    npcBelief: Object.fromEntries(
      Object.entries(s.npcs).map(([id, n]) => [id, n.beliefs]),
    ),
    publicBelief: s.canon.public,
  };
});
writeFileSync(
  "artifacts/canon-ledger.json",
  JSON.stringify({ version: 1, ledgers, relationshipContinuity }, null, 2) +
    "\n",
);
writeFileSync(
  "artifacts/scene-cards.json",
  JSON.stringify(
    Object.fromEntries(Object.values(scenes).map((s) => [s.id, s.card])),
    null,
    2,
  ) + "\n",
);
writeFileSync(
  "artifacts/scene-map.json",
  JSON.stringify(
    {
      nodes: Object.values(scenes).map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        location: s.location,
        ending: !!s.ending,
      })),
      edges: Object.values(scenes).flatMap((s) =>
        s.choices.map((c) => ({
          from: s.id,
          to: c.to,
          choice: c.id,
          minutes: c.minutes,
          condition: c.when,
          theme: c.theme,
          effects: c.effects,
        })),
      ),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Exported canonical ledgers for three seeds, scene cards and scene map to artifacts/.",
);
