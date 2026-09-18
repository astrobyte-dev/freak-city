import { expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import { currentDrink } from "../src/trial/vessels";
import { interactionFixture } from "./fixtures/interaction-fixture";

// Added after the initial foundation implementation and 143 passing checks.
// Historical held-back wording, now maintained regressions; not a new blind evaluation.
const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce(
    (s, c) => validateTrial(JSON.parse(JSON.stringify(executeTrial(s, c)))),
    s,
  );
const last = (s: TrialState) => s.transcript.at(-1)!;
const d = (s: TrialState) => last(s).diagnostics![0];
it.each([
  "No, the complaint does not seem menacing",
  "I disagree about the supplier complaint",
  "That sounds harmless",
])("held-back negative opinion: %s", (c) => {
  const s =
    c === "That sounds harmless"
      ? run(newTrial(), "look", c)
      : run(newTrial(), "talk", "look", c);
  expect(d(s).meaning).toMatchObject({ kind: "opinion", polarity: "negative" });
  expect(currentDrink(s)).toBeUndefined();
});
it("held-back acceptance retains the offered vessel after putting it down", () => {
  const s = run(
    newTrial(),
    "may I get coffee",
    "pick up the cup",
    "have one more sip of my coffee",
    "finish the coffee cup",
    "ask for another drink",
    "set the cup down on the counter",
    "I accept that coffee",
  );
  expect(d(s).meaning).toMatchObject({
    kind: "accept",
    entities: ["trial-cup"],
  });
  expect(currentDrink(s)).toMatchObject({
    remaining: 3,
    location: "trial-counter",
  });
});
it.each([
  "Perhaps, but the complaint may be harmless",
  "Yes, unless the coffee is cold",
  "Could I get tea or perhaps coffee?",
])("held-back qualified answer: %s", (c) => {
  const s = run(newTrial(), "talk"),
    after = run(s, c);
  expect(d(after).outcome).toBe(
    c.startsWith("Perhaps, but") ? "deferred" : "clarified",
  );
  expect(after.entities).toEqual(s.entities);
  expect(after.context).toEqual(s.context);
  expect(after.time).toBe(s.time);
});
it("held-back unknown named request does not turn into successful banter", () => {
  const s = run(
    newTrial(),
    "ask Sable about the music",
    "Sable, could you mend my coat?",
  );
  expect(d(s).outcome).toBe("clarified");
  expect(last(s).lines.join(" ")).toMatch(/^Trial limitation:/);
});
it("held-back second actor and vessel need no new parser branches", () => {
  const f = interactionFixture();
  expect(f.command("Kit, could I get some tea")?.failed).not.toBe(true);
  expect(f.command("Rowan, may I try coffee")?.failed).not.toBe(true);
  expect(f.command("pick up mug")?.failed).not.toBe(true);
  expect(f.command("have one more sip of the mug")?.failed).not.toBe(true);
  expect(f.state.entities.mug.properties.remaining).toBe(2);
  expect(
    f.command("Kit, I discovered an image which might be relevant")?.meaning
      ?.kind,
  ).toBe("claim");
  expect(f.host.observed("kit", "snapshot")).toBe(false);
});

it("an unqualified pronoun after a topic change clarifies instead of borrowing an older subject", () => {
  const before = run(newTrial(), "talk"),
    s = run(before, "That sounds harmless");
  expect(d(s).outcome).toBe("clarified");
  expect(s.context).toEqual(before.context);
  expect(s.entities).toEqual(before.entities);
  expect(s.time).toBe(before.time);
});
