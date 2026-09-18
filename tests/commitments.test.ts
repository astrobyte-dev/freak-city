import { describe, it, expect } from "vitest";
import {
  newGame,
  validateSave,
  updateBoundary,
  advanceTime,
} from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { agreementFor, socialTime } from "../src/engine/commitments";
import {
  importSave,
  exportSave,
  bookmark,
  restoreBookmark,
} from "../src/engine/save";

const fresh = () => ensureWorld(newGame("NIGHT-0"));
const last = (s: ReturnType<typeof fresh>) =>
  s
    .world!.transcript.at(-1)!
    .passages.map((p) => p.text)
    .join("\n");
function run(commands: string[], s = fresh()) {
  for (const command of commands) {
    const result = executeCommand(s, command);
    expect(result.ok, `${command}: ${last(result.state)}`).toBe(true);
    s = result.state;
  }
  return s;
}
const arrive = () => run(["take envelope", "go outside", "go inside"]);
const offer = () =>
  run(["ask Inez to keep my envelope while I visit the bar"], arrive());
const accepted = () => run(["yes please"], offer());
const earlier = () =>
  run(["I'll be back in eight minutes", "sounds good"], offer());

describe("Inez's existing availability and contextual agreement", () => {
  it("offers her actual departure, never transfers or teaches lore before acknowledgement", () => {
    const s = offer();
    expect(s.world!.social!.offer?.due).toBe(1455 * 60);
    expect(agreementFor(s)).toBeUndefined();
    expect(s.world!.entities.envelope.location).toBe("player");
    expect(s.canon.player).toEqual([]);
    expect(last(s)).toContain("00:15");
  });
  it.each([
    "yes",
    "yeah",
    "sure",
    "okay",
    "yes please",
    "yes, please",
    "sounds good",
    'say "yes please" to Inez',
  ])("acknowledges natural reply %s", (phrase) => {
    const s = run([phrase], offer());
    expect(agreementFor(s)?.status).toBe("active");
    expect(s.world!.entities.envelope.location).toBe("ledge");
    expect(s.world!.entities.envelope.owner).toBe("player");
    expect(s.world!.entities.invitation.location).toBe("envelope");
  });
  it.each([
    "no thanks",
    "no, thanks",
    'say "no thanks" to Inez',
    "I'd rather not",
    "never mind",
  ])("declines naturally: %s", (phrase) => {
    const s = offer(),
      result = run([phrase], s);
    expect(agreementFor(result)).toBeUndefined();
    expect(result.world!.social!.offer).toBeUndefined();
    expect(socialTime(result)).toBe(socialTime(s));
    expect(result.npcs.inez.relationship).toEqual(s.npcs.inez.relationship);
  });
  it("allows player-proposed timing, two-minute extension and ordinary acknowledgement", () => {
    let s = earlier();
    const due = agreementFor(s)!.due;
    s = run(["can I have two more minutes?", "okay"], s);
    expect(agreementFor(s)!.due).toBe(due + 120);
    expect(agreementFor(s)!.revisions).toHaveLength(2);
    expect(s.world!.social!.events.map((e) => e.kind)).toEqual([
      "accepted",
      "revised",
    ]);
  });
  it("clarifies an unspecified extension and survives reload of that conversation", () => {
    let s = run(["could I have a little longer?"], earlier());
    expect(last(s)).toContain("How much");
    s = validateSave(JSON.parse(exportSave(s)));
    s = run(["two minutes", "yes"], s);
    expect(agreementFor(s)!.revisions).toHaveLength(2);
  });
  it("refuses an extension past departure without changing existing terms", () => {
    const s = accepted(),
      due = agreementFor(s)!.due;
    const n = run(["can I have ten more minutes"], s);
    expect(agreementFor(n)!.due).toBe(due);
    expect(n.world!.social!.offer).toBeUndefined();
    expect(last(n)).toContain("quarter past");
  });
  it("does not infer acceptance from thanks, hypothetical, negated or unrelated replies", () => {
    for (const phrase of [
      "thank Inez",
      "don't give the envelope to Inez",
      "what if I leave it here",
      'tell Inez "someone said yes"',
    ]) {
      const result = executeCommand(offer(), phrase);
      expect(agreementFor(result.state), phrase).toBeUndefined();
      expect(result.state.world!.entities.envelope.location, phrase).toBe(
        "player",
      );
    }
    const s = run(["go bar", "joke with Mara", "go vestibule"], offer());
    expect(agreementFor(executeCommand(s, "yes").state)).toBeUndefined();
  });
  it("stops a dependent command chain at an unanswered offer", () => {
    const s = run(["ask Inez to watch my envelope; go bar"], arrive());
    expect(s.world!.room).toBe("vestibule");
    expect(agreementFor(s)).toBeUndefined();
  });
  it("keeps giving distinct from a loan and resolves object pronouns honestly", () => {
    const gift = run(["give envelope to Inez"], offer());
    expect(gift.world!.entities.envelope.owner).toBe("inez");
    expect(agreementFor(gift)).toBeUndefined();
    const s = run(["examine phone"], arrive());
    const result = executeCommand(s, "Inez, can you keep it for me?");
    expect(result.ok).toBe(false);
    expect(result.state.world!.entities.phone.location).toBe("player");
  });
});

