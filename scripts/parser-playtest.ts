import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { newGame, validateSave } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { variants } from "../src/content/world";
import { contentMigration } from "../src/content/parser-content";
import { rooms, locations } from "../src/content/spaces";
const results: unknown[] = [];
for (const seed of ["NIGHT-0", "NIGHT-1", "NIGHT-2"]) {
  for (const ending of ["protect", "public", "power", "ghost"]) {
    let s = ensureWorld(newGame(seed));
    s.started = true;
    s.alias = "Ash";
    const start = [
      "look",
      "take envelope",
      "open it",
      "take invitation",
      "put it in my coat",
      "go outside",
      "go inside",
      "go bar",
      "ask Mara about invitation",
      "ask her why she recognised it",
      "wait 40",
      "go archive",
      "open service envelope",
      `read ${variants[s.variant].proof}`,
      "take ledger",
    ];
    const decision =
      ending === "protect"
        ? ["redact ledger", "go bar"]
        : ending === "public"
          ? ["go bar", "go stage", "give ledger to Luca", "go bar"]
          : ending === "power"
            ? [
                "go bar",
                "go upstairs",
                "open office door",
                "enter",
                "give ledger to Celeste",
                "leave",
                "go downstairs",
              ]
            : ["go bar"];
    const commands = [...start, ...decision, "go outside", "go home", "sleep"];
    for (const command of commands) {
      const next = executeCommand(s, command);
      assert(
        next.ok,
        `${seed}/${ending}: ${command}: ${next.state
          .world!.transcript.at(-1)!
          .passages.map((p) => p.text)
          .join(" ")}`,
      );
      s = next.state;
      validateSave(JSON.parse(JSON.stringify(s)));
    }
    assert.equal(s.flags.ending, ending);
    assert(s.canon.player.includes("sender"));
    assert(s.flags.parserNightEnded);
    results.push({
      seed,
      variant: s.variant,
      ending,
      time: s.time,
      commands,
      knowledge: s.canon.player,
      moral: s.moral,
      npcs: s.npcs,
      transcript: s.world!.transcript,
    });
  }
}
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  "artifacts/parser-playthroughs.json",
  JSON.stringify({ runs: results.length, results }, null, 2) + "\n",
);
writeFileSync(
  "artifacts/parser-content-migration.json",
  JSON.stringify(
    {
      sceneCount: contentMigration.length,
      locations,
      rooms,
      scenes: contentMigration,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${results.length} scripted parser campaigns passed across all three seeds and four custody outcomes; every command state passed save validation. ${contentMigration.length} preserved scenes indexed.`,
);
