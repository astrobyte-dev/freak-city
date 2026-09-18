import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";

const reload = (s: TrialState) => validateTrial(JSON.parse(JSON.stringify(s)));
const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce((s, command) => reload(executeTrial(s, command)), s);
const last = (s: TrialState) => s.transcript.at(-1)!;
const text = (s: TrialState) => last(s).lines.join(" ");
const outcome = (s: TrialState) => last(s).diagnostics![0].outcome;
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
function finished() {
  let s = run(disclosed(), "wait ten minutes", "go home");
  for (let i = 0; i < 4; i++) s = run(s, "rest until tomorrow");
  return run(s, "go bar", "talk privately");
}
function unchangedConversation(before: TrialState, after: TrialState) {
  expect(after.context).toEqual(before.context);
  expect(after.time).toBe(before.time);
  expect(after.actors).toEqual(before.actors);
  expect(after.observations).toEqual(before.observations);
  expect(after.companyOffers).toEqual(before.companyOffers);
}

describe("Sable routes meaning rather than a name or broad keyword", () => {
  it.each([
    "Hi Sable, how's your evening going?",
    "How’s your evening going?",
    "Sabel, how is your night going?",
  ])("keeps %s social", (command) => {
    const s = run(newTrial(), command);
    expect(text(s)).toMatch(/supplier|lids|vessel/);
    expect(text(s)).not.toMatch(/date I can check|shop lot|examination/);
    expect(s.context?.topic).toBe("supplier");
    expect(s.actors.sable.knowledge).toEqual([]);
    expect(s.receipt).toBeUndefined();
  });
  it.each([
    "Sable, the moon is made of spoons",
    "Sable, arrange a taxi for me",
  ])("clarifies unknown named speech: %s", (command) => {
    const before = run(newTrial(), "talk");
    const after = run(before, command);
    expect(outcome(after)).toBe("clarified");
    expect(text(after)).not.toMatch(/octopus|music|vessel/);
    unchangedConversation(before, after);
  });
  it.each([
    "Sable, I found a photograph of you at the Cat's Cradle closing party",
    "I came across a picture that might show you, Sable",
  ])("records %s as an unverified claim", (command) => {
    const s = run(newTrial(), command);
    expect(text(s)).toMatch(/see it|inspecting/);
    expect(s.context?.topic).toBe("photo");
    expect(s.observations.filter((o) => o.mode === "claim")).toHaveLength(1);
    expect(s.observations.some((o) => o.mode === "inspected")).toBe(false);
    expect(s.actors.sable.knowledge).toEqual([]);
    expect(s.receipt).toBeUndefined();
    expect(s.entities["trial-photo"].location).toBe("shop");
  });
  it("keeps a negative claim from being evidence or a positive claim", () => {
    const before = run(newTrial(), "talk");
    const after = run(before, "Sable, I didn't find a photograph");
    expect(last(after).failed).toBe(true);
    unchangedConversation(before, after);
  });
  it("answers a photograph follow-up without granting unseen corroboration", () => {
    const s = run(
      newTrial(),
      "go shop",
      "take photograph",
      "go bar",
      "show photograph to Sable",
      "look",
      "what do you think?",
    );
    expect(s.context?.topic).toBe("photo");
    expect(text(s)).toMatch(/separate dated source/);
    expect(s.actors.sable.knowledge).toEqual(["trial-photo"]);
    expect(s.receipt).toBeUndefined();
  });
  it("answers hospital follow-ups and preserves context across inspection and reload", () => {
    let s = run(newTrial(), "Sabel, tell me about your dream", "look around");
    s = run(reload(s), "why were you in hospital?");
    expect(text(s)).toMatch(/reason for that admission/);
    expect(s.context?.topic).toBe("hospital");
    s = run(s, "tell me more");
    expect(text(s)).toMatch(/dream feels familiar/);
    expect(s.treatment).toEqual([]);
    expect(s.actors.player.knowledge).toEqual(["hospital-account"]);
  });
  it("does not infer a topic after leaving and returning", () => {
    const s = run(newTrial(), "ask Sable about dreams", "go shop", "go bar");
    const after = run(reload(s), "what do you think?");
    expect(outcome(after)).toBe("clarified");
    unchangedConversation(s, after);
  });
});

