import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";

// The opening's shop hook: Sable's borrowed smoke machine and one small
// favour. Assertions are on what the player sees and on the two recorded
// axes: history in the observations ledger, the agreement in its own ledger.
const reload = (s: TrialState) => validateTrial(JSON.parse(JSON.stringify(s)));
const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce((s, c) => reload(executeTrial(s, c)), s);
const last = (s: TrialState) => s.transcript.at(-1)!;
const text = (s: TrialState) => last(s).lines.join(" ");
const diagnostic = (s: TrialState) => last(s).diagnostics![0];
const outcome = (s: TrialState) => diagnostic(s).outcome;
const everySaid = (s: TrialState) => s.transcript.flatMap((t) => t.lines);
const count = (s: TrialState, pattern: RegExp) =>
  everySaid(s).filter((l) => pattern.test(l)).length;

// The approved lines, each matched on a distinctive fragment.
const OFFER =
  /would you tell Vesper the smoke machine comes back after Thursday/;
const ACCEPTED = /taken well/;
const DECLINED = /speech they were hoping to avoid/;
const HESITATION = /No obligation/;
const VESPER = /after Thursday is fine/;
const VESPER_AGAIN = /After Thursday\. I heard/;
const THANKS = /Delivered, then/;
const DOOR = /head round the door/;
const CAN_WAIT = /The message can wait/;
const GOODBYE = /Get home all right/;
const ANY_BEAT = new RegExp(
  [OFFER, ACCEPTED, DECLINED, HESITATION, VESPER, THANKS, DOOR, CAN_WAIT]
    .map((p) => p.source)
    .join("|"),
);
// Nothing in this beat may touch the mystery's material or the octopus.
const FORBIDDEN =
  /photograph|photo\b|print|picture|listing|\blot\b|five years|years ago|hospital|cat's cradle|octopus/i;

// Exactly one line of the reply is the beat, and it is clean.
function fresh(s: TrialState, pattern: RegExp) {
  const lines = last(s).lines.filter((l) => pattern.test(l));
  expect(lines, text(s)).toHaveLength(1);
  expect(lines[0]).not.toMatch(FORBIDDEN);
  return lines[0];
}
const custody = (s: TrialState) =>
  Object.fromEntries(Object.values(s.entities).map((e) => [e.id, e.location]));
// Treatment, custody and the decision context are not this beat's business.
function untouched(before: TrialState, after: TrialState) {
  expect(after.treatment).toEqual(before.treatment);
  expect(custody(after)).toEqual(custody(before));
  expect(after.decision).toEqual(before.decision);
  expect(after.receipt).toEqual(before.receipt);
  expect(after.events).toEqual(before.events);
  expect(after.context?.kind === "decision").toBe(
    before.context?.kind === "decision",
  );
}
const vesperHeard = (s: TrialState) =>
  s.observations.filter((o) => o.actor === "vesper" && o.mode === "heard");
const delivered = (s: TrialState) =>
  s.observations.filter(
    (o) => o.actor === "sable" && o.subject === "message-delivered",
  );

// Base states. The supplier answer is the first ordinary exchange.
const offered = () => run(newTrial(), "no");
const accepted = () => run(offered(), "yes");
const declined = () => run(offered(), "no");
const probeShop = () => run(newTrial(), "go to the secondhand shop");
const passed = () =>
  run(
    accepted(),
    "go shop",
    "tell Vesper the smoke machine comes back after Thursday",
    "go bar",
  );

