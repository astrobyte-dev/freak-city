import { describe, it, expect } from "vitest";
import { newGame, validateSave, updateBoundary } from "../src/engine/game";
import {
  ensureWorld,
  executeCommand,
  transcriptText,
} from "../src/engine/parser";
import { parseCommand } from "../src/engine/language";
import { rooms } from "../src/content/spaces";
import { ambientEntities } from "../src/content/affordances";
import type { GameState } from "../src/engine/types";
const initial = () => ensureWorld(newGame("NIGHT-0"));
function at(room = "bar", time = 1428) {
  const s = initial();
  s.world!.room = room;
  s.time = time;
  return s;
}
function run(s: GameState, commands: string[]) {
  for (const command of commands) {
    const r = executeCommand(s, command);
    expect(r.ok, `${command}: ${last(r.state)}`).toBe(true);
    s = r.state;
  }
  return s;
}
const last = (s: GameState) =>
  s
    .world!.transcript.at(-1)!
    .passages.map((p) => p.text)
    .join(" ");
const held = () => {
  const s = at();
  s.world!.entities.envelope.location = "player";
  s.inventory.push("envelope");
  s.world!.lastObject = "envelope";
  return s;
};

describe("ordinary language", () => {
  it.each([
    "where am i",
    "where am I?",
    "what can i see",
    "who's here",
    "whos here",
    "check out the room",
    "have a look around",
    "please look around",
    "look",
    "l",
    "what's here?",
    "what does the room look like?",
  ])("orients: %s", (q) => {
    const s = at();
    const r = executeCommand(s, q);
    expect(r.ok, last(r.state)).toBe(true);
    expect(r.state.time).toBe(s.time);
  });
  it.each([
    "examine envelope",
    "look at this envelope",
    "whats up with this envlope",
    "check out the envelope",
    "inspect the black envelope",
    "x envelope",
    "examin envelope",
    "please examine envelope",
    "can i look at the envelope",
    "i wanna inspect the envelope",
    "take a look at the envelope",
    "what is this envelope",
  ])("examines: %s", (q) => {
    const r = executeCommand(initial(), q);
    expect(r.ok, last(r.state)).toBe(true);
    expect(r.state.world!.lastObject).toBe("envelope");
    expect(r.state.inventory).not.toContain("envelope");
  });
  it.each([
    "ask Mara about invitation",
    "ask mara what she knows about it",
    "ask her what the hell is going on",
    "ask her y she knows it",
    "ask why she recognised it",
    "ask her where she saw it before",
    "Mara, tell me about the invitation",
    "ask about invitation to mara",
  ])("converses: %s", (q) => {
    const s = run(held(), ["show envelope to Mara"]);
    const r = executeCommand(s, q);
    expect(r.ok, last(r.state)).toBe(true);
    expect(r.state.world!.lastPerson).toBe("mara");
    expect(r.state.canon.player).not.toContain("sender");
  });
  it.each([
    "put it somewhere safe",
    "put it away",
    "stash it",
    "put envelope in my coat",
  ])("stows: %s", (q) => {
    const s = run(held(), [q]);
    expect(s.world!.entities.envelope.location).toBe("coat");
  });
  it.each([
    "keep an eye on luca",
    "watch mara for a while",
    "tell her i don't believe that",
    "listen to what they're talking about",
    "see if anyone is watching",
    "look at her boots",
    "think about what mara just said",
    "what do i know about motel 27",
    "lean against bar",
    "smell the room",
    "look behind bar",
    "touch glass",
    "sit on stool",
  ])("understands requested examples: %s", (q) => {
    const s = run(held(), ["show envelope to Mara"]);
    s.npcs.luca.location = "bar";
    expect(executeCommand(s, q).ok, last(executeCommand(s, q).state)).toBe(
      true,
    );
  });
  it("checks doors without opening them", () => {
    const s = run(at("landing"), [
      "check whether the door is locked",
      "peek inside door",
    ]);
    expect(s.world!.entities.office_door.open).toBe(false);
    expect(last(s)).toMatch(/closed/i);
  });
  it("sits beside Celeste without entering a contract", () => {
    const s = at("salon");
    s.npcs.celeste.location = "salon";
    const r = run(s, ["sit beside celeste"]);
    expect(r.flags).toEqual(s.flags);
    expect(r.inventory).toEqual(s.inventory);
  });
  it("follows at a distance along a scheduled physical route", () => {
    const s = at("stage", 1450);
    s.world!.lastMale = "luca";
    s.world!.lastPerson = "luca";
    expect(run(s, ["follow him but keep my distance"]).world!.room).toBe(
      "loading-bay",
    );
  });
  it("waits for a named departure", () => {
    const s = run(at(), ["wait until mara leaves"]);
    expect(s.time).toBe(1445);
    expect(s.npcs.mara.location).toBe("kitchen");
  });
  it.each([
    "stay here for five minutes",
    "wait five minutes",
    "wait for 5 mins",
    "wait 300 seconds",
  ])("spends exactly five minutes: %s", (q) =>
    expect(run(initial(), [q]).time).toBe(1433),
  );
});

