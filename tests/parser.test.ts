import { describe, it, expect } from "vitest";
import { newGame, validateSave, updateBoundary } from "../src/engine/game";
import {
  executeCommand,
  ensureWorld,
  isVisible,
  completions,
  transcriptText,
  actionHandlers,
} from "../src/engine/parser";
import { parseCommand, splitCommands, verbs } from "../src/engine/language";
import { rooms } from "../src/content/spaces";
import { contentMigration } from "../src/content/parser-content";
import { scenes } from "../src/content/scenes";
import { exportSave, importSave } from "../src/engine/save";
import type { GameState } from "../src/engine/types";
import { variants } from "../src/content/world";
const initial = () => ensureWorld(newGame("NIGHT-0"));
function at(room: string, time = 1428) {
  const s = initial();
  s.world!.room = room;
  s.time = time;
  return s;
}
function run(s: GameState, commands: string[]) {
  for (const command of commands) {
    const result = executeCommand(s, command);
    expect(
      result.ok,
      `${command}: ${result.state.world?.transcript
        .at(-1)
        ?.passages.map((p) => p.text)
        .join(" ")}`,
    ).toBe(true);
    s = result.state;
  }
  return s;
}
const last = (s: GameState) =>
  s
    .world!.transcript.at(-1)!
    .passages.map((p) => p.text)
    .join(" ");

describe("forgiving language", () => {
  it.each(["take", "get", "grab", "pick up", "taek"])(
    "accepts %s envelope",
    (verb) => {
      const result = executeCommand(initial(), `${verb} envelope`);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.state.inventory).toContain("envelope");
    },
  );
  it.each(["examine", "look at", "inspect", "x", "examin"])(
    "accepts %s black envelope",
    (verb) => {
      expect(executeCommand(initial(), `${verb} black envelope`).ok).toBe(true);
    },
  );
  it("fuzzy matches a misspelled noun", () =>
    expect(executeCommand(initial(), "take envelpoe").ok).toBe(true));
  it("understands reordered recipient prepositions", () => {
    expect(parseCommand("show photo to Inez")).toMatchObject({
      verb: "show",
      direct: "photo",
      indirect: "inez",
    });
    expect(parseCommand("show Inez the photograph")).toMatchObject({
      verb: "show",
      direct: "photograph",
      indirect: "inez",
    });
  });
  it("keeps a quoted message and semicolon intact", () =>
    expect(
      splitCommands('text Celeste "where are you; and then what?"; look'),
    ).toEqual(['text Celeste "where are you; and then what?"', "look"]));
  it("normalizes natural questions and adverbs", () => {
    expect(
      parseCommand("ask Mara why she recognised the envelope"),
    ).toMatchObject({
      verb: "ask",
      direct: "mara",
      topic: "why she recognised the envelope",
    });
    expect(parseCommand("quietly follow Luca outside")).toMatchObject({
      verb: "follow",
      direct: "luca",
      indirect: "outside",
    });
  });
  it("covers every core and atmospheric verb with a deterministic handler", () => {
    for (const verb of verbs)
      expect(actionHandlers[verb], verb).toBeTypeOf("function");
  });
  it("completes verbs, contextual objects and typos only when asked", () => {
    expect(completions(initial(), "exa")).toContain("examine");
    expect(completions(initial(), "take env")).toContain("take black envelope");
    expect(completions(initial(), "")).toEqual([]);
  });
});

