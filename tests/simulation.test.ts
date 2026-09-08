import { describe, it, expect } from "vitest";
import {
  advanceTime,
  applyEffects,
  availableChoices,
  choiceEnabled,
  choose,
  correctRumour,
  getPassages,
  newGame,
  updateBoundary,
  validateSave,
} from "../src/engine/game";
import { directObservation, forgetPull, learn } from "../src/engine/pull";
import {
  createEngagement,
  learnTheme,
  thematicObservation,
} from "../src/engine/themes";
import {
  bookmark,
  eraseLocal,
  exportSave,
  importSave,
  loadGame,
  restoreBookmark,
  saveGame,
  SAVE_KEY,
} from "../src/engine/save";
import { scenes } from "../src/content/scenes";
import { playRoute, routes, walkChoices } from "./routes";
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
describe("deterministic campaigns and paths", () => {
  for (const name of Object.keys(routes))
    for (const seed of ["948-ASH-17", "CARBON-1", "PROXY-2", "LETTER-3"])
      it(`${name} completes on ${seed}`, () => {
        const { state } = playRoute(name, seed);
        expect(scenes[state.scene].ending).toBe(true);
        expect(state.canon.player).toContain("sender");
        expect(state.flags.missedExchange || state.flags.missedWitness).toBe(
          true,
        );
      });
  it("same seed and actions have byte-identical state", () =>
    expect(playRoute("honest").state).toEqual(playRoute("honest").state));
  // Thirty full campaigns can exceed the default five seconds on shared CI CPUs.
  it("seeds cover three coherent authored truths", () => {
    const variants = new Set(
      Array.from({ length: 30 }, (_, i) => newGame(`seed-${i}`).variant),
    );
    expect(variants.size).toBe(3);
    for (let i = 0; i < 30; i++) {
      const s = playRoute("guarded", `seed-${i}`).state;
      expect(s.canon.truth.sender).toBe(newGame(s.seed).canon.truth.sender);
      expect(
        s.inventory.filter((x) => ["carbon", "token", "register"].includes(x)),
      ).toHaveLength(1);
    }
  }, 20_000);
  it("contrasting play styles finish with materially distinct worlds", () => {
    const runs = Object.keys(routes).map((x) => playRoute(x).state);
    expect(new Set(runs.map((s) => s.scene)).size).toBe(4);
    expect(runs[0].visited).toContain("hidden");
    expect(runs[1].visited).toContain("contradiction");
    expect(runs[2].flags.missedExchange).toBe(true);
    expect(runs[1].flags.missedWitness).toBe(true);
  });
});
describe("time, consequence and knowledge boundaries", () => {
  it("a lie propagates to Luca only through an explicit timed report", () => {
    const s = walkChoices(newGame(), ["enter", "lie"]);
    expect(s.npcs.inez.memories.claimedSender.value).toBe("Luca");
    expect(s.npcs.luca.memories.doorReport).toBeUndefined();
    const report = s.events.find((e) => e.id === "door-report")!;
    advanceTime(s, report.at - s.time - 1);
    expect(s.npcs.luca.memories.doorReport).toBeUndefined();
    advanceTime(s, 1);
    expect(s.npcs.luca.memories.doorReport).toBeDefined();
    expect(s.npcs.mara.memories.doorReport).toBeUndefined();
    expect(s.npcs.mara.beliefs.playerClaim).toBeUndefined();
  });
  it("doubling down increases suspicion without magically informing Mara", () => {
    const s = playRoute("reckless").state;
    expect(s.npcs.luca.relationship.suspicion).toBeGreaterThanOrEqual(6);
    expect(s.npcs.luca.memories.contradiction).toBeDefined();
    expect(s.npcs.mara.memories.contradiction).toBeUndefined();
  });
  it("missed events fire once and mutate off-screen relationships", () => {
    const s = newGame();
    advanceTime(s, 50);
    expect(s.flags.missedExchange).toBe(true);
    expect(s.flags.missedWitness).toBe(true);
    const count = s.messages.length;
    advanceTime(s, 5);
    expect(s.messages.length).toBe(count);
    expect(s.npcs.luca.relationship.trust).toBe(-1);
  });
  it("scheduled followups execute at their own timestamps even during a large time jump", () => {
    const s = newGame();
    applyEffects(s, [
      {
        type: "schedule",
        id: "first",
        delay: 2,
        effects: [
          {
            type: "schedule",
            id: "second",
            delay: 3,
            effects: [
              { type: "memory", npc: "inez", key: "nested", value: "done" },
            ],
          },
        ],
      },
    ]);
    advanceTime(s, 20);
    expect(s.npcs.inez.memories.nested.at).toBe(1433);
  });
  it("cancelled events do not happen", () => {
    const s = newGame();
    applyEffects(s, [{ type: "cancel", id: "exchange" }]);
    advanceTime(s, 70);
    expect(s.flags.exchangeHappened).toBeUndefined();
    expect(s.events[0].status).toBe("cancelled");
  });
  it("rumours mutate separately from objective truth, then can be disputed", () => {
    let s = newGame();
    const truth = structuredClone(s.canon.truth);
    applyEffects(s, [
      { type: "rumour", id: "r", text: "Original report", faction: "static" },
    ]);
    advanceTime(s, 15);
    expect(s.rumours[0].stage).toBe(1);
    expect(s.canon.truth).toEqual(truth);
    s = correctRumour(s, "r");
    advanceTime(s, 20);
    expect(s.rumours[0].corrected).toBe(true);
    expect(s.canon.public.r).toContain("disputed");
  });
  it("a mundane remembered preference returns later", () => {
    const s = playRoute("honest").state;
    expect(s.npcs.mara.memories.drink.value).toBe("Tea, no sugar");
    s.scene = "walk";
    expect(
      getPassages(s)
        .map((p) => p.text)
        .join(" "),
    ).toContain("tea no sugar");
    expect(s.npcs.mara.memories.chips).toBeDefined();
  });
  it("Luca can believe agreement happened without it becoming fact", () => {
    const s = walkChoices(newGame(), [
      "enter",
      "truth",
      "bar",
      "tea",
      "find_luca",
      "sympathy",
    ]);
    expect(s.npcs.luca.beliefs.publication.value).toContain("agreed");
    expect(s.flags.promisedLuca).toBeUndefined();
    expect(s.canon.truth.publication).toBeUndefined();
  });
  it("upstairs always consumes the departure window even when arriving early", () => {
    let s = walkChoices(newGame(), [
      "enter",
      "truth",
      "bar",
      "water",
      "commit",
      "upstairs",
    ]);
    expect(s.time).toBeGreaterThanOrEqual(1467);
    expect(s.flags.missedWitness).toBe(true);
    expect(s.flags.missedExchange).toBeUndefined();
    expect(s.locked).toContain("bay");
  });
  it("knowledge-bearing dialogue has an authorized speaker on every route", () => {
    for (const route of Object.keys(routes)) {
      let s = newGame();
      for (const id of routes[route].flatMap((id) =>
        [
          "boundary_sender",
          "debt_sender",
          "distance_sender",
          "focus_ledger",
        ].includes(id)
          ? [id, "decide_now"]
          : [id],
      )) {
        for (const p of getPassages(s))
          if (p.speaker && p.reveals)
            expect(
              p.reveals.every((f) => s.npcs[p.speaker!].knowledge.includes(f)),
            ).toBe(true);
        s = choose(s, id);
      }
    }
  });
});
describe("boundaries, agency and thematic engagement", () => {
  it("skip overrides authored text, dialogue, choices and learned observations", () => {
    let s = newGame();
    s.scene = "quiet";
    s = updateBoundary(s, "romance", "skip");
    expect(availableChoices(s).some((c) => c.id === "stay_close")).toBe(false);
    expect(
      getPassages(s)
        .map((p) => p.text)
        .join(" "),
    ).not.toContain("sit close enough");
    expect(() => choose(s, "stay_close")).toThrow();
    learn(s, "connection", 4);
    expect(s.pull.entries.connection.interest).toBe(0);
    learnTheme(s, "attention.private", "explore", "private");
    expect(s.engagement["attention.private"].interest).toBe(0);
  });
  it("implied only substitutes prose and blocks full themed choices", () => {
    let s = newGame();
    s.scene = "quiet";
    s = updateBoundary(s, "romance", "implied");
    expect(
      getPassages(s)
        .map((p) => p.text)
        .join(" "),
    ).toContain("makes room for you");
    expect(availableChoices(s).some((c) => c.id === "stay_close")).toBe(false);
  });
  it("all boundaries skipped still reaches the mystery and ending", () => {
    const s = playRoute("boundaries").state;
    expect(s.canon.player).toContain("sender");
    expect(Object.values(s.boundaries).every((b) => b === "skip")).toBe(true);
  });
  it("low composure never removes pause, written objection or exit", () => {
    const s = newGame();
    s.scene = "objection";
    s.player.composure = 0;
    s.player.heat = 100;
    const ids = availableChoices(s)
      .filter((c) => choiceEnabled(s, c))
      .map((c) => c.id);
    expect(ids).toContain("leave_room");
    expect(ids).toContain("recover");
    expect(ids).not.toContain("call_bluff");
  });
  it("THE PULL cooldown prevents repeating the same cue", () => {
    const s = newGame();
    learn(s, "curiosity", 4);
    s.turn = 3;
    expect(directObservation(s, "mystery")).not.toBeNull();
    s.turn = 6;
    expect(directObservation(s, "mystery")).toBeNull();
    s.turn = 9;
    expect(directObservation(s, "mundane")).not.toBeNull();
  });
  it("uncertainty is retained rather than interpreted as agreement", () => {
    const s = newGame();
    learnTheme(s, "attention.private", "uncertain", "private");
    expect(s.engagement["attention.private"].interest).toBe(0);
    expect(s.engagement["attention.private"].certainty).toBe(0);
    expect(s.engagement["attention.private"].uncertainty).toBe(1);
  });
  it("theme observation respects character compatibility and trust", () => {
    let s = newGame();
    s = updateBoundary(s, "romance", "allowed");
    s.scene = "quiet";
    learnTheme(s, "attention.private", "explore", "private");
    learnTheme(s, "attention.private", "explore", "private");
    s.turn = 4;
    expect(thematicObservation(s, "mundane")).toBeNull();
    s.npcs.mara.relationship.trust = 5;
    expect(thematicObservation(s, "mundane")).not.toBeNull();
  });
  it("clear interests preserves boundaries and disable stops learning", () => {
    let s = newGame();
    learn(s, "curiosity", 3);
    learnTheme(s, "care.checkIn", "explore", "private");
    s = updateBoundary(s, "romance", "skip");
    s = forgetPull(s);
    expect(s.boundaries.romance).toBe("skip");
    expect(s.engagement).toEqual(createEngagement());
    expect(s.pull.entries.curiosity.interest).toBe(0);
    s.pull.enabled = false;
    learn(s, "curiosity", 5);
    learnTheme(s, "care.checkIn", "explore", "private");
    expect(s.pull.entries.curiosity.interest).toBe(0);
    expect(s.engagement["care.checkIn"].familiarity).toBe(0);
  });
  it("changing a boundary clears an already-selected observation and sanitizes messages", () => {
    let s = newGame();
    s.pacing.observation = "Personal detail";
    applyEffects(s, [
      {
        type: "message",
        from: "Mara",
        text: "Optional romantic detail",
        theme: "romance",
        fallback: "See you tomorrow.",
      },
    ]);
    s = updateBoundary(s, "romance", "skip");
    expect(s.pacing.observation).toBeNull();
    expect(s.messages.at(-1)!.text).toBe("See you tomorrow.");
  });
});
describe("save integrity and privacy", () => {
  it("round trips the complete campaign and future events", () => {
    const { state } = playRoute("reckless");
    expect(importSave(exportSave(state), newGame())).toEqual(state);
    const storage = memoryStorage();
    expect(saveGame(state, storage)).toBeNull();
    expect(loadGame(storage).state).toEqual(state);
  });
  it("bookmark restores in normal mode", () => {
    const storage = memoryStorage();
    const s = newGame();
    bookmark(s, storage);
    expect(restoreBookmark(s, storage)).toEqual(s);
  });
  it("Live Wire rejects manual bookmark, restore and import", () => {
    const storage = memoryStorage();
    const s = newGame("x", "livewire");
    expect(() => bookmark(s, storage)).toThrow();
    expect(() => restoreBookmark(s, storage)).toThrow();
    expect(() => importSave(exportSave(newGame()), s)).toThrow();
    expect(() => importSave(exportSave(s), newGame())).toThrow();
  });
  it("corrupt saves fail without deleting stored data", () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, "{broken");
    expect(loadGame(storage).error).toBeTruthy();
    expect(storage.getItem(SAVE_KEY)).toBe("{broken");
  });
  it("unknown versions, scenes and malicious scheduled effects are rejected", () => {
    const s = newGame();
    expect(() => validateSave({ ...s, version: 99 })).toThrow();
    expect(() => validateSave({ ...s, scene: "missing" })).toThrow();
    expect(() =>
      validateSave({
        ...s,
        events: [
          {
            id: "bad",
            at: 1500,
            status: "pending",
            effects: [{ type: "execute", code: "bad" }],
          },
        ],
      }),
    ).toThrow();
  });
  it("storage failures are reported to the player", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("quota");
    };
    expect(saveGame(newGame(), storage)).toContain("could not save");
  });
  it("erase only removes this game’s local keys", () => {
    const storage = memoryStorage();
    storage.setItem("other-app", "keep");
    saveGame(newGame(), storage);
    bookmark(newGame(), storage);
    eraseLocal(storage);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(storage.data.size).toBe(1);
  });
});
describe("expanded character and seeded investigations", () => {
  it("thematic engagement opens a compatible authored branch, and skip closes it", () => {
    let s = walkChoices(newGame(), [
      "enter",
      "truth",
      "bar",
      "tea",
      "find_celeste",
      "read_terms",
      "annotate",
    ]);
    expect(s.engagement["authority.negotiated"].interest).toBe(2);
    expect(availableChoices(s).some((c) => c.id === "private_token")).toBe(
      true,
    );
    s = choose(s, "private_token");
    expect(s.scene).toBe("reversal");
    s = choose(s, "return_token");
    expect(s.npcs.celeste.relationship.trust).toBeGreaterThan(3);
    s = updateBoundary(s, "powerExchange", "skip");
    expect(availableChoices(s).some((c) => c.id === "private_token")).toBe(
      false,
    );
  });
  for (const [seed, scene, choice] of [
    ["NIGHT-0", "carbon_case", "mara_tells"],
    ["NIGHT-1", "letter_case", "ask_contact"],
    ["NIGHT-2", "proxy_case", "refuse_proxy"],
  ] as const)
    it(`seed-specific investigation ${scene} has a distinct consequence`, () => {
      let s = playRoute("honest", seed).state;
      s.scene = "casework";
      const next = availableChoices(s).find((c) => c.to === scene)!;
      s = choose(s, next.id);
      s = choose(s, choice);
      expect(s.scene).toBe("source_call");
      s = choose(s, "respect_no");
      s = choose(s, "write_account");
      expect(s.scene).toBe("ledger");
      expect(s.flags.wroteAccount).toBe(true);
      expect(s.npcs.mara.memories.source).toBeDefined();
      if (seed === "NIGHT-0")
        expect(s.npcs.luca.beliefs.carbon.source).toContain("Mara directly");
      if (seed === "NIGHT-1")
        expect(s.messages.some((m) => m.text.includes("agreed to send"))).toBe(
          true,
        );
      if (seed === "NIGHT-2") expect(s.flags.proxyRefused).toBe(true);
    });
  it("dawn is morning rather than a mislabeled late-night timestamp", () => {
    expect(playRoute("guarded").state.time).toBeGreaterThanOrEqual(1800);
  });
  it("scene entry notices happen once, even on revisits", () => {
    let s = walkChoices(newGame(), ["enter", "truth", "bar", "tea"]);
    const messages = s.messages.length;
    s = walkChoices(s, ["find_luca", "no_radio"]);
    expect(s.messages.length).toBe(messages);
  });
  it("unavailable hidden content is not advertised as a locked choice", () => {
    const s = newGame();
    s.scene = "aftermath";
    expect(availableChoices(s).some((c) => c.id === "mara_private")).toBe(
      false,
    );
    s.scene = "decision";
    s.time = 1500;
    expect(availableChoices(s).some((c) => c.id === "upstairs")).toBe(true);
    expect(
      choiceEnabled(
        s,
        availableChoices(s).find((c) => c.id === "upstairs")!,
      ),
    ).toBe(false);
  });
});
describe("late boundary changes and emergent social effects", () => {
  it("changing limits mid-scene replaces the encounter and supplies a neutral exit", () => {
    let s = walkChoices(newGame(), [
      "enter",
      "truth",
      "bar",
      "tea",
      "find_celeste",
      "read_terms",
      "annotate",
      "private_token",
    ]);
    s = updateBoundary(s, "powerExchange", "skip");
    expect(getPassages(s)).toHaveLength(1);
    expect(getPassages(s)[0].text).not.toContain("token");
    expect(availableChoices(s).map((c) => c.id)).toEqual(["boundary_exit"]);
    expect(() => choose(s, "introduce_terms")).toThrow();
    s = choose(s, "boundary_exit");
    expect(s.scene).toBe("floor");
    expect(() => validateSave(JSON.parse(JSON.stringify(s)))).not.toThrow();
  });
  it("off-screen events change NPC-to-NPC relationships", () => {
    const s = newGame();
    const before = s.relationships["celeste:mara"].trust;
    advanceTime(s, 40);
    expect(s.relationships["celeste:mara"].trust).toBe(before - 2);
  });
  it("a trait opens a useful approach with a reputation cost", () => {
    let s = newGame();
    s.scene = "assembly";
    s.traits = ["On the record"];
    expect(availableChoices(s).some((c) => c.id === "stand_account")).toBe(
      true,
    );
    s = choose(s, "stand_account");
    expect(s.flags.publicObjector).toBe(true);
    expect(s.rumours.some((r) => r.id === "named-objector")).toBe(true);
  });
  it("canon validation is independent of JSON object-key order", () => {
    const s = newGame();
    s.canon.truth = Object.fromEntries(Object.entries(s.canon.truth).reverse());
    expect(() => validateSave(s)).not.toThrow();
  });
});
