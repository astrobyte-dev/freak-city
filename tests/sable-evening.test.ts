import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import { currentDrink } from "../src/trial/vessels";
import { interactionFixture } from "./fixtures/interaction-fixture";

const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce(
    (s, c) => validateTrial(JSON.parse(JSON.stringify(executeTrial(s, c)))),
    s,
  );
const last = (s: TrialState) => s.transcript.at(-1)!;
const text = (s: TrialState) => last(s).lines.join(" ");
const diagnostic = (s: TrialState) => last(s).diagnostics![0];
const offer = () =>
  run(newTrial(), "coffee", "take cup", "finish cup", "ask for another drink");

describe("Repairs after the frozen ordinary-evening exploration", () => {
  it.each([
    "Sable, I found a photograph, but it isn't you.",
    "I saw a picture and you weren't there.",
    "I found a photograph but that wasn't you.",
    "Sable, I didn't find a photograph.",
  ])(
    "clarifies a denied account without inventing a positive claim: %s",
    (command) => {
      const before = newTrial(),
        s = run(before, command);
      expect(diagnostic(s).outcome).toBe("clarified");
      expect(s.observations).toEqual(before.observations);
      expect(s.entities).toEqual(before.entities);
      expect(s.actors).toEqual(before.actors);
      expect(s.time).toBe(before.time);
      expect(text(s)).toMatch(/correcting/);
      expect(text(s)).not.toMatch(
        /recorded|observation|current conversation|qualified statement/,
      );
    },
  );
  it.each([
    ["No, I think it sounds perfectly reasonable.", "negative"],
    ["Yes, I think it is polite.", "negative"],
    ["No, I think it isn't reasonable.", "positive"],
  ])("follows the judgement in %s", (command, polarity) => {
    const s = run(newTrial(), command);
    expect(diagnostic(s).outcome).toBe("handled");
    expect(diagnostic(s).meaning?.polarity).toBe(polarity);
    expect(text(s)).toContain(
      polarity === "negative" ? "send it as it is" : "soften",
    );
  });
  it("changes explicitly from music to party and answers the snacks question", () => {
    const s = run(
      newTrial(),
      "what music do you like",
      "tell me more about the party",
    );
    expect(s.context?.topic).toBe("party");
    expect(text(s)).toContain("octopus");
    const snacks = run(s, "Have you sorted out the snacks?");
    expect(text(snacks)).toContain("blank line");
    expect(diagnostic(snacks).outcome).toBe("handled");
    expect(snacks.events).toEqual([]);
  });
  it("does not borrow the previous topic for an unsupported explicit follow-up", () => {
    const s = run(
      newTrial(),
      "what music do you like",
      "tell me more about the railway",
    );
    expect(text(s)).toMatch(/^Trial limitation:/);
    expect(diagnostic(s).outcome).toBe("clarified");
    expect(s.events).toEqual([]);
  });
});

