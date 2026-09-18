import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { activeContext } from "../src/trial/conversation";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import { currentDrink } from "../src/trial/vessels";

// Regression inputs from the 18 September 2026 story-exploration playtest:
// artifacts/sable-story-exploration-20260918-port52755/session-index.md.
// Each state is reached by replaying the exact earlier submissions, failures
// included, then the numbered submission is sent verbatim.
const reload = (s: TrialState) => validateTrial(JSON.parse(JSON.stringify(s)));
const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce((s, command) => reload(executeTrial(s, command)), s);
const last = (s: TrialState) => s.transcript.at(-1)!;
const text = (s: TrialState) => last(s).lines.join(" ");
const diagnostic = (s: TrialState) => last(s).diagnostics![0];
const outcome = (s: TrialState) => diagnostic(s).outcome;
const intent = (s: TrialState) => diagnostic(s).intent;

const session = [
  /* 1 */ "Maybe a little threatening, but I think they deserve it.",
  /* 2 */ "How's the rest of your evening been, Sable?",
  /* 3 */ "I'll try the special without alcohol, please.",
  /* 4 */ "Could I have the alcohol-free special?",
  /* 5 */ "What's on the back of the menu?",
  /* 6 */ "Are you looking forward to the prom?",
  /* 7 */ "Do you enjoy putting these nights on?",
  /* 8 */ "finish my drink",
  /* 9 */ "I'll have a look in the shop next door.",
  /* 10 */ "go to the secondhand shop",
  /* 11 */ "What's in the photograph?",
  /* 12 */ "look at the photograph",
  /* 13 */ "read the provenance listing",
  /* 14 */ "Vesper, can I borrow these to show Sable?",
  /* 15 */ "Vesper, may I take the photograph?",
  /* 16 */ "help",
  /* 17 */ "take the photograph",
  /* 18 */ "take the listing too",
  /* 19 */ "go back to the bar",
  /* 20 */ "Sable, did you work at the Cat's Cradle?",
  /* 21 */ "show the photograph to Sable",
  /* 22 */ "Do you remember that night?",
  /* 23 */ "Do you remember being at the closing party in this photograph?",
  /* 24 */ "show Sable the provenance listing",
  /* 25 */ "Does that date fit with what you remember?",
  /* 26 */ "What do you remember about five years ago?",
  /* 27 */ "Sable, what are your memories of that time?",
  /* 28 */ "That sounds frightening. Are you all right?",
  /* 29 */ "Sable, how are you feeling about this?",
  /* 30 */ "What do you remember about the hospital?",
  /* 31 */ "What happened in the dream?",
  /* 32 */ "Can you tell me more about that dream?",
  /* 33 */ "How do you know you can trust this practitioner?",
  /* 34 */ "Sable, who is the independent practitioner?",
  /* 35 */ "I'm not sure about the appointment yet.",
  /* 36 */ "I'm worried about you going to the examination.",
  /* 37 */ "Actually, I'd like to come with you, if you want company.",
  /* 38 */ "Could I come with you to the appointment?",
  /* 39 */ "When's the appointment?",
  /* 40 */ "What day should I check in with you?",
  /* 41 */ "Goodnight, Sable. I'll check in tomorrow.",
  /* 42 */ "Goodnight, Sable.",
  /* 43 */ "head home",
  /* 44 */ "rest until tomorrow",
  /* 45 */ "go back to the bar",
  /* 46 */ "Hi Sabel. How are you today?",
  /* 47 */ "Have you decided whether you'd like company at the appointment?",
  /* 48 */ "Would you prefer me to come with you?",
];
const before = (n: number) => run(newTrial(), ...session.slice(0, n - 1));
function submit(n: number) {
  const state = before(n);
  return { before: state, after: run(state, session[n - 1]) };
}
function unchangedArrangement(before: TrialState, after: TrialState) {
  expect(after.companyOffers).toEqual(before.companyOffers);
  expect(after.treatment).toEqual(before.treatment);
  expect(after.decision).toEqual(before.decision);
  expect(after.events).toEqual(before.events);
}
function unchangedKnowledge(before: TrialState, after: TrialState) {
  expect(after.actors).toEqual(before.actors);
  expect(after.receipt).toEqual(before.receipt);
  expect(after.observations.filter((o) => o.mode === "claim")).toEqual(
    before.observations.filter((o) => o.mode === "claim"),
  );
}
const socialJoke =
  /Deep Sea Prom|octopus|smoke machine|playlist|run the music|lids|jars/;
