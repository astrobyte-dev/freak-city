import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import {
  openingPromises,
  trialInterlocutors,
} from "../src/trial/interaction-content";
import { currentDrink, vesselView } from "../src/trial/vessels";
import { readTrial, writeTrial, TRIAL_SAVE } from "../src/trial/save";
import { interactionFixture } from "./fixtures/interaction-fixture";

const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce(
    (s, c) => validateTrial(JSON.parse(JSON.stringify(executeTrial(s, c)))),
    s,
  );
const last = (s: TrialState) => s.transcript.at(-1)!;
const diagnostic = (s: TrialState) => last(s).diagnostics![0];
const text = (s: TrialState) => last(s).lines.join(" ");

describe("Authored opening promises are executable declarations", () => {
  it.each(openingPromises)("$id", (promise) => {
    if ("actor" in promise)
      expect(trialInterlocutors.some((a) => a.id === promise.actor)).toBe(true);
    if ("entity" in promise)
      expect(newTrial().entities[promise.entity]).toBeDefined();
    const s = run(newTrial(), ...promise.commands);
    expect(diagnostic(s).outcome, text(s)).toBe("handled");
    expect(diagnostic(s).intent).toContain(promise.intent);
    expect(text(s).toLowerCase()).toContain(promise.response.toLowerCase());
  });
});
describe("One validated vessel action for words, offers and custody", () => {
  it.each(["yes", "yes ill have another coffee", "I accept the coffee"])(
    "accepts the same identified held cup: %s",
    (reply) => {
      const offered = run(
        newTrial(),
        "coffee",
        "take cup",
        "finish cup",
        "ask for another drink",
      );
      const s = run(offered, "read menu", reply);
      expect(currentDrink(s)).toMatchObject({
        id: "trial-cup",
        location: "player",
        remaining: 3,
      });
      expect(diagnostic(s).meaning).toMatchObject({
        kind: "accept",
        entities: ["trial-cup"],
      });
      expect(Object.keys(s.entities)).toEqual(Object.keys(offered.entities));
    },
  );
  it.each(["yes", "yes ill have another coffee", "I accept the coffee"])(
    "revalidates a moved offer without teleport: %s",
    (reply) => {
      const offered = run(
        newTrial(),
        "coffee",
        "finish cup",
        "ask for another drink",
      );
      offered.entities["trial-cup"].location = "home";
      const s = run(offered, reply);
      expect(diagnostic(s).outcome).toBe("rejected");
      expect(s.entities).toEqual(offered.entities);
      expect(s.context).toEqual(offered.context);
      expect(s.time).toBe(offered.time);
    },
  );
  it("remote refill does not substitute an unused vessel", () => {
    const remote = run(
      newTrial(),
      "coffee",
      "take cup",
      "go home",
      "finish cup",
      "put down cup",
      "go bar",
    );
    const s = run(remote, "refill coffee");
    expect(diagnostic(s).outcome).toBe("rejected");
    expect(s.entities).toEqual(remote.entities);
    expect(text(s)).toMatch(/back within reach/);
  });
  it("closed containment blocks every physical operation and refill", () => {
    const s = run(
      newTrial(),
      "coffee",
      "take cup",
      "finish cup",
      "put cup in satchel",
      "close satchel",
    );
    for (const c of [
      "examine cup",
      "take cup",
      "sip cup",
      "finish cup",
      "put down cup",
      "refill coffee",
    ]) {
      const after = run(s, c);
      expect(diagnostic(after).outcome, c).toBe("rejected");
      expect(after.entities, c).toEqual(s.entities);
      expect(after.time, c).toBe(s.time);
    }
    expect(currentDrink(run(s, "open satchel", "refill coffee"))).toMatchObject(
      { remaining: 3, location: "trial-bag" },
    );
  });
  it("retains other carried objects and clarifies competing vessels", () => {
    const s = run(newTrial(), "coffee", "take cup", "water", "take glass");
    expect(vesselView(s.entities["trial-cup"])).toMatchObject({
      kind: "coffee",
      remaining: 3,
      location: "player",
    });
    const ambiguous = run(s, "sip drink");
    expect(diagnostic(ambiguous).outcome).toBe("clarified");
    expect(ambiguous.entities).toEqual(s.entities);
    const emptied = run(s, "finish cup", "put down cup", "examine cup");
    expect(vesselView(emptied.entities["trial-cup"])).toMatchObject({
      remaining: 0,
      location: "bar",
    });
    expect(vesselView(emptied.entities["trial-glass"])).toMatchObject({
      remaining: 3,
      location: "player",
    });
    expect(diagnostic(run(emptied, "sip cup")).outcome).toBe("rejected");
  });
});
describe("Explicit conversation meaning", () => {
  it.each(["I don't disagree about the complaint"])(
    "clarifies competing polarity: %s",
    (reply) => {
      const s = newTrial(),
        after = run(s, reply);
      expect(diagnostic(after).outcome).toBe("clarified");
      expect(after.observations).toEqual(s.observations);
      expect(after.time).toBe(s.time);
    },
  );
  it("does not execute part of a competing request", () => {
    const s = newTrial(),
      after = run(s, "order coffee and arrange a taxi");
    expect(diagnostic(after).outcome).toBe("clarified");
    expect(after.entities).toEqual(s.entities);
    expect(after.time).toBe(s.time);
  });
  it.each([
    ["no it dosen't sound threatening", "negative"],
    ["yes very threatening", "positive"],
    ["it sounds harmless", "negative"],
  ])("opening opinion %s", (reply, polarity) => {
    const s = run(newTrial(), "look", "inventory", "read menu", reply);
    expect(diagnostic(s).meaning).toMatchObject({
      kind: "opinion",
      subject: "supplier",
      polarity,
      interlocutor: "sable",
    });
    expect(currentDrink(s)).toBeUndefined();
    expect(
      s.observations.some(
        (o) => o.subject === "supplier" && o.detail === polarity,
      ),
    ).toBe(true);
  });
  it("explicit complaint reply supersedes a later offer without accepting it", () => {
    const offered = run(newTrial(), "talk");
    const s = run(offered, "yes very threatening");
    expect(diagnostic(s).meaning).toMatchObject({
      kind: "opinion",
      subject: "supplier",
    });
    expect(s.context?.topic).toBe("supplier");
    expect(s.context?.question).toBeUndefined();
    expect(text(s)).not.toContain("not accepted");
    expect(currentDrink(s)).toBeUndefined();
    expect(run(s, "tell me more").context?.topic).toBe("supplier");
  });
  it.each(["maybe", "yes but not very threatening", "perhaps coffee or water"])(
    "keeps uncertainty and ambiguity from executing: %s",
    (reply) => {
      const s = run(newTrial(), "talk");
      const after = run(s, reply);
      expect(diagnostic(after).outcome).toBe(
        reply === "perhaps coffee or water" ? "clarified" : "deferred",
      );
      expect(after.entities).toEqual(s.entities);
      expect(after.context).toEqual(s.context);
      expect(after.time).toBe(s.time);
    },
  );
  it("unknown service gets a relevant limitation, including after another topic", () => {
    const s = run(
      newTrial(),
      "ask Sable about memories",
      "ask Sable for a taxi",
    );
    expect(diagnostic(s).outcome).toBe("clarified");
    expect(text(s)).toMatch(/^Trial limitation:/);
    expect(text(s)).not.toMatch(/supplier|Tea, coffee/);
  });
  it("claims retain qualifications; showing and giving have distinct observation effects", () => {
    const claim = run(
      newTrial(),
      "Sable, I came across a picture that might show you",
    );
    expect(diagnostic(claim).meaning?.kind).toBe("claim");
    expect(
      claim.observations.find((o) => o.mode === "claim")?.detail,
    ).toContain("might");
    expect(claim.actors.sable.knowledge).toEqual([]);
    const held = run(claim, "go shop", "take photo", "go bar");
    const shown = run(held, "show photo to Sable");
    const given = run(held, "give photo to Sable");
    expect(shown.entities["trial-photo"].location).toBe("player");
    expect(
      shown.observations.some(
        (o) => o.actor === "sable" && o.mode === "inspected",
      ),
    ).toBe(true);
    expect(given.entities["trial-photo"].location).toBe("sable");
    expect(
      given.observations.some(
        (o) => o.actor === "sable" && o.mode === "inspected",
      ),
    ).toBe(false);
  });
});