describe("Offers are neither acceptance nor completed action", () => {
  it.each([
    "I'll come with you if you'd like company",
    "offer Sable company",
    "Sable, I could join you if you want",
    "May I accompany you to the appointment?",
  ])("records the qualified offer: %s", (command) => {
    const before = disclosed();
    const s = run(reload(before), command);
    expect(s.companyOffers).toEqual([
      { at: before.time, words: command, observer: "sable", status: "offered" },
    ]);
    expect(text(s)).toMatch(/haven't decided|before we arrange/);
    expect(s.observations.at(-1)?.subject).toBe("company-offer");
    expect(s.context).toEqual(before.context);
    expect(s.treatment).toEqual([]);
    expect(s.decision).toBeUndefined();
    expect(s.events).toEqual(before.events);
    expect(s.completed).toBeUndefined();
  });
  it.each([
    "I can't come with you",
    "I cannot accompany you",
    "Sable, I won't join you at the appointment",
  ])("records refusal rather than support: %s", (command) => {
    const s = run(disclosed(), command);
    expect(s.companyOffers).toEqual([]);
    expect(s.treatment.at(-1)?.value).toBe("space");
    expect(text(s)).toMatch(/won't count on you/);
    expect(s.observations.at(-1)?.subject).toBe("company-declined");
  });
  it.each([
    "I might come with you",
    "What if I offered company?",
    "don't offer Sable company",
    "I can come with you but not to the appointment",
  ])("asks before interpreting %s", (command) => {
    const before = disclosed();
    const after = run(before, command);
    expect(outcome(after)).toBe("clarified");
    unchangedConversation(before, after);
  });
  it("does not make an absent offer heard", () => {
    const before = run(disclosed(), "go home");
    const after = run(before, "I'll come with you");
    expect(last(after).failed).toBe(true);
    expect(after.companyOffers).toEqual([]);
    expect(after.observations).toEqual(before.observations);
  });
  it("accepts a time suggestion without letting company choose an outcome", () => {
    const s = run(
      disclosed(),
      "I can keep you company",
      "You can take the time you need",
      "wait ten minutes",
    );
    expect(s.companyOffers).toHaveLength(1);
    expect(s.decision?.course).toBe("document");
    expect(s.treatment.map((t) => t.value)).toEqual(["time"]);
  });
});

describe("Small advertised interactions have truthful effects", () => {
  it("reads a menu without losing a pending drink reply", () => {
    const before = run(newTrial(), "talk");
    const read = run(before, "read the cocktail menu");
    expect(text(read)).toMatch(
      /Minor Administrative Disappointment.*citrus.*alcohol-free.*gin/,
    );
    expect(read.context).toEqual(before.context);
    expect(read.time).toBe(before.time);
    const declined = run(reload(read), "No thanks, still drinking this one");
    expect(text(declined)).toMatch(/minimum order/);
    expect(declined.drink).toBeUndefined();
    expect(declined.treatment).toEqual([]);
  });
  it.each([
    "Sable, can I try Minor Administrative Disappointment without alcohol?",
    "Could I have the special, no gin please?",
    "order Minor Administrative Disappointment",
  ])("serves the alcohol-free special for %s", (command) => {
    const s = run(newTrial(), command);
    expect(s.drink?.kind).toBe("alcohol-free special");
    expect(text(s)).toMatch(/alcohol-free/);
    expect(text(s)).not.toMatch(/date I can check|investigat/);
    expect(s.context?.topic).toBe("drink");
  });
  it("distinguishes the gin version and a qualified refusal", () => {
    const s = run(newTrial(), "Can I have the special with gin?");
    expect(s.drink?.kind).toBe("gin special");
    expect(text(s)).toMatch(/with gin/);
    const after = run(s, "Sable, don't order me a special with gin");
    expect(after.drink).toEqual(s.drink);
    expect(after.time).toBe(s.time);
  });
  it("lets the player sip the advertised special without replacing it", () => {
    const s = run(
      newTrial(),
      "order the special without alcohol",
      "sip my special",
    );
    expect(s.drink?.kind).toBe("alcohol-free special");
    expect(s.drink?.remaining).toBe(2);
    expect(text(s)).toMatch(/sip/);
  });
  it("accepts a simple correction and polite multi-clause order", () => {
    let s = run(newTrial(), "Tea please. A lid implies ambition, at least.");
    expect(s.drink?.kind).toBe("tea");
    s = run(s, "actually, water please");
    expect(s.drink?.kind).toBe("water");
    expect(text(s)).toMatch(/takes back your previous cup/);
  });
  it("clarifies competing choices without losing context or serving anything", () => {
    const s = run(newTrial(), "talk");
    const next = run(s, "Could I have coffee or tea?");
    expect(outcome(next)).toBe("clarified");
    unchangedConversation(s, next);
    expect(next.drink).toBeUndefined();
  });
  it("follows the lid subject and does not cycle jokes or refill offers", () => {
    let s = run(
      newTrial(),
      "order water",
      "How's your evening going?",
      "Thanks, Sable. Tell me more about the lids.",
    );
    expect(text(s)).toMatch(/missing jars/);
    expect(text(s)).not.toMatch(/Deep Sea Prom|usual water/);
    expect(s.context?.topic).toBe("supplier");
    s = run(
      s,
      "chat with Sable",
      "chat with Sable",
      "chat with Sable",
      "chat with Sable",
    );
    const all = s.transcript.flatMap((t) => t.lines).join("\n");
    expect(all.match(/a lid implies a vessel/g)).toHaveLength(1);
    expect(all.match(/underestimated the dignity/g)).toHaveLength(1);
    expect(all).not.toMatch(/Would you like your usual/);
  });
  it.each([
    "take photograph and provenance listing",
    "take both photo and listing",
    "show photo and listing to Sable",
    "take photo and newspaper",
  ])("clarifies multiple targets before mutation: %s", (command) => {
    const before = run(newTrial(), "go shop");
    const after = run(before, command);
    expect(outcome(after)).toBe("clarified");
    expect(text(after)).toMatch(/one object at a time/);
    expect(after.entities).toEqual(before.entities);
    expect(after.observations).toEqual(before.observations);
    expect(after.time).toBe(before.time);
  });
  it("takes inspected objects without implying lost knowledge", () => {
    const s = run(newTrial(), "go shop", "read photo", "take photo");
    expect(s.entities["trial-photo"].location).toBe("player");
    expect(text(s)).toMatch(/already inspected/);
    expect(text(s)).not.toMatch(/haven't read/);
    expect(s.actors.player.knowledge).toContain("trial-photo");
  });
  it.each(["wait an hour", "wait for an hour", "wait one hour"])(
    "advances exactly an hour for %s",
    (command) => {
      expect(run(newTrial(), command).time).toBe(1140);
      expect(run(newTrial(), `don't ${command}`).time).toBe(1080);
    },
  );
});

describe("Player-facing evidence and once-only history", () => {
  it.each(["What do you think of it?", "What do you think about that?"])(
    "keeps the inspected photograph as the referent: %s",
    (command) => {
      const before = run(
        newTrial(),
        "go shop",
        "take photo",
        "go bar",
        "show photo to Sable",
      );
      const s = run(reload(before), command);
      expect(text(s)).toMatch(/occasion needs a separate dated source/);
      expect(s.context?.topic).toBe("photo");
      expect(s.receipt).toBeUndefined();
      expect(s.actors.sable.knowledge).not.toContain("trial-listing");
    },
  );
  it.each(["What would you write down?", "What are you writing down?"])(
    "explains the documentation proposal: %s",
    (command) => {
      const s = run(disclosed(), "You can take the time you need", command);
      expect(text(s)).toMatch(/what I remember, what I've observed/);
      expect(s.context?.topic).toBe("notebook");
      expect(s.completed).toBeUndefined();
      expect(s.actors.player.knowledge).not.toContain("trial-notebook");
    },
  );
  it("answers a decision follow-up after an hour without mistaking it for an action", () => {
    const before = run(disclosed(), "take your time", "wait an hour");
    const s = run(reload(before), "How is that going?");
    expect(text(s)).toMatch(/notebook the evening after/);
    expect(text(s)).not.toMatch(/supported object|\? Their|Day \d/);
    expect(s.context?.topic).toBe("investigation");
    expect(s.entities).toEqual(before.entities);
    expect(
      s.observations.filter(
        (o) => o.actor === "player" && o.subject === "decision",
      ),
    ).toHaveLength(1);
  });
  it.each([
    "look at the costume notes",
    "read the back of the menu",
    "examine the theme-night notes",
  ])("makes the advertised menu reverse readable: %s", (command) => {
    const before = run(newTrial(), "talk");
    const s = run(before, command);
    expect(text(s)).toMatch(/costume notes.*smoke machine.*rubber octopus/);
    expect(s.context).toEqual(before.context);
    expect(s.entities).toEqual(before.entities);
    expect(s.actors.player.knowledge).not.toContain("trial-notebook");
  });
  it("finishes a special in a glass without converting a refusal into drinking", () => {
    const before = run(newTrial(), "order the alcohol-free special");
    const declined = run(before, "don't finish my drink");
    expect(declined.drink).toEqual(before.drink);
    const s = run(before, "finish my drink");
    expect(s.drink?.remaining).toBe(0);
    expect(text(s)).toMatch(/empty glass/);
  });
  it("lets the documentation disclosure remain serious", () => {
    const s = run(
      disclosed(),
      "take your time",
      "wait an hour",
      "go home",
      "rest until tomorrow",
      "wait an hour",
      "go bar",
      "talk privately",
    );
    expect(s.completed?.course).toBe("document");
    expect(text(s)).toMatch(/three columns/);
    expect(text(s)).not.toMatch(/disaster|octopus|music is/);
  });
  it("records one decision without erasing other observations or provenance", () => {
    let s = run(
      disclosed(),
      "wait ten minutes",
      "ask Sable about the decision",
      "When is your appointment, Sable?",
      "journal",
    );
    expect(
      s.observations.filter(
        (o) => o.actor === "player" && o.subject === "decision",
      ),
    ).toHaveLength(1);
    expect(text(s)).toContain("chose an independent examination");
    expect(text(s)).not.toContain("chose formal");
    expect(text(s).match(/chose an independent examination/g)).toHaveLength(1);
    expect(s.receipt?.sources).toHaveLength(2);
    expect(
      s.observations.filter(
        (o) => o.actor === "player" && o.mode === "inspected",
      ),
    ).toHaveLength(2);
    s = reload(s);
    expect(s.decision?.at).toBe(s.receipt!.at + 10);
  });
  it("keeps new outcome narration natural and theories out of all visible text", () => {
    const s = finished();
    expect(text(s)).toMatch(/It's been a few days|It's been several days/);
    expect(text(s)).not.toMatch(/\d+ hours|\d+ minutes|did not wait for you/);
    expect(s.transcript.flatMap((t) => t.lines).join(" ")).not.toMatch(
      /donor|memory theft|deserve an account/,
    );
    expect(s.actors.player.knowledge).not.toContain("trial-report");
    expect(s.completed!.at - s.decision!.at).toBe(4320);
  });
  it("resolves the invited report request and follow-up after reload", () => {
    const before = finished();
    const s = run(
      reload(before),
      "May I see the medical report?",
      "what does that mean?",
    );
    expect(s.actors.player.knowledge).toContain("trial-report");
    expect(s.entities["trial-report"].location).toBe("sable");
    expect(s.context?.topic).toBe("report");
    expect(text(s)).toMatch(/report leaves other explanations open/);
    expect(text(s)).not.toMatch(/donor|memory theft|octopus/);
    expect(
      s.observations.filter(
        (o) =>
          o.actor === "player" &&
          o.mode === "inspected" &&
          o.subject === "trial-report",
      ),
    ).toHaveLength(1);
  });
  it("understands a clear document pronoun without inventing custody", () => {
    const s = run(finished(), "May I see it?");
    expect(s.actors.player.knowledge).toContain("trial-report");
    expect(s.entities["trial-report"].location).toBe("sable");
  });
});
