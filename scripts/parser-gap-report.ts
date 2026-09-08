import { readFileSync, writeFileSync } from "node:fs";
import { validateSave } from "../src/engine/game";
import { parserGapReport } from "../src/engine/parser-report";
const filename = process.argv[2];
if (!filename)
  throw new Error(
    "Usage: npm run parser:gaps -- path/to/exported-save.json [report.json]",
  );
const state = validateSave(JSON.parse(readFileSync(filename, "utf8")));
const report = JSON.stringify(parserGapReport([state]), null, 2) + "\n";
if (process.argv[3]) writeFileSync(process.argv[3], report);
else console.log(report);
