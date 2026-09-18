import { describe, expect, it } from "vitest";
import { executeTrial, trialClock } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import {
  eraseTrial,
  importTrial,
  readTrial,
  TRIAL_BOOKMARK,
  TRIAL_DRAFT,
  TRIAL_SAVE,
  writeTrial,
} from "../src/trial/save";
import { newGame, validateSave } from "../src/engine/game";
import { SAVE_KEY } from "../src/engine/save";

function run(s: TrialState, ...commands: string[]) {
  for (const command of commands) {
    s = executeTrial(s, command);
    expect(
      s.transcript.at(-1)?.failed,
      `${command}: ${s.transcript.at(-1)?.lines}`,
    ).toBe(false);
    s = validateTrial(JSON.parse(JSON.stringify(s)));
  }
  return s;
}
function discovery(late = false) {
  return run(
    newTrial(),
    ...(late ? ["wait for two hours"] : []),
    "ask Sable about their memories",
    "go shop",
    "take photo",
    "read photo",
    "take listing",
    "read listing",
  );
}
function disclose(path: "direct" | "vesper", late = false) {
  let s = discovery(late);
  return path === "direct"
    ? run(s, "go bar", "show photo to Sable", "show listing to Sable")
    : run(
        s,
        "show photo to Vesper",
        "show listing to Vesper",
        "ask Vesper to tell Sable",
      );
}
function finish(s: TrialState, days = 4) {
  s = run(s, "go home");
  for (let i = 0; i < days; i++) s = run(s, "rest until tomorrow");
  return run(s, "wait for two hours", "go bar", "talk privately");
}
function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
}