describe("The offer fires once, after the first ordinary exchange", () => {
  it("follows the supplier answer as a pending question, recording nothing yet", () => {
    const before = newTrial(),
      s = offered();
    expect(outcome(s)).toBe("handled");
    expect(text(s)).toMatch(/send it as it is/);
    fresh(s, OFFER);
    expect(s.context?.question?.kind).toBe("favour");
    expect(s.context?.topic).toBe("supplier");
    expect(s.agreements).toEqual([]);
    // The supplier answer records Sable hearing an opinion; the offer adds
    // nothing.
    expect(s.observations.map((o) => o.subject)).toEqual(["supplier"]);
    untouched(before, s);
  });
  it.each(["yes", "order coffee", "what's the octopus for"])(
    "also follows %s when it leaves no question open",
    (command) => {
      expect(count(run(newTrial(), command), OFFER)).toBe(1);
    },
  );
  it("waits while Sable's drink offer or their own question is open", () => {
    const greeted = run(newTrial(), "talk to Sable");
    expect(greeted.context?.question?.kind).toBe("choose-drink");
    expect(count(greeted, OFFER)).toBe(0);
    const tea = run(greeted, "tea");
    expect(count(tea, OFFER)).toBe(1);
    expect(tea.context?.question?.kind).toBe("favour");
    const asked = run(newTrial(), "tell me about the supplier");
    expect(asked.context?.question?.kind).toBe("opinion");
    expect(count(asked, OFFER)).toBe(0);
    expect(count(run(asked, "no"), OFFER)).toBe(1);
  });
  it("does not follow the hospital account, free actions, travel or a later evening", () => {
    expect(
      count(run(newTrial(), "ask Sable about their memories"), OFFER),
    ).toBe(0);
    expect(
      count(run(newTrial(), "look", "examine pencil", "inventory"), OFFER),
    ).toBe(0);
    expect(count(run(newTrial(), "go shop", "go bar"), OFFER)).toBe(0);
    expect(
      count(
        run(newTrial(), "go home", "rest until tomorrow", "go bar", "no"),
        OFFER,
      ),
    ).toBe(0);
    expect(
      count(
        run(
          newTrial(),
          "go home",
          "rest until tomorrow",
          "go bar",
          "order coffee",
        ),
        OFFER,
      ),
    ).toBe(0);
  });
  it.each([
    ["accepted", accepted],
    ["declined", declined],
    ["ignored", () => run(offered(), "order coffee")],
  ])("never repeats once %s", (_, base) => {
    const s = run(
      base(),
      "hi",
      "tea",
      "tell me about the party",
      "go shop",
      "go bar",
      "how are you",
      "goodnight",
    );
    expect(count(s, OFFER)).toBe(1);
  });
  it("survives free actions and reloads while pending", () => {
    const s = run(offered(), "look", "examine pencil", "inventory", "journal");
    expect(s.context?.question?.kind).toBe("favour");
    const yes = run(s, "yes");
    fresh(yes, ACCEPTED);
    expect(yes.agreements).toHaveLength(1);
  });
  it("lapses when the player moves on, recording nothing", () => {
    const moved = run(offered(), "order coffee");
    expect(moved.context?.question).toBeUndefined();
    const yes = run(moved, "yes");
    expect(text(yes)).not.toMatch(ACCEPTED);
    expect(yes.agreements).toEqual([]);
    expect(yes.observations).toEqual(moved.observations);
  });
});

describe("Accepting records exactly one agreement", () => {
  it("opens the agreement and Sable hears it, then the conversation resumes", () => {
    const before = offered(),
      s = accepted();
    expect(outcome(s)).toBe("handled");
    fresh(s, ACCEPTED);
    expect(last(s).lines).toHaveLength(1);
    expect(s.agreements).toEqual([
      {
        id: "smoke-machine-message",
        at: before.time,
        observer: "sable",
        words: expect.stringMatching(/yes/i),
        status: "open",
      },
    ]);
    expect(s.observations).toHaveLength(before.observations.length + 1);
    expect(s.observations.at(-1)).toMatchObject({
      actor: "sable",
      mode: "heard",
    });
    expect(s.context?.question).toBeUndefined();
    expect(s.context?.topic).toBe("supplier");
    expect(diagnostic(s).changes.some((c) => c.field === "agreements")).toBe(
      true,
    );
    untouched(before, s);
  });
  it.each([
    "sure",
    "of course",
    "okay",
    "alright",
    "fine",
    "will do",
    "happy to",
    "gladly",
    "no problem",
    "no worries",
    "I will",
    "I'll tell them",
    "I'll tell Vesper",
    "I can do that",
    "I accept",
    "certainly",
    "yes please",
    "Yes, Sable.",
  ])("recognises %s", (reply) => {
    const s = run(offered(), reply);
    expect(outcome(s), text(s)).toBe("handled");
    fresh(s, ACCEPTED);
    expect(s.agreements).toHaveLength(1);
    expect(s.agreements[0]).toMatchObject({
      id: "smoke-machine-message",
      status: "open",
    });
  });
  it("does not open a second agreement on a repeated yes", () => {
    const s = run(accepted(), "yes");
    expect(s.agreements).toHaveLength(1);
    expect(text(s)).not.toMatch(ACCEPTED);
  });
});