describe("Hesitation is an understood reply, not a choice error", () => {
  it.each(["perhaps", "maybe", "I'm not sure", "im not sure yet"])(
    "retains an identified offer for %s",
    (reply) => {
      const before = offer(),
        s = run(before, reply);
      expect(diagnostic(s)).toMatchObject({
        outcome: "deferred",
        meaning: {
          kind: "uncertain",
          subject: "drink",
          entities: ["trial-cup"],
        },
      });
      expect(text(s)).toMatch(/No hurry/);
      expect(text(s)).not.toMatch(/which|choose/i);
      expect(s.context).toEqual(before.context);
      expect(s.entities).toEqual(before.entities);
      expect(s.observations).toEqual(before.observations);
      expect(s.companyOffers).toEqual([]);
      expect(s.time).toBe(before.time);
      const accepted = run(s, "read menu", "look", "yes please");
      expect(currentDrink(accepted)).toMatchObject({
        id: "trial-cup",
        remaining: 3,
        location: "player",
      });
      expect(diagnostic(accepted).meaning?.kind).toBe("accept");
      const declined = run(s, "inventory", "no thanks");
      expect(diagnostic(declined).meaning?.kind).toBe("decline");
      expect(declined.entities).toEqual(before.entities);
      expect(declined.context?.question).toBeUndefined();
    },
  );
  it.each([
    "perhaps tea or coffee",
    "yes unless it's decaf",
    "maybe water instead",
  ])("clarifies a genuinely competing/conditional choice: %s", (reply) => {
    const before = offer(),
      after = run(before, reply);
    expect(diagnostic(after).outcome).toBe("clarified");
    expect(after.entities).toEqual(before.entities);
    expect(after.context).toEqual(before.context);
  });
  it("does not execute a later compound action after hesitation", () => {
    const s = run(offer(), "maybe; yes");
    expect(last(s).diagnostics).toHaveLength(1);
    expect(currentDrink(s)?.remaining).toBe(0);
  });
  it.each(["Rowan", "Kit"])(
    "shared hesitation works for %s without character parsing",
    (name) => {
      const f = interactionFixture();
      f.command(`${name}, coffee`);
      f.command("finish cup");
      f.command("ask for another drink");
      const before = structuredClone(f.state);
      expect(f.command("perhaps")?.deferred).toBe(true);
      expect(f.state).toEqual(before);
      expect(f.command("yes")?.meaning).toMatchObject({
        kind: "accept",
        serviceMode: "refill",
      });
    },
  );
});
describe("New order, refill and finite serving supply", () => {
  const remote = () =>
    run(
      newTrial(),
      "coffee",
      "take cup",
      "go home",
      "finish cup",
      "put down cup",
      "go bar",
    );
  it("a new order uses another vessel while an explicit refill cannot fetch the old cup", () => {
    const before = remote();
    const refill = run(before, "please refill my coffee");
    expect(diagnostic(refill).outcome).toBe("rejected");
    expect(refill.entities).toEqual(before.entities);
    const next = run(before, "I'd like a coffee please");
    expect(diagnostic(next).meaning?.serviceMode).toBe("new");
    expect(currentDrink(next)).toMatchObject({
      id: "trial-glass",
      kind: "coffee",
      remaining: 3,
    });
    expect(next.entities["trial-cup"]).toEqual(before.entities["trial-cup"]);
    expect(Object.keys(next.entities)).toEqual(Object.keys(before.entities));
  });
  it("another coffee asks new-versus-refill when remote custody makes a difference", () => {
    const before = remote(),
      s = run(before, "another coffee please");
    expect(diagnostic(s).outcome).toBe("clarified");
    expect(s.context?.question?.kind).toBe("service-choice");
    expect(s.entities).toEqual(before.entities);
    const ambiguous = run(s, "yes");
    expect(diagnostic(ambiguous).outcome).toBe("clarified");
    expect(ambiguous.entities).toEqual(before.entities);
    expect(currentDrink(run(s, "a fresh one"))?.id).toBe("trial-glass");
    expect(diagnostic(run(s, "refill my cup")).outcome).toBe("rejected");
  });
  it("held, unfinished drinks are not overwritten by new orders", () => {
    const before = run(newTrial(), "coffee", "take cup", "water", "take glass"),
      s = run(before, "order tea");
    expect(diagnostic(s).outcome).toBe("rejected");
    expect(text(s)).toMatch(/clean cups and glasses/);
    expect(s.entities).toEqual(before.entities);
    const restored = run(
      before,
      "finish cup",
      "put cup on counter",
      "order tea",
    );
    expect(text(restored)).toMatch(/rinses the empty cup/);
    expect(restored.entities["trial-glass"]).toEqual(
      before.entities["trial-glass"],
    );
    expect(currentDrink(restored)).toMatchObject({
      id: "trial-cup",
      kind: "tea",
      remaining: 3,
    });
  });
  it("new order cannot steal an empty held vessel; refill can use it", () => {
    const s = run(
      newTrial(),
      "coffee",
      "take cup",
      "water",
      "take glass",
      "finish cup",
    );
    expect(diagnostic(run(s, "a new coffee")).outcome).toBe("rejected");
    expect(currentDrink(run(s, "refill cup"))).toMatchObject({
      id: "trial-cup",
      location: "player",
      remaining: 3,
    });
  });
  it("retained offer rechecks actual access after hesitation", () => {
    const s = run(offer(), "perhaps");
    s.entities["trial-cup"].location = "home";
    expect(diagnostic(run(s, "yes")).outcome).toBe("rejected");
    expect(run(s, "yes").entities).toEqual(s.entities);
  });
});
describe("Meaning, character and conversational pacing", () => {
  it.each([
    ["no it dosen't sound threatening", "negative"],
    ["yes very threatening", "positive"],
    ["yes the letter doesn't sound threatening", "negative"],
    ["no the letter is very threatening", "positive"],
    ["yes the complaint is harmless", "negative"],
    ["it doesn't sound harmless", "positive"],
  ])("explicit opinion precedes particles: %s", (reply, polarity) => {
    const s = run(newTrial(), reply);
    expect(diagnostic(s).meaning?.polarity).toBe(polarity);
    expect(text(s)).toMatch(
      polarity === "positive" ? /soften/ : /send it as it is/,
    );
    expect(currentDrink(s)).toBeUndefined();
  });
  it("hesitation, explicit teasing and changed opinions have different effects and prose", () => {
    const before = newTrial(),
      uncertain = run(before, "maybe"),
      tease = run(before, "Very threatening. I'm only joking");
    expect(diagnostic(uncertain).outcome).toBe("deferred");
    expect(uncertain.observations).toEqual([]);
    expect(diagnostic(tease).meaning?.tone).toBe("explicit-teasing");
    expect(tease.observations).toEqual([]);
    const negative = run(before, "not threatening"),
      changed = run(negative, "actually very threatening"),
      again = run(changed, "yes very threatening");
    expect(text(changed)).toContain("On second thoughts");
    expect(text(again)).toContain("stop making you proofread");
    expect(
      new Set([
        text(uncertain),
        text(tease),
        text(negative),
        text(changed),
        text(again),
      ]).size,
    ).toBe(5);
  });
  it("does not infer teasing without an explicit cue", () => {
    expect(
      diagnostic(run(newTrial(), "very threatening")).meaning?.tone,
    ).toBeUndefined();
  });
  it("keeps jokes once, repeated questions shorter, and declined drinks declined", () => {
    const s = run(
      newTrial(),
      "coffee",
      "finish cup",
      "refill cup",
      "finish cup",
      "refill cup",
    );
    expect(
      s.transcript
        .flatMap((t) => t.lines)
        .join(" ")
        .match(/Smells more awake/g),
    ).toHaveLength(1);
    const follow = run(newTrial(), "tell me more", "tell me more");
    expect(text(follow)).toContain("entire lid saga");
    const company = run(
      newTrial(),
      "talk",
      "no thanks",
      "talk",
      "talk",
      "I'm just here for company",
    );
    expect(company.context?.question).toBeUndefined();
    expect(company.events).toEqual([]);
    expect(company.actors.player.knowledge).not.toContain("hospital-account");
    expect(company.transcript.flatMap((t) => t.lines).join(" ")).not.toMatch(
      /dream|hospital/,
    );
    expect(text(run(company, "go home"))).toContain("apartment");
  });
  it("separates interface limitations from dialogue and removes procedural narration", () => {
    const s = run(
      newTrial(),
      "talk",
      "yes very threatening",
      "Sable, could you mend my coat?",
    );
    expect(text(s)).toMatch(/^Trial limitation:/);
    expect(diagnostic(s).outcome).toBe("clarified");
    const photo = run(
      newTrial(),
      "Sable, I found a picture that might show you",
      "go shop",
      "take photo",
      "go bar",
      "show photo to Sable",
      "tell me more",
    );
    expect(photo.actors.sable.knowledge.length).toBeGreaterThan(0);
    expect(photo.entities["trial-photo"].location).toBe("player");
    expect(photo.transcript.flatMap((t) => t.lines).join(" ")).not.toMatch(
      /keep custody|claim separate|offer was not accepted|offer is for/,
    );
  });
  it("additive save defaults preserve earlier revision-three state and pending offers", () => {
    const before = offer(),
      old = JSON.parse(JSON.stringify(before));
    delete old.interactionMemory;
    const loaded = validateTrial(old);
    expect(loaded.entities).toEqual(before.entities);
    expect(loaded.context).toEqual(before.context);
    expect(loaded.transcript).toEqual(before.transcript);
    expect(
      currentDrink(run(loaded, "I'm not sure", "read menu", "yes"))?.remaining,
    ).toBe(3);
    const invalid = JSON.parse(JSON.stringify(before));
    invalid.interactionMemory.replies.bad = -1;
    expect(() => validateTrial(invalid)).toThrow();
  });
});