describe("refusals never execute the refused action", () => {
  const prefixes = [
    "don't",
    "dont",
    "do not",
    "never",
    "i don't",
    "I won't",
    "i will not",
    "i refuse to",
    "not",
    "please don't",
    "can i not",
    "i would rather not",
    "i'm not going to",
    "I'd rather not",
    "quietly don't",
    "okay, don't",
    "i don't want to",
    "i would prefer not to",
  ];
  const actions = [
    "give it to mara",
    "tell mara luca invited me",
    "follow luca",
    "publish ledger",
    "redact ledger",
    "open envelope",
    "take invitation",
    "go outside",
    "agree with mara",
    "show envelope to mara",
  ];
  it.each(prefixes.flatMap((p) => actions.map((a) => `${p} ${a}`)))(
    "leaves undone: %s",
    (q) => {
      const s = held(),
        r = executeCommand(s, q);
      expect(r.state.inventory).toEqual(s.inventory);
      expect(r.state.world!.entities).toEqual(s.world!.entities);
      expect(r.state.npcs).toEqual(s.npcs);
      expect(r.state.flags).toEqual(s.flags);
      expect(r.state.time).toBe(s.time);
      expect(r.state.canon).toEqual(s.canon);
      expect(r.state.world!.room).toBe(s.world!.room);
      expect(r.state.world!.transcript.at(-1)!.outcome).toBe("refusal");
    },
  );
  it.each([
    "tell Inez Luca did not invite me",
    "tell Inez Luca never invited me",
    "tell Inez I don't know if Luca invited me",
    "tell Inez Luca invited me? no",
    "tell Inez I'm not saying Luca invited me",
  ])("does not assert the positive door lie: %s", (q) => {
    const r = executeCommand(at("vestibule"), q);
    expect(r.state.flags.liedLuca).toBeUndefined();
    expect(r.state.events.some((e) => e.id === "door-report")).toBe(false);
  });
  it("does not execute a second clause under a refusal", () => {
    const s = held(),
      r = executeCommand(s, "don't give it to mara then go outside");
    expect(r.state.world!.room).toBe("bar");
    expect(r.state.inventory).toEqual(s.inventory);
  });
  it("can execute an explicit action after a positive command and refusal", () => {
    const s = run(held(), ["examine envelope; don't give it to mara; look"]);
    expect(s.world!.entities.envelope.location).toBe("player");
  });
  it("keeps quoted refusal text as a phone message", () => {
    const s = run(initial(), [
      'text Mara "Do not give it to Luca; then call me."',
    ]);
    expect(
      s.messages.some(
        (m) => m.text === "Do not give it to Luca; then call me.",
      ),
    ).toBe(true);
    expect(s.world!.room).toBe("taxi");
  });
});

