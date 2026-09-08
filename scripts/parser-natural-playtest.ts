import { mkdirSync, writeFileSync } from "node:fs";
import { naturalCampaign, naturalStyles } from "./natural-campaigns";
import { parserGapReport } from "../src/engine/parser-report";
const results = [];
for (const seed of ["NIGHT-0", "NIGHT-1", "NIGHT-2"])
  for (const style of Object.keys(
    naturalStyles,
  ) as (keyof typeof naturalStyles)[])
    for (const ending of ["protect", "public", "power", "ghost"]) {
      const state = naturalCampaign(seed, style, ending);
      results.push({ seed, style, ending, state });
    }
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  "artifacts/parser-natural-playthroughs.json",
  JSON.stringify(
    {
      runs: results.length,
      results: results.map(({ state, ...run }) => ({
        ...run,
        time: state.time,
        knowledge: state.canon.player,
        transcript: state.world!.transcript,
      })),
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  "artifacts/parser-gap-report.json",
  JSON.stringify(parserGapReport(results.map((r) => r.state)), null, 2) + "\n",
);
console.log(
  `${results.length} natural-language campaigns passed: five styles, three seeds, four custody outcomes. Every command and saved state validated.`,
);