describe("explicit subjects take precedence over safekeeping focus", () => {
  const unrelated = [
    "tell Inez I got a drink",
    "tell Inez I changed my mind about going to the bar",
    "ask Inez how much longer the bar stays open",
    "tell Inez I collected my coat",
    "tell Inez I picked up a book",
    "tell Inez I took the bus",
    "tell Inez I got a drink while carrying my envelope",
    "tell Inez I changed my mind about dinner",
    "tell Inez cancel my drink order",
    "tell Inez stop watching the street",
    "ask Inez can I have more time for a drink",
    "ask Inez can we extend my stay",
    "ask Inez what time the bar closes",
    "ask Inez when Mara comes back",
    "tell Inez I'll return to the bar in two minutes",
    "tell Inez I'll collect my coat in two minutes",
    "tell Inez sorry for being late for dinner",
    "tell Inez don't open the door",
  ];
  it.each(unrelated)(
    "keeps unrelated speech out of the care lifecycle: %s",
    (command) => {
      const before = accepted();
      const after = executeCommand(before, command).state;
      expect(after.world!.social!.agreements).toEqual(
        before.world!.social!.agreements,
      );
      expect(after.world!.social!.events).toEqual(before.world!.social!.events);
      expect(after.world!.social!.observations).toEqual(
        before.world!.social!.observations,
      );
      expect(after.world!.social!.offer).toBeUndefined();
      expect(after.world!.social!.clarification).toBeUndefined();
      expect(after.npcs.inez.beliefs.envelopeCollection).toBeUndefined();
      expect(after.world!.entities.envelope).toEqual(
        before.world!.entities.envelope,
      );
      expect(
        after
          .world!.transcript.at(-1)!
          .passages.some((p) => p.from === "commitment"),
      ).toBe(false);
      expect(validateSave(JSON.parse(exportSave(after)))).toEqual(after);
    },
  );
  it("does not let a pending duration question swallow an explicit topic change", () => {
    const before = run(["could I have a little longer?"], earlier());
    const after = executeCommand(
      before,
      "ask Inez how much longer the bar stays open",
    ).state;
    expect(after.world!.social!.agreements).toEqual(
      before.world!.social!.agreements,
    );
    expect(after.world!.social!.events).toEqual(before.world!.social!.events);
    expect(last(after)).not.toContain("How much more time");
    expect(after.world!.social!.offer).toBeUndefined();
  });
  it.each([
    "tell Inez I got my envelope and my coat",
    "tell Inez cancel the envelope arrangement and my dinner",
  ])(
    "clarifies mixed consequential references without a mutation: %s",
    (command) => {
      const before = accepted(),
        after = run([command], before);
      expect(last(after)).toContain("Do you mean your envelope");
      expect(socialTime(after)).toBe(socialTime(before));
      expect(after.world!.social!).toEqual(before.world!.social!);
      expect(after.npcs.inez.beliefs).toEqual(before.npcs.inez.beliefs);
    },
  );
  it("clarifies a conflicting pronoun but honours an explicit envelope object", () => {
    let s = run(["examine phone"], accepted());
    const before = structuredClone(s.world!.social!);
    s = run(["I got it"], s);
    expect(last(s)).toContain("Do you mean your envelope");
    expect(s.world!.social!).toEqual(before);
    s = run(["tell Inez I got my envelope"], s);
    expect(last(s)).toContain("still on the ledge");
    expect(s.world!.social!.events.some((e) => e.kind === "reported")).toBe(
      true,
    );
  });
  it("retains explicit extension purpose, cancellation and a specific apology", () => {
    let s = run(
      ["can I have two more minutes to collect my envelope", "okay"],
      earlier(),
    );
    expect(agreementFor(s)!.revisions).toHaveLength(2);
    s = run(["tell Inez I changed my mind about leaving my envelope here"], s);
    expect(agreementFor(s)!.status).toBe("cancelled");
    s = run(
      ["wait until 00:01", "apologise to Inez for missing the envelope time"],
      earlier(),
    );
    expect(agreementFor(s)!.apologyAt).toBeDefined();
  });
});

