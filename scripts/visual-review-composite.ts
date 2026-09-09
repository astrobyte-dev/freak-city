// Development-only review snapshots. No shipping registry or saved game is changed.
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, basename } from "node:path";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
const { values } = parseArgs({
  options: {
    batch: { type: "string" },
    output: { type: "string" },
    url: { type: "string" },
    composition: { type: "string" },
    minimal: { type: "boolean" },
  },
});
if (!values.batch || !values.output)
  throw new Error("--batch and --output are required");
const batch = resolve(values.batch),
  output = resolve(values.output),
  local = relative(resolve(".visuals"), batch);
if (local.startsWith("..") || local.includes(":"))
  throw new Error(
    "Review batch must be inside this repository's .visuals directory",
  );
const candidates = readdirSync(batch)
  .filter((p) => p.endsWith(".png"))
  .sort()
  .map((file) => ({
    file: relative(resolve("."), resolve(batch, file)).replaceAll("\\", "/"),
    metadata: JSON.parse(
      readFileSync(resolve(batch, file.replace(/\.png$/, ".json")), "utf8"),
    ),
  }));
if (
  !candidates.length ||
  candidates.some(
    (c) =>
      c.metadata.role !== "canonical-room" ||
      c.metadata.roomId !== "bar" ||
      c.metadata.reviewStatus !== "draft",
  )
)
  throw new Error(
    "This composite proof expects unapproved Velvet canonical-room drafts",
  );
const draftComposition = values.composition
  ? JSON.parse(readFileSync(resolve(values.composition), "utf8"))
  : null;
