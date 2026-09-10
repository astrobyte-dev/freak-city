import { writeFileSync } from "node:fs";
import { format } from "prettier";
import plan from "../tools/visual-gen/production-plan.json";
import { rooms } from "../src/content/spaces";
import { generationDefinition } from "../src/content/visuals/generation";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";

if (
  new Set(plan.map((p) => p.room)).size !== Object.keys(rooms).length ||
  plan.some((p) => !rooms[p.room])
)
  throw new Error(
    "Production plan must cover every persistent room exactly once",
  );
const state = ensureWorld(newGame());
const lines = [
  "# First-night visual asset plan",
  "",
  "Audited against the 17 persistent rooms in `src/content/spaces.ts`, their affordances, and current visual manifests. Priorities are production judgments based on hub connectivity, narrative role and repeated use—not measured dwell-time analytics. No locations or gameplay events are added.",
  "",
  "## Product decisions",
  "",
  "- Canonical gameplay rooms provide stable place: manifest → layout → blockout → bounded surface work → optional documented cleanup → pixel masters → human review → runtime composite validation.",
  "- Cinematic scene illustrations provide occasional feeling and always have `authoritativeGeometry: false`. Suggestions below are art opportunities, not new scenes or approved bindings.",
  "- Dynamic overlays provide changing simulation state. The texture role remains a supporting material study, not a fourth gameplay product.",
  "",
  "## Production order and identity",
  "",
  "Tier A: hero rooms; Tier B: supporting identity; Tier C: procedural/simple transitional assets first. Work one approved composition through the whole pipeline before scaling production.",
  "",
  "| Order | Existing room | Tier / importance | Family | Canonical plate | Canonical view | Secondary view | Difficulty |",
  "| ---: | --- | --- | --- | --- | --- | --- | --- |",
];
const cell = (s: string) => s.replaceAll("|", "/");
for (const p of [...plan].sort((a, b) => a.priority - b.priority))
  lines.push(
    `| ${p.priority} | ${p.room} | ${p.tier} | ${p.family} | ${p.plate} | ${cell(p.view)} | ${cell(p.secondary)} | ${p.difficulty} |`,
  );
lines.push(
  "",
  "## Dynamic layers and illustration opportunities",
  "",
  "All six time bands remain available: early, night, late, closing, dawn, day (plus the existing base texture fallback). Time treatment changes light/atmosphere, never room geometry. Named NPCs, props and evidence must be derived from current state. Some art roadmap examples below describe styling work still to implement; they are not claims that every overlay already has a renderer.",
  "",
  "| Room | Overlay art needs | Actual dynamic entity / door count at audit | Scene illustration opportunity | Time / light treatment |",
  "| --- | --- | --- | --- | --- |",
);
for (const p of plan) {
  const m = generationDefinition(p.room, state, "canonical-room");
  const light = p.family.startsWith("Apartment")
    ? "Muted practical light; colder dawn; no nightclub neon"
    : p.family.startsWith("Service")
      ? "Functional neutral/work light; limited spill; weather only where exposed"
      : p.family.startsWith("Backstage")
        ? "Fluorescent work light with pink spill; practical closing treatment"
        : p.family.startsWith("Exteriors")
          ? "Pink/cyan signage and reflections; rain/steam only in supported zones; dawn desaturates"
          : "Venue pink/cyan or private crimson; late low light, closing work light, dawn cooling";
  lines.push(
    `| ${p.room} | ${cell(p.overlays)} | ${m.dynamicObjects.length} / ${m.dynamicDoors.length} | ${cell(p.illustration)} | ${light}; exposure: ${m.weatherCompatibility} |`,
  );
}
lines.push(
  "",
  "## Geography and permanent-fact audit",
  "",
  "Only facts already in the permanent manifest may be baked. The current fixed-entity allowlist is conservative: bare bar counter, empty bar shelves and identified permanent windows/exterior features. Desks, chairs, appliances, containers, signs and scenery outside that allowlist remain reserved zones until separately reviewed for static/dynamic separation. Proposed art families do not add mirrors, racks, cables, booths or furniture to rooms that lack them.",
  "",
  "| Room | Actual routes | Current permanent visual facts |",
  "| --- | --- | --- |",
);
for (const p of plan) {
  const m = generationDefinition(p.room, state, "canonical-room");
  lines.push(
    `| ${p.room} | ${m.exits.map((e) => e.to).join(", ")} | ${cell([...m.staticArchitecture, ...m.fixedFurniture].map((f) => f.text).join("; "))} |`,
  );
}
lines.push(
  "",
  "## First production gate",
  "",
  "Review Velvet's existing layout, the new regional masks, one masked room study with actual runtime overlays, and the four separate slow-shift illustration drafts. No canonical plate is approved yet. Then finish Velvet's surfaces and cleanup before mapping the next Tier A room. Secondary views are deferred until their sightlines and occlusion are reviewed.",
  "",
  "This world has no separate playable backstage/dressing-room, VIP-booth or alley room. Backstage is an art family applied only to existing work/cloakroom spaces. Do not create those example locations from the art brief. Keep Room 06 unseen. Scene proposals require existing authored scene IDs, actual character presence, spoiler review and boundary compatibility before any shipping binding.",
  "",
  "See [production workflow and experiments](VISUAL-PRODUCTION-REPORT.md), [art families](VISUAL-STYLE.md), [model strategy](VISUAL-MODEL-STRATEGY.md), and [overlay roadmap](VISUAL-OVERLAY-ROADMAP.md).",
  "",
  "Generated with `npx tsx scripts/visual-production-plan.ts`; edit `tools/visual-gen/production-plan.json` and regenerate when the production order changes.",
);
writeFileSync(
  "docs/VISUAL-ASSET-PLAN.md",
  await format(lines.join("\n") + "\n", { parser: "markdown" }),
);
console.log(
  `Audited ${plan.length} rooms: ${["A", "B", "C"].map((t) => `${plan.filter((p) => p.tier === t).length} Tier ${t}`).join(", ")}`,
);