describe("pending extension versus the original agreement", () => {
  const pending = () => run(["can I have two more minutes"], earlier());
  const reload = (s: ReturnType<typeof fresh>) =>
    validateSave(JSON.parse(exportSave(s)));
  it.each([
    "no thanks",
    "decline the extension",
    "cancel the extension",
    "reject the extra time",
    "I've changed my mind about the extension",
  ])("declines only the extension: %s", (reply) => {
    const before = pending();
    let s = run([reply], reload(before));
    expect(agreementFor(s)).toEqual(agreementFor(before));
    expect(s.world!.social!.offer).toBeUndefined();
    expect(s.world!.social!.events).toEqual(before.world!.social!.events);
    expect(s.world!.entities.envelope).toEqual(before.world!.entities.envelope);
    expect(last(s)).toContain("before 00:01");
    expect(last(s)).not.toContain("Keep it with you");
    s = run(["yes"], reload(s));
    expect(agreementFor(s)!.revisions).toHaveLength(1);
    expect(agreementFor(s)!.due).toBe(agreementFor(before)!.due);
    s = run(["wait until 00:02"], s);
    expect(agreementFor(s)!.status).toBe("missed");
    expect(agreementFor(s)!.missedAt).toBe(agreementFor(before)!.due);
    expect(last(s)).toContain("Our time is up");
    expect(reload(s)).toEqual(s);
  });
  it.each([
    "cancel the envelope arrangement",
    "cancel the original agreement",
    "stop watching the envelope",
    "decline the envelope arrangement",
  ])("cancels the agreement even with an offer pending: %s", (reply) => {
    const before = pending();
    let s = run([reply], reload(before));
    expect(agreementFor(s)!.status).toBe("cancelled");
    expect(agreementFor(s)!.due).toBe(agreementFor(before)!.due);
    expect(s.world!.social!.offer).toBeUndefined();
    expect(s.world!.social!.events.map((e) => e.kind)).toEqual([
      "accepted",
      "cancelled",
    ]);
    expect(s.world!.entities.envelope).toEqual(before.world!.entities.envelope);
    expect(last(s)).toContain("I'm no longer watching it");
    s = run(["yes"], reload(s));
    expect(agreementFor(s)!.status).toBe("cancelled");
    expect(agreementFor(s)!.revisions).toHaveLength(1);
    advanceTime(s, 25);
    expect(agreementFor(s)!.missedAt).toBeUndefined();
    expect(agreementFor(s)!.reminder).toBeUndefined();
    expect(s.world!.social!.events.some((e) => e.kind === "missed")).toBe(
      false,
    );
    expect(s.world!.entities.envelope).toEqual(before.world!.entities.envelope);
    expect(reload(s)).toEqual(s);
  });
  it.each(["I've changed my mind", "I changed my mind about it"])(
    "keeps both decisions while clarifying: %s",
    (reply) => {
      const before = pending();
      let s = run([reply], before);
      expect(last(s)).toContain("no extra time, or should I stop watching");
      expect(socialTime(s)).toBe(socialTime(before));
      expect(agreementFor(s)).toEqual(agreementFor(before));
      expect(s.world!.social!.offer).toEqual(before.world!.social!.offer);
      expect(s.world!.social!.events).toEqual(before.world!.social!.events);
      expect(s.world!.social!.observations).toEqual(
        before.world!.social!.observations,
      );
      expect(s.world!.entities.envelope).toEqual(
        before.world!.entities.envelope,
      );
      s = run(["yes"], reload(s));
      expect(last(s)).toContain("no extra time, or should I stop watching");
      expect(agreementFor(s)).toEqual(agreementFor(before));
      expect(s.world!.social!.offer).toEqual(before.world!.social!.offer);
      expect(socialTime(s)).toBe(socialTime(before));
    },
  );
  it.each([
    ["no extra time", "active"],
    ["the extension", "active"],
    ["keep the original deadline", "active"],
    ["no thanks", "active"],
    ["the original arrangement", "cancelled"],
    ["stop watching the envelope", "cancelled"],
  ])("resolves a saved clarification with %s", (reply, status) => {
    const before = pending();
    let s = run(["I've changed my mind"], before);
    s = run([reply], reload(s));
    expect(agreementFor(s)!.status).toBe(status);
    expect(agreementFor(s)!.due).toBe(agreementFor(before)!.due);
    expect(s.world!.social!.offer).toBeUndefined();
    expect(s.world!.social!.clarification).toBeUndefined();
    expect(s.world!.entities.envelope).toEqual(before.world!.entities.envelope);
    s = run(["wait until 00:02"], reload(s));
    expect(agreementFor(s)!.status).toBe(
      status === "active" ? "missed" : "cancelled",
    );
    expect(reload(s)).toEqual(s);
  });
  it("does not apply a pending choice to explicit unrelated subjects or other people", () => {
    const before = run(["I've changed my mind"], pending());
    for (const command of [
      "tell Inez I changed my mind about going to the bar",
      "cancel my drink order",
      "tell Mara cancel the envelope arrangement",
    ]) {
      const after = executeCommand(before, command).state;
      expect(agreementFor(after)).toEqual(agreementFor(before));
      expect(after.world!.social!.events).toEqual(before.world!.social!.events);
      expect(after.world!.entities.envelope).toEqual(
        before.world!.entities.envelope,
      );
    }
  });
  it("does not erase a miss when cancellation completes across the original deadline", () => {
    let s = pending();
    const due = agreementFor(s)!.due;
    s = run(
      [
        `wait ${due - socialTime(s) - 30} seconds`,
        "cancel the envelope arrangement",
      ],
      s,
    );
    expect(agreementFor(s)!.status).toBe("cancelled");
    expect(agreementFor(s)!.missedAt).toBe(due);
    expect(s.world!.social!.offer).toBeUndefined();
    expect(reload(s)).toEqual(s);
  });
});

