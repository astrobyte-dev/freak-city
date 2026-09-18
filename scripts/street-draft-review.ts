// Headless-only draft review. Never navigates a user's browser or writes shipping art.
import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { SAVE_KEY } from "../src/engine/save";

const root = "docs/visuals/reviewed-sources/street/draft-v1";
const output = resolve(root, "review");
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
mkdirSync(output, { recursive: true });
mkdirSync(".visuals", { recursive: true });
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
const protectedFiles = [
  "src/content/visuals/assets.json",
  "src/content/visuals/velvet-overlay.json",
  "src/content/spaces.ts",
  "src/engine/parser.ts",
];
const protectedHashes = Object.fromEntries(
  protectedFiles.map((f) => [f, hash(readFileSync(f))]),
);
writeFileSync(
  ".visuals/street-draft.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Street draft / unactivated review</title><main id="root"></main><script type="module" src="/.visuals/street-draft.tsx"></script></html>',
);
writeFileSync(
  ".visuals/street-draft.tsx",
  `
import React from 'react';import {createRoot} from 'react-dom/client';
import {StreetDraftVisual} from '../scripts/street-draft-component';
import {deriveVisualState} from '../src/visuals/derive';import '../src/styles.css';
const root=createRoot(document.getElementById('root'));
window.streetReview=(state,label,mode='on',width=640)=>{
 const d=deriveVisualState(state);
 root.render(<section id="draft-capture" data-label={label} style={{width,maxWidth:'100%',margin:'0 auto'}}>
 <style>{'body{margin:0;padding:18px;background:#110e17;color:#d8c2cf}*{box-sizing:border-box}.location-visual{margin:0;width:100%;border:0}.visual-viewport{animation:none}.visual-light{transition:none}h1{font:15px monospace;margin:0 0 14px}.state-note{font:12px monospace;line-height:1.6;margin:12px 0}.route-note{font:12px monospace;line-height:1.6;color:#b4a2b1}'}</style>
 <h1>STREET / DRAFT / {label}</h1><StreetDraftVisual descriptor={d} mode={mode}/>
 <p className="state-note">{state.world.entities.side_door.open?'Side door open':state.world.entities.side_door.locked?'Side door closed and locked':'Side door closed, unlocked'} · {d.lighting} · {d.weather}</p>
 <p className="route-note">Off-camera routes remain: front entrance → bar; behind → loading bay; across road → kiosk; west → home.</p>
 </section>);
 return {room:d.roomId,npcs:d.npcPresence.map(n=>n.id),crowd:d.crowdLevel,time:state.time,lighting:d.lighting,weather:d.weather,envelopeLocation:state.world.entities.envelope.location,door:{open:state.world.entities.side_door.open,locked:state.world.entities.side_door.locked}};
};`,
);

