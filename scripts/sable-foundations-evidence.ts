import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial } from "../src/trial/state";
import { openingPromises } from "../src/trial/interaction-content";
import { buildPlaytestExport, emptyArchive } from "../src/trial/playtest";
import { interactionFixture } from "../tests/fixtures/interaction-fixture";

const output = resolve(
  process.env.SABLE_FOUNDATIONS_REPORT ??
    "artifacts/sable-foundations-20260917/reducer-evidence",
);
mkdirSync(output, { recursive: true });
function write(name: string, value: unknown) {
  writeFileSync(
    resolve(output, name),
    typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
  );
}
write("opening-promises.json", openingPromises);
// Complete the inventory with the existing controls explicitly advertised in
// the preamble. Manual prose review covers implied/background possibilities.
const controls = [
  { id: "look", commands: ["look"], response: "counter", untimed: true },
  { id: "help", commands: ["help"], response: "LOOK describes", untimed: true },
  {
    id: "journal",
    commands: ["journal"],
    response: "Your notes",
    untimed: true,
  },
  {
    id: "private-thought",
    commands: ["think"],
    response: "Private:",
    untimed: true,
  },
  {
    id: "evening",
    commands: ["ask Sable about their evening"],
    response: "lids",
    untimed: false,
  },
  {
    id: "company",
    commands: ["talk with Sable"],
    response: "Tea, coffee or water",
    untimed: false,
  },
  {
    id: "rest",
    commands: ["go home", "rest until tomorrow"],
    response: "choose to rest",
    untimed: false,
  },
];
write(
  "opening-controls.json",
  controls.map((control) => {
    const state = control.commands.reduce(executeTrial, newTrial());
    const entry = state.transcript.at(-1)!;
    assert.equal(entry.failed, false, control.id);
    assert.ok(
      entry.lines
        .join(" ")
        .toLowerCase()
        .includes(control.response.toLowerCase()),
      control.id,
    );
    if (control.untimed) assert.equal(state.time, 1080, control.id);
    return {
      ...control,
      passed: true,
      responseLines: entry.lines,
      diagnostics: entry.diagnostics,
    };
  }),
);
const cases = {
  "human-phrases": [
    "no it dosen't sound threatening",
    "yes very threatening",
    "talk",
    "yes very threatening",
    "tell me more",
    "coffee",
    "take cup",
    "take another sip of coffee",
    "finish cup",
    "ask for another drink",
    "read menu",
    "yes ill have another coffee",
    "put down the cup",
  ],
  "remote-refill": [
    "coffee",
    "take cup",
    "go home",
    "finish cup",
    "put down cup",
    "go bar",
    "ask for another drink",
    "order another coffee",
  ],
  "two-vessels": [
    "coffee",
    "take cup",
    "water",
    "take glass",
    "sip drink",
    "finish cup",
    "ask for another coffee",
    "inventory",
  ],
  "claims-and-inspection": [
    "Sable, I found a picture that might show you",
    "tell me more",
    "go shop",
    "take photo",
    "go bar",
    "show photo to Sable",
    "read menu",
    "tell me more",
  ],
};
for (const [name, commands] of Object.entries(cases)) {
  const state = commands.reduce(
    (s, c) => validateTrial(JSON.parse(JSON.stringify(executeTrial(s, c)))),
    newTrial("Foundation"),
  );
  const exported = buildPlaytestExport(
    state,
    emptyArchive(),
    "Synthetic reducer replay, not a human transcript. Validated save/reload after every command.",
  );
  write(`${name}.md`, exported.markdown);
  write(`${name}.json`, exported.diagnostic);
}
for (const name of ["Rowan", "Kit"]) {
  const f = interactionFixture();
  const commands = [
    `ask ${name} about the notice`,
    "no it doesn't sound severe",
    "tell me more",
    `${name}, order coffee`,
    `${name}, order tea`,
    "sip drink",
    "take mug",
    "have one more sip of the mug",
    "finish mug",
    "put down mug",
    `${name}, I discovered a snapshot`,
    "take snapshot",
    `show snapshot to ${name}`,
    "tell me more",
  ];
  const ledger = commands.map((command) => ({
    command,
    result: f.command(command),
    state: structuredClone(f.state),
    observations: structuredClone(f.observations),
  }));
  write(`synthetic-${name.toLowerCase()}.json`, ledger);
}
if (process.argv[2]) {
  const directory = resolve(process.argv[2]);
  const diag = JSON.parse(
    readFileSync(
      resolve(directory, "sable-playtest-diagnostics-SPOILERS.json"),
      "utf8",
    ),
  );
  const state = validateTrial(diag.state);
  const expected = buildPlaytestExport(state, diag.history, diag.note);
  const actual = readFileSync(
    resolve(directory, "sable-playtest-transcript.md"),
    "utf8",
  );
  assert.equal(
    actual,
    expected.markdown,
    "Visible transcript and diagnostics do not match",
  );
  assert.equal(diag.identifiers.trialBuild, "sable-foundations-3");
  const counts: Record<string, number> = {};
  for (const entry of state.transcript)
    for (const d of entry.diagnostics ?? [])
      counts[d.outcome] = (counts[d.outcome] ?? 0) + 1;
  write("visible-export-verification.json", {
    exactMatch: true,
    build: diag.identifiers,
    entries: state.transcript.length,
    outcomes: counts,
    vessels: Object.values(state.entities).filter(
      (e) => e.properties.interaction === "vessel",
    ),
  });
}
console.log(`Foundation evidence written to ${output}`);