function disclosed() {
  return run(
    newTrial(),
    "ask Sable about memories",
    "go shop",
    "read photograph",
    "take photograph",
    "read listing",
    "take listing",
    "go bar",
    "show photograph to Sable",
    "show listing to Sable",
  );
}

describe("Context-priority routing regressions from the story-exploration playtest", () => {
  it("#9 modal phrasing without a beverage is not a drink request", () => {
    const { before, after } = submit(9);
    expect(before.room).toBe("bar");
    expect(intent(after)).not.toBe("conversation:unsupported");
    expect(text(after)).not.toMatch(/order a drink/);
    expect(after.room).toBe("shop");
  });
  it("#22 a night question with the photo just shown stays on the photo or clarifies", () => {
    const { before, after } = submit(22);
    expect(before.context?.topic).toBe("photo");
    expect(
      before.observations.some(
        (o) =>
          o.actor === "sable" &&
          o.mode === "inspected" &&
          o.subject === "trial-photo",
      ),
    ).toBe(true);
    expect(intent(after)).not.toBe("conversation:plans");
    expect(text(after)).not.toMatch(socialJoke);
    expect(
      outcome(after) === "clarified" ||
        /^conversation:(photo|hospital)/.test(intent(after)),
      `${intent(after)}: ${text(after)}`,
    ).toBe(true);
    expect(after.socialSeen).toEqual(before.socialSeen);
    unchangedKnowledge(before, after);
  });
  it("#29 a feelings question after the contradiction clarifies rather than joking", () => {
    const { before, after } = submit(29);
    expect(before.receipt).toBeDefined();
    expect(before.actors.player.knowledge).toContain("credible-contradiction");
    expect(intent(after)).not.toBe("conversation:plans");
    expect(outcome(after)).toBe("clarified");
    expect(text(after)).not.toMatch(socialJoke);
    expect(after.socialSeen).toEqual(before.socialSeen);
    unchangedArrangement(before, after);
    unchangedKnowledge(before, after);
  });
  it("#37 a qualified offer of company reaches the company reply as an offer", () => {
    const { before, after } = submit(37);
    expect(before.receipt).toBeDefined();
    expect(before.room).toBe("bar");
    expect(before.away).toBeFalsy();
    expect(intent(after)).not.toBe("conversation:unsupported");
    expect(intent(after)).toBe("conversation:offer-company");
    expect(outcome(after)).toBe("handled");
    expect(after.companyOffers).toHaveLength(before.companyOffers.length + 1);
    expect(after.companyOffers.at(-1)).toMatchObject({
      observer: "sable",
      status: "offered",
    });
    expect(after.companyOffers.at(-1)?.words).toContain("come with you");
    expect(after.treatment).toEqual(before.treatment);
    expect(after.decision).toEqual(before.decision);
    expect(after.events).toEqual(before.events);
  });
  it("#47/#48 asking what Sable wants states the current company position without re-clarifying", () => {
    const first = submit(47);
    expect(first.before.decision).toBeDefined();
    expect(first.before.companyOffers.length).toBeGreaterThan(0);
    for (const s of [first.after]) {
      expect(outcome(s)).toBe("handled");
      expect(intent(s)).not.toBe("conversation:company-clarification");
      expect(last(s).lines).toHaveLength(1);
      expect(text(s)).toMatch(/haven't decided|not decided|undecided/);
      expect(text(s)).toMatch(/offer/);
      expect(text(s)).not.toMatch(socialJoke);
    }
    unchangedArrangement(first.before, first.after);
    const second = run(first.after, session[47]);
    expect(outcome(second)).toBe("handled");
    expect(intent(second)).not.toBe("conversation:company-clarification");
    expect(last(second).lines).toHaveLength(1);
    unchangedArrangement(first.after, second);
    const repeated = run(second, session[47]);
    expect(outcome(repeated)).toBe("handled");
    expect(intent(repeated)).not.toBe("conversation:company-clarification");
    unchangedArrangement(second, repeated);
  });
});

describe("Company preference questions state the true arrangement", () => {
  const question = "Would you prefer me to come with you?";
  it.each([
    ["nothing arranged", []],
    ["an open offer", ["I'll come with you if you'd like company"]],
    ["a refusal on record", ["I can't come with you"]],
  ] as const)("answers in one line with %s", (_, setup) => {
    const before = run(disclosed(), ...setup);
    const after = run(before, question);
    expect(outcome(after)).toBe("handled");
    expect(intent(after)).not.toBe("conversation:company-clarification");
    expect(last(after).lines).toHaveLength(1);
    expect(text(after)).not.toMatch(socialJoke);
    unchangedArrangement(before, after);
    expect(after.observations).toEqual(before.observations);
  });
  it("distinguishes the three positions", () => {
    const replies = [
      [],
      ["I'll come with you if you'd like company"],
      ["I can't come with you"],
    ].map((setup) => text(run(disclosed(), ...setup, question)));
    expect(new Set(replies).size).toBe(3);
    expect(replies[1]).toMatch(/offer/);
  });
});

describe("Unchanged social and ordering routes", () => {
  it("keeps a bare greeting on plans", () => {
    const s = run(newTrial(), "how are you?");
    expect(outcome(s)).toBe("handled");
    expect(intent(s)).toBe("conversation:plans");
  });
  it("keeps an evening-plans question on plans", () => {
    const s = run(newTrial(), "what are your plans for the evening?");
    expect(outcome(s)).toBe("handled");
    expect(intent(s)).toBe("conversation:plans");
  });
  it("still orders a named drink with modal phrasing", () => {
    const s = run(newTrial(), "I'll have the second cocktail");
    expect(outcome(s)).toBe("handled");
    expect(intent(s)).toMatch(/order-drink/);
    expect(currentDrink(s)?.kind).toBe("alcohol-free special");
  });
  it("does not travel without a named room", () => {
    const shop = run(newTrial(), "go shop", "take photograph");
    const photo = run(shop, "have a look at the photograph");
    expect(photo.room).toBe("shop");
    expect(intent(photo)).toBe("conversation:photo");
    const around = run(shop, "have a look around");
    expect(around.room).toBe("shop");
    expect(outcome(around)).toBe("clarified");
    expect(intent(around)).toBe("action:unknown-object");
  });
  it("neither crashes nor invents knowledge for a night question with no active subject", () => {
    const before = run(newTrial(), "wait for an hour");
    expect(activeContext(before)).toBeUndefined();
    const after = run(before, "Do you remember that night?");
    expect(last(after).command).toBe("Do you remember that night?");
    unchangedKnowledge(before, after);
    expect(after.receipt).toBeUndefined();
  });
});

describe("Modal acceptance of a pending drink offer", () => {
  const phrases = [
    "I'll have another",
    "yes I'll have another",
    "I'll have one",
  ];
  it.each(phrases)("%s accepts a named offer exactly as yes does", (phrase) => {
    const pending = run(
      newTrial(),
      "order coffee",
      "finish cup",
      "ask for another drink",
    );
    expect(pending.context?.question).toMatchObject({
      kind: "confirm-drink",
      subject: "drink",
      offered: "coffee",
    });
    const yes = run(pending, "yes");
    const modal = run(pending, phrase);
    expect(outcome(modal)).toBe(outcome(yes));
    expect(intent(modal)).toBe(intent(yes));
    expect(text(modal)).toBe(text(yes));
    expect(currentDrink(modal)).toEqual(currentDrink(yes));
    expect(modal.context).toEqual(yes.context);
  });
  it.each(phrases)(
    "%s answers an open choice exactly as yes does",
    (phrase) => {
      const pending = run(newTrial(), "talk");
      expect(pending.context?.question).toMatchObject({
        kind: "choose-drink",
        subject: "drink",
      });
      const yes = run(pending, "yes");
      const modal = run(pending, phrase);
      expect(outcome(modal)).toBe(outcome(yes));
      expect(intent(modal)).toBe(intent(yes));
      expect(text(modal)).toBe(text(yes));
      expect(currentDrink(modal)).toEqual(currentDrink(yes));
    },
  );
  it.each(phrases)("%s still falls through with nothing pending", (phrase) => {
    const idle = run(newTrial(), "wait for an hour");
    expect(activeContext(idle)).toBeUndefined();
    const after = run(idle, phrase);
    expect(outcome(after)).toBe("rejected");
    expect(intent(after)).not.toMatch(/drink/);
    expect(currentDrink(after)).toBeUndefined();
    expect(after.context).toEqual(idle.context);
  });
});