describe("Declining records nothing and the offer never recurs", () => {
  it.each([
    "no",
    "no thanks",
    "I'd rather not",
    "I can't",
    "I won't",
    "not tonight",
    "sorry, no",
  ])("%s gets one line and leaves every record as it was", (reply) => {
    const before = offered(),
      s = run(before, reply);
    expect(outcome(s), text(s)).toBe("handled");
    expect(last(s).lines).toEqual([expect.stringMatching(DECLINED)]);
    expect(last(s).lines[0]).not.toMatch(FORBIDDEN);
    expect(s.agreements).toEqual([]);
    expect(s.observations).toEqual(before.observations);
    expect(s.interactionMemory).toEqual(before.interactionMemory);
    expect(s.context?.question).toBeUndefined();
    untouched(before, s);
  });
  it("is then silent: no repeat, no goodnight line, nothing recorded", () => {
    const s = run(declined(), "hi", "tea", "look", "goodnight");
    expect(count(s, OFFER)).toBe(1);
    expect(count(s, CAN_WAIT)).toBe(0);
    expect(last(s).lines).toEqual([expect.stringMatching(GOODBYE)]);
    expect(s.agreements).toEqual([]);
  });
  it.each(["maybe", "perhaps", "I'm not sure"])(
    "%s keeps the offer open, costs no time and records nothing",
    (reply) => {
      const before = offered(),
        s = run(before, reply);
      expect(outcome(s)).toBe("deferred");
      fresh(s, HESITATION);
      expect(s.time).toBe(before.time);
      expect(s.context?.question?.kind).toBe("favour");
      expect(s.observations).toEqual(before.observations);
      expect(s.agreements).toEqual([]);
      const yes = run(s, "yes");
      fresh(yes, ACCEPTED);
      expect(yes.agreements).toHaveLength(1);
    },
  );
});