describe("physical world", () => {
  it("preserves pronouns through nested inventory and revisits", () => {
    const s = run(initial(), [
      "take envelope",
      "open it",
      "take invitation",
      "put it in my coat",
      "go outside",
      "go inside",
      "go bar",
      "drop envelope",
      "go outside",
      "go inside",
      "go bar",
      "take envelope",
    ]);
    expect(s.world!.entities.invitation.location).toBe("coat");
    expect(s.inventory).toContain("invitation");
    expect(s.world!.entities.envelope.location).toBe("player");
  });
  it("asks only for genuinely ambiguous objects and resumes the exact command", () => {
    let s = at("office");
    let result = executeCommand(s, "open drawer");
    expect(result.ok).toBe(false);
    expect(result.state.time).toBe(s.time);
    expect(result.state.world!.pending?.candidates).toHaveLength(2);
    s = run(result.state, ["top drawer", "take receipt"]);
    expect(s.inventory).toContain("receipt");
    expect(s.world!.entities.bottom_drawer.open).toBe(false);
    expect(s.world!.pending).toBeUndefined();
  });
  it("saves and reloads a pending clarification", () => {
    const s = executeCommand(at("office"), "open drawer").state;
    const loaded = validateSave(JSON.parse(exportSave(s)));
    expect(
      run(loaded, ["bottom drawer"]).world!.entities.bottom_drawer.open,
    ).toBe(true);
  });
  it("stops a chain at ambiguity and accepts a new command", () => {
    const s = executeCommand(at("office"), "open drawer; take receipt").state;
    expect(s.inventory).not.toContain("receipt");
    expect(run(s, ["look"]).world!.pending).toBeUndefined();
  });
  it("resolves the local door and respects both sides of its state", () => {
    const s = run(at("landing"), ["open door", "enter", "close door"]);
    expect(s.world!.room).toBe("office");
    expect(executeCommand(s, "leave").ok).toBe(false);
    expect(run(s, ["open door", "leave"]).world!.room).toBe("landing");
  });
  it("requires the matching held key", () => {
    let s = at("landing");
    s.world!.entities.office_key.location = "player";
    s.inventory.push("office_key");
    s = run(s, ["lock office door", "use key on door", "open door"]);
    expect(s.world!.entities.office_door.locked).toBe(false);
    expect(s.world!.entities.office_door.open).toBe(true);
  });
  it("explains incomplete use without consuming time", () => {
    const s = at("kitchen");
    const r = executeCommand(s, "use key");
    expect(r.ok).toBe(false);
    expect(r.state.time).toBe(s.time);
    expect(last(r.state)).toMatch(/use.*on/i);
  });
  it("keeps closed contents out of scope", () => {
    const s = initial();
    expect(isVisible(s, "invitation")).toBe(false);
    expect(executeCommand(s, "take invitation").ok).toBe(false);
  });
  it("prevents containment cycles without partial mutation", () => {
    const s = run(initial(), [
      "take envelope",
      "open it",
      "remove coat",
      "put coat in envelope",
    ]);
    const r = executeCommand(s, "put envelope in coat");
    expect(r.ok).toBe(false);
    expect(r.state.world!.entities.envelope.location).toBe("player");
    expect(r.state.time).toBe(s.time);
  });
  it("wears only held wearables", () => {
    const s = run(at("cloakroom"), [
      "take jacket",
      "put on jacket",
      "take off jacket",
    ]);
    expect(s.world!.entities.formal.worn).toBe(false);
    expect(s.wardrobe).toBe("workwear");
    expect(executeCommand(s, "wear receipt").ok).toBe(false);
  });
  it("supports leaving physical evidence on the bar", () => {
    let s = at("bar");
    s.world!.entities.photo.location = "player";
    s.inventory.push("photo");
    s = run(s, ["leave photo on the bar"]);
    expect(s.world!.entities.photo.location).toBe("counter");
    expect(s.inventory).not.toContain("photo");
  });
  it("gives custody without inventing evidence", () => {
    let s = at("bar");
    s.world!.entities.photo.location = "player";
    s.inventory.push("photo");
    s = run(s, ["give photo to Mara"]);
    expect(s.world!.entities.photo.location).toBe("mara");
    expect(s.npcs.mara.knowledge).not.toContain("witness");
    expect(s.npcs.mara.memories["give:photo"]).toBeDefined();
    expect(executeCommand(s, "show photo to Mara").ok).toBe(false);
  });
  it("destruction persists, affects witnesses and cannot be undone by taking", () => {
    let s = at("bar");
    s.world!.entities.photo.location = "player";
    s.inventory.push("photo");
    s = run(s, ["tear photo"]);
    expect(s.world!.entities.photo.destroyed).toBe(true);
    expect(s.moral.destruction).toBe(1);
    expect(s.npcs.mara.memories["destroyed:photo"]).toBeDefined();
    expect(executeCommand(s, "take photo").ok).toBe(false);
  });
});

