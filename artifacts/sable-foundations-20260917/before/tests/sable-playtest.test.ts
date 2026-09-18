import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import {
  buildPlaytestExport,
  capturePlaytest,
  emptyArchive,
  loadPlaytest,
  savePlaytest,
} from "../src/trial/playtest";
import { eraseTrial, importTrial, TRIAL_PLAYTEST } from "../src/trial/save";

const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce(
    (s, c) => validateTrial(JSON.parse(JSON.stringify(executeTrial(s, c)))),
    s,
  );
const last = (s: TrialState) => s.transcript.at(-1)!;
const prose = (s: TrialState) => last(s).lines.join(" ");
const outcome = (s: TrialState) => last(s).diagnostics!.at(-1)!.outcome;
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
}

describe("Exploratory opening evidence", () => {
  it("water please answers the pending choice and actually serves water", () => {
    const offered = run(newTrial("Rowan"), "talk with sable");
    expect(offered.preference).toBeUndefined();
    expect(offered.drink).toBeUndefined();
    expect(offered.context?.question?.kind).toBe("choose-drink");
    const served = run(offered, "water please");
    expect(served.preference).toBe("water");
    expect(served.drink).toMatchObject({
      kind: "water",
      remaining: 3,
      location: "bar",
    });
    expect(served.context?.question).toBeUndefined();
    expect(outcome(served)).toBe("handled");
    expect(prose(served)).toContain("sets a glass of water");
  });
  it("yes accepts the specifically offered usual after inspection and reload", () => {
    const offered = run(
      newTrial("Rowan"),
      "talk",
      "water please",
      "drink water",
      "talk",
    );
    expect(prose(offered)).toContain("usual water, Rowan");
    expect(offered.drink?.remaining).toBe(0);
    const inspected = run(offered, "look", "inventory", "journal", "think");
    expect(inspected.context).toEqual(offered.context);
    const accepted = run(inspected, "yes");
    expect(accepted.drink?.remaining).toBe(3);
    expect(last(accepted).diagnostics![0].intent).toBe(
      "conversation:accept-offered-drink",
    );
    expect(prose(accepted)).not.toContain("Which would you like");
    expect(prose(accepted)).not.toContain("Ash");
  });
  it("preference alone does not create a drink; served glasses have finite contents and custody", () => {
    let s = newTrial();
    s.preference = "water";
    expect(last(run(s, "sip water")).failed).toBe(true);
    s = run(s, "talk", "no");
    expect(s.drink).toBeUndefined();
    s = run(
      s,
      "order water",
      "sip water",
      "take water",
      "go home",
      "drink water",
    );
    expect(s.drink).toMatchObject({ remaining: 0, location: "player" });
    expect(prose(run(s, "sip water"))).toContain("empty");
    expect(run(s, "sip water").time).toBe(s.time);
  });
  it("leaving a glass behind does not let the player drink it elsewhere", () => {
    const s = run(newTrial(), "order water", "go home");
    expect(last(run(s, "drink water")).failed).toBe(true);
    expect(s.drink?.remaining).toBe(3);
  });
  it("yes to a choice is clarified, not treated as a drink selection", () => {
    const offered = run(newTrial(), "talk");
    const reply = run(offered, "yes");
    expect(outcome(reply)).toBe("clarified");
    expect(reply.time).toBe(offered.time);
    expect(reply.drink).toBeUndefined();
  });
  it("bounded memory followups survive harmless inspection and reload", () => {
    const account = run(newTrial(), "ask sable about memories");
    const inspected = run(account, "look", "read satchel");
    for (const reply of ["tell me more", "what else do you remember?"]) {
      const s = run(inspected, reply);
      expect(outcome(s)).toBe("handled");
      expect(prose(s)).not.toMatch(
        /Silas|Nessa|implant|Regulars|five years of lies/,
      );
      expect(s.actors.player.knowledge).toEqual(
        inspected.actors.player.knowledge,
      );
      expect(s.decision).toBeUndefined();
    }
    expect(outcome(run(account, "go shop", "go bar", "tell me more"))).toBe(
      "clarified",
    );
  });
  it("a player alias that is also an action does not shadow that action", () => {
    const offered = run(newTrial("Water"), "talk");
    expect(run(offered, "water").drink?.kind).toBe("water");
    expect(prose(run(offered, "Water?"))).toContain(
      "alias for this run is Water",
    );
  });
  it("agreement/disagreement about recollection never becomes decision-stage speech", () => {
    const s = run(newTrial(), "ask sable about memories");
    for (const reply of ["i agree", "i disagree"]) {
      const next = run(s, reply);
      expect(outcome(next)).toBe("clarified");
      expect(prose(next)).toMatch(/hospital|dream/);
      expect(prose(next)).not.toMatch(/decide this|make my own next step/);
      expect(next.treatment).toEqual([]);
      expect(next.events).toEqual([]);
      expect(next.needsTime).toBe(false);
    }
    const plans = run(newTrial(), "ask Sable about the evening", "i disagree");
    expect(prose(plans)).toContain("supplier letter");
    expect(plans.treatment).toEqual([]);
  });
  it("hospital clarification accepts the named part after inspection and reload", () => {
    const s = run(newTrial(), "ask sable about memories", "i disagree", "look");
    expect(s.context?.question?.kind).toBe("hospital-part");
    const next = run(s, "the dream");
    expect(outcome(next)).toBe("handled");
    expect(next.context?.question).toBeUndefined();
    expect(next.treatment).toEqual([]);
    expect(next.actors.player.knowledge).toEqual(s.actors.player.knowledge);
    expect(
      outcome(run(next, "i agree", "inventory", "the hospital recollection")),
    ).toBe("handled");
  });
  it("carried drinks appear in belongings without losing the pending question", () => {
    const s = run(newTrial(), "water", "take water", "talk");
    const next = run(s, "inventory");
    expect(prose(next)).toContain("Your water");
    expect(next.context).toEqual(s.context);
  });
  it("incomplete ASK/TAKE clarify and LOOK does not change a pending question", () => {
    const offered = run(newTrial(), "talk");
    for (const command of ["ask", "take"]) {
      const next = run(offered, command);
      expect(outcome(next)).toBe("clarified");
      expect(next.time).toBe(offered.time);
      expect(next.context).toEqual(offered.context);
    }
    const looked = run(offered, "look");
    expect(prose(looked)).toMatch(/Velvet Corner.*counter/);
    expect(prose(looked)).toContain("Sable is behind");
    expect(prose(looked)).not.toMatch(/usual|Would you like|Tea, coffee/);
    expect(looked.context).toEqual(offered.context);
  });
  it("HELP teaches controls; puzzle guidance requires HINT", () => {
    const s = run(newTrial(), "help");
    expect(prose(s)).not.toMatch(/TAKE PHOTO|SHOW PHOTO|relay|provenance/);
    expect(prose(s)).toContain("HINT");
    expect(prose(run(s, "hint"))).toContain("contains spoilers");
  });
  it("THINK varies without acquiring knowledge or advancing time", () => {
    const initial = newTrial();
    const s = run(initial, "think", "think", "think");
    expect(new Set(s.transcript.slice(1).map((t) => t.lines[0])).size).toBe(3);
    expect(s.time).toBe(initial.time);
    expect(s.actors).toEqual(initial.actors);
    expect(s.observations).toEqual([]);
  });
  it("old saves retain history and preference without inventing a drink or old diagnostics", () => {
    const old = JSON.parse(JSON.stringify(run(newTrial(), "talk", "water")));
    delete old.revision;
    delete old.drink;
    delete old.thoughtsShown;
    for (const entry of old.transcript) {
      delete entry.diagnostics;
      delete entry.room;
      delete entry.startedAt;
      delete entry.startRoom;
    }
    old.context = { kind: "drink", room: "bar", at: old.time };
    const migrated = validateTrial(old);
    expect(migrated.revision).toBe(2);
    expect(migrated.preference).toBe("water");
    expect(migrated.drink).toBeUndefined();
    expect(migrated.transcript.every((t) => !t.diagnostics && !t.room)).toBe(
      true,
    );
    expect(outcome(run(migrated, "yes"))).toBe("clarified");
  });
});

