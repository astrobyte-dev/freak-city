import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { newGame, validateSave } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { exportSave } from "../src/engine/save";
import {
  clockLabel,
  socialTime,
  agreementFor,
} from "../src/engine/commitments";

const output = "docs/design/inez-envelope-review";
mkdirSync(output, { recursive: true });
const arrival = ["take envelope", "go outside", "go inside"];
const ask = "ask Inez to keep my envelope while I visit the bar";
const early = [ask, "I'll be back in eight minutes", "sounds good"];
export const socialReviewCases: Record<string, string[]> = {
  "on-time-and-natural-callback": [
    ...arrival,
    ask,
    "yes, please",
    "go bar",
    "joke with Mara",
    "go vestibule",
    "take envelope",
    "go bar",
    "wait until 00:38",
    "go vestibule",
    "talk Inez",
  ],
  "player-time-and-renegotiation": [
    ...arrival,
    ...early,
    "could I have a little longer?",
    "two minutes",
    "okay",
    "go bar",
    "watch Mara for thirty seconds",
    "go vestibule",
    "collect my envelope",
  ],
  "refusal-without-debt": [
    ...arrival,
    ask,
    "no, thanks",
    "go bar",
    "joke with Mara",
  ],
  "changed-mind": [
    ...arrival,
    ask,
    "sure",
    "no",
    "yes",
    "take envelope",
    "go bar",
  ],
  "missed-and-repaired": [
    ...arrival,
    ...early,
    "wait until 00:01",
    "yes, please",
    "sorry I'm late",
    "go bar",
    "wait until 00:38",
    "go vestibule",
    "talk Inez",
  ],
  "unseen-collection-and-later-possession": [
    ...arrival,
    ask,
    "okay",
    "go bar",
    "tell Mara I promised Inez I'd collect my envelope",
    "wait until 00:16",
    "go vestibule",
    "take envelope",
    "go bar",
    "wait until 00:38",
    "go vestibule",
    "talk Inez",
    "yes",
    "sorry I'm late",
  ],
  "availability-refusal": [
    ...arrival,
    ask,
    "yes",
    "can I have ten more minutes?",
    "take envelope",
  ],
  "contradicted-claim": [
    ...arrival,
    ask,
    "yes",
    "I already collected it",
    "take envelope",
  ],
  "return-shift-and-front-route": [
    ...arrival,
    "wait until 02:38",
    ask,
    "that works",
    "go bar",
    "go outside",
    "go front entrance",
    "go vestibule",
    "take envelope",
  ],
  "scope-drink-report": [
    ...arrival,
    ask,
    "yes please",
    "tell Inez I got a drink",
  ],
  "scope-travel-change": [
    ...arrival,
    ask,
    "yes please",
    "tell Inez I changed my mind about going to the bar",
  ],
  "scope-opening-hours": [
    ...arrival,
    ask,
    "yes please",
    "ask Inez how much longer the bar stays open",
  ],
  "scope-mixed-reference": [
    ...arrival,
    ask,
    "yes please",
    "tell Inez cancel the envelope arrangement and my dinner",
  ],
  "revision-declined": [
    ...arrival,
    ...early,
    "can I have two more minutes",
    "no thanks",
    "wait until 00:02",
  ],
  "revision-agreement-cancelled": [
    ...arrival,
    ...early,
    "can I have two more minutes",
    "cancel the envelope arrangement",
    "wait until 00:02",
  ],
  "revision-clarified-decline": [
    ...arrival,
    ...early,
    "can I have two more minutes",
    "I've changed my mind",
    "no extra time",
    "wait until 00:02",
  ],
  "revision-clarified-cancellation": [
    ...arrival,
    ...early,
    "can I have two more minutes",
    "I've changed my mind",
    "yes",
    "the original arrangement",
    "wait until 00:02",
  ],
};
const results = Object.entries(socialReviewCases).map(([name, commands]) => {
  let state = ensureWorld(newGame("NIGHT-0"));
  state.started = true;
  state.alias = "Ash";
  const steps = commands.map((command, index) => {
    const before = state;
    const result = executeCommand(state, command);
    state = result.state;
    const entry = state.world!.transcript.at(-1)!;
    if (name.startsWith("revision-") && command === "I've changed my mind") {
      assert.deepEqual(agreementFor(state), agreementFor(before));
      assert.deepEqual(state.world!.social!.offer, before.world!.social!.offer);
      assert.equal(socialTime(state), socialTime(before));
    }
    if (name.startsWith("scope-") && index === commands.length - 1) {
      // Ordinary conversation may have no authored answer. It must not invent care intent.
      for (const key of [
        "agreements",
        "events",
        "observations",
        "offer",
      ] as const)
        assert.deepEqual(state.world!.social![key], before.world!.social![key]);
      assert.deepEqual(
        state.world!.entities.envelope,
        before.world!.entities.envelope,
      );
      assert.equal(state.npcs.inez.beliefs.envelopeCollection, undefined);
      if (name === "scope-mixed-reference") {
        assert.equal(socialTime(state), socialTime(before));
        assert(
          entry.passages.some((p) =>
            p.text.includes("Do you mean your envelope"),
          ),
        );
      } else assert(!entry.passages.some((p) => p.from === "commitment"));
    } else
      assert(
        result.ok,
        `${name}: ${command}: ${entry.passages.map((p) => p.text).join(" ")}`,
      );
    assert.deepEqual(
      JSON.parse(exportSave(validateSave(JSON.parse(exportSave(state))))),
      JSON.parse(exportSave(state)),
    );
    return {
      command,
      ok: result.ok,
      at: clockLabel(socialTime(state)),
      seconds: entry.seconds,
      passages: entry.passages,
    };
  });
  if (name.startsWith("revision-")) {
    assert.equal(
      agreementFor(state)!.status,
      name === "revision-declined" || name === "revision-clarified-decline"
        ? "missed"
        : "cancelled",
    );
    assert.equal(state.world!.social!.offer, undefined);
    assert.equal(state.world!.entities.envelope.location, "ledge");
  }
  return { name, steps, state, agreement: agreementFor(state) ?? null };
});
writeFileSync(`${output}/states.json`, JSON.stringify(results, null, 2) + "\n");
writeFileSync(
  `${output}/TRANSCRIPTS.md`,
  "# Representative player transcripts\n\nSynthetic local runs through the implemented parser, not mock dialogue. Every step passes save validation. All timestamps are simulation time. Existing longer authored passages are retained so the new callback can be reviewed in context.\n\n" +
    results
      .map(
        (r) =>
          `## ${r.name}\n\nOutcome: **${r.agreement?.status ?? "no agreement"}**${r.agreement?.repairAt ? "; repair recorded without erasing the miss" : ""}.\n\n` +
          r.steps
            .map(
              (step) =>
                `### ${step.at} — ${step.command}\n\n${step.passages.map((p) => (p.speaker ? `**${p.speaker}:** ` : "") + p.text).join("\n\n")}\n`,
            )
            .join("\n"),
      )
      .join("\n"),
);
const baseline: Record<string, string> = JSON.parse(
  readFileSync("docs/design/evidence/preserved-files.json", "utf8"),
);
const allowed = new Set([
  "src/engine/game.ts",
  "src/engine/parser.ts",
  "src/engine/world-types.ts",
  "src/engine/world-validation.ts",
  "src/components/Panels.tsx",
]);
const preserved = Object.entries(baseline).filter(
  ([path]) => !allowed.has(path),
);
for (const [path, hash] of preserved)
  assert.equal(
    createHash("sha256").update(readFileSync(path)).digest("hex"),
    hash,
    path,
  );
writeFileSync(
  `${output}/checks.json`,
  JSON.stringify(
    {
      status: "passed",
      runs: results.length,
      saveValidatedSteps: results.reduce((n, r) => n + r.steps.length, 0),
      unchangedBaselineFiles: preserved.length,
      unchangedVestibuleDraftFiles: preserved.filter(([p]) =>
        p.startsWith("docs/visuals/"),
      ).length,
      browserSavesAccessed: false,
      note: "State experiments are synthetic; previous draft/evidence files were read only. Full-suite and headless results are recorded in REPORT.md.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Saved ${results.length} representative transcripts; ${preserved.length} preserved baseline hashes match.`,
);
