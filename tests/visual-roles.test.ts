import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";
import { rooms } from "../src/content/spaces";
import { generationDefinition } from "../src/content/visuals/generation";
import {
  selectVisualAsset,
  visualManifests,
} from "../src/content/visuals/manifest";
import { deriveVisualState } from "../src/visuals/derive";
import { LocationVisual } from "../src/components/LocationVisual";
import { assetRoles, timeBands, type VisualAsset } from "../src/visuals/types";
import { approvedAsset } from "../src/visuals/asset-contract";
import { assetProblems } from "../scripts/visual-assets";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function state() {
  const s = ensureWorld(newGame());
  s.world!.room = "bar";
  s.scene = "floor";
  return s;
}
function canonical(): VisualAsset {
  const manifest = visualManifests.bar;
  return {
    role: "canonical-room",
    roomId: "bar",
    variant: "canonical",
    status: "canonical",
    file: "visuals/generated/bar-canonical-test.webp",
    width: 512,
    height: 358,
    sha256: "test",
    authoritativeArchitecture: true,
    bakedEntities: generationDefinition("bar", state(), "canonical-room")
      .bakedEntities,
    composition: {
      anchors: manifest.anchors,
      npcZones: manifest.npcZones,
      atmosphereZones: manifest.atmosphereZones,
      foregroundZones: manifest.foregroundZones,
    },
    review: {
      by: "test",
      at: "2026-09-08",
      worldFactsChecked: true,
      architectureChecked: true,
      compositionChecked: true,
      nonExplicit: true,
    },
  };
}
function illustration(): VisualAsset {
  return {
    ...canonical(),
    role: "scene-illustration",
    variant: "late",
    file: "visuals/generated/bar-scene-test.webp",
    authoritativeArchitecture: false,
    authoritativeGeometry: false,
    bakedEntities: [],
    composition: undefined,
    illustration: {
      sceneId: "floor",
      caption: "A slow shift at Velvet",
      timeBands: [...timeBands],
      requiredNPCs: ["mara"],
      themes: ["performance"],
    },
  };
}

describe("visual role authoring", () => {
  it.each(Object.keys(rooms))(
    "separates permanent and dynamic facts in %s",
    (room) => {
      const before = state();
      const saved = JSON.stringify(before);
      for (const role of assetRoles) {
        const job = generationDefinition(room, before, role);
        expect(job.role).toBe(role);
        expect(job.staticArchitecture.length).toBeGreaterThan(0);
        const fixed = job.bakedEntities.map((e) => e.id);
        expect(
          [...job.dynamicObjects, ...job.dynamicDoors].some((id) =>
            fixed.includes(id),
          ),
        ).toBe(false);
        const all = [...fixed, ...job.dynamicObjects, ...job.dynamicDoors];
        for (const e of job.canonicalEntities) expect(all).toContain(e.id);
        expect(job.generationPresets[role].displayWidth).toBeGreaterThanOrEqual(
          job.generationPresets[role].pixelWidth,
        );
      }
      expect(JSON.stringify(before)).toBe(saved);
    },
  );
  it("uses actual bar facts without the sample brief's booths", () => {
    const job = generationDefinition("bar", state(), "canonical-room");
    expect(JSON.stringify(job.staticArchitecture)).toContain("One staircase");
    expect(JSON.stringify(job.staticArchitecture)).toContain(
      "High street-facing window",
    );
    expect(JSON.stringify(job.fixedFurniture)).toContain("counter");
    expect(
      JSON.stringify([...job.staticArchitecture, ...job.fixedFurniture]),
    ).not.toContain("booth");
    expect(job.dynamicObjects).toContain("detail_bar_glass");
    expect(job.dynamicObjects).toContain("detail_bar_light");
  });
  it("rejects mutable fixed furniture and unknown roles", () => {
    const s = state();
    s.world!.entities.counter.portable = true;
    expect(() => generationDefinition("bar", s, "canonical-room")).toThrow(
      "Unsafe permanent",
    );
    expect(() =>
      generationDefinition("bar", state(), "unknown" as never),
    ).toThrow("Unknown asset role");
  });
});