const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const failures: string[] = [];
const records: any[] = [];
const layerFiles: string[] = [];
const deliberateFailures: string[] = [];
try {
  // Render editable SVG masters into transparent native-grid PNGs without a window.
  const raster = await browser.newPage({
    viewport: { width: 320, height: 224 },
  });
  for (const file of readdirSync(`${root}/layers`).filter((f) =>
    f.endsWith(".svg"),
  )) {
    await raster.setContent(
      `<style>html,body{margin:0;width:320px;height:224px;background:transparent}svg{display:block}</style>${readFileSync(`${root}/layers/${file}`, "utf8")}`,
    );
    await raster.screenshot({
      path: resolve(root, "layers", file.replace(".svg", ".png")),
      omitBackground: true,
    });
    layerFiles.push(file);
  }
  await raster.close();
  const page = await browser.newPage({
    viewport: { width: 800, height: 860 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => {
    if (!deliberateFailures.some((x) => r.url().includes(x)))
      failures.push(r.url());
  });
  await page.goto(`${url}/.visuals/street-draft.html`);
  await page.waitForFunction(
    () => typeof (window as any).streetReview === "function",
  );
  let state = ensureWorld(newGame("NIGHT-0"));
  const history: string[] = [];
  function command(text: string, expected = true) {
    const r = executeCommand(state, text);
    expect(r.ok, `${text}: expected parser result`).toBe(expected);
    state = r.state;
    history.push(text);
    return r;
  }
  async function show(label: string, mode = "on", width = 640, custom = state) {
    const record = await page.evaluate(
      ({ state, label, mode, width }) =>
        (window as any).streetReview(state, label, mode, width),
      { state: custom, label, mode, width },
    );
    await expect(page.locator("#draft-capture")).toHaveAttribute(
      "data-label",
      label,
    );
    if (mode !== "off")
      await expect(page.locator(".street-draft")).toHaveAttribute(
        "data-active",
        "true",
      );
    await page.evaluate(async () => {
      await document.fonts.ready;
      const sources = [
        ...Array.from(document.images).map((i) => i.src),
        ...Array.from(document.querySelectorAll("svg image")).map((i) =>
          i.getAttribute("href")!,
        ),
      ];
      await Promise.all(
        sources.map(
          (src) =>
            new Promise<void>((ok, no) => {
              const im = new Image();
              im.onload = () => ok();
              im.onerror = () => no(new Error(src));
              im.src = src;
            }),
        ),
      );
    });
    await expect(page.locator("[data-visual-npc]")).toHaveCount(0);
    expect(record.npcs).toEqual([]);
    expect(record.crowd).toBe("quiet");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (mode !== "off") {
      const size = await page.locator(".visual-viewport").boundingBox();
      expect(size!.height).toBeCloseTo(size!.width * 0.7, 1);
      expect(
        await page
          .locator(".street-draft-layers image")
          .evaluateAll((ns) =>
            ns.every((n) => getComputedStyle(n).imageRendering === "pixelated"),
          ),
      ).toBe(true);
      await page
        .locator(".visual-viewport")
        .screenshot({ path: resolve(output, `${label}-viewport.png`) });
    }
    await page
      .locator("#draft-capture")
      .screenshot({ path: resolve(output, `${label}.png`) });
    records.push({ ...record, label, mode, width, commands: [...history] });
  }
  command("take envelope");
  command("go outside");
  await show("01-open-door");
  await expect(
    page.locator('.draft-owner[data-owner="side_door"]'),
  ).toHaveAttribute("data-open", "true");
  await expect(
    page.locator('.draft-owner [data-effect-owner="side_door"]'),
  ).toHaveCount(1);
  command("close side door");
  await show("02-closed-door");
  await expect(
    page.locator('.draft-owner [data-effect-owner="side_door"]'),
  ).toHaveCount(0);
  command("open side door");
  command("drop envelope");
  await show("03-dropped-envelope");
  await expect(page.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('.draft-owner [data-effect-owner="envelope"]'),
  ).toHaveCount(1);
  command("go inside");
  command("go outside");
  await show("04-return-envelope");
  await expect(page.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  command("take envelope");
  await show("05-retaken-envelope");
  await expect(page.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    0,
  );
  await expect(
    page.locator('.draft-owner [data-effect-owner="envelope"]'),
  ).toHaveCount(0);
  await show("06-master-320", "on", 320);
  await page.setViewportSize({ width: 390, height: 844 });
  await show("07-mobile-390");
  await page.setViewportSize({ width: 800, height: 860 });
  await show("08-reduced", "reduced");
  await expect(page.locator("[data-draft-weather]")).toHaveCount(0);
  await show("09-off", "off");
  await expect(
    page.locator(".location-visual svg,.location-visual img"),
  ).toHaveCount(0);
  while (state.time < 1600)
    command(`wait ${Math.min(1600 - state.time, 180)} minutes`);
  expect(state.world!.entities.side_door.open).toBe(false);
  expect(state.world!.entities.side_door.locked).toBe(true);
  command("go inside", false);
  await show("10-locked-0240");
  command("go front door");
  expect(state.world!.room).toBe("bar");
  command("go outside");
  while (state.time < 1755)
    command(`wait ${Math.min(1755 - state.time, 180)} minutes`);
  await show("11-dawn");
  const damaged = structuredClone(state);
  damaged.world!.entities.detail_street_sign.properties.damaged = true;
  await show("12-sign-damaged-fallback", "on", 640, damaged);
  await expect(
    page.locator('.draft-owner[data-owner="detail_street_sign"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.draft-owner [data-effect-owner="detail_street_sign"]'),
  ).toHaveCount(0);
  const gone = structuredClone(state);
  gone.world!.entities.detail_street_bin.visible = false;
  await show("13-bin-absent", "on", 640, gone);
  await expect(
    page.locator('.draft-owner[data-owner="detail_street_bin"]'),
  ).toHaveCount(0);
  // Deliberately fail a primary object; its owned effects must not survive.
  deliberateFailures.push("/layers/bin.png");
  await page.route("**/layers/bin.png", (r) => r.abort());
  await page.reload();
  await page.waitForFunction(
    () => typeof (window as any).streetReview === "function",
  );
  await page.evaluate(
    (state) => (window as any).streetReview(state, "bin-failure"),
    state,
  );
  await expect(page.locator(".street-draft")).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(page.locator(".street-draft")).toHaveAttribute(
    "data-art-bin",
    "false",
  );
  await expect(
    page.locator('.draft-owner[data-owner="detail_street_bin"]'),
  ).toHaveCount(0);
  await expect(
    page.locator('.visual-world [data-visual-entity="detail_street_bin"]'),
  ).toBeVisible();
  await page
    .locator("#draft-capture")
    .screenshot({ path: resolve(output, "14-bin-image-fallback.png") });
  await page.unroute("**/layers/bin.png");
  deliberateFailures.push(
    "/candidate/street__canonical-room__canonical__64-colours.png",
  );
  await page.route(
    "**/candidate/street__canonical-room__canonical__64-colours.png",
    (r) => r.abort(),
  );
  await page.reload();
  await page.waitForFunction(
    () => typeof (window as any).streetReview === "function",
  );
  await page.evaluate(
    (state) => (window as any).streetReview(state, "plate-failure"),
    state,
  );
  await expect(page.locator(".location-visual")).toHaveAttribute(
    "data-base",
    "procedural",
  );
  await expect(page.locator(".street-draft-layers")).toHaveCount(0);
  await expect(page.locator(".visual-presence")).toContainText(
    "No named characters",
  );
  await page
    .locator("#draft-capture")
    .screenshot({ path: resolve(output, "15-plate-image-fallback.png") });
  await page.close();

  // Ordinary game UI, isolated request replacement only. No app source is changed.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  let replacements = 0;
  await context.route("**/src/components/Atmosphere.tsx", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const needle =
      'import { LocationVisual } from "/src/components/LocationVisual.tsx";';
    if (!body.includes(needle))
      throw new Error("Expected ordinary-UI import not found");
    replacements++;
    await route.fulfill({
      response,
      body: body.replace(
        needle,
        'import { StreetDraftVisual as LocationVisual } from "/scripts/street-draft-component.tsx";',
      ),
    });
  });
  const app = await context.newPage();
  const external: string[] = [];
  app.on("pageerror", (e) => errors.push(e.message));
  app.on("requestfailed", (r) => failures.push(r.url()));
  app.on("request", (r) => {
    if (!r.url().startsWith(url + "/") && !r.url().startsWith("data:"))
      external.push(r.url());
  });
  await app.goto(url);
  const cmd = async (text: string) => {
    const input = app.getByRole("textbox", { name: "Command", exact: true });
    await input.fill(text);
    await input.press("Enter");
  };
  const saved = () =>
    app.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  await cmd("take envelope");
  await app.getByRole("textbox", { name: "YOUR ALIAS" }).fill("Ash");
  await app.getByRole("checkbox", { name: /18 or older/ }).check();
  await app.getByRole("button", { name: "Enter as Ash", exact: true }).click();
  await cmd("go outside");
  await cmd("drop envelope");
  await expect(app.locator(".street-draft")).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  await app.evaluate(() => document.fonts.ready);
  await app.screenshot({
    path: resolve(output, "16-ordinary-ui-desktop.png"),
    fullPage: true,
  });
  const before = await saved();
  await app.reload();
  expect(await saved()).toEqual(before);
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  await cmd("take envelope");
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    0,
  );
  await app.setViewportSize({ width: 390, height: 844 });
  expect(
    await app.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await app.screenshot({
    path: resolve(output, "17-ordinary-ui-mobile.png"),
    fullPage: true,
  });
  await app.setViewportSize({ width: 1440, height: 1100 });
  let current = (await saved()).time;
  while (current < 1600) {
    await cmd(`wait ${Math.min(1600 - current, 180)} minutes`);
    const next = (await saved()).time;
    expect(next).toBeGreaterThan(current);
    current = next;
  }
  await cmd("go inside");
  expect((await saved()).world.room).toBe("street");
  await expect(app.getByRole("log")).toContainText(
    "The side door is locked. The front entrance remains open.",
  );
  await app.screenshot({
    path: resolve(output, "18-ordinary-ui-locked.png"),
    fullPage: true,
  });
  await cmd("go front door");
  expect((await saved()).world.room).toBe("bar");
  await expect(
    app.locator('[data-review-status="approved-direction"]'),
  ).toBeVisible();
  await expect(app.locator(".street-draft-layers")).toHaveCount(0);
  expect(replacements).toBeGreaterThan(0);
  expect(external).toEqual([]);
  await context.close();
  // A fresh context sees the original unactivated app without the request override.
  const plain = await browser.newPage();
  await plain.goto(url);
  await expect(plain.locator(".street-draft")).toHaveCount(0);
  await plain.close();
  for (const file of protectedFiles)
    expect(hash(readFileSync(file))).toBe(protectedHashes[file]);
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        status: "passed-draft-unactivated",
        headless: true,
        protectedHashes,
        records,
        rasterizedLayers: layerFiles,
        checks: [
          "open/closed door and owned spill",
          "drop/return/take envelope and owned reflection",
          "real parser 02:40 lock and front-entry success",
          "native 320/640 and mobile containment",
          "On/Reduced/Off",
          "damaged sign and absent bin",
          "failed primary removes owned effect with procedural/text fallback",
          "base failure restores procedural renderer",
          "ordinary UI isolated preview, save/reload and mobile",
          "normal app unchanged without preview injection",
        ],
        errors,
        failedRequests: failures,
        externalRequests: external,
        deliberateFailedRequests: deliberateFailures,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Street draft: ${records.length} state composites, 9 raster layers, image fallbacks and isolated ordinary UI passed. All screenshots saved without opening a window.`,
  );
} catch (error) {
  writeFileSync(
    resolve(output, "failure.json"),
    JSON.stringify(
      { error: String(error), records, errors, failures },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
