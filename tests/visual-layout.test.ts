import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";
import { generationDefinition } from "../src/content/visuals/generation";

const definition = () =>
  generationDefinition("bar", ensureWorld(newGame()), "canonical-room");

describe("Velvet geometry reference", () => {
  it("keeps the checked-in reference aligned with the actual parser and permanent manifest", () => {
    const m = definition();
    const bundle = JSON.parse(
      readFileSync("docs/visuals/velvet-bar-layout/layout.json", "utf8"),
    );
    for (const [key, value] of Object.entries(bundle.worldFacts))
      expect(m[key as keyof typeof m]).toEqual(value);
    expect(bundle.blueprint).toEqual(m.layoutBlueprint);
    expect(m.layoutBlueprint!.routes.map((r) => r.to).sort()).toEqual(
      m.exits.map((e) => e.to).sort(),
    );
  });

  it("covers all permanent facts and fixed entities, with one staircase beside the salon", () => {
    const m = definition();
    const elements = m.layoutBlueprint!.elements;
    expect(elements.filter((e) => e.kind === "staircase")).toHaveLength(1);
    expect(elements.find((e) => e.kind === "staircase")).toMatchObject({
      route: "landing",
      beside: "salon",
    });
    const facts = ["staticArchitecture", "fixedFurniture"] as const;
    expect([...new Set(elements.flatMap((e) => e.facts))].sort()).toEqual(
      facts.flatMap((k) => m[k].map((_, i) => `${k}:${i}`)).sort(),
    );
    expect(
      elements.flatMap((e) => (e.entityId ? [e.entityId] : [])).sort(),
    ).toEqual(m.bakedEntities.map((e) => e.id).sort());
    for (const e of elements)
      if (e.entityId)
        expect([...m.dynamicObjects, ...m.dynamicDoors]).not.toContain(
          e.entityId,
        );
    expect(m.layoutBlueprint!.reservations).toHaveLength(3);
  });

  it("copies the art blueprint without mutating world or subsequent jobs", () => {
    const state = ensureWorld(newGame());
    const before = structuredClone(state);
    const a = generationDefinition("bar", state, "canonical-room");
    a.layoutBlueprint!.elements[0].box[0] = 999;
    expect(state).toEqual(before);
    expect(definition().layoutBlueprint!.elements[0].box[0]).toBe(132);
    expect(generationDefinition("kitchen", state).layoutBlueprint).toBeNull();
  });

  it("prefers an exact two-times canonical display while preserving other roles", () => {
    const presets = definition().generationPresets;
    expect(presets["canonical-room"]).toMatchObject({
      pixelWidth: 320,
      displayWidth: 640,
    });
    expect(presets.texture.displayWidth).toBe(320);
    expect(presets["scene-illustration"].displayWidth).toBe(512);
  });
});