describe("stable architecture and dynamic rendering", () => {
  it("build validation rejects false architecture, incomplete layouts, scene mismatches and invalid sizes", () => {
    const root = mkdtempSync(join(tmpdir(), "freak-role-validation-"));
    try {
      mkdirSync(join(root, "src/content/visuals"), { recursive: true });
      const invalid = {
        ...canonical(),
        width: 512,
        height: 512,
        bakedEntities: [],
        composition: { ...canonical().composition!, anchors: {} },
      };
      const scene = illustration();
      scene.illustration!.sceneId = "arrival";
      writeFileSync(
        join(root, "src/content/visuals/assets.json"),
        JSON.stringify([
          invalid,
          scene,
          { ...canonical(), role: "overlay", variant: "base" },
        ]),
      );
      const problems = assetProblems(root).join("\n");
      expect(problems).toContain("Baked architecture differs");
      expect(problems).toContain("dynamic composition anchors");
      expect(problems).toContain("authored scene illustration binding");
      expect(problems).toContain("10:7");
      expect(problems).toContain("Missing human review");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("keeps one reviewed canonical plate across every time band", () => {
    const plate = canonical();
    const texture: VisualAsset = {
      ...plate,
      role: "texture",
      variant: "dawn",
      authoritativeArchitecture: false,
      review: {
        by: "test",
        at: "2026-09-08",
        worldFactsChecked: true,
        backgroundOnly: true,
      },
    };
    for (const timeBand of timeBands) {
      const d = deriveVisualState(state(), { timeBand }, [texture, plate]);
      expect(d.baseArt).toEqual(plate);
      expect(d.timeBand).toBe(timeBand);
    }
    expect(
      selectVisualAsset("bar", "late", [{ ...plate, variant: "late" }]),
    ).toBeUndefined();
  });
  it.each(["hidden", "destroyed", "moved", "damaged", "closed", "carried"])(
    "falls back when baked architecture is %s",
    (change) => {
      const s = state();
      const e = s.world!.entities.counter;
      if (change === "hidden") e.visible = false;
      if (change === "destroyed") e.destroyed = true;
      if (change === "moved") e.location = "kitchen";
      if (change === "damaged") e.properties.damaged = true;
      if (change === "closed") e.open = false;
      if (change === "carried") {
        e.location = "inventory";
        s.inventory.push(e.id);
      }
      expect(deriveVisualState(s, {}, [canonical()]).baseArt).toBeUndefined();
    },
  );
  it("requires role-specific approval and never uses scenes or overlays as canonical bases", () => {
    expect(approvedAsset(canonical())).toBe(true);
    expect(
      approvedAsset({ ...canonical(), authoritativeArchitecture: false }),
    ).toBe(false);
    expect(approvedAsset({ ...canonical(), composition: undefined })).toBe(
      false,
    );
    expect(approvedAsset({ ...canonical(), role: "overlay" })).toBe(false);
    expect(selectVisualAsset("bar", "late", [illustration()])).toBeUndefined();
  });
  it("keeps dynamic props and NPCs while suppressing duplicate baked sprites", () => {
    const d = deriveVisualState(state(), {}, [canonical()]);
    const html = renderToStaticMarkup(
      createElement(LocationVisual, { descriptor: d, mode: "reduced" }),
    );
    expect(html).not.toContain('data-visual-entity="counter"');
    expect(html).not.toContain('data-visual-entity="detail_bar_window"');
    expect(html).toContain('data-visual-entity="detail_bar_glass"');
    expect(html).toContain('data-visual-npc="mara"');
    expect(html).toContain("bar counter"); // Accessible object list remains complete.
  });
  it("binds illustrations to authored scenes, boundaries and actual NPC presence", () => {
    const s = state(),
      scene = illustration();
    s.boundaries.performance = "allowed";
    expect(deriveVisualState(s, {}, [scene]).sceneArt).toEqual(scene);
    s.boundaries.performance = "implied";
    expect(deriveVisualState(s, {}, [scene]).sceneArt).toBeUndefined();
    s.boundaries.performance = "allowed";
    s.npcs.mara.location = "off-duty";
    expect(deriveVisualState(s, {}, [scene]).sceneArt).toBeUndefined();
    s.npcs.mara.location = "bar";
    s.scene = "arrival";
    expect(deriveVisualState(s, {}, [scene]).sceneArt).toBeUndefined();
  });
  it("illustrations have captioned cinematic presentation without misplaced object sprites", () => {
    const s = state();
    s.boundaries.performance = "allowed";
    const d = deriveVisualState(s, {}, [canonical(), illustration()]);
    const html = renderToStaticMarkup(
      createElement(LocationVisual, { descriptor: d, mode: "reduced" }),
    );
    expect(html).toContain("A slow shift at Velvet");
    expect(html).toContain("Illustrated moment");
    expect(html).not.toContain('data-layer="objects"');
    expect(html).not.toContain('data-layer="npcs"');
    const off = renderToStaticMarkup(
      createElement(LocationVisual, { descriptor: d, mode: "off" }),
    );
    expect(off).not.toContain("<img");
    expect(off).toContain("bar counter");
  });
});
