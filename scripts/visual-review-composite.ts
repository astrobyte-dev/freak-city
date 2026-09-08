// Development-only review snapshots. No shipping registry or saved game is changed.
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, basename } from "node:path";
import { parseArgs } from "node:util";
const { values } = parseArgs({
  options: {
    batch: { type: "string" },
    output: { type: "string" },
    url: { type: "string" },
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
  .map((file) => ({
    file: relative(resolve("."), resolve(batch, file)).replaceAll("\\", "/"),
    metadata: JSON.parse(
      readFileSync(resolve(batch, file.replace(/\.png$/, ".json")), "utf8"),
    ),
  }));
if (
  !candidates.length ||
  candidates.some((c) => c.metadata.role !== "canonical-room")
)
  throw new Error("This composite proof expects canonical-room drafts");
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
const composition={anchors:{...m.anchors,detail_bar_glass:{...m.anchors.detail_bar_glass,x:59,y:143},detail_bar_stool:{...m.anchors.detail_bar_stool,x:102,y:175},detail_bar_light:{...m.anchors.detail_bar_light,x:70,y:46},detail_bar_bin:{...m.anchors.detail_bar_bin,x:15,y:190}},npcZones:[{x:123,y:167},{x:188,y:184},{x:242,y:167},{x:273,y:196}],atmosphereZones:[{x:104,y:120,width:184,height:70}],foregroundZones:[{x:80,y:197,width:224,height:27}]};
window.productionReview=(index=0,band='early',mode='on')=>{
 const s=ensureWorld(newGame()); const at={early:1435,late:1600,dawn:1755};advanceTime(s,at[band]-s.time);s.world.room='bar';s.scene='floor';
 const c=candidates[index];
 const testAsset={roomId:'bar',role:'canonical-room',variant:'canonical',status:'reviewed',file:c.file,sha256:c.metadata.sha256,width:c.metadata.dimensions.width,height:c.metadata.dimensions.height,authoritativeArchitecture:true,bakedEntities:generationDefinition('bar',s,'canonical-room').bakedEntities,composition,review:{by:'ISOLATED TEST BINDING - NOT APPROVAL',at:'2026-09-08',worldFactsChecked:true,architectureChecked:true,compositionChecked:true,nonExplicit:true}};
 const d=deriveVisualState(s,{},[testAsset]);
 root.render(<section id="review-composite" data-candidate={index} data-band={band} style={{width:640,maxWidth:'100%',padding:12,background:'#14151c'}}><p>UNAPPROVED COMPOSITE STUDY / {index+1} / {band}</p><LocationVisual descriptor={d} mode={mode}/></section>);
 return {composition,npcs:d.npcPresence.map(n=>n.id),band,mode};
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
    const record = await page.evaluate(
      (i) => (window as any).productionReview(i),
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
    await page.locator("#review-composite").screenshot({
      path: resolve(
        output,
        `runtime-${String(index + 1).padStart(2, "0")}.png`,
      ),
    });
    records.push({ candidate: basename(candidates[index].file), ...record });
  }
  for (const band of ["late", "dawn"]) {
    await page.evaluate((b) => (window as any).productionReview(0, b), band);
    await expect(page.locator("#review-composite")).toHaveAttribute(
      "data-band",
      band,
    );
    await page
      .locator("#review-composite")
      .screenshot({ path: resolve(output, `runtime-01-${band}.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("#review-composite")
    .screenshot({ path: resolve(output, "runtime-01-mobile.png") });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (errors.length) throw new Error(errors.join("\n"));
  writeFileSync(
    resolve(output, "runtime-composite.json"),
    JSON.stringify(
      { status: "unapproved-test-bindings", records, errors },
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