const registryBefore = readFileSync("src/content/visuals/assets.json");
const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
for (const c of candidates) {
  if (sha256(readFileSync(c.file)) !== c.metadata.sha256)
    throw new Error("Review candidate differs from its sidecar");
}
mkdirSync(output, { recursive: true });
writeFileSync(
  ".visuals/production-review-fixture.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Unapproved runtime composite study</title><main id="root"></main><script type="module" src="/.visuals/production-review-fixture.tsx"></script></html>',
);
writeFileSync(
  ".visuals/production-review-fixture.tsx",
  `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {LocationVisual} from '../src/components/LocationVisual';
import {deriveVisualState} from '../src/visuals/derive';
import {generationDefinition} from '../src/content/visuals/generation';
import {visualManifests} from '../src/content/visuals/manifest';
import {ensureWorld} from '../src/engine/parser'; import {newGame,advanceTime} from '../src/engine/game';
import '../src/styles.css';
const candidates=${JSON.stringify(candidates)};
const root=createRoot(document.getElementById('root'));
const m=visualManifests.bar;
// Draft placement study only. A human must align and approve the selected plate.
const composition=${JSON.stringify(draftComposition)} ?? {anchors:{...m.anchors,detail_bar_glass:{...m.anchors.detail_bar_glass,x:59,y:143},detail_bar_stool:{...m.anchors.detail_bar_stool,x:102,y:175},detail_bar_light:{...m.anchors.detail_bar_light,x:70,y:46},detail_bar_bin:{...m.anchors.detail_bar_bin,x:15,y:190}},npcZones:[{x:123,y:167},{x:188,y:184},{x:242,y:167},{x:273,y:196}],atmosphereZones:[{x:104,y:120,width:184,height:70}],foregroundZones:[{x:80,y:197,width:224,height:27}]};
window.productionReview=(index=0,band='early',mode='on')=>{
 const s=ensureWorld(newGame()); const at={early:1435,late:1600,dawn:1755};if (!(band in at)) throw new Error('Unknown review time band');advanceTime(s,at[band]-s.time);s.world.room='bar';s.scene='floor';
 const c=candidates[index];
 const testAsset={roomId:'bar',role:'canonical-room',variant:'canonical',status:'reviewed',file:c.file,sha256:c.metadata.sha256,width:c.metadata.dimensions.width,height:c.metadata.dimensions.height,authoritativeArchitecture:true,bakedEntities:generationDefinition('bar',s,'canonical-room').bakedEntities,composition,review:{by:'ISOLATED TEST BINDING - NOT APPROVAL',at:${JSON.stringify(new Date().toISOString().slice(0, 10))},worldFactsChecked:true,architectureChecked:true,compositionChecked:true,nonExplicit:true}};
 const d=deriveVisualState(s,{},[testAsset]);
 root.render(<section id="review-composite" data-candidate={index} data-band={band} style={{width:640,maxWidth:'100%',padding:12,background:'#14151c'}}><p>UNAPPROVED COMPOSITE STUDY / {index+1} / {band}</p><LocationVisual descriptor={d} mode={mode}/></section>);
 return {composition,npcs:d.npcPresence.map(n=>n.id),band,mode,time:s.time,lighting:d.lighting,crowd:d.crowdLevel,overlays:d.overlays,objects:d.canonicalObjects.map(o=>o.id),assetBound:d.baseArt?.file===c.file};
};
window.productionReference=(index=0)=>{
 const c=candidates[index];root.render(<section id="review-composite" data-candidate={index} data-band="reference" style={{width:664,maxWidth:'100%',padding:12,background:'#14151c'}}><p>UNAPPROVED PLATE-ONLY REFERENCE / NO SIMULATION STATE</p><img src={'/'+c.file} width="640" height="448" style={{maxWidth:'100%',height:'auto',imageRendering:'pixelated'}} alt="Empty plate reference; not a gameplay state"/></section>);
};window.productionReview();
`,
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 760, height: 900 },
    reducedMotion: "reduce",
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    new URL(
      "/.visuals/production-review-fixture.html",
      values.url ?? "http://127.0.0.1:5182",
    ).href,
  );
  await page.waitForFunction(
    () => typeof (window as any).productionReview === "function",
  );
  const records = [];
  for (let index = 0; index < candidates.length; index++) {
    for (const band of ["early", "late", "dawn"]) {
      const record = await page.evaluate(
        ({ i, b }) => (window as any).productionReview(i, b),
        { i: index, b: band },
      );
      await expect(page.locator("#review-composite")).toHaveAttribute(
        "data-candidate",
        String(index),
      );
      await expect(page.locator("#review-composite")).toHaveAttribute(
        "data-band",
        band,
      );
      expect(record.assetBound).toBe(true);
      await page.waitForFunction(() =>
        Array.from(document.images).every(
          (i) => i.complete && i.naturalWidth > 0,
        ),
      );
      expect(
        await page
          .locator("[data-layer=npcs] [data-visual-npc]")
          .evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("data-visual-npc")),
          ),
      ).toEqual(record.npcs);
      await page.locator("#review-composite").screenshot({
        path: resolve(
          output,
          `runtime-${String(index + 1).padStart(2, "0")}${band === "early" ? "" : `-${band}`}.png`,
        ),
      });
      records.push({ candidate: basename(candidates[index].file), ...record });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let index = 0; index < candidates.length; index++) {
    const mobile = await page.evaluate(
      (i) => (window as any).productionReview(i, "early"),
      index,
    );
    await expect(page.locator("#review-composite")).toHaveAttribute(
      "data-candidate",
      String(index),
    );
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
    );
    await expect(page.locator("#review-composite")).toHaveAttribute(
      "data-band",
      "early",
    );
    await page.locator("#review-composite").screenshot({
      path: resolve(
        output,
        `runtime-${String(index + 1).padStart(2, "0")}-mobile.png`,
      ),
    });
    records.push({
      candidate: basename(candidates[index].file),
      viewport: "mobile-390",
      ...mobile,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  if (!values.minimal) {
    await page.setViewportSize({ width: 760, height: 900 });
    for (let index = 0; index < candidates.length; index++) {
      await page.evaluate((i) => (window as any).productionReference(i), index);
      await expect(page.locator("#review-composite")).toHaveAttribute(
        "data-band",
        "reference",
      );
      await expect(page.locator("#review-composite")).toHaveAttribute(
        "data-candidate",
        String(index),
      );
      await page.waitForFunction(() =>
        Array.from(document.images).every(
          (i) => i.complete && i.naturalWidth > 0,
        ),
      );
      await page.locator("#review-composite").screenshot({
        path: resolve(
          output,
          `runtime-${String(index + 1).padStart(2, "0")}-reference.png`,
        ),
      });
    }
    await page.evaluate(() =>
      (window as any).productionReview(0, "early", "off"),
    );
    await expect(page.locator(".visual-off")).toBeVisible();
    await expect(
      page.locator("#review-composite img, #review-composite svg"),
    ).toHaveCount(0);
    await page.evaluate(() =>
      (window as any).productionReview(0, "early", "reduced"),
    );
    await expect(page.locator(".visual-reduced")).toBeVisible();
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
    );
  }
  if (errors.length) throw new Error(errors.join("\n"));
  expect(
    readFileSync("src/content/visuals/assets.json").equals(registryBefore),
  ).toBe(true);
  writeFileSync(
    resolve(output, "runtime-composite.json"),
    JSON.stringify(
      {
        status: "unapproved-test-bindings",
        registrySha256: sha256(registryBefore),
        records,
        displayChecks: values.minimal
          ? ["desktop early/late/dawn", "mobile early for every palette"]
          : [
              "desktop early/late/dawn",
              "mobile early for every palette",
              "plate-only reference",
              "Off",
              "Reduced",
            ],
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Rendered ${candidates.length} actual LocationVisual composites, late/dawn and mobile; no registry writes.`,
  );
} finally {
  await browser.close();
}