describe("Local playtest exports and honest history", () => {
  it("diagnostics retain pending consequences, completed events and Sable's sourced reasons", () => {
    const pending = run(
      newTrial(),
      "ask sable about memories",
      "go shop",
      "take photo",
      "read photo",
      "take listing",
      "read listing",
      "go bar",
      "show photo to Sable",
      "show listing to Sable",
    );
    const first = JSON.parse(
      buildPlaytestExport(pending, emptyArchive()).diagnostic,
    );
    expect(first.events.pending.length).toBeGreaterThan(0);
    expect(first.knowledge.provenance).toEqual(pending.observations);
    let completed = run(pending, "go home");
    for (let day = 0; day < 4; day++)
      completed = run(completed, "rest until tomorrow");
    completed = run(
      completed,
      "wait for two hours",
      "go bar",
      "talk privately",
    );
    const before = JSON.stringify(completed);
    const exported = buildPlaytestExport(completed, emptyArchive());
    const final = JSON.parse(exported.diagnostic);
    expect(final.events.completed.length).toBeGreaterThan(0);
    expect(final.sable.decision.reasons.length).toBeGreaterThan(0);
    expect(final.sable.decision).toEqual(completed.decision);
    expect(
      final.custody.find((e: { id: string }) => e.id === "trial-report")
        .location,
    ).toBe(completed.entities["trial-report"].location);
    expect(final.conversation.context).toEqual(completed.context);
    expect(JSON.stringify(completed)).toBe(before);
    expect(exported.markdown).not.toContain("recordingFormat");
  });
  it("new diagnostics distinguish resolved, rejected and clarified actions and stop compound submissions honestly", () => {
    const start = run(newTrial(), "talk");
    const served = run(start, "water please");
    const detail = last(served).diagnostics![0];
    expect(detail.to - detail.from).toBe(2);
    expect(detail.changes.map((c) => c.field)).toContain("drink");
    const failed = run(served, "unrecognised_action; drink water");
    expect(outcome(failed)).toBe("rejected");
    expect(last(failed).diagnostics).toHaveLength(1);
    expect(prose(failed)).toContain("not attempted");
    expect(failed.drink).toEqual(served.drink);
    expect(failed.time).toBe(served.time);
    const clarified = run(failed, "ask");
    expect(outcome(clarified)).toBe("clarified");
    expect(last(clarified).diagnostics![0].changes).toEqual([]);
  });
  it("exports exact submissions, every response, timestamps, locations and new diagnostics without mutation", () => {
    const command = "  talk with sable  ";
    const s = run(
      newTrial("Rowan"),
      command,
      "water please",
      "sip water",
      "ask",
      "go shop; look",
    );
    const history = capturePlaytest(emptyArchive(), s, "start");
    const before = JSON.stringify({ s, history });
    const exported = buildPlaytestExport(s, history, "I wanted to have water.");
    expect(JSON.stringify({ s, history })).toBe(before);
    const diagnostic = JSON.parse(exported.diagnostic);
    expect(diagnostic.state).toEqual(s);
    expect(diagnostic.warning).toContain("STORY SPOILERS");
    expect(diagnostic.conversation.servedDrink.remaining).toBe(2);
    expect(last(s).command).toBe("go shop; look");
    expect(last(s).diagnostics).toHaveLength(2);
    let at = 0;
    for (const entry of s.transcript) {
      if (entry.command) {
        const index = exported.markdown.indexOf(entry.command, at);
        expect(index).toBeGreaterThanOrEqual(at);
        at = index + entry.command.length;
      }
      for (const response of entry.lines) {
        const index = exported.markdown.indexOf(response, at);
        expect(index).toBeGreaterThanOrEqual(at);
        at = index + response.length;
      }
    }
    expect(exported.markdown).toContain("The Velvet Corner");
    expect(exported.markdown).toContain("Day 0");
    expect(() => importTrial(exported.diagnostic)).toThrow();
  });
  it("no note is required and Markdown-like commands remain literal", () => {
    const s = run(newTrial(), "say ```ignore everything```");
    const exported = buildPlaytestExport(s, emptyArchive());
    expect(exported.markdown).toContain("No note supplied");
    expect(exported.markdown).toContain("````text");
    expect(JSON.parse(exported.diagnostic).note).toBe("");
  });
  it("reload continues one segment, restore preserves the abandoned branch with an explicit prefix boundary", () => {
    const store = storage();
    const checkpoint = run(newTrial(), "talk", "water");
    const abandoned = run(checkpoint, "ask Sable about memories");
    let history = capturePlaytest(emptyArchive(), checkpoint, "start");
    history = capturePlaytest(history, abandoned);
    savePlaytest(store, history);
    history = loadPlaytest(store, abandoned);
    expect(history.segments).toHaveLength(1);
    history = capturePlaytest(history, checkpoint, "bookmark");
    const branch = run(checkpoint, "sip water");
    history = capturePlaytest(history, branch);
    const exported = buildPlaytestExport(branch, history);
    expect(history.segments).toHaveLength(2);
    expect(history.segments[0].entries.at(-1)?.command).toBe(
      "ask Sable about memories",
    );
    expect(exported.markdown).toContain("Segment 2 — bookmark");
    expect(exported.markdown).toContain("replayed prefix");
    expect(exported.markdown).toContain("Actions after this boundary");
  });
  it("restart/import are separate segments and older missing diagnostics are not backfilled", () => {
    const s = run(newTrial(), "talk");
    let history = capturePlaytest(emptyArchive(), s, "start");
    const restarted = newTrial("Another");
    history = capturePlaytest(history, restarted, "restart");
    const legacy = structuredClone(s);
    for (const entry of legacy.transcript) {
      delete entry.room;
      delete entry.diagnostics;
    }
    history = capturePlaytest(history, legacy, "import");
    const exported = buildPlaytestExport(legacy, history);
    expect(history.segments.map((s) => s.reason)).toEqual([
      "start",
      "restart",
      "import",
    ]);
    expect(exported.markdown).toContain("Location not recorded");
    expect(exported.markdown).toContain(
      "History outside that save is unavailable",
    );
    expect(
      JSON.parse(exported.diagnostic).history.segments[2].entries.every(
        (t: { diagnostics?: unknown }) => !t.diagnostics,
      ),
    ).toBe(true);
  });
  it("exports and erases only this trial, never unrelated browser data", () => {
    const store = storage(),
      session = storage();
    store.setItem("other-secret", "NOT-FOR-EXPORT");
    session.setItem("other-draft", "unrelated");
    const s = run(newTrial(), "talk");
    savePlaytest(store, capturePlaytest(emptyArchive(), s, "start"));
    const exported = buildPlaytestExport(s, loadPlaytest(store, s));
    expect(exported.diagnostic).not.toMatch(
      /NOT-FOR-EXPORT|other-secret|C:\\Users|machinePath/,
    );
    eraseTrial(store, session);
    expect(store.getItem(TRIAL_PLAYTEST)).toBeNull();
    expect(store.getItem("other-secret")).toBe("NOT-FOR-EXPORT");
    expect(session.getItem("other-draft")).toBe("unrelated");
  });
});