describe("context, knowledge and conversation intent", () => {
  it("keeps physical and conversational referents separate", () => {
    const s = run(held(), [
      "examine envelope",
      "show it to mara",
      "ask her where she saw it before",
      "tell her i don't believe that",
      "look at her boots",
      "examine envelope",
      "put it away",
    ]);
    expect(s.world!.entities.envelope.location).toBe("coat");
    expect(s.flags.promisedProtection).toBeUndefined();
  });
  it("clarifies expired person pronouns", () => {
    let s = run(held(), ["show envelope to Mara"]);
    s.time += 21;
    s.npcs.mara.location = "bar";
    expect(executeCommand(s, "thank her").ok).toBe(false);
    expect(executeCommand(s, "thank Mara").ok).toBe(true);
  });
  it.each([
    "deny Mara",
    "thank Mara",
    "reassure Mara",
    "challenge Mara",
    "tease Mara",
    "joke with Mara",
    "change subject",
    "tell her I don't believe that",
    "tell her thanks",
    "tell her it's okay",
    "ask her a personal question",
    "mara is lying",
    "confront her",
    "apologize to Mara",
    "flirt with Mara",
  ])("has an authored social response: %s", (q) => {
    const s = run(held(), ["show envelope to Mara"]);
    const r = executeCommand(s, q);
    expect(r.ok, last(r.state)).toBe(true);
    expect(r.state.world!.entities.envelope.location).toBe("player");
    expect(r.state.flags.promisedProtection).toBeUndefined();
  });
  it("requires a specific agreement instead of a generic yes", () => {
    const s = run(held(), ["talk to Mara", "agree with her"]);
    expect(s.flags.drink).toBeUndefined();
    expect(last(s)).toMatch(/which|what/i);
  });
  it("does not farm gratitude or reassurance", () => {
    const s = run(held(), [
      "thank Mara",
      "thank Mara",
      "reassure Mara",
      "reassure Mara",
    ]);
    expect(s.npcs.mara.relationship.trust).toBe(2);
  });
  it("thinks from knowledge, not seed truth", () => {
    for (const seed of ["NIGHT-0", "NIGHT-1", "NIGHT-2"]) {
      const s = ensureWorld(newGame(seed));
      const r = run(s, [
        "think about Mara",
        "what do i know about motel 27",
        "think about the timestamp",
      ]);
      expect(r.canon).toEqual(s.canon);
      expect(last(r)).toMatch(/haven't verified/);
    }
  });
  it("remembers only boundary-filtered spoken words", () => {
    let s = run(at(), ["flirt with Mara"]);
    s = updateBoundary(s, "romance", "skip");
    const r = run(s, ["remember what mara said"]);
    expect(last(r)).not.toContain("before we decide what this is");
    expect(r.time).toBe(s.time);
  });
});

describe("physical affordances throughout the existing map", () => {
  it.each(Object.keys(rooms))(
    "has at least five authored details in %s",
    (room) =>
      expect(
        ambientEntities().filter((e) => e.location === room).length,
      ).toBeGreaterThanOrEqual(5),
  );
  it.each(
    ambientEntities()
      .filter((e) => rooms[e.location])
      .flatMap((e) =>
        ["examine", "touch", "search", "smell", "listen"].map((verb) => ({
          id: e.id,
          room: e.location,
          verb,
        })),
      ),
  )("responds to $verb $id", ({ id, room, verb }) => {
    const s = at(room);
    const r = executeCommand(s, `${verb} ${s.world!.entities[id].name}`);
    expect(r.ok, last(r.state)).toBe(true);
    expect(r.state.world!.entities[id].location).toBe(room);
  });
  it("keeps harmless fallback free of rewards", () => {
    const s = at(),
      r = run(s, ["smile", "sigh", "stretch", "lean against bar"]);
    expect(r.canon).toEqual(s.canon);
    expect(r.npcs.mara.relationship).toEqual(s.npcs.mara.relationship);
    expect(r.moral).toEqual(s.moral);
    expect(r.inventory).toEqual(s.inventory);
  });
});

describe("observation, off-screen work, embodiment and saves", () => {
  it("distinguishes thirty seconds, two minutes and five minutes", () => {
    const s = at(),
      short = run(s, ["watch mara for thirty seconds"]),
      two = run(short, ["watch mara for 90 seconds"]),
      five = run(two, ["watch mara for three minutes"]);
    expect(short.time).toBe(s.time);
    expect(short.world!.subMinute).toBe(30);
    expect(two.time).toBe(s.time + 2);
    expect(two.canon.player).toContain("observed_mara_routine");
    expect(short.canon.player).not.toContain("observed_mara_routine");
    expect(last(short)).not.toBe(last(two));
    expect(last(two)).not.toBe(last(five));
    expect(five.time).toBe(s.time + 5);
    expect(validateSave(JSON.parse(JSON.stringify(five)))).toEqual(five);
  });
  it.each([
    "watch mara for half a minute",
    "watch mara for 0.5 minutes",
    "watch mara for 30 seconds",
  ])("accounts for fractions: %s", (q) =>
    expect(run(at(), [q]).world!.subMinute).toBe(30),
  );
  it("patient observation can miss another event", () => {
    const s = run(at("bar", 1443), ["watch mara for five minutes", "wait 20"]);
    expect(s.flags.missedExchange).toBe(true);
  });
  it("leaves traces of work after time away", () => {
    const s = run(initial(), ["wait 80"]);
    s.world!.room = "bar";
    expect(last(run(s, ["look"]))).toContain("crate for the supplier");
    s.world!.room = "kitchen";
    expect(last(run(s, ["look"]))).toContain("restocked the cups");
  });
  it("reassurance can bring a quiet break forward", () => {
    const s = at("bar", 1470);
    s.npcs.mara.location = "bar";
    const r = run(s, ["reassure Mara", "wait 8"]);
    expect(r.flags.maraQuietBreak).toBe(true);
    expect(r.npcs.mara.location).toBe("kitchen");
  });
  it("a greeting does not take a drink, disclose a document or agree", () => {
    const s = at();
    const r = run(s, ["talk to Mara"]);
    expect(r.inventory).toEqual(s.inventory);
    expect(r.flags.drink).toBeUndefined();
    expect(r.world!.room).toBe("bar");
    expect(r.flags.promisedProtection).toBeUndefined();
  });
  it("offers Inez's chair and mitten without taking them", () => {
    const s = at("vestibule", 1480);
    s.npcs.inez.location = "vestibule";
    const r = run(s, ["ask Inez about company"]);
    expect(last(r)).not.toContain("You sit anyway");
    const next = run(r, ["ask for something ordinary accept the chair"]);
    expect(next.world!.entities.mitten.location).toBe("vestibule");
    expect(next.inventory).not.toContain("mitten");
    expect(executeCommand(next, "put mitten on ledge").ok).toBe(false);
    expect(
      run(next, ["take mitten", "put mitten on ledge"]).world!.entities.mitten
        .location,
    ).toBe("ledge");
  });
  it("migrates the checkpoint world without relocating any original objects", () => {
    const s = run(held(), ["put envelope in coat"]);
    const old = JSON.parse(JSON.stringify(s));
    delete old.world.revision;
    delete old.world.subMinute;
    delete old.world.references;
    delete old.world.hints;
    delete old.world.observations;
    for (const e of ambientEntities()) delete old.world.entities[e.id];
    const migrated = validateSave(old);
    expect(migrated.world!.revision).toBe(2);
    expect(migrated.world!.entities.envelope).toEqual(
      s.world!.entities.envelope,
    );
    expect(migrated.canon).toEqual(s.canon);
    expect(migrated.history).toEqual(s.history);
    expect(validateSave(migrated)).toEqual(migrated);
  });
  it("records delivered phone messages once and filters their history", () => {
    const s = run(initial(), ['text Mara "hello"', "wait 3"]);
    const phones = s
      .world!.transcript.flatMap((e) => e.passages)
      .filter((p) => p.kind === "phone");
    expect(phones.some((p) => p.from === "Mara")).toBe(true);
    const r = run(s, ["look"]);
    expect(
      r.world!.transcript.at(-1)!.passages.some((p) => p.kind === "phone"),
    ).toBe(false);
    const p = {
      kind: "phone" as const,
      text: "personal",
      theme: "romance" as const,
      safe: "omitted",
    };
    expect(transcriptText(updateBoundary(r, "romance", "skip"), p)).toBe(
      "omitted",
    );
  });
  it("does not show moral solutions in hints", () => {
    const s = run(at("archive"), ["hint", "hint", "hint"]);
    expect(last(s)).not.toMatch(/publish|redact|bargain|withhold/i);
  });
  it("parses independently and deterministically", () => {
    const q = "watch mara for five minutes";
    expect(parseCommand(q)).toEqual(parseCommand(q));
    const cmds = [
      "take envelope",
      "open it",
      "wait thirty seconds",
      "where am i",
    ];
    expect(run(initial(), cmds)).toEqual(run(initial(), cmds));
  });
});

describe("consequential ambiguity and world continuity", () => {
  it.each([
    "should I give ledger to Celeste",
    "what happens if I publish ledger",
    "maybe redact ledger",
    "I might give ledger to Luca",
    "if I give ledger to Celeste",
    "I'm thinking about giving ledger to Celeste",
    "what if I agree to the terms",
  ])("does not commit a hypothetical: %s", (q) => {
    const s = at("archive", 1470);
    s.world!.entities.ledger.location = "player";
    s.inventory.push("ledger");
    s.canon.player.push("sender");
    s.world!.encounters.archive = "ledger";
    const r = executeCommand(s, q);
    expect(r.state.inventory).toEqual(s.inventory);
    expect(r.state.flags).toEqual(s.flags);
    expect(r.state.time).toBe(s.time);
  });
  it("runs a curated work conversation only while both people are present", () => {
    const s = run(initial(), ["wait 30"]);
    expect(s.npcs.luca.memories.workHandover).toBeDefined();
    expect(s.npcs.inez.memories.workHandover).toBeDefined();
    expect(s.canon.player).not.toContain("workHandover");
    const other = initial();
    other.events = other.events.filter((e) => e.id !== "world:luca-outside");
    expect(run(other, ["wait 30"]).flags.workHandover).toBeUndefined();
  });
  it("uses the actual fraction of a minute when waiting to a clock time", () => {
    const s = run(initial(), ["wait 30 seconds", "wait until 00:00"]);
    expect(s.time).toBe(1440);
    expect(s.world!.subMinute).toBe(0);
  });
});
