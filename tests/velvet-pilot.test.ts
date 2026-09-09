import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { velvetPilot, velvetState } from "../scripts/velvet-pilot-fixture";
import { deriveVisualState } from "../src/visuals/derive";
import {
  deriveVelvetPilot,
  hasPilotReflection,
  pilotProblems,
  velvetContacts,
} from "../src/visuals/velvet-pilot";
import { LocationVisual } from "../src/components/LocationVisual";
const descriptor = (...args: Parameters<typeof velvetState>) =>
  deriveVisualState(velvetState(...args).state);
const render = (d = descriptor(), p = velvetPilot) =>
  renderToStaticMarkup(
    createElement(LocationVisual, {
      descriptor: d,
      mode: "on",
      overlayPilot: p,
    }),
  );
describe("Velvet draft overlay pilot", () => {
  it("validates source bindings and every actual sprite/reflection hash", () => {
    expect(pilotProblems(velvetPilot)).toEqual([]);
    for (const a of Object.values(velvetPilot.assets))
      for (const file of [a, a.reflection])
        expect(
          createHash("sha256").update(readFileSync(file.file)).digest("hex"),
        ).toBe(file.sha256);
    expect(Object.keys(velvetContacts)).toContain("detail_bar_glass");
  });
  it("keeps one Mara identity across supported lighting and staging without mutating simulation", () => {
    const { state } = velvetState();
    const before = JSON.stringify(state);
    for (const lighting of ["amber", "low", "morning"] as const)
      for (const maraStaging of ["floor", "behind-counter"] as const) {
        const entities = deriveVelvetPilot(
          deriveVisualState(state, { lighting }),
          { ...velvetPilot, maraStaging },
        );
        const mara = entities.filter((e) => e.kind === "npc");
        expect(mara).toHaveLength(1);
        expect(mara[0].sprite).toBe(velvetPilot.assets.mara);
      }
    expect(JSON.stringify(state)).toBe(before);
  });
  it("uses actual schedules and occupancy for early, late and dawn", () => {
    for (const [band, named, anonymous] of [
      ["early", 1, 5],
      ["late", 0, 2],
      ["dawn", 0, 0],
    ] as const) {
      const es = deriveVelvetPilot(descriptor(band), velvetPilot);
      expect(es.filter((e) => e.kind === "npc")).toHaveLength(named);
      expect(es.filter((e) => e.kind === "anonymous")).toHaveLength(anonymous);
      expect(
        es
          .filter((e) => e.kind === "anonymous")
          .every((e) => e.spriteId !== "mara"),
      ).toBe(true);
    }
  });
  it("removes the envelope AND owned reflection after a real parser take", () => {
    const present = render(descriptor("early", "dropped"));
    expect(present).toContain('data-visual-entity="envelope"');
    expect(present).toContain('data-reflection-owner="envelope"');
    for (const custody of ["held", "retaken"] as const) {
      const absent = render(descriptor("early", custody));
      expect(absent).not.toContain('data-visual-entity="envelope"');
      expect(absent).not.toContain('data-reflection-owner="envelope"');
    }
  });
  it("uses the counter polygon only behind the bar and suppresses hidden-foot reflections", () => {
    const behind = deriveVelvetPilot(descriptor(), {
      ...velvetPilot,
      maraStaging: "behind-counter",
    }).find((e) => e.id === "mara")!;
    const front = deriveVelvetPilot(descriptor(), velvetPilot).find(
      (e) => e.id === "mara",
    )!;
    expect(front.contact.y).toBe(151 + 16);
    expect(hasPilotReflection(front)).toBe(true);
    expect(hasPilotReflection(behind)).toBe(false);
    expect(
      render(descriptor(), { ...velvetPilot, maraStaging: "behind-counter" }),
    ).toContain('data-occlusion="counter"');
    expect(
      hasPilotReflection({
        ...front,
        contact: { ...front.contact, surface: "raised" },
      }),
    ).toBe(false);
    const lamp = deriveVelvetPilot(descriptor(), velvetPilot).find(
      (e) => e.id === "detail_bar_light",
    )!;
    expect(hasPilotReflection(lamp)).toBe(false);
  });
  it("does not activate draft art by default, against another plate, or in Off mode", () => {
    const d = descriptor();
    expect(
      renderToStaticMarkup(
        createElement(LocationVisual, { descriptor: d, mode: "on" }),
      ),
    ).not.toContain("velvet-overlay-pilot");
    expect(
      render(d, { ...velvetPilot, plateSha256: "0".repeat(64) }),
    ).not.toContain("data-sprite-id");
    expect(
      renderToStaticMarkup(
        createElement(LocationVisual, {
          descriptor: d,
          mode: "off",
          overlayPilot: velvetPilot,
        }),
      ),
    ).not.toContain("<svg");
  });
  it("never leaves moved or damaged props at their original contact", () => {
    const d = descriptor();
    const moved = {
      ...d,
      canonicalObjects: d.canonicalObjects.map((o) =>
        o.id === "detail_bar_glass" ? { ...o, location: "counter" } : o,
      ),
    };
    expect(
      deriveVelvetPilot(moved, velvetPilot).some(
        (e) => e.id === "detail_bar_glass",
      ),
    ).toBe(false);
    const damaged = {
      ...d,
      canonicalObjects: d.canonicalObjects.map((o) => ({
        ...o,
        damaged: true,
      })),
    };
    expect(
      deriveVelvetPilot(damaged, velvetPilot).filter(
        (e) => e.kind === "object",
      ),
    ).toHaveLength(0);
  });
  it("does not switch a named identity when descriptor ordering changes", () => {
    const d = descriptor();
    const mara = d.npcPresence[0];
    const es = deriveVelvetPilot(
      {
        ...d,
        npcPresence: [{ ...mara, id: "celeste", name: "Celeste" }, mara],
      },
      velvetPilot,
    );
    expect(
      es.filter((e) => e.kind === "npc").map((e) => [e.id, e.spriteId]),
    ).toEqual([["mara", "mara"]]);
  });
});