describe("custody, timed completion, provenance and repair", () => {
  it("collects through ordinary TAKE and naturally remembers once on later conversation", () => {
    let s = run(
      ["go bar", "joke with Mara", "go vestibule", "take envelope"],
      accepted(),
    );
    expect(agreementFor(s)?.status).toBe("fulfilled");
    expect(s.npcs.inez.relationship).toEqual({
      trust: 0,
      affinity: 0,
      suspicion: 0,
    });
    s = run(["go bar", "wait until 00:38", "go vestibule", "talk Inez"], s);
    expect(last(s)).toContain("came back when you said");
    const again = run(["talk Inez"], s);
    expect(last(again)).not.toContain("came back when you said");
    expect(validateSave(JSON.parse(exportSave(again)))).toEqual(again);
  });
  it.each([-1, 0, 1])(
    "uses completion time at deadline offset %s seconds",
    (offset) => {
      let s = accepted();
      const due = agreementFor(s)!.due;
      const seconds = due - socialTime(s) - 60 + offset;
      s = run([`wait ${seconds} seconds`, "take envelope"], s);
      expect(agreementFor(s)?.status).toBe(
        offset < 0 ? "fulfilled" : "collected-late",
      );
      expect(s.npcs.inez.location).toBe(
        offset < 0 ? "vestibule" : "loading-bay",
      );
      expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
    },
  );
  it("does not tell Inez about unseen late collection or Mara's conversation", () => {
    let s = run(
      [
        "go bar",
        "tell Mara I promised Inez I'd collect my envelope",
        "wait until 00:16",
        "go vestibule",
        "take envelope",
      ],
      accepted(),
    );
    const social = s.world!.social!,
      collection = social.events.find((e) => e.kind === "collected")!;
    expect(
      social.observations.some(
        (o) => o.event === collection.id && o.npc === "inez",
      ),
    ).toBe(false);
    const report = social.events.find((e) => e.kind === "reported")!;
    expect(
      social.observations
        .filter((o) => o.event === report.id)
        .map((o) => o.npc),
    ).toEqual(["mara"]);
    s = run(["go bar", "wait until 00:38", "go vestibule", "talk Inez"], s);
    expect(last(s)).toContain("ledge was empty");
    expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
  });
  it("keeps a missed time after specific apology and witnessed late collection", () => {
    let s = earlier();
    s = run(
      [
        `wait until ${Math.floor(agreementFor(s)!.due / 3600) % 24}:${String(Math.floor(agreementFor(s)!.due / 60) % 60).padStart(2, "0")}`,
        "sorry I'm late",
        "take envelope",
      ],
      s,
    );
    const a = agreementFor(s)!;
    expect(a.status).toBe("collected-late");
    expect(a.repairAt).toBeDefined();
    expect(a.missedAt).toBeDefined();
    const count = s.world!.social!.events.length;
    s = run(["apologise to Inez for missing the envelope time"], s);
    expect(s.world!.social!.events).toHaveLength(count);
    expect(s.npcs.inez.relationship.trust).toBe(0);
    expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
  });
  it("cancels without teleporting the envelope or erasing the original agreement", () => {
    const s = run(["I've changed my mind"], accepted());
    expect(agreementFor(s)?.status).toBe("cancelled");
    expect(s.world!.entities.envelope.location).toBe("ledge");
    expect(s.world!.social!.events.map((e) => e.kind)).toEqual([
      "accepted",
      "cancelled",
    ]);
  });
  it.each(["yes", "no"])(
    "resumes a cancellation clarification with %s after reload",
    (reply) => {
      let s = run(["no"], accepted());
      expect(s.world!.social!.clarification).toBe("cancellation");
      s = validateSave(JSON.parse(exportSave(s)));
      s = run([reply], s);
      expect(agreementFor(s)!.status).toBe(
        reply === "yes" ? "cancelled" : "active",
      );
      expect(s.world!.social!.clarification).toBeUndefined();
      expect(s.world!.entities.envelope.location).toBe("ledge");
    },
  );
  it("answers the collection reminder with an actual timed pickup", () => {
    let s = run(["wait until 00:01"], earlier());
    expect(last(s)).toContain("Are you collecting");
    s = run(["yes, please"], s);
    expect(agreementFor(s)!.status).toBe("collected-late");
    expect(s.world!.entities.envelope.location).toBe("player");
  });
  it.each(["yes", "no"])(
    "treats %s to a later collection question as a report, not unseen evidence or cancellation",
    (reply) => {
      let s = run(
        [
          "go bar",
          "wait until 00:16",
          "go vestibule",
          "take envelope",
          "go bar",
          "wait until 00:38",
          "go vestibule",
          "talk Inez",
        ],
        accepted(),
      );
      expect(last(s)).toContain("Did you collect");
      s = run([reply], s);
      expect(agreementFor(s)!.status).toBe("collected-late");
      const collection = s.world!.social!.events.find(
        (e) => e.kind === "collected",
      )!;
      expect(
        s.world!.social!.observations.some(
          (o) => o.event === collection.id && o.npc === "inez",
        ),
      ).toBe(false);
      expect(s.world!.social!.events.some((e) => e.kind === "reported")).toBe(
        true,
      );
      expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
    },
  );
  it("distinguishes a visibly contradicted collection claim from an unverified report", () => {
    const s = run(["I already collected it"], accepted());
    expect(last(s)).toContain("still on the ledge");
    expect(agreementFor(s)!.status).toBe("active");
    expect(s.npcs.inez.beliefs.envelopeCollection.source).toContain(
      "contradicted",
    );
  });
  it("processes deadlines during a non-parser time advance and retains the front route", () => {
    let s = accepted();
    advanceTime(s, 40);
    expect(agreementFor(s)?.missedAt).toBe(1455 * 60);
    expect(s.npcs.inez.location).not.toBe("vestibule");
    s = run(["go bar", "wait until 02:40", "go outside"], s);
    expect(executeCommand(s, "go inside").ok).toBe(false);
    expect(run(["go front entrance"], s).world!.room).toBe("bar");
  });
});