describe("conversation and simulation", () => {
  it("supports authored invitation dialogue and contextual follow-ups", () => {
    const s = run(at("bar"), [
      "ask Mara about invitation",
      "ask her why she recognised it",
    ]);
    expect(last(s)).toMatch(/handled deliveries/);
    expect(s.canon.player).toContain("tenantRisk");
    expect(s.world!.lastPerson).toBe("mara");
  });
  it("does not disclose seed truth from an unsupported question", () => {
    const s = run(at("bar"), ["ask Mara who sent it"]);
    expect(s.canon.player).not.toContain("sender");
    expect(last(s)).toMatch(/routing record/);
  });
  it("transmits verified knowledge and keeps an allegation a belief", () => {
    let s = at("bar");
    s.canon.player.push("header");
    s = run(s, ["tell Mara about the timestamp", "tell Mara Luca is lying"]);
    expect(s.npcs.mara.knowledge).toContain("header");
    expect(s.npcs.mara.beliefs["playerReport:luca is lying"].source).toContain(
      "not verified",
    );
    expect(s.npcs.mara.knowledge).not.toContain("luca is lying");
  });
  it("propagates the authored door lie on the existing scheduler", () => {
    let s = at("vestibule");
    s = run(s, ["tell Inez Luca invited me", "wait 25"]);
    expect(s.flags.liedLuca).toBe(true);
    expect(s.npcs.luca.beliefs.playerClaim).toBeDefined();
  });
  it("will not summon an absent NPC", () => {
    const s = at("bar", 1450);
    s.npcs.mara.location = "office";
    const r = executeCommand(s, "ask Mara about invitation");
    expect(r.ok).toBe(false);
    expect(r.state.npcs.mara.location).toBe("office");
    expect(r.state.time).toBe(1450);
  });
  it("applies explicit boundaries to social actions and historical transcript", () => {
    let s = at("bar");
    s = run(s, ["flirt with Mara"]);
    expect(s.npcs.mara.relationship.affinity).toBe(1);
    s = updateBoundary(s, "romance", "skip");
    expect(
      transcriptText(s, s.world!.transcript.at(-1)!.passages[0]),
    ).not.toMatch(/know each other/);
    const after = run(s, ["flirt with Mara"]);
    expect(after.npcs.mara.relationship.affinity).toBe(1);
    expect(after.time).toBe(s.time);
  });
  it("filters optional authored scene gates and disclosures", () => {
    let s = at("bar");
    s = updateBoundary(s, "powerExchange", "skip");
    s = run(s, ["go salon"]);
    expect(
      s
        .world!.transcript.at(-1)!
        .passages.some((p) => p.text === scenes.salon.boundaryGate?.summary),
    ).toBe(true);
  });
  it("charges meaningful actions while observations and failures stay free", () => {
    let s = run(initial(), ["look", "help", "inventory", "map", "remember"]);
    expect(s.time).toBe(1428);
    s = run(s, ["take envelope", "wait 5"]);
    expect(s.time).toBe(1434);
    const bad = executeCommand(s, "levitate a piano");
    expect(bad.state.time).toBe(s.time);
    expect(bad.ok).toBe(false);
    expect(last(bad.state)).toContain("HELP");
  });
  it("NPCs leave and remain elsewhere when the player revisits", () => {
    const s = run(at("bar"), [
      "wait 22",
      "go upstairs",
      "open office door",
      "enter",
    ]);
    expect(s.npcs.mara.location).toBe("office");
    expect(s.world!.room).toBe("office");
  });
  it("follows a scheduled move along a real exit", () => {
    const s = run(at("bar"), ["wait 15", "quietly follow Mara"]);
    expect(s.world!.room).toBe("kitchen");
  });
  it("misses both events organically", () => {
    const s = run(initial(), ["wait 40"]);
    expect(s.flags.missedExchange).toBe(true);
    expect(s.flags.missedWitness).toBe(true);
    expect(s.npcs.inez.location).toBe("night-bus");
    expect(s.rumours.some((r) => r.id === "absent")).toBe(true);
  });
  it("attends the exchange by physical presence at its deadline", () => {
    const s = run(initial(), [
      "go outside",
      "go inside",
      "go bar",
      "go upstairs",
      "go exchange",
      "wait until 00:20",
    ]);
    expect(s.flags.attendedExchange).toBe(true);
    expect(s.flags.missedExchange).toBeUndefined();
    expect(s.canon.player).toContain("tenantRisk");
  });
  it("cannot attend an event while still travelling", () => {
    let s = at("landing", 1459);
    s = run(s, ["go exchange"]);
    expect(s.flags.missedExchange).toBe(true);
    expect(s.flags.attendedExchange).toBeUndefined();
  });
  it("meets the witness in the bay, and learns only witnessed evidence", () => {
    const s = run(initial(), [
      "go outside",
      "go loading bay",
      "wait until 00:21",
      "say your name stays off my copy",
    ]);
    expect(s.flags.metWitness).toBe(true);
    expect(s.canon.player).toContain("witness");
    expect(s.inventory).toContain("photo");
    expect(s.flags.attendedExchange).toBeUndefined();
  });
  it("texts remotely with a delayed authored response", () => {
    const s = run(initial(), ['text Celeste "where are you?"', "wait 3"]);
    expect(s.messages.some((m) => m.text === "where are you?")).toBe(true);
    expect(
      s.messages.some(
        (m) => m.from === "Celeste" && m.text.includes("Above the bass"),
      ),
    ).toBe(true);
    expect(s.npcs.celeste.location).toBe("landing");
  });
  it("blocks phone commands when the phone was left behind", () => {
    const s = run(initial(), ["drop phone", "go outside"]);
    expect(executeCommand(s, 'text Mara "hello"').ok).toBe(false);
  });
  it("relationship responses cannot be farmed repeatedly", () => {
    const s = run(at("bar"), ["apologise to Mara", "apologise to Mara"]);
    expect(s.npcs.mara.relationship.trust).toBe(1);
  });
});

