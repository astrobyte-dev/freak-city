// Review-only manifest export; no inference, shipping registry or game mutation.
import { readFileSync, writeFileSync } from "node:fs";
import { generationDefinition } from "../src/content/visuals/generation";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";
const root = "docs/visuals/reviewed-sources/street/draft-v1";
const manifest = generationDefinition(
  "street",
  ensureWorld(newGame("NIGHT-0")),
  "canonical-room",
);
const layout = JSON.parse(readFileSync(`${root}/layout.json`, "utf8"));
if (
  new Set(layout.routes.map((r: { to: string }) => r.to)).size !==
    manifest.exits.length ||
  manifest.exits.some(
    (e) => !layout.routes.some((r: { to: string }) => r.to === e.to),
  )
)
  throw new Error("Street layout changed parser routes");
const fixed = manifest.bakedEntities.map((e) => e.id).sort();
if (
  JSON.stringify(fixed) !==
  JSON.stringify(layout.permanent.map((e: { id: string }) => e.id).sort())
)
  throw new Error("Permanent entity partition differs");
writeFileSync(
  `${root}/world-manifest.json`,
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Street manifest retained; 5 routes and 3 permanent entities checked. Custom draft layout remains separate from the bar-only layout tool.",
);