describe("Vesper answers the message", () => {
  it("closes an open agreement when the message is passed", () => {
    const before = run(accepted(), "go shop");
    const s = run(
      before,
      "Sable says the smoke machine comes back after Thursday",
    );
    expect(outcome(s)).toBe("handled");
    const line = fresh(s, VESPER);
    expect(line).toMatch(/next door/);
    expect(s.agreements).toHaveLength(1);
    expect(s.agreements[0]).toMatchObject({ status: "kept" });
    expect(s.agreements[0].keptAt).toBe(before.time);
    expect(vesperHeard(s)).toHaveLength(1);
    expect(vesperHeard(s)[0].detail).toMatch(/smoke machine/i);
    untouched(before, s);
  });
  it.each([
    "tell vesper about sable",
    "does vesper know sable",
    "ask vesper about sable",
    "do you know sable",
    "I have a message from Sable",
    "vesper, the smoke machine comes back after thursday",
    "the machine comes back after thursday",
    "tell vesper the smoke machine comes back after thursday",
    "Vesper, Sable says the smoke machine comes back after Thursday.",
  ])(
    "answers %s without a prior agreement, recording only Vesper's hearing",
    (command) => {
      const before = probeShop(),
        s = run(before, command);
      expect(outcome(s), text(s)).toBe("handled");
      fresh(s, VESPER);
      expect(s.agreements).toEqual([]);
      expect(s.observations).toHaveLength(before.observations.length + 1);
      expect(vesperHeard(s)).toHaveLength(1);
      untouched(before, s);
    },
  );
  it("the probe's shop-state inputs now resolve to Vesper's line", () => {
    for (const command of [
      "tell vesper about sable",
      "does vesper know sable",
    ]) {
      const s = run(probeShop(), command);
      expect(outcome(s)).toBe("handled");
      expect(diagnostic(s).intent).toBe("conversation:message");
      fresh(s, VESPER);
    }
  });
  it("answers after a decline, with nothing to close", () => {
    const s = run(declined(), "go shop", "does vesper know sable");
    fresh(s, VESPER);
    expect(s.agreements).toEqual([]);
  });
  it("repeats briefly and records Vesper's hearing once", () => {
    const s = run(
      run(accepted(), "go shop"),
      "tell vesper about sable",
      "I have a message from Sable",
    );
    fresh(s, VESPER_AGAIN);
    expect(vesperHeard(s)).toHaveLength(1);
    expect(s.agreements[0]).toMatchObject({ status: "kept" });
  });
  it.each([
    "is that sable",
    "that's sable",
    "this looks like sable",
    "show sable the photo",
    "give the photo to sable",
    "go see sable",
    "look at sable",
  ])("does not answer %s, which is not a message", (command) => {
    const before = probeShop(),
      s = run(before, command);
    expect(text(s)).not.toMatch(VESPER);
    expect(vesperHeard(s)).toEqual([]);
    expect(s.agreements).toEqual([]);
  });
  it("leaves the relay request and Vesper's general conversation alone", () => {
    const relay = run(
      newTrial(),
      "ask Sable about their memories",
      "go shop",
      "take photo",
      "read photo",
      "take listing",
      "read listing",
      "show photo to Vesper",
      "show listing to Vesper",
      "ask Vesper to tell Sable",
    );
    expect(text(relay)).toMatch(/I'll call Sable privately/);
    expect(relay.events).toEqual([
      expect.objectContaining({ id: "sable:relay", status: "pending" }),
    ]);
    expect(count(relay, VESPER)).toBe(0);
    expect(text(run(probeShop(), "talk to vesper"))).toMatch(/clearance lot/);
  });
  it("answers only where Vesper is", () => {
    for (const s of [
      run(newTrial(), "tell vesper about sable"),
      run(newTrial(), "go home", "tell vesper about sable"),
    ]) {
      expect(text(s)).not.toMatch(VESPER);
      expect(vesperHeard(s)).toEqual([]);
    }
  });
});

describe("Sable learns the message arrived, once, by one of two paths", () => {
  it("says nothing on the same-evening return to the bar", () => {
    const k = passed();
    expect(text(k)).not.toMatch(DOOR);
    expect(text(k)).not.toMatch(THANKS);
    expect(delivered(k)).toEqual([]);
    const later = run(k, "hi", "look", "go home", "go bar");
    expect(count(later, DOOR)).toBe(0);
    expect(count(later, THANKS)).toBe(0);
    expect(delivered(later)).toEqual([]);
  });
  it.each([
    "I told Vesper",
    "Vesper got the message",
    "I passed on the message",
    "the smoke machine business is sorted",
    "Vesper says after Thursday is fine",
    "Sable, I told Vesper about the smoke machine.",
  ])(
    "(a) thanks the player once for %s, and Sable hears it from them",
    (command) => {
      const k = passed(),
        s = run(k, command);
      expect(outcome(s), text(s)).toBe("handled");
      expect(last(s).lines).toEqual([expect.stringMatching(THANKS)]);
      fresh(s, THANKS);
      expect(delivered(s)).toHaveLength(1);
      expect(delivered(s)[0].source).toMatch(/player/i);
      expect(s.agreements[0]).toMatchObject({ status: "kept" });
      untouched(k, s);
      const again = run(s, "Vesper says after Thursday is fine");
      expect(text(again)).not.toMatch(THANKS);
      expect(delivered(again)).toHaveLength(1);
      const rested = run(again, "go home", "rest until tomorrow", "go bar");
      expect(count(rested, DOOR)).toBe(0);
      expect(delivered(rested)).toHaveLength(1);
    },
  );
  it("(a) also thanks a player who declined or ignored the favour and passed it anyway", () => {
    const afterDecline = run(
      declined(),
      "go shop",
      "tell vesper about the smoke machine",
      "go bar",
      "I told Vesper",
    );
    fresh(afterDecline, THANKS);
    expect(afterDecline.agreements).toEqual([]);
    expect(delivered(afterDecline)[0].source).toMatch(/player/i);
    const afterIgnore = run(
      offered(),
      "order coffee",
      "go shop",
      "do you know sable",
      "go bar",
      "Vesper knows",
    );
    fresh(afterIgnore, THANKS);
    expect(afterIgnore.agreements).toEqual([]);
  });
  it("(b) on the next-evening arrival Sable has heard it from Vesper, once", () => {
    const k = passed(),
      s = run(k, "go home", "rest until tomorrow", "go bar");
    fresh(s, DOOR);
    expect(delivered(s)).toHaveLength(1);
    expect(delivered(s)[0].source).toMatch(/vesper/i);
    expect(s.agreements[0]).toMatchObject({ status: "kept" });
    untouched(k, s);
    const told = run(s, "I told Vesper about the smoke machine");
    expect(text(told)).not.toMatch(THANKS);
    expect(delivered(told)).toHaveLength(1);
    const again = run(told, "go home", "rest until tomorrow", "go bar");
    expect(count(again, DOOR)).toBe(1);
    expect(delivered(again)).toHaveLength(1);
  });
  it("(b) also fires for a player who never accepted", () => {
    const s = run(
      declined(),
      "go shop",
      "does vesper know sable",
      "go home",
      "rest until tomorrow",
      "go bar",
    );
    fresh(s, DOOR);
    expect(s.agreements).toEqual([]);
    expect(delivered(s)[0].source).toMatch(/vesper/i);
  });
  it("neither path fires before Vesper has heard anything", () => {
    const bar = run(accepted(), "I told Vesper");
    expect(text(bar)).not.toMatch(THANKS);
    expect(delivered(bar)).toEqual([]);
    const next = run(accepted(), "go home", "rest until tomorrow", "go bar");
    expect(count(next, DOOR)).toBe(0);
    expect(delivered(next)).toEqual([]);
    expect(next.agreements[0]).toMatchObject({ status: "open" });
  });
  it("(a) waits rather than interrupting Sable's decision", () => {
    const before = run(
      accepted(),
      "ask Sable about their memories",
      "go shop",
      "tell Vesper the smoke machine comes back after Thursday",
      "take photo",
      "read photo",
      "take listing",
      "read listing",
      "go bar",
      "show photo to Sable",
      "show listing to Sable",
    );
    expect(before.context?.kind).toBe("decision");
    const s = run(before, "Vesper could come with you");
    expect(text(s)).not.toMatch(THANKS);
    expect(delivered(s)).toEqual([]);
    untouched(before, s);
  });
  it.each(["ask Vesper to tell Sable", "Vesper, thank you"])(
    "(a) ignores %s, which is addressed to Vesper",
    (command) => {
      const k = passed(),
        s = run(k, command);
      expect(text(s)).not.toMatch(THANKS);
      expect(delivered(s)).toEqual([]);
      expect(s.agreements).toEqual(k.agreements);
    },
  );
});

describe("Goodnight", () => {
  it("with an open agreement adds one line that the message can wait, once", () => {
    const a = accepted(),
      s = run(a, "goodnight");
    expect(last(s).lines).toEqual([
      expect.stringMatching(GOODBYE),
      expect.stringMatching(CAN_WAIT),
    ]);
    fresh(s, CAN_WAIT);
    expect(s.agreements[0]).toMatchObject({ status: "open" });
    expect(last(run(s, "goodnight")).lines).toEqual([
      expect.stringMatching(GOODBYE),
    ]);
    expect(last(run(a, "Goodnight, Sable.")).lines).toEqual([
      expect.stringMatching(GOODBYE),
      expect.stringMatching(CAN_WAIT),
    ]);
  });
  it("is the plain goodbye when declined, ignored or already passed", () => {
    for (const s of [
      run(declined(), "goodnight"),
      run(offered(), "order coffee", "goodnight"),
      run(passed(), "goodnight"),
    ])
      expect(last(s).lines).toEqual([expect.stringMatching(GOODBYE)]);
  });
});

describe("Nothing else moves", () => {
  function route(s: TrialState, ...commands: string[]) {
    for (const c of commands) {
      s = reload(executeTrial(s, c));
      expect(last(s).failed, `${c}: ${last(s).lines}`).toBe(false);
    }
    return s;
  }
  function disclose(path: "direct" | "vesper", late: boolean) {
    const s = route(
      newTrial(),
      ...(late ? ["wait for two hours"] : []),
      "ask Sable about their memories",
      "go shop",
      "take photo",
      "read photo",
      "take listing",
      "read listing",
    );
    return path === "direct"
      ? route(s, "go bar", "show photo to Sable", "show listing to Sable")
      : route(
          s,
          "show photo to Vesper",
          "show listing to Vesper",
          "ask Vesper to tell Sable",
        );
  }
  function finish(s: TrialState) {
    s = route(s, "go home");
    for (let i = 0; i < 4; i++) s = route(s, "rest until tomorrow");
    return route(s, "wait for two hours", "go bar", "talk privately");
  }
  for (const path of ["direct", "vesper"] as const)
    for (const course of ["formal", "document"] as const)
      it(`the ${path}/${course} story route is unchanged`, () => {
        const s = finish(disclose(path, course === "document"));
        expect(s.receipt?.path).toBe(path);
        expect(s.decision?.course).toBe(course);
        expect(s.completed?.course).toBe(course);
        expect(s.updateAt).toBeDefined();
        expect(s.agreements).toEqual([]);
        expect(count(s, ANY_BEAT)).toBe(0);
      });
  it("the browser routes' opening serves tea, offers, and reaches the same ending with the favour ignored", () => {
    const opening = route(
      newTrial(),
      "talk to Sable",
      "tea",
      "ask Sable about roleplay",
    );
    expect(count(opening, OFFER)).toBe(1);
    expect(opening.context?.topic).toBe("roleplay");
    const s = finish(
      route(
        opening,
        "ask Sable about their memories",
        "go shop",
        "take photo",
        "read photo",
        "take listing",
        "read listing",
        "go bar",
        "show photo to Sable",
        "show listing to Sable",
        "I disagree",
      ),
    );
    expect(s.treatment.map((t) => t.value)).toEqual(["disagree"]);
    expect(s.completed?.course).toBe("formal");
    expect(s.agreements).toEqual([]);
    expect(count(s, ANY_BEAT)).toBe(1);
  });
  it("saves fail closed on a kept agreement without Vesper's hearing or a future one, and older saves load with none", () => {
    const kept = run(accepted(), "go shop", "tell vesper about sable");
    const unheard = JSON.parse(JSON.stringify(kept));
    unheard.observations = unheard.observations.filter(
      (o: { actor: string }) => o.actor !== "vesper",
    );
    expect(() => validateTrial(unheard)).toThrow();
    const future = JSON.parse(JSON.stringify(accepted()));
    future.agreements[0].at = future.time + 1;
    expect(() => validateTrial(future)).toThrow();
    const old = JSON.parse(JSON.stringify(offered()));
    delete old.agreements;
    const loaded = validateTrial(old);
    expect(loaded.agreements).toEqual([]);
    expect(loaded.context?.question?.kind).toBe("favour");
    expect(run(loaded, "yes").agreements).toHaveLength(1);
  });
});