describe("Synthetic second character and vessel reuse declarations", () => {
  it.each(["Rowan", "Kit"])(
    "%s uses the same dispatcher and separate observations",
    (name) => {
      const f = interactionFixture();
      expect(f.command(`ask ${name} about the notice`)?.failed).not.toBe(true);
      expect(f.command("no it doesn't sound severe")?.meaning).toMatchObject({
        kind: "opinion",
        polarity: "negative",
        interlocutor: name.toLowerCase(),
      });
      expect(f.command("tell me more")?.lines.join(" ")).toContain(
        "missing spoons",
      );
      expect(f.command(`${name}, order coffee`)?.failed).not.toBe(true);
      expect(f.command(`${name}, order tea`)?.failed).not.toBe(true);
      expect(f.state.entities.mug.properties.beverage).toBe("tea");
      expect(f.command("sip drink")?.clarified).toBe(true);
      for (const vessel of ["cup", "mug"]) {
        for (const c of [
          `take ${vessel}`,
          `take another sip of ${vessel}`,
          `finish ${vessel}`,
          `put down ${vessel}`,
          `examine ${vessel}`,
        ])
          expect(f.command(c)?.failed, c).not.toBe(true);
        expect(f.state.entities[vessel].properties.remaining).toBe(0);
      }
      expect(f.command(`${name}, I found a snapshot`)?.meaning?.kind).toBe(
        "claim",
      );
      f.command("take snapshot");
      f.command(`show snapshot to ${name}`);
      expect(f.host.observed(name.toLowerCase(), "snapshot")).toBe(true);
      expect(
        f.host.observed(name === "Kit" ? "rowan" : "kit", "snapshot"),
      ).toBe(false);
      expect(f.command("what do you think of it")?.lines.join(" ")).toContain(
        "no date",
      );
    },
  );
});