describe("save compatibility and identity", () => {
  it("uses the real 03:00 departure on Inez's return shift, including the front route", () => {
    let s = run(
      ["wait until 02:38", "ask Inez to watch my envelope", "sure"],
      arrive(),
    );
    expect(agreementFor(s)!.due).toBe(1620 * 60);
    s = run(
      [
        "go bar",
        "go outside",
        "go front entrance",
        "go vestibule",
        "take envelope",
      ],
      s,
    );
    expect(agreementFor(s)!.status).toBe("fulfilled");
    expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
  });
  it("does not change acceptance terms or execute a request embedded in a report", () => {
    let s = offer();
    s = run(["agree to collect the envelope before 00:20"], s);
    expect(agreementFor(s)).toBeUndefined();
    expect(last(s)).toContain("What are you agreeing");
    s = run(["tell Inez someone said to keep my envelope"], arrive());
    expect(s.world!.social!.offer).toBeUndefined();
    expect(agreementFor(s)).toBeUndefined();
  });
  it("preserves elapsed time and fired deadlines when an extension reply arrives too late", () => {
    let s = earlier();
    const due = agreementFor(s)!.due;
    s = run(["can I have two more minutes"], s);
    s = run([`wait ${due - socialTime(s) - 30} seconds`], s);
    const result = executeCommand(s, "yes");
    expect(result.ok).toBe(false);
    expect(socialTime(result.state)).toBe(socialTime(s) + 60);
    expect(agreementFor(result.state)!.status).toBe("missed");
    expect(agreementFor(result.state)!.revisions).toHaveLength(1);
    expect(validateSave(JSON.parse(exportSave(result.state)))).toEqual(
      result.state,
    );
  });
  it("does not infer collection timing from possession seen after a late return", () => {
    let s = run(
      [
        "go bar",
        "wait until 00:16",
        "go vestibule",
        "take envelope",
        "go bar",
        "wait until 00:38",
        "go vestibule",
        "talk Inez",
        "sorry I'm late",
      ],
      accepted(),
    );
    expect(agreementFor(s)!.repairAt).toBeDefined();
    const collection = s.world!.social!.events.find(
      (e) => e.kind === "collected",
    )!;
    expect(
      s.world!.social!.observations.some(
        (o) => o.event === collection.id && o.npc === "inez",
      ),
    ).toBe(false);
    expect(last(s)).toContain("Next time");
    s = run(["put envelope in coat", "close coat"], s);
    expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
  });
  it("keeps nonsensical duration qualifiers out of accepted timing", () => {
    const s = earlier(),
      due = agreementFor(s)!.due;
    const n = run(["can I have minus two more minutes"], s);
    expect(n.world!.social!.offer).toBeUndefined();
    expect(agreementFor(n)!.due).toBe(due);
    expect(last(n)).toContain("How much");
  });
  it("migrates old revisions without inferred promises or relocated gifts", () => {
    for (const revision of [1, 2]) {
      const s = run(["give envelope to Inez"], arrive());
      s.world!.revision = revision;
      delete s.world!.social;
      const migrated = validateSave(JSON.parse(exportSave(s)));
      expect(migrated.world!.revision).toBe(3);
      expect(migrated.world!.social!.agreements).toEqual([]);
      expect(migrated.world!.entities.envelope).toEqual(
        s.world!.entities.envelope,
      );
    }
  });
  it("rejects missing revision-three history and impossible provenance", () => {
    const original = accepted();
    const missing = structuredClone(original);
    delete missing.world!.social;
    expect(() => validateSave(missing)).toThrow();
    const bad = structuredClone(original);
    bad.world!.social!.observations[0].event = "unknown";
    expect(() => validateSave(bad)).toThrow();
    const outcome = structuredClone(original);
    outcome.world!.social!.agreements[0].status = "fulfilled";
    expect(() => validateSave(outcome)).toThrow();
  });
  it("round trips pending offers, active terms, misses and normal bookmarks", () => {
    const states = [
      offer(),
      accepted(),
      earlier(),
      run(["wait until 00:40"], accepted()),
    ];
    for (const s of states) expect(importSave(exportSave(s), s)).toEqual(s);
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
    };
    bookmark(states[1], storage);
    expect(restoreBookmark(states[2], storage)).toEqual(states[1]);
  });
  it.each(["allowed", "implied", "skip"] as const)(
    "keeps Inez non-romantic at boundary %s and any legacy affinity",
    (boundary) => {
      let s = updateBoundary(arrive(), "romance", boundary);
      s.npcs.inez.relationship.trust = 20;
      s.npcs.inez.relationship.affinity = 12;
      const before = structuredClone(s.npcs.inez.relationship);
      s = run(["flirt with Inez"], s);
      expect(last(s)).toContain("Romance isn't what I'm offering");
      expect(s.npcs.inez.relationship).toEqual(before);
    },
  );
});
