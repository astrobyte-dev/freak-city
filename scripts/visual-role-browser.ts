import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Isolated developer fixture: no asset registry or player save is changed.
const devURL = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5182/";
mkdirSync(".visuals/v2/browser", { recursive: true });
writeFileSync(
  ".visuals/role-test.html",
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visual role test fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="root"></main><script type="module" src="/.visuals/role-test.tsx"></script></body></html>',
);
writeFileSync(
  ".visuals/role-test.tsx",
  `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LocationVisual } from '../src/components/LocationVisual';
import { deriveVisualState } from '../src/visuals/derive';
import { generationDefinition } from '../src/content/visuals/generation';
import { visualManifests } from '../src/content/visuals/manifest';
import { ensureWorld } from '../src/engine/parser';
import { newGame } from '../src/engine/game';
import '../src/styles.css';
const root = createRoot(document.getElementById('root'));
const s = ensureWorld(newGame()); s.world.room = 'bar'; s.scene = 'floor';
const m = visualManifests.bar;
const plate = {role:'canonical-room',roomId:'bar',variant:'canonical',status:'canonical',file:'visuals/generated/test-room.webp',sha256:'isolated-fixture',width:512,height:358,authoritativeArchitecture:true,bakedEntities:generationDefinition('bar',s,'canonical-room').bakedEntities,composition:{anchors:{...m.anchors,detail_bar_light:{...m.anchors.detail_bar_light,x:201}},npcZones:m.npcZones,atmosphereZones:m.atmosphereZones,foregroundZones:m.foregroundZones},review:{by:'isolated test',at:'2026-09-08',worldFactsChecked:true,architectureChecked:true,compositionChecked:true,nonExplicit:true}};
const scene = {...plate,role:'scene-illustration',variant:'early',file:'visuals/generated/test-scene.webp',authoritativeArchitecture:false,authoritativeGeometry:false,bakedEntities:[],composition:undefined,illustration:{sceneId:'floor',caption:'An illustrated slow shift at Velvet',timeBands:['early','late','dawn'],requiredNPCs:[],themes:[]}};
window.visualRoleTest = (kind='base',mode='on',band='early') => {
  const registry = kind.startsWith('scene') ? [plate,{...scene,file:kind === 'scene-revisit'?'visuals/generated/test-revisit.webp':scene.file}] : [{...plate,file:kind === 'missing'?'visuals/generated/test-missing.webp':plate.file}];
  const d=deriveVisualState(s,{timeBand:band},registry);
  root.render(<div style={{maxWidth:640,margin:'0 auto'}}><LocationVisual descriptor={d} mode={mode}/></div>);
};
window.visualRoleTest();
`,
);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors: string[] = [];
const audits: { screen: string; violations: unknown[] }[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const image = readFileSync("screenshots/visuals/fixtures-bar.webp");
await page.route("**/visuals/generated/test-*.webp", (route) =>
  route.request().url().includes("missing")
    ? route.abort()
    : route.fulfill({ contentType: "image/webp", body: image }),
);
async function show(kind = "base", mode = "on", band = "early") {
  await page.evaluate(
    ([k, m, b]) =>
      (
        window as unknown as {
          visualRoleTest: (k: string, m: string, b: string) => void;
        }
      ).visualRoleTest(k, m, b),
    [kind, mode, band],
  );
}
async function audit(screen: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  audits.push({ screen, violations: result.violations });
}
try {
  await page.goto(new URL(".visuals/role-test.html", devURL).href);
  const visual = page.getByTestId("location-visual");
  await expect(visual).toHaveAttribute("data-asset-role", "canonical-room");
  await expect(
    page.locator('[data-layer="objects"] [data-visual-entity="counter"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-visual-entity="detail_bar_light"]'),
  ).toHaveAttribute("transform", "translate(201 19)");
  await expect(page.locator('[data-visual-npc="mara"]')).toBeVisible();
  await audit("canonical-desktop");
  const file = await visual.getAttribute("data-base");
  await show("base", "on", "dawn");
  await expect(visual).toHaveAttribute("data-base", file!);
  await expect(visual).toHaveClass(/lighting-morning/);
  await page.setViewportSize({ width: 390, height: 844 });
  await audit("canonical-mobile");
  await page.screenshot({
    path: ".visuals/v2/browser/canonical-mobile.png",
    fullPage: true,
  });
  const geometry = await page.locator(".visual-base").evaluate((img) => {
    const style = getComputedStyle(img);
    return {
      fit: style.objectFit,
      top: style.top,
      width: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.fit).toBe("contain");
  expect(geometry.top).toBe("0px");
  expect(geometry.width).toBeLessThanOrEqual(390);
  await show("scene", "on");
  await expect(visual).toHaveAttribute("data-asset-role", "scene-illustration");
  await expect(
    page.getByText(/An illustrated slow shift at Velvet/),
  ).toBeVisible();
  await expect(page.locator('[data-layer="objects"]')).toHaveCount(0);
  await expect(page.locator('[data-layer="npcs"]')).toHaveCount(0);
  await audit("scene-mobile");
  await expect(visual).toHaveAttribute("data-asset-role", "canonical-room", {
    timeout: 8000,
  });
  await show("scene", "on", "late");
  await expect(visual).toHaveAttribute("data-asset-role", "canonical-room"); // Does not replay every paragraph.
  await show("scene-revisit", "on");
  await expect(visual).toHaveAttribute("data-asset-role", "scene-illustration");
  await show("scene-revisit", "off");
  await expect(page.locator(".visual-viewport")).toHaveCount(0);
  await show("scene-revisit", "on");
  await expect(visual).toHaveAttribute("data-asset-role", "canonical-room"); // Interrupting the moment also consumes its presentation cue.
  await show("base", "off");
  await expect(page.locator(".visual-viewport")).toHaveCount(0);
  await audit("roles-off");
  await show("base", "reduced");
  await expect(visual).toHaveAttribute("data-paused", "true");
  expect(
    await page
      .locator(".visual-viewport")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await show("missing", "reduced");
  await expect(visual).toHaveAttribute("data-base", "procedural");
  await expect(
    page.locator('[data-layer="objects"] [data-visual-entity="counter"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-visual-entity="detail_bar_light"]'),
  ).toHaveAttribute("transform", "translate(167 19)");
  expect(errors).toEqual([]);
  expect(audits.flatMap((a) => a.violations)).toEqual([]);
  writeFileSync(
    ".visuals/v2/browser/results.json",
    JSON.stringify({ success: true, audits, errors }, null, 2),
  );
  console.log(
    `Visual role browser checks passed; ${audits.length} accessibility scans, canonical/mobile/illustration/return/Off/fallback.`,
  );
} finally {
  await browser.close();
}
