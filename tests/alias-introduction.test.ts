import { describe, expect, it } from "vitest";
import { newGame, validateSave } from "../src/engine/game";
import {
  ensureWorld,
  executeAliasIntroduction,
  executeCommand,
} from "../src/engine/parser";

function arrival() {
  let s = ensureWorld(newGame("NIGHT-0"));
  for (const c of [
    "take envelope",
    "go outside",
    "go inside",
    "put envelope on ledge",
    "talk Inez",
  ])
    s = executeCommand(s, c).state;
  return s;
}
describe("typed alias introduction transaction", () => {
  it("uses the existing authored alias-only choice with its timing, effects and validation", () => {
    const s = arrival();
    const before = structuredClone(s);
    const result = executeAliasIntroduction(s, "  <Night Finch>\n ");
    expect(result.ok).toBe(true);
    expect(result.state.alias).toBe("Night Finch");
    expect(result.state.npcs.inez.memories.chosenAlias.value).toBe(
      "Night Finch",
    );
    const ordinary = executeCommand(s, "say just the alias to Inez").state;
    expect(result.state.time).toBe(ordinary.time);
    expect(result.state.history).toEqual(ordinary.history);
    expect(result.state.world!.entities).toEqual(ordinary.world!.entities);
    expect(result.state.npcs.inez.relationship).toEqual(
      ordinary.npcs.inez.relationship,
    );
    expect(result.state.canon).toEqual(s.canon);
    expect(result.state.world!.room).toBe("vestibule");
    expect(result.state.world!.consumed).toContain("intent:door:private");
    expect(
      result.state
        .world!.transcript.at(-1)!
        .passages.some(
          (p) => p.speaker === "inez" && p.text.includes("full name"),
        ),
    ).toBe(true);
    expect(validateSave(result.state)).toEqual(result.state);
    expect(s).toEqual(before);
  });
  it("never parses aliases as commands, even with chain syntax", () => {
    const s = arrival();
    const result = executeAliasIntroduction(s, "Alex; wait 99");
    expect(result.ok).toBe(true);
    expect(result.state.alias).toBe("Alex; wait 99");
    expect(result.state.time - s.time).toBe(2);
    expect(
      result.state.world!.transcript.length - s.world!.transcript.length,
    ).toBe(1);
    expect(result.state.world!.entities.envelope.location).toBe("ledge");
  });
  it.each(["", "  ", "<>\n\t"])(
    "rejects empty normalized alias %j atomically",
    (alias) => {
      const s = arrival();
      const r = executeAliasIntroduction(s, alias);
      expect(r.ok).toBe(false);
      expect(r.state.alias).toBe(s.alias);
      expect(r.state.npcs).toEqual(s.npcs);
      expect(r.state.time).toBe(s.time);
      expect(r.state.world!.entities).toEqual(s.world!.entities);
      expect(r.state.history).toEqual(s.history);
    },
  );
  it("uses the setup UI's 24-character limit", () => {
    expect(
      executeAliasIntroduction(arrival(), "a".repeat(30)).state.alias,
    ).toBe("a".repeat(24));
  });
  it("requires a present Inez and her outstanding introduction", () => {
    const unasked = ensureWorld(newGame("NIGHT-0"));
    expect(executeAliasIntroduction(unasked, "Alex").ok).toBe(false);
    const s = executeCommand(arrival(), "wait 30 minutes").state;
    const r = executeAliasIntroduction(s, "Alex");
    expect(r.ok).toBe(false);
    expect(r.state.alias).toBe(s.alias);
    expect(r.state.npcs).toEqual(s.npcs);
  });
  it("preserves an unanswered safekeeping offer and rejects alias submission", () => {
    let s = executeCommand(arrival(), "take envelope").state;
    s = executeCommand(
      s,
      "ask Inez to keep my envelope while I visit the bar",
    ).state;
    expect(s.world!.social?.offer).toBeTruthy();
    const r = executeAliasIntroduction(s, "Alex");
    expect(r.ok).toBe(false);
    expect(r.state.world!.social).toEqual(s.world!.social);
    expect(r.state.alias).toBe(s.alias);
    expect(r.state.time).toBe(s.time);
  });
  it("does not repeat the introduction or grant unrelated evidence on subsequent Talk", () => {
    const s = executeAliasIntroduction(arrival(), "Alex").state;
    const repeat = executeAliasIntroduction(s, "Other");
    expect(repeat.ok).toBe(false);
    expect(repeat.state.alias).toBe("Alex");
    expect(repeat.state.time).toBe(s.time);
    const talk = executeCommand(s, "talk Inez");
    expect(talk.ok).toBe(true);
    expect(
      talk.state
        .world!.transcript.at(-1)!
        .passages.map((p) => p.text)
        .join(" "),
    ).toContain("I'm listening");
    expect(talk.state.canon).toEqual(s.canon);
    expect(talk.state.history).toEqual(s.history);
    expect(talk.state.npcs.inez.memories.chosenAlias.value).toBe("Alex");
  });
});