function legacy() {
  const s = JSON.parse(JSON.stringify(newTrial()));
  s.revision = 2;
  delete s.context;
  for (const id of ["trial-cup", "trial-glass", "trial-counter", "trial-menu"])
    delete s.entities[id];
  s.drink = {
    kind: "coffee",
    remaining: 0,
    location: "player",
    servedAt: 1080,
  };
  s.context = {
    kind: "drink",
    topic: "drink",
    room: "bar",
    at: 1080,
    question: { kind: "confirm-drink", offered: "coffee" },
  };
  return s;
}
describe("Validated migration preserves custody, context and original bytes", () => {
  it("backs up before autosave, restores the question and never duplicates migration", () => {
    const raw = JSON.stringify(legacy());
    const data = new Map([
      [TRIAL_SAVE, raw],
      ["campaign", "untouched"],
    ]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
      removeItem: (k: string) => {
        data.delete(k);
      },
    };
    const loaded = readTrial(storage);
    expect(loaded.error).toBeNull();
    expect(loaded.notice).toContain("migrated");
    expect(data.get(`${TRIAL_SAVE}:preserved:1`)).toBe(raw);
    expect(currentDrink(loaded.state!)).toMatchObject({
      remaining: 0,
      location: "player",
    });
    expect(loaded.state!.context?.question).toMatchObject({
      subject: "drink",
      vesselId: "trial-cup",
    });
    const next = run(loaded.state!, "yes");
    writeTrial(storage, next);
    expect(currentDrink(readTrial(storage).state!)).toMatchObject({
      remaining: 3,
      location: "player",
    });
    expect(data.get("campaign")).toBe("untouched");
    expect(data.size).toBe(3);
  });
  it.each(["contents", "future", "unknown", "conflict"])(
    "rejects invalid older save: %s",
    (invalid) => {
      const old = legacy();
      if (invalid === "contents") old.drink.remaining = 4;
      if (invalid === "future") old.drink.servedAt = 2000;
      if (invalid === "unknown") old.revision = 99;
      if (invalid === "conflict")
        old.entities["trial-cup"] = {
          ...newTrial().entities["trial-cup"],
          location: "player",
        };
      expect(() => validateTrial(old)).toThrow();
    },
  );
  it("refuses revision 3 dual authority and tampered vessel markers", () => {
    expect(() =>
      validateTrial({ ...newTrial(), drink: legacy().drink }),
    ).toThrow();
    const s = newTrial();
    delete s.entities["trial-cup"].properties.interaction;
    expect(() => validateTrial(s)).toThrow();
  });
});
