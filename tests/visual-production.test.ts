import { describe, expect, it } from "vitest";
import plan from "../tools/visual-gen/production-plan.json";
import { rooms, sceneRooms } from "../src/content/spaces";
import { generationDefinition } from "../src/content/visuals/generation";
import { ensureWorld } from "../src/engine/parser";
import { newGame } from "../src/engine/game";

describe("visual production scope", () => {
  it("plans every existing persistent room once with distinct production priority", () => {
    expect(plan.map((p) => p.room).sort()).toEqual(Object.keys(rooms).sort());
    expect(plan.map((p) => p.priority).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1),
    );
    expect(plan.filter((p) => p.tier === "A")).toHaveLength(7);
    expect(plan.filter((p) => p.tier === "B")).toHaveLength(5);
    expect(plan.filter((p) => p.tier === "C")).toHaveLength(5);
  });
  it("keeps scene and canonical presets distinct and binds the proof to an existing room", () => {
    const m = generationDefinition(
      "bar",
      ensureWorld(newGame()),
      "scene-illustration",
    );
    expect(m.generationPresets["scene-illustration"]).toMatchObject({
      colors: 64,
      contrast: 1.1,
    });
    expect(m.generationPresets["canonical-room"]).toMatchObject({
      pixelWidth: 320,
      displayWidth: 640,
      colors: 48,
    });
    expect(m.styleGuide.sceneModel).toContain("hot pink");
    expect(m.sceneIllustrationHints[0]).toContain("anonymous adult patrons");
    expect(sceneRooms.floor).toBe("bar");
  });
});
