import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { deriveVisualState } from "../src/visuals/derive";
import overlay from "../src/content/visuals/street-overlay.json";
import approval from "../docs/visuals/street-activation/human-approval.json";
const digest = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
describe("approved street artwork", () => {
  it("binds shipping layers to the exact reviewed masters and explicit owner approval", () => {
    expect(approval.status).toBe("approved-for-feature-activation");
    expect(approval.envelopeReadability).toBe(
      "accepted; further polish deferred",
    );
    for (const [file, sha] of Object.entries(approval.reviewedFiles))
      expect(digest(file), file).toBe(sha);
    for (const [id, asset] of Object.entries(overlay.layers)) {
      expect(digest(`public/${asset.file}`), id).toBe(asset.sha256);
      expect(asset.sha256).toBe(
        digest(
          `docs/visuals/reviewed-sources/street/draft-v2-polish/layers/${id}.png`,
        ),
      );
    }
    expect(overlay.layers.envelope.sha256).toBe(
      digest("public/visuals/velvet-overlay/sprites/envelope.png"),
    );
  });
  it("keeps permanent scenery in the plate and mutable owners in the simulation", () => {
    let s = ensureWorld(newGame("NIGHT-0"));
    for (const text of ["take envelope", "go outside"])
      s = executeCommand(s, text).state;
    const open = deriveVisualState(s);
    expect(open.baseArt?.sha256).toBe(overlay.plateSha256);
    expect(open.baseArt?.bakedEntities?.map((e) => e.id).sort()).toEqual([
      "detail_street_awning",
      "detail_street_wall",
      "detail_street_window",
    ]);
    s = executeCommand(s, "drop envelope").state;
    expect(
      deriveVisualState(s).canonicalObjects.some(
        (e) => e.id === "envelope" && e.location === "street",
      ),
    ).toBe(true);
    s = executeCommand(s, "take envelope").state;
    expect(
      deriveVisualState(s).canonicalObjects.some((e) => e.id === "envelope"),
    ).toBe(false);
    s.world!.entities.detail_street_window.properties.damaged = true;
    expect(deriveVisualState(s).baseArt).toBeUndefined();
  });
});
