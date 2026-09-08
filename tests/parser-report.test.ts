import { it, expect } from "vitest";
import { newGame, validateSave } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { parserGapReport } from "../src/engine/parser-report";
it("reports real failures, ambiguity and fallback separately without changing the run", () => {
  let s = ensureWorld(newGame());
  s.world!.room = "bar";
  for (const q of [
    "levitate piano",
    "take unicorn",
    "ask Mara about orbital mechanics",
    "smile",
  ]) {
    s = executeCommand(s, q).state;
  }
  s.world!.room = "office";
  s = executeCommand(s, "open drawer").state;
  const before = structuredClone(s),
    report = parserGapReport([s]);
  expect(report.outcomes).toMatchObject({
    "unsupported-verb": 1,
    "missing-noun": 1,
    "unsupported-topic": 1,
    fallback: 1,
    ambiguous: 1,
  });
  expect(report.failedVerbs.levitate).toBe(1);
  expect(report.failedNouns.unicorn).toBe(1);
  expect(report.failedTopics["orbital mechanics"]).toBe(1);
  expect(report.ambiguous).toHaveLength(1);
  expect(report.lowAffordanceRooms).toEqual([]);
  expect(report.genericOnlyObjects.length).toBeGreaterThan(0);
  expect(report.fallbackFrequency).toBe(0.2);
  expect(s).toEqual(before);
});
it("rejects future or invalid saved referents", () => {
  const s = ensureWorld(newGame());
  s.world!.references.it = { id: "envelope", at: s.time + 1, room: "taxi" };
  expect(() => validateSave(s)).toThrow(/reference/);
  s.world!.references.it.at = s.time;
  s.world!.references.it.id = "unicorn";
  expect(() => validateSave(s)).toThrow(/reference/);
});
it("listening and watching away from the workplace do not invent visual evidence", () => {
  let s = ensureWorld(newGame());
  s.world!.room = "bar";
  s = executeCommand(s, "listen to Mara for two minutes").state;
  expect(s.canon.player).not.toContain("observed_mara_routine");
  s.world!.room = "landing";
  s.npcs.mara.location = "landing";
  s = executeCommand(s, "watch Mara for two minutes").state;
  expect(s.canon.player).not.toContain("observed_mara_routine");
  expect(
    s
      .world!.transcript.at(-1)!
      .passages.map((p) => p.text)
      .join(" "),
  ).not.toContain("chipped glasses");
});

it("stops observation at the actual departure second", () => {
  let s = ensureWorld(newGame());
  s.world!.room = "bar";
  s.time = 1444;
  s.world!.subMinute = 50;
  const r = executeCommand(s, "watch Mara for five minutes");
  expect(r.state.time).toBe(1445);
  expect(r.state.world!.subMinute).toBe(0);
  expect(r.state.world!.transcript.at(-1)!.seconds).toBe(10);
});

it("can put a conversational thread down and return to the same point", () => {
  let s = ensureWorld(newGame());
  s.world!.room = "kitchen";
  s.time = 1470;
  s.npcs.mara.location = "kitchen";
  for (const q of [
    "ask Mara about company",
    "use your system",
    "say vinegar",
  ]) {
    const r = executeCommand(s, q);
    expect(r.ok).toBe(true);
    s = r.state;
  }
  const previous = s.world!.conversations.mara;
  s = executeCommand(s, "change subject").state;
  expect(s.world!.conversations.mara).toBe(previous);
  s = executeCommand(s, "talk to Mara").state;
  expect(s.world!.conversations.mara).toBe(previous);
});
it("remembers a recent person's words through a pronoun", () => {
  let s = ensureWorld(newGame());
  s.world!.room = "bar";
  s = executeCommand(s, "ask Mara why she recognised it").state;
  const r = executeCommand(s, "think about what she just said");
  expect(r.ok).toBe(true);
  expect(
    r.state
      .world!.transcript.at(-1)!
      .passages.map((p) => p.text)
      .join(" "),
  ).toContain("handled deliveries");
  expect(r.state.time).toBe(s.time);
});
