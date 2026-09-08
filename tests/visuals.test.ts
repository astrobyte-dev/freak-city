import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  newGame,
  advanceTime,
  updateBoundary,
  validateSave,
} from "../src/engine/game";
import {
  ensureWorld,
  executeCommand,
  isCarried,
  isVisible,
  presentNPCs,
} from "../src/engine/parser";
import { rooms } from "../src/content/spaces";
import { deriveVisualState, timeBandAt } from "../src/visuals/derive";
import {
  selectVisualAsset,
  visualManifests,
} from "../src/content/visuals/manifest";
import { generationDefinition } from "../src/content/visuals/generation";
import { LocationVisual } from "../src/components/LocationVisual";
import { assetProblems } from "../scripts/visual-assets";
import type { VisualAsset } from "../src/visuals/types";
const at = (room = "street") => {
  const s = ensureWorld(newGame("NIGHT-0"));
  s.world!.room = room;
  return s;
};
const ids = (s: ReturnType<typeof at>) =>
  deriveVisualState(s).canonicalObjects.map((e) => e.id);
describe("visual state is a view of the parser world", () => {
  it.each(Object.keys(rooms))(
    "%s has a manifest and only parser-resolvable visible entities",
    (room) => {
      const s = at(room);
      const before = JSON.stringify(s);
      const d = deriveVisualState(s);
      expect(d.manifest.roomId).toBe(room);
      expect(ids(s).sort()).toEqual(
        Object.values(s.world!.entities)
          .filter(
            (e) =>
              isVisible(s, e.id) &&
              !isCarried(s, e.id) &&
              !e.properties.onPerson,
          )
          .map((e) => e.id)
          .sort(),
      );
      for (const object of d.canonicalObjects) {
        expect(object.aliases.length).toBeGreaterThan(0);
        const resolves = object.aliases.some((alias) => {
          const result = executeCommand(s, `examine ${alias}`);
          return result.ok && result.state.world!.lastObject === object.id;
        });
        expect(
          resolves,
          `${room}: ${object.id} must have an unambiguous ordinary alias`,
        ).toBe(true);
      }
      expect(JSON.stringify(s)).toBe(before);
      for (const id of Object.keys(d.manifest.anchors))
        expect(s.world!.entities[id]).toBeDefined();
    },
  );
  it.each([
    [1439, "early"],
    [1440, "night"],
    [1559, "night"],
    [1560, "late"],
    [1679, "late"],
    [1680, "closing"],
    [1739, "closing"],
    [1740, "dawn"],
    [1860, "day"],
    [2879, "early"],
  ] as const)("clock minute %i gives %s", (minute, band) =>
    expect(timeBandAt(minute)).toBe(band),
  );
  it("follows scheduled departures and returns rather than guessing from the time", () => {
    const s = at("bar");
    expect(deriveVisualState(s).npcPresence.map((n) => n.id)).toEqual(["mara"]);
    advanceTime(s, 18);
    expect(deriveVisualState(s).npcPresence).toEqual([]);
    advanceTime(s, 12);
    expect(deriveVisualState(s).npcPresence.map((n) => n.id)).toEqual(
      presentNPCs(s),
    );
    s.npcs.luca.location = "bar";
    expect(deriveVisualState(s).npcPresence.map((n) => n.id)).toContain("luca");
    s.npcs.luca.location = "off-duty";
    expect(deriveVisualState(s).npcPresence.map((n) => n.id)).not.toContain(
      "luca",
    );
  });
  it("does not show contents of closed, hidden, destroyed or cyclic parents", () => {
    let s = at("office");
    expect(ids(s)).not.toContain("receipt");
    s = executeCommand(s, "open top drawer").state;
    expect(ids(s)).toContain("receipt");
    s.world!.entities.desk.visible = false;
    expect(ids(s)).not.toContain("receipt");
    s.world!.entities.desk.visible = true;
    s.world!.entities.top_drawer.destroyed = true;
    expect(ids(s)).not.toContain("receipt");
    s.world!.entities.top_drawer.destroyed = false;
    s.world!.entities.desk.location = "receipt";
    expect(ids(s)).not.toContain("receipt");
  });
  it("updates both sides of a canonical door after parser actions", () => {
    let s = at();
    expect(deriveVisualState(s).openedState.side_door).toBe(true);
    s = executeCommand(s, "close side door").state;
    expect(
      deriveVisualState(s).doors.find((e) => e.id === "side_door")?.open,
    ).toBe(false);
    s.world!.room = "vestibule";
    expect(deriveVisualState(s).openedState.side_door).toBe(false);
    s = executeCommand(s, "open side door").state;
    expect(deriveVisualState(s).openedState.side_door).toBe(true);
  });
  it("removes carried, moved, hidden and destroyed objects from their original anchors", () => {
    let s = at("taxi");
    expect(ids(s)).toContain("envelope");
    s = executeCommand(s, "take envelope").state;
    expect(ids(s)).not.toContain("envelope");
    s = executeCommand(s, "drop envelope").state;
    expect(ids(s)).toContain("envelope");
    const b = at("bar");
    b.world!.entities.detail_bar_glass.location = "counter";
    expect(
      deriveVisualState(b).canonicalObjects.find(
        (e) => e.id === "detail_bar_glass",
      )?.anchor,
    ).toBeUndefined();
    b.world!.entities.detail_bar_glass.destroyed = true;
    expect(ids(b)).not.toContain("detail_bar_glass");
    b.world!.entities.counter.visible = false;
    expect(ids(b)).not.toContain("counter");
  });
  it("never restores torn evidence and roundtrips through the existing save format", () => {
    let s = at("office");
    s.world!.entities.photo.location = "office";
    s.world!.entities.photo.visible = true;
    expect(ids(s)).toContain("photo");
    s = executeCommand(s, "take photo").state;
    const result = executeCommand(s, "tear photo");
    expect(result.ok).toBe(true);
    s = result.state;
    expect(s.world!.entities.photo.destroyed).toBe(true);
    expect(ids(s)).not.toContain("photo");
    expect(
      deriveVisualState(validateSave(JSON.parse(JSON.stringify(s)))),
    ).toEqual(deriveVisualState(s));
  });
  it("art previews cannot change canonical objects, NPCs, boundaries or saves", () => {
    const s = at("bar"),
      before = JSON.stringify(s),
      actual = deriveVisualState(s);
    const preview = deriveVisualState(s, {
      timeBand: "dawn",
      weather: "dry",
      lighting: "cold",
      visualVariant: "base",
      overlay: "none",
    });
    expect(preview.canonicalObjects).toEqual(actual.canonicalObjects);
    expect(preview.npcPresence).toEqual(actual.npcPresence);
    expect(preview.overlays).toEqual([]);
    expect(JSON.stringify(s)).toBe(before);
    const bounded = updateBoundary(s, "surveillance", "skip");
    expect(deriveVisualState(bounded).canonicalObjects).toEqual(
      actual.canonicalObjects,
    );
  });
  it("does not invent a weather change or physical cleaning actions from a lighting band", () => {
    const s = at("bar");
    const early = deriveVisualState(s);
    advanceTime(s, 330);
    const dawn = deriveVisualState(s);
    expect(dawn.timeBand).toBe("dawn");
    expect(dawn.weather).toBe("rain");
    expect(dawn.crowdLevel).toBe("quiet");
    expect(dawn.specialEventState).toContain("towel");
    expect(dawn.canonicalObjects.map((e) => e.id)).toEqual(
      early.canonicalObjects.map((e) => e.id),
    );
  });
  it("supports missing art, reduced and off while retaining text context", () => {
    const descriptor = deriveVisualState(at());
    const off = renderToStaticMarkup(
      createElement(LocationVisual, { descriptor, mode: "off" }),
    );
    expect(off).not.toContain("<svg");
    expect(off).not.toContain("<img");
    expect(off).toContain("side door");
    const reduced = renderToStaticMarkup(
      createElement(LocationVisual, { descriptor, mode: "reduced" }),
    );
    expect(reduced).toContain('data-base="procedural"');
    expect(reduced).not.toContain('class="pixel-rain"');
    expect(reduced).toContain('data-paused="true"');
  });
});
describe("development-side asset contract", () => {
  it.each(Object.keys(rooms))("prepares grounded facts for %s", (room) => {
    const job = generationDefinition(room, at());
    expect(job.exits).toEqual(rooms[room].exits);
    expect(job.requiredVisualFacts.length).toBeGreaterThan(0);
    expect(job.forbiddenVisualFacts.join(" ")).toContain("baked into");
    expect(job.output.initialStatus).toBe("draft");
    expect(visualManifests[room]).toBeDefined();
  });
  it("falls back to approved base and never selects draft images", () => {
    const draft: VisualAsset = {
      roomId: "bar",
      variant: "dawn",
      status: "draft",
      file: "visuals/generated/draft.webp",
      sha256: "",
      width: 640,
      height: 448,
    };
    expect(selectVisualAsset("bar", "dawn", [draft])).toBeUndefined();
    const base = {
      ...draft,
      variant: "base",
      status: "reviewed" as const,
      review: {
        by: "reviewer",
        at: "2026-09-08",
        backgroundOnly: true as const,
        worldFactsChecked: true as const,
      },
    };
    expect(selectVisualAsset("bar", "dawn", [draft, base])).toEqual(base);
    expect(selectVisualAsset("street", "dawn", [base])).toBeUndefined();
  });
  it("blocks draft files, traversal, missing reviews and missing assets at build time", () => {
    const root = mkdtempSync(join(tmpdir(), "freak-visuals-"));
    try {
      mkdirSync(join(root, "src/content/visuals"), { recursive: true });
      mkdirSync(join(root, "public/visuals/generated"), { recursive: true });
      writeFileSync(
        join(root, "src/content/visuals/assets.json"),
        JSON.stringify([
          { file: "../secret.webp" },
          {
            file: "visuals/generated/a.webp",
            status: "draft",
            roomId: "bar",
            variant: "base",
            width: 640,
            height: 448,
          },
        ]),
      );
      writeFileSync(
        join(root, "public/visuals/generated/unreviewed.webp"),
        "draft",
      );
      const problems = assetProblems(root).join("\n");
      expect(problems).toContain("Unsafe");
      expect(problems).toContain("Unreviewed");
      expect(problems).toContain("Missing human review");
      expect(problems).toContain("Missing asset");
      expect(problems).toContain("Unregistered");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("room-local loading", () => {
  it("selects at most one reviewed adjacent plate", async () => {
    const { neighbourAssets } = await import("../src/visuals/preload");
    const base: VisualAsset = {
      roomId: "vestibule",
      variant: "base",
      status: "canonical",
      file: "visuals/generated/vestibule.webp",
      width: 640,
      height: 448,
      sha256: "fixture",
      review: {
        by: "test",
        at: "2026-09-08",
        backgroundOnly: true,
        worldFactsChecked: true,
      },
    };
    expect(
      neighbourAssets("street", "late", [base, { ...base, roomId: "kiosk" }]),
    ).toEqual([base]);
    expect(
      neighbourAssets("bar", "late", [{ ...base, roomId: "motel" }]),
    ).toEqual([]);
    expect(
      neighbourAssets("street", "late", [{ ...base, status: "draft" }]),
    ).toEqual([]);
  });
});
