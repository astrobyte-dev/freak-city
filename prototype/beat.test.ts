import { describe, expect, it } from "vitest";
import { validateSave } from "../src/engine/game";
import { executeAliasIntroduction, executeCommand } from "../src/engine/parser";
import { agreementFor } from "../src/engine/commitments";
import {
  availableActions,
  commandFor,
  createFixture,
  dispatch,
  inventory,
  objective,
  targets,
  type Action,
} from "./simulation";
import { hitTarget } from "./targeting";

describe("bounded investigative beat", () => {
  it("answers, reads, discloses and follows up entirely through transactions", () => {
    let s = createFixture();
    const sequence: Action[] = [
      { id: "talk", target: "inez" },
      { id: "alias", target: "inez", alias: "Night Finch" },
      { id: "talk", target: "inez" },
      { id: "take", target: "envelope" },
      { id: "open", target: "envelope" },
      { id: "read", target: "invitation" },
      { id: "show-invitation", target: "inez" },
      { id: "ask-sender", target: "inez" },
    ];
    for (const a of sequence) {
      const prior = structuredClone(s);
      const r = dispatch(s, a);
      expect(r.ok, a.id + ": " + r.lines.join(" ")).toBe(true);
      const engine =
        a.id === "alias"
          ? executeAliasIntroduction(s, a.alias)
          : executeCommand(s, commandFor(a));
      expect(r.state).toEqual(engine.state);
      expect(s).toEqual(prior);
      expect(validateSave(r.state)).toEqual(r.state);
      s = r.state;
    }
    expect(s.canon.player).toContain("header");
    expect(s.canon.player).not.toContain("sender");
    expect(s.canon.player).not.toContain("signature");
    expect(s.npcs.inez.memories["show:invitation"]).toBeTruthy();
    expect(s.world!.entities.invitation.location).toBe("envelope");
    expect(s.world!.entities.envelope.location).toBe("player");
    expect(objective(s)).toContain("check the routing record");
    expect(s.world!.room).toBe("vestibule");
  });
  it("does not reveal nested evidence through a closed, hidden or destroyed envelope", () => {
    let s = createFixture();
    expect(availableActions(s, "invitation")).toEqual([]);
    expect(dispatch(s, { id: "read", target: "invitation" }).ok).toBe(false);
    s = dispatch(s, { id: "open", target: "envelope" }).state;
    expect(availableActions(s, "invitation")).toContain("read");
    s = dispatch(s, { id: "close", target: "envelope" }).state;
    expect(availableActions(s, "invitation")).toEqual([]);
    s.world!.entities.envelope.destroyed = true;
    expect(availableActions(s, "envelope")).toEqual([]);
  });
  it("gates showing on introduction, reading, visibility, possession and presence", () => {
    let s = dispatch(createFixture(), { id: "talk", target: "inez" }).state;
    s = dispatch(s, { id: "alias", target: "inez", alias: "Alex" }).state;
    s = dispatch(s, { id: "open", target: "envelope" }).state;
    expect(availableActions(s, "inez")).not.toContain("show-invitation");
    s = dispatch(s, { id: "read", target: "invitation" }).state;
    expect(availableActions(s, "inez")).not.toContain("show-invitation");
    s = dispatch(s, { id: "take", target: "envelope" }).state;
    expect(availableActions(s, "inez")).toContain("show-invitation");
    s = dispatch(s, { id: "close", target: "envelope" }).state;
    expect(availableActions(s, "inez")).not.toContain("show-invitation");
    expect(inventory(s).some((e) => e.id === "invitation")).toBe(false);
    s = dispatch(s, { id: "open", target: "envelope" }).state;
    s = executeCommand(s, "wait 30 minutes").state;
    expect(
      dispatch(s, { id: "show-invitation", target: "invitation" }).ok,
    ).toBe(false);
  });
  it("keeps approved private reflection untimed and out of NPC knowledge", () => {
    let s = dispatch(createFixture(), { id: "open", target: "envelope" }).state;
    s = dispatch(s, { id: "read", target: "invitation" }).state;
    const r = dispatch(s, { id: "think" });
    expect(r.lines.join(" ")).toContain("23:41");
    expect(r.state.npcs).toEqual(s.npcs);
    expect(r.state.world!.social).toEqual(s.world!.social);
    expect(r.state.time).toBe(s.time);
    expect(r.spokenLines).toEqual([]);
    expect(r.state.canon).toEqual(s.canon);
  });
  it("preserves the safekeeping refusal for open envelopes, then accepts a closed one", () => {
    let s = dispatch(createFixture(), { id: "take", target: "envelope" }).state;
    s = dispatch(s, { id: "open", target: "envelope" }).state;
    s = dispatch(s, { id: "ask-care", target: "inez" }).state;
    expect(s.world!.social?.offer).toBeUndefined();
    expect(agreementFor(s)).toBeUndefined();
    s = dispatch(s, { id: "close", target: "envelope" }).state;
    s = dispatch(s, { id: "ask-care", target: "inez" }).state;
    s = dispatch(s, { id: "accept-care", target: "inez" }).state;
    expect(agreementFor(s)?.status).toBe("active");
    s = dispatch(s, { id: "take", target: "envelope" }).state;
    expect(agreementFor(s)?.status).toBe("fulfilled");
  });
  it("rejects a stale alias and premature sender question", () => {
    const s = createFixture();
    expect(dispatch(s, { id: "alias", target: "inez", alias: "Alex" }).ok).toBe(
      false,
    );
    expect(dispatch(s, { id: "ask-sender", target: "inez" }).ok).toBe(false);
    expect(s.alias).toBe("Stranger");
  });
});
describe("visible target shapes", () => {
  it.each([
    [790, 330, "inez"],
    [777, 344, "inez"],
    [800, 379, "inez"],
    [341, 286, "bench"],
    [619, 374, "bench"],
    [181, 221, "heater"],
    [244, 309, "heater"],
    [91, 151, "notice"],
    [818, 211, "ledge"],
    [775, 225, "envelope"],
  ] as const)("selects visible shape at %s,%s", (x, y, id) => {
    expect(hitTarget(targets(createFixture()), { x, y })?.id).toBe(id);
  });
  it("leaves clear floor walkable and respects absent targets", () => {
    expect(
      hitTarget(targets(createFixture()), { x: 480, y: 540 }),
    ).toBeUndefined();
    expect(hitTarget([], { x: 790, y: 330 })).toBeUndefined();
  });
});
