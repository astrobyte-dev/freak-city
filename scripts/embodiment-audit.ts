import { writeFileSync, mkdirSync } from "node:fs";
import { scenes } from "../src/content/scenes";
import { contentMigration } from "../src/content/parser-content";
import {
  embodimentEdits,
  parserPassages,
} from "../src/content/parser-passages";
const pattern =
  /\byou (?:sit|take|accept|give|tell|follow|drink|ask|move|suggest|show|put|hand|agree|nod|sign|read|hold)\b/i;
const audit = contentMigration.map((scene) => {
  const source = scenes[scene.id];
  const passages = source.passages.flatMap((p, index) => {
    const edited = parserPassages(scene.id, [p])[0];
    if (!pattern.test(p.text) && edited.text === p.text) return [];
    const consequential =
      /\byou (?:accept|give|follow|drink|show|hand|agree|sign)\b/i.test(
        edited.text,
      );
    return [
      {
        index,
        original: p.text,
        parser: edited.text,
        disposition:
          edited.text !== p.text
            ? "parser presentation corrected"
            : consequential
              ? "retained within explicitly chosen authored outcome; review granularity during human playtest"
              : "retained reciprocal conversation / trivial presentation",
        reveals: p.reveals ?? [],
      },
    ];
  });
  return {
    scene: scene.id,
    kind: scene.kind,
    room: scene.room,
    entryEffects: source.onEnter ?? [],
    passages,
  };
});
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  "artifacts/parser-embodiment-audit.json",
  JSON.stringify(
    {
      scenes: audit.length,
      scenesWithPresentationEdits: Object.keys(embodimentEdits).length,
      policy:
        "Original manuscript preserved. Parser requires explicit movement and custody; ordinary reciprocal questions remain conversation texture. This audit is a review aid, not proof that prose never implies an action.",
      audit,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Embodiment audit: ${audit.length} scenes accounted for; ${Object.keys(embodimentEdits).length} scenes have targeted parser presentation edits.`,
);
