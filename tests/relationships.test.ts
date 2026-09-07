import { describe, it, expect } from "vitest";
import { pairs, playExpandedRoute } from "./expanded-routes";
import {
  newGame,
  choose,
  availableChoices,
  applyEffects,
  advanceTime,
  validateSave,
  messageReplies,
  replyMessage,
  updateBoundary,
  getPassages,
} from "../src/engine/game";
import { npcIds, effectSchema } from "../src/engine/types";
import { playRoute } from "./routes";
describe("a longer single night", () => {
  for (const pair of pairs)
    it(`${pair.join(" / ")} can return to two distinct people`, () => {
      const { state, words } = playExpandedRoute(pair);
      expect(npcIds.filter((n) => state.flags[`arc_${n}`])).toEqual(
        npcIds.filter((n) => pair.includes(n)),
      );
      for (const n of pair) expect(state.flags[`${n}_closed`]).toBe(true);
      expect(words).toBeGreaterThan(10000);
      expect(state.time).toBeGreaterThanOrEqual(1800);
      expect(state.history.map((h) => h.at)).toEqual(
        state.history.map((h) => h.at).sort((a, b) => a - b),
      );
    });
  it("committing to two people removes all further full arcs", () => {
    let s = newGame();
    s.scene = "late_room";
    s = choose(s, "spend_mara");
    s.scene = "mara_r7";
    s = choose(s, "keep_company");
    s = choose(s, "spend_luca");
    s.scene = "luca_r7";
    s = choose(s, "keep_company");
    expect(availableChoices(s).map((c) => c.id)).toEqual(["enough_company"]);
  });
  it("all exclusions retain complete relationship arcs and evidence", () => {
    const { state } = playExpandedRoute(
      ["celeste", "luca"],
      "NIGHT-1",
      "boundaries",
    );
    expect(state.flags.celeste_closed).toBe(true);
    expect(state.flags.luca_closed).toBe(true);
    expect(state.flags.celesteChemistry).toBeUndefined();
    expect(state.flags.lucaChemistry).toBeUndefined();
    expect(state.canon.player).toContain("sender");
  });
  it("private details stay out of unrelated characters’ knowledge", () => {
    const { state } = playExpandedRoute(["mara", "inez"], "NIGHT-2", "rare");
    expect(state.flags.crossedShifts).toBe(true);
    expect(state.npcs.celeste.memories.homeDetail).toBeUndefined();
    expect(state.npcs.luca.memories.homeSound).toBeUndefined();
    expect(state.npcs.celeste.knowledge).not.toContain("clinic");
  });
  it("rare overlap requires both independently witnessed decisions", () => {
    let s = newGame();
    s.scene = "late_accounts";
    expect(availableChoices(s).some((c) => c.id === "compare_shifts")).toBe(
      false,
    );
    s.flags = {
      mara_firstDone: true,
      inez_firstDone: true,
      maraRota: "leave",
      inezThread: "challenged",
    };
    expect(availableChoices(s).some((c) => c.id === "compare_shifts")).toBe(
      true,
    );
  });
  it("a warm conversation cannot override Celeste’s own answer", () => {
    let s = newGame();
    s.scene = "celeste_r12";
    s.flags.celesteAttention = true;
    s = choose(s, "name_attraction");
    expect(s.flags.celesteBounded).toBe(true);
    expect(s.flags.celesteChemistry).toBeUndefined();
    s = newGame();
    s.scene = "celeste_r12";
    s.flags.celesteAttention = true;
    s.npcs.celeste.relationship.trust = 8;
    s = choose(s, "name_attraction");
    expect(s.flags.celesteChemistry).toBe(true);
  });
  it("existing shorter saves retain their original historical destinations", () => {
    const s = playRoute("honest").state;
    expect(validateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
describe("deferred personal consequences and phone choices", () => {
  it("scheduled conditions read the state when delivered, not when scheduled", () => {
    const s = newGame();
    applyEffects(s, [
      {
        type: "schedule",
        id: "later-test",
        delay: 10,
        effects: [
          {
            type: "when",
            condition: { flag: "changed" },
            then: [{ type: "message", from: "MARA", text: "Changed" }],
            otherwise: [{ type: "message", from: "MARA", text: "Original" }],
          },
        ],
      },
    ]);
    s.flags.changed = true;
    advanceTime(s, 12);
    expect(s.messages.at(-1)?.text).toBe("Changed");
    advanceTime(s, 20);
    expect(s.messages.filter((m) => m.text === "Changed")).toHaveLength(1);
  });
  it("rejects malformed imported conditional effects", () => {
    expect(
      effectSchema.safeParse({
        type: "when",
        condition: { npc: "child", trust: 0 },
        then: [],
      }).success,
    ).toBe(false);
  });
  it("phone reply is authored, delayed, and cannot be farmed", () => {
    let s = newGame();
    applyEffects(s, [
      { type: "message", from: "LUCA", text: "Later?", replyKey: "luca-later" },
    ]);
    const id = s.messages.at(-1)!.id;
    expect(messageReplies(s, id)).toHaveLength(2);
    const original = structuredClone(s);
    expect(replyMessage(s, id, "invented")).toEqual(original);
    s = replyMessage(s, id, "later");
    expect(s.flags.lucaPhoneReply).toBe("later");
    expect(replyMessage(s, id, "yes")).toEqual(s);
    expect(s.messages.at(-1)?.from).toBe(s.alias);
    advanceTime(s, 20);
    expect(s.messages.at(-1)?.text).toContain("No explanation needed");
    expect(s.npcs.mara.memories.phoneReply).toBeUndefined();
  });
  it("a restricted message offers no reply or attachment through its themed route", () => {
    let s = newGame();
    applyEffects(s, [
      {
        type: "message",
        from: "LUCA",
        text: "Private attention",
        theme: "romance",
        replyKey: "luca-later",
        fallback: "Later conversation",
      },
    ]);
    const id = s.messages.at(-1)!.id;
    s = updateBoundary(s, "romance", "skip");
    expect(messageReplies(s, id)).toEqual([]);
    s.scene = "celeste_r12";
    expect(availableChoices(s).some((c) => c.id === "name_attraction")).toBe(
      false,
    );
    expect(getPassages(s).length).toBeGreaterThan(0);
  });
});