describe("content, saves and parser playthroughs", () => {
  it("accounts for every original scene without deleting the graph", () => {
    expect(Object.keys(scenes)).toHaveLength(117);
    expect(contentMigration).toHaveLength(117);
    for (const entry of contentMigration) {
      expect(rooms[entry.room], entry.id).toBeDefined();
      expect(entry.continuations).toHaveLength(scenes[entry.id].choices.length);
    }
  });
  it.each(["NIGHT-0", "NIGHT-1", "NIGHT-2"])(
    "authenticates seed %s via physical evidence then completes the night",
    (seed) => {
      let s = ensureWorld(newGame(seed));
      s = run(s, [
        "take envelope",
        "open it",
        "take invitation",
        "go outside",
        "go inside",
        "go bar",
        "wait 40",
        "go archive",
        "open service envelope",
      ]);
      s = run(s, [
        `read ${variants[s.variant].proof}`,
        "take ledger",
        "redact ledger",
        "go bar",
        "go outside",
        "go home",
        "sleep",
      ]);
      expect(s.canon.player).toContain("sender");
      expect(s.canon.player).toContain(variants[s.variant].fact);
      expect(s.flags.ending).toBe("protect");
      expect(s.scene).toBe("end_protect");
      expect(s.flags.parserNightEnded).toBe(true);
      expect(validateSave(JSON.parse(exportSave(s)))).toEqual(s);
    },
  );
  it("requires real custody before a moral commitment", () => {
    let s = at("archive", 1470);
    s.world!.entities.ledger.location = "archive";
    s.canon.player.push("sender");
    s.world!.encounters.archive = "ledger";
    expect(executeCommand(s, "redact ledger").ok).toBe(false);
    expect(executeCommand(s, "publish ledger").ok).toBe(false);
  });
  it("round trips containers, doors, wearables, NPCs, transcript and discourse", () => {
    const s = run(initial(), [
      "take envelope",
      "open it",
      "put it in coat",
      "go outside",
      "go inside",
      "go cloakroom",
      "take jacket",
      "wear jacket",
    ]);
    expect(importSave(exportSave(s), s)).toEqual(s);
  });
  it("migrates a legacy save without changing canon or history", () => {
    const old = newGame("old-run");
    const s = ensureWorld(validateSave(old));
    expect(s.canon).toEqual(old.canon);
    expect(s.history).toEqual(old.history);
    expect(s.world).toBeDefined();
    expect(validateSave(s)).toEqual(s);
  });
  it("rejects malformed entity graphs and inventory disagreement", () => {
    let s = initial();
    s.world!.entities.envelope.location = "envelope";
    expect(() => validateSave(s)).toThrow(/cycle/);
    s = initial();
    s.world!.room = "void";
    expect(() => validateSave(s)).toThrow(/room/);
    s = initial();
    s.inventory.push("photo");
    expect(() => validateSave(s)).toThrow(/custody/);
  });
  it("same seed and actual commands yield identical results", () => {
    const commands = ["take envelope", "open it", "go outside", "wait 40"];
    expect(run(initial(), commands)).toEqual(run(initial(), commands));
  });
});

