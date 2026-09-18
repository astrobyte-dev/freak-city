import { describe, expect, it } from "vitest";
import { advanceTime, validateSave } from "../src/engine/game";
import { executeCommand } from "../src/engine/parser";
import { agreementFor } from "../src/engine/commitments";
import {
  availableActions,
  commandFor,
  createFixture,
  dispatch,
  inventory,
  targets,
  type Action,
} from "./simulation";
import {
  clearSegment,
  findPath,
  obstacles,
  spawn,
  walkable,
} from "./navigation";

describe("isolated graphical adapter", () => {
  it("projects existing NPC speech separately from legacy spatial narration", () => {
    const result = dispatch(createFixture(), { id: "talk", target: "inez" });
    expect(result.spokenLines.length).toBeGreaterThan(0);
    expect(result.spokenLines).toEqual(
      result.state
        .world!.transcript.at(-1)!
        .passages.filter((p) => p.speaker === "inez")
        .map((p) => p.text),
    );
    expect(result.spokenLines.join(" ")).not.toContain("taxi");
    expect(dispatch(createFixture(), { id: "think" }).spokenLines).toEqual([]);
  });
  it("creates a valid legal arrival with one envelope on the ledge", () => {
    const s = createFixture();
    expect(validateSave(s)).toEqual(s);
    expect(s.world!.room).toBe("vestibule");
    expect(s.npcs.inez.location).toBe("vestibule");
    expect(s.world!.entities.envelope.location).toBe("ledge");
    expect(s.world!.entities.invitation.location).toBe("envelope");
    expect(inventory(s).some((e) => e.id === "envelope")).toBe(false);
    expect(s.world!.transcript.slice(-4).map((t) => t.command)).toEqual([
      "take envelope",
      "go outside",
      "go inside",
      "put envelope on ledge",
    ]);
  });
  it("keeps all transaction effects equal to the existing entry point", () => {
    let state = createFixture();
    const sequence: Action[] = [
      { id: "examine", target: "bench" },
      { id: "examine", target: "notice" },
      { id: "examine", target: "heater" },
      { id: "examine", target: "ledge" },
      { id: "take", target: "envelope" },
      { id: "place", target: "ledge" },
      { id: "take", target: "envelope" },
      { id: "talk", target: "inez" },
      { id: "ask-care", target: "inez" },
      { id: "decline-care", target: "inez" },
      { id: "ask-care", target: "inez" },
      { id: "accept-care", target: "inez" },
      { id: "take", target: "envelope" },
      { id: "think" },
      { id: "wait" },
    ];
    for (const action of sequence) {
      const previous = structuredClone(state);
      const result = dispatch(state, action);
      expect(
        result.ok,
        `${JSON.stringify(action)}: ${result.lines.join(" ")}`,
      ).toBe(true);
      expect(result.state).toEqual(
        executeCommand(state, commandFor(action)).state,
      );
      expect(state).toEqual(previous);
      expect(() => validateSave(result.state)).not.toThrow();
      state = result.state;
    }
    expect(agreementFor(state)?.status).toBe("fulfilled");
  });
  it("requires explicit acknowledgement and follows physical custody", () => {
    let s = dispatch(createFixture(), { id: "take", target: "envelope" }).state;
    const taken = s.time;
    s = dispatch(s, { id: "ask-care", target: "inez" }).state;
    expect(s.world!.entities.envelope.location).toBe("player");
    expect(agreementFor(s)).toBeUndefined();
    expect(availableActions(s, "inez")).toEqual([
      "accept-care",
      "decline-care",
    ]);
    s = dispatch(s, { id: "accept-care", target: "inez" }).state;
    expect(s.time).toBeGreaterThan(taken);
    expect(agreementFor(s)?.status).toBe("active");
    expect(s.world!.entities.envelope.owner).toBe("player");
    expect(s.world!.entities.envelope.location).toBe("ledge");
    expect(inventory(s).some((e) => e.id === "envelope")).toBe(false);
    s = dispatch(s, { id: "take", target: "envelope" }).state;
    expect(agreementFor(s)?.status).toBe("fulfilled");
    expect(s.world!.entities.envelope.location).toBe("player");
  });
  it("rejects repeated and stale actions without state or clock changes", () => {
    const s = dispatch(createFixture(), {
      id: "take",
      target: "envelope",
    }).state;
    const repeated = dispatch(s, { id: "take", target: "envelope" });
    expect(repeated.ok).toBe(false);
    expect(repeated.state).toBe(s);
    const departed = structuredClone(s);
    advanceTime(departed, 1456 - departed.time);
    expect(targets(departed).some((t) => t.id === "inez")).toBe(false);
    expect(dispatch(departed, { id: "talk", target: "inez" }).state).toBe(
      departed,
    );
    expect(dispatch(departed, { id: "talk", target: "inez" }).ok).toBe(false);
  });
  it("does not expose hidden or destroyed targets or inventory", () => {
    const s = createFixture();
    s.world!.entities.envelope.visible = false;
    expect(targets(s).some((t) => t.id === "envelope")).toBe(false);
    expect(dispatch(s, { id: "take", target: "envelope" }).ok).toBe(false);
    s.world!.entities.ledge.destroyed = true;
    expect(targets(s).some((t) => t.id === "ledge")).toBe(false);
  });
  it("preserves private knowledge, memory and clock during a thought", () => {
    const s = createFixture();
    const n = dispatch(s, { id: "think" }).state;
    expect(n.npcs).toEqual(s.npcs);
    expect(n.time).toBe(s.time);
    expect(n.world!.subMinute).toBe(s.world!.subMinute);
    expect(n.world!.social).toEqual(s.world!.social);
    expect(n.world!.transcript.at(-1)!.passages.every((p) => !p.speaker)).toBe(
      true,
    );
  });
  it("lets the engine refuse open-envelope safekeeping", () => {
    let s = dispatch(createFixture(), { id: "take", target: "envelope" }).state;
    s = executeCommand(s, "open envelope").state;
    s = dispatch(s, { id: "ask-care", target: "inez" }).state;
    expect(agreementFor(s)).toBeUndefined();
    expect(s.world!.entities.envelope.location).toBe("player");
    expect(s.world!.social?.offer).toBeUndefined();
  });
});
describe("footprint navigation", () => {
  it("routes around the bench with continuous clearance for the player's radius", () => {
    const end = { x: 480, y: 180 };
    const path = findPath(spawn, end)!;
    expect(path.length).toBeGreaterThan(1);
    let previous = spawn;
    for (const p of path) {
      expect(clearSegment(previous, p)).toBe(true);
      previous = p;
    }
    expect(previous).toEqual(end);
  });
  it("rejects walls, furniture and a disconnected target", () => {
    expect(findPath(spawn, { x: 480, y: 325 })).toBeNull();
    expect(findPath(spawn, { x: 480, y: 50 })).toBeNull();
    expect(
      findPath(spawn, { x: 480, y: 180 }, [
        ...obstacles,
        { x: 80, y: 440, width: 800, height: 20 },
      ]),
    ).toBeNull();
    expect(walkable({ x: NaN, y: 200 })).toBe(false);
  });
  it("reaches every displayed target at its approach point", () => {
    for (const t of targets(createFixture()))
      expect(findPath(spawn, t.approach), t.id).not.toBeNull();
  });
});