describe("Sable's complete bounded chain", () => {
  for (const path of ["direct", "vesper"] as const)
    for (const course of ["formal", "document"] as const) {
      it(`${path} disclosure reaches ${course}, off-screen, with actual history`, () => {
        const start = disclose(path, course === "document");
        const s = finish(start);
        expect(s.receipt?.path).toBe(path);
        expect(s.decision?.course).toBe(course);
        expect(s.completed?.course).toBe(course);
        expect(s.completed!.at - s.decision!.at).toBe(
          course === "formal" ? 4320 : 1440,
        );
        expect(s.updateAt).toBeDefined();
        expect(
          s.entities[course === "formal" ? "trial-report" : "trial-notebook"]
            .location,
        ).toBe("sable");
        const prose = s.transcript.at(-1)!.lines.join(" ");
        expect(prose).toContain(
          path === "direct"
            ? "you showed me"
            : "Vesper called, at your request",
        );
        expect(prose).toContain(
          course === "formal"
            ? "Other explanations are still open"
            : "authenticate the lot",
        );
        expect(s.actors.player.knowledge).not.toContain("trial-report");
        expect(s.actors.regulars.knowledge).toEqual([]);
        expect(s.actors.silas.knowledge).toEqual([]);
      });
    }
  it("waits exactly 24 hours for relay, then decides independently", () => {
    let s = disclose("vesper");
    const due = s.events.find((e) => e.id === "sable:relay")!.at;
    s = run(s, `wait for ${due - s.time - 1} minutes`);
    expect(s.receipt).toBeUndefined();
    s = run(s, "wait one minute");
    expect(s.receipt?.at).toBe(due);
    expect(s.decision).toBeUndefined();
    s = run(s, "wait ten minutes");
    expect(s.decision?.at).toBe(due + 10);
  });
  it("does not relay just because Vesper sees evidence", () => {
    const s = finish(
      run(discovery(), "show photo to Vesper", "show listing to Vesper"),
    );
    expect(s.receipt).toBeUndefined();
    expect(s.completed).toBeUndefined();
  });
  it("no disclosure means no independent discovery or magical photo duplication", () => {
    const s = finish(discovery());
    expect(s.receipt).toBeUndefined();
    expect(s.entities["trial-photo"].location).toBe("player");
    expect(s.actors.sable.knowledge).toEqual([]);
  });
  it("treatment is heard without becoming an examination score", () => {
    for (const reply of [
      "I disagree",
      "say nothing",
      "I need space",
      "I support you",
      "do it now",
    ]) {
      const s = finish(run(disclose("direct"), reply));
      expect(s.decision?.course).toBe("formal");
      expect(s.treatment).toHaveLength(1);
      expect(s.transcript.at(-1)!.lines.join(" ")).toContain(
        reply === "I disagree"
          ? "You disagreed"
          : reply === "say nothing"
            ? "silence stay"
            : reply === "I need space"
              ? "couldn't help"
              : reply === "do it now"
                ? "Being pushed"
                : "responsible for fixing",
      );
    }
  });
  it("Sable can acknowledge needing time without a less useful ending", () => {
    const s = finish(run(disclose("direct"), "take your time"));
    expect(s.decision?.course).toBe("document");
    expect(s.decision?.reasons.join(" ")).toContain("my own observations");
    expect(s.transcript.at(-1)!.lines.join(" ")).toContain("authenticat");
  });
});
describe("Custody and epistemic limits", () => {
  it("the listing does not reveal the unheard hospital account or memory scheme", () => {
    const s = run(newTrial(), "go shop", "read listing");
    expect(s.transcript.at(-1)!.lines.join(" ")).not.toMatch(
      /hospital|implant|donor|Silas/,
    );
    expect(s.actors.player.knowledge).not.toContain("hospital-account");
    expect(s.actors.player.knowledge).not.toContain("credible-contradiction");
  });
  it("reports, hypotheticals and negated instructions do not request a relay", () => {
    const initial = run(
      discovery(),
      "show photo to Vesper",
      "show listing to Vesper",
    );
    for (const line of [
      "tell Vesper I told Sable",
      "ask Vesper whether I should tell Sable",
      "don't ask Vesper to tell Sable",
      "say ask Vesper to tell Sable",
    ]) {
      const next = executeTrial(initial, line);
      expect(next.events).toEqual([]);
      expect(next.receipt).toBeUndefined();
    }
  });
  it("explicit refusal works and negating WAIT does not pass time", () => {
    const s = disclose("direct");
    for (const reply of [
      "I can't help",
      "I cannot help",
      "I don't want to get involved",
    ])
      expect(run(s, reply).treatment.at(-1)?.value).toBe("space");
    expect(executeTrial(s, "don't wait for ten minutes").time).toBe(s.time);
  });
  it("secondary transmission is recorded without replacing the first path", () => {
    const s = finish(
      run(
        disclose("vesper"),
        "go bar",
        "show photo to Sable",
        "show listing to Sable",
      ),
    );
    expect(s.receipt?.path).toBe("direct");
    expect(
      s.observations.filter((o) => o.subject === "supplemental-relay"),
    ).toHaveLength(1);
    expect(s.transcript.at(-1)!.lines.join(" ")).toContain(
      "Vesper called afterward",
    );
  });
  it("missing pending events and unsourced NPC knowledge fail closed", () => {
    const s = disclose("vesper");
    expect(() => validateTrial({ ...s, events: [] })).toThrow();
    s.actors.regulars.knowledge.push("trial-photo");
    expect(() => validateTrial(s)).toThrow();
  });
  it("requires the explicitly heard hospital account to establish the player contradiction", () => {
    let s = run(
      newTrial(),
      "go shop",
      "take photo",
      "read photo",
      "take listing",
      "read listing",
    );
    expect(s.actors.player.knowledge).not.toContain("credible-contradiction");
    s = run(s, "go bar", "ask Sable about their memories");
    expect(s.actors.player.knowledge).toContain("credible-contradiction");
  });
  it("destruction before inspection blocks reading and preserves no knowledge", () => {
    const s = run(newTrial(), "go shop", "take photo", "tear photo");
    const next = executeTrial(s, "read photo");
    expect(next.transcript.at(-1)?.failed).toBe(true);
    expect(next.actors.player.knowledge).toEqual([]);
    expect(next.entities["trial-photo"].destroyed).toBe(true);
  });
  it("player recollection alone after destruction is an unsupported claim", () => {
    let s = run(
      discovery(),
      "tear photo",
      "go bar",
      "tell Sable the photo proves Silas did it",
      "wait ten minutes",
    );
    expect(s.actors.sable.beliefs).toHaveProperty("hospital");
    expect(Object.keys(s.actors.sable.beliefs)).toHaveLength(2);
    expect(s.receipt).toBeUndefined();
    expect(s.truth).toEqual(newTrial().truth);
    expect(s.actors.sable.knowledge).toEqual([]);
  });
  it("Vesper's prior observation survives destruction, without inventing a copy", () => {
    const s = finish(run(disclose("vesper"), "tear photo"));
    expect(s.receipt?.path).toBe("vesper");
    expect(s.entities["trial-photo"].destroyed).toBe(true);
    expect(s.transcript.at(-1)!.lines.join(" ")).toContain(
      "without laying a print",
    );
  });
  it("transfer without reading gives custody without evidence knowledge", () => {
    let s = run(discovery(), "give photo to Vesper");
    expect(s.entities["trial-photo"].location).toBe("vesper");
    expect(s.actors.vesper.knowledge).toEqual([]);
    s = run(
      s,
      "ask Vesper to read photo",
      "show listing to Vesper",
      "ask Vesper to tell Sable",
    );
    expect(finish(s).receipt?.path).toBe("vesper");
  });
  it("closed containers cannot disclose their contents", () => {
    let s = run(discovery(), "put photo in satchel", "close satchel", "go bar");
    s = executeTrial(s, "show photo to Sable");
    expect(s.transcript.at(-1)?.failed).toBe(true);
    expect(s.actors.sable.knowledge).toEqual([]);
    s = run(s, "open satchel", "show photo to Sable");
    expect(s.entities["trial-photo"].location).toBe("trial-bag");
  });
  it("unseen transfers never notify unrelated NPCs", () => {
    const s = run(discovery(), "go home", "drop photo", "think", "journal");
    expect(
      s.observations.filter((o) =>
        ["sable", "regulars", "silas"].includes(o.actor),
      ),
    ).toEqual([]);
  });
  it("only explicit requests disclose report contents or transfer the original", () => {
    let s = finish(disclose("direct"));
    s = run(s, "ask Sable to show the report");
    expect(s.actors.player.knowledge).toContain("trial-report");
    expect(s.entities["trial-report"].location).toBe("sable");
    s = run(s, "ask Sable to borrow the report");
    expect(s.entities["trial-report"].location).toBe("player");
  });
});
describe("Time, interruption and once-only consequences", () => {
  it("information and reading cost no time, save/load has no wall clock", () => {
    let s = discovery();
    const time = s.time;
    s = run(s, "look", "journal", "inventory", "think", "help", "read photo");
    expect(s.time).toBe(time);
    expect(validateTrial(JSON.parse(JSON.stringify(s))).time).toBe(time);
  });
  it("small and large advances produce identical event/observation histories", () => {
    const s = disclose("vesper");
    let small = s,
      large = s;
    for (let i = 0; i < 4 * 24; i++) small = run(small, "wait sixty minutes");
    for (let i = 0; i < 4; i++) large = run(large, "wait 1440 minutes");
    expect(small.events).toEqual(large.events);
    expect(small.observations).toEqual(large.observations);
    expect(small.decision).toEqual(large.decision);
    expect(small.completed).toEqual(large.completed);
  });
  it("does not consume an update before privacy or presence, and does not repeat it", () => {
    let s = finish(disclose("direct"));
    const updateAt = s.updateAt;
    const count = s.observations.length;
    s = run(
      s,
      "ask Sable about the update",
      "go bar",
      "talk privately",
      "ask Sable about the update",
    );
    expect(s.updateAt).toBe(updateAt);
    expect(s.observations).toHaveLength(count);
    expect(
      s.transcript
        .flatMap((t) => t.lines)
        .filter((l) => l.startsWith("Sable: ‘It's been")),
    ).toHaveLength(1);
  });
  it("vague interrupted replies clarify instead of changing decisions", () => {
    let s = run(disclose("direct"), "go home", "go bar");
    s = executeTrial(s, "yes");
    expect(s.transcript.at(-1)?.failed).toBe(true);
    expect(s.treatment).toEqual([]);
  });
  it("remembers actual drink preference and leaves attraction unspecified", () => {
    let s = run(newTrial(), "talk to Sable", "tea", "go shop", "go bar");
    expect(s.preference).toBe("tea");
    expect(s.transcript.at(-1)!.lines.join(" ")).toContain("Your tea");
    expect(s.context).toBeUndefined(); // Arrival/LOOK must not make another offer.
    for (const mode of ["allowed", "implied", "skip"] as const) {
      const next = run({ ...s, roleplay: mode }, "ask Sable about roleplay");
      expect(next.receipt).toBeUndefined();
      expect(next.transcript.at(-1)!.lines.join(" ")).not.toContain(
        "attracted to you",
      );
    }
  });
  it("deterministic seed and commands remain identical", () => {
    expect(finish(disclose("vesper"))).toEqual(finish(disclose("vesper")));
    expect(trialClock(2520)).toBe("Day 1 · Saturday 18:00");
  });
});
describe("Separate validated persistence", () => {
  it("round trips pending, completed and consumed chains without losing events", () => {
    const store = memoryStorage();
    for (const state of [
      disclose("direct"),
      disclose("vesper"),
      finish(disclose("direct")),
    ]) {
      writeTrial(store, state);
      expect(readTrial(store).state).toEqual(state);
      writeTrial(store, state, TRIAL_BOOKMARK);
      expect(readTrial(store, TRIAL_BOOKMARK).state).toEqual(state);
    }
  });
  it("keeps legacy saves, bookmarks and drafts intact on reset/import", () => {
    const storage = memoryStorage(),
      session = memoryStorage();
    const legacy = newGame();
    storage.setItem(SAVE_KEY, JSON.stringify(legacy));
    storage.setItem("freak-city:v1:bookmark", "legacy-bookmark");
    session.setItem("freak-city:command:NIGHT-0", "look");
    writeTrial(storage, disclose("vesper"));
    writeTrial(storage, newTrial(), TRIAL_BOOKMARK);
    session.setItem(TRIAL_DRAFT, "hello");
    expect(() => importTrial(JSON.stringify(legacy))).toThrow();
    expect(() => validateSave(newTrial())).toThrow();
    eraseTrial(storage, session);
    expect(storage.getItem(TRIAL_SAVE)).toBeNull();
    expect(storage.getItem(TRIAL_BOOKMARK)).toBeNull();
    expect(session.getItem(TRIAL_DRAFT)).toBeNull();
    expect(storage.getItem(SAVE_KEY)).toBe(JSON.stringify(legacy));
    expect(storage.getItem("freak-city:v1:bookmark")).toBe("legacy-bookmark");
    expect(session.getItem("freak-city:command:NIGHT-0")).toBe("look");
  });
  it("preserves unreadable saves and rejects impossible history", () => {
    const storage = memoryStorage();
    storage.setItem(TRIAL_SAVE, "broken");
    expect(readTrial(storage).error).toBeTruthy();
    expect(storage.getItem(TRIAL_SAVE)).toBe("broken");
    const s = finish(disclose("direct"));
    const variants = [
      { ...s, campaign: "other" },
      { ...s, truth: {} },
      { ...s, time: 0 },
      { ...s, events: [...s.events, s.events[0]] },
      { ...s, receipt: { ...s.receipt, sources: [] } },
      { ...s, completed: { ...s.completed, at: 1 } },
    ];
    for (const raw of variants) expect(() => validateTrial(raw)).toThrow();
  });
});