describe("extended authored conversations in a persistent world", () => {
  it("keeps a conversation across leaving and returning, without replaying effects", () => {
    let s = at("kitchen", 1470);
    s.npcs.mara.location = "kitchen";
    s = run(s, [
      "ask Mara about company",
      "use your system",
      "say vinegar",
      "go bar",
      "go kitchen",
      "talk to Mara",
      "tell her about the refrigerator noise",
    ]);
    expect(s.flags.arc_mara).toBe(true);
    expect(s.flags.firstLead).toBe("mara");
    expect(s.npcs.mara.memories.snack.value).toContain("vinegar");
    expect(s.world!.conversations.mara).toBe("mara_r4");
  });
  it("finishes Mara's first relationship encounter using actual commands", () => {
    let s = at("kitchen", 1470);
    s.npcs.mara.location = "kitchen";
    s = run(s, [
      "ask Mara about company",
      "use your system",
      "say vinegar",
      "tell her about the refrigerator noise",
      "say I like being useful. I wasn't offering an inspection.",
      "keep Sera's reason private",
      "say I wanted to be around you",
      "return to the room",
    ]);
    expect(s.flags.mara_firstDone).toBe(true);
    expect(s.events.some((e) => e.id === "mara-break-plan")).toBe(true);
    expect(s.world!.room).toBe("kitchen");
  });
  it("finishes Luca's first relationship encounter using authored intent synonyms", () => {
    let s = at("stage", 1470);
    s.npcs.luca.location = "stage";
    s = run(s, [
      "ask Luca about company",
      "hold the light",
      "say coriander is fine",
      "ask him for something familiar enough to stop thinking to",
      "ask him to correct the commitment now in front of you",
      "recommend disclosing the terms keeping the amount private",
      "choose the little audience agree that watching is enough",
      "return to the room",
    ]);
    expect(s.flags.luca_firstDone).toBe(true);
    expect(s.npcs.luca.memories).not.toEqual({});
  });
  it("does not reveal seed truth or invent ledger custody on an early departure", () => {
    const s = run(initial(), ["go outside", "go home", "sleep"]);
    expect(s.flags.parserNightEnded).toBe(true);
    expect(s.canon.player).not.toContain("sender");
    expect(last(s)).not.toContain(variants[s.variant].sender);
    expect(last(s)).not.toContain("ledger under your table");
  });
});

describe("remaining relationship routes and ending consequences", () => {
  it("supports Celeste's ordinary and personal conversation intents", () => {
    let s = at("office", 1470);
    s.npcs.celeste.location = "office";
    s = run(s, [
      "ask Celeste about company",
      "hold glasses",
      "say toast",
      "ask her whether the dog preferred the expensive wallpaper",
      "say I liked being overestimated briefly",
      "recommend closing the room and owning the refund",
      "say company counts even when it stays professional",
      "return to the room",
    ]);
    expect(s.flags.celeste_firstDone).toBe(true);
  });
  it("connects Inez's lost-property interaction to the authored relationship effects", () => {
    let s = at("vestibule", 1480);
    s.npcs.inez.location = "vestibule";
    s = run(s, [
      "ask Inez about company",
      "ask for something ordinary accept the chair",
      "put mitten on ledge",
      "tell her you like familiar voices in the background",
      "say I trust the correction more than I trusted the certainty",
      "recommend challenging the claim using only the arranged cover",
      "tell her you sometimes make accepting help needlessly difficult",
      "return to the room",
    ]);
    expect(s.world!.entities.mitten.location).toBe("ledge");
    expect(s.flags.inez_firstDone).toBe(true);
  });
  it.each(["luca", "celeste"])(
    "giving the original to %s propagates the original ending consequences",
    (npc) => {
      let s = run(initial(), [
        "go outside",
        "go inside",
        "go bar",
        "wait 40",
        "go archive",
        "open service envelope",
      ]);
      s = run(s, [
        `read ${variants[s.variant].proof}`,
        "take ledger",
        "go bar",
        ...(npc === "luca"
          ? ["go stage"]
          : ["go upstairs", "open office door", "enter"]),
        `give ledger to ${npc}`,
        ...(npc === "luca" ? ["go bar"] : ["leave", "go downstairs"]),
        "go outside",
        "go home",
        "sleep",
      ]);
      expect(s.flags.ending).toBe(npc === "luca" ? "public" : "power");
      expect(s.world!.entities.ledger.location).toBe(npc);
      expect(s.scene).toBe(npc === "luca" ? "end_public" : "end_power");
      expect(s.npcs.mara.relationship.trust).toBeLessThan(0);
      if (npc === "luca")
        expect(s.rumours.some((r) => r.id === "published")).toBe(true);
    },
  );
});

it("supports Mara's closing return after an actual document decision", () => {
  let s = at("kitchen", 1470);
  s.npcs.mara.location = "kitchen";
  s = run(s, [
    "ask Mara about company",
    "use your system",
    "say vinegar",
    "tell her about the refrigerator noise",
    "say I like being useful. I wasn't offering an inspection.",
    "keep Sera's reason private",
    "say I wanted to be around you",
    "return to the room",
    "go bar",
    "go archive",
    "open service envelope",
  ]);
  s = run(s, [
    `read ${variants[s.variant].proof}`,
    "take ledger",
    "redact ledger",
    "go bar",
    "go kitchen",
    "ask Mara about company",
    "ask what happened while you were elsewhere",
    "accept the packet without making a speech",
    "let their imperfect repair stand",
    "acknowledge the cost without asking her to approve",
    "say Ask what I mean. I'll ask what you need.",
    "goodnight",
  ]);
  expect(s.flags.mara_closed).toBe(true);
  expect(s.npcs.mara.memories).not.toEqual({});
  expect(validateSave(JSON.parse(exportSave(s))).world).toEqual(s.world);
});

it("resolves gendered pronouns across a conversation with two people", () => {
  let s = at("bar");
  s.npcs.luca.location = "bar";
  s = run(s, [
    "ask Mara about invitation",
    "ask Luca about invitation",
    "ask her why she recognised it",
  ]);
  expect(last(s)).toContain("handled deliveries");
  expect(s.world!.lastPerson).toBe("mara");
});
it("clarifies an ambiguous person using their full name", () => {
  const s = at("bar");
  s.npcs.celeste.location = "bar";
  const ambiguous = executeCommand(s, "ask woman about invitation");
  expect(ambiguous.ok).toBe(false);
  const next = run(ambiguous.state, ["Celeste Ardent"]);
  expect(next.world!.lastPerson).toBe("celeste");
});
it("retains an unconditional physical exit from Motel 27", () => {
  let s = run(initial(), [
    "call Inez about Motel 27",
    "go outside",
    "go home",
    "take key27",
    "go motel",
  ]);
  expect(s.world!.room).toBe("motel");
  s = run(s, ["go home"]);
  expect(s.world!.room).toBe("apartment");
});

it("retains the actual boundary theme of a PULL observation in the transcript", () => {
  let s = at("bar");
  s.pull.entries.connection.interest = 2;
  s = run(s, ["talk to Mara"]);
  const cue = s
    .world!.transcript.at(-1)!
    .passages.find((p) => p.theme === "romance");
  expect(cue).toBeDefined();
  s = updateBoundary(s, "romance", "skip");
  expect(transcriptText(s, cue!)).toBe("");
});

it.each([
  ["public", "luca"],
  ["power", "celeste"],
  ["protect", "mara"],
])(
  "preserves legacy %s custody when archive delivery is initialized",
  (ending, owner) => {
    const old = newGame();
    old.scene = "apartment";
    old.time = 1800;
    old.flags.ending = ending;
    old.history = [
      { scene: "arrival", choice: "enter", to: "door", at: 1431, changes: [] },
    ];
    const s = run(ensureWorld(validateSave(old)), ["wait 1"]);
    expect(s.world!.entities.ledger.location).toBe(owner);
    expect(s.inventory).not.toContain("ledger");
    expect(validateSave(s).world).toEqual(s.world);
  },
);
