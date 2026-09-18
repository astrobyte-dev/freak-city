// Focused headless comparison runner. Prior draft files are read-only.
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { SAVE_KEY } from "../src/engine/save";

const beforeRoot = "docs/visuals/reviewed-sources/street/draft-v1";
const root = "docs/visuals/reviewed-sources/street/draft-v2-polish";
const output = resolve(root, "review");
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
mkdirSync(output, { recursive: true });
mkdirSync(".visuals", { recursive: true });
const digest = (f: string) =>
  createHash("sha256").update(readFileSync(f)).digest("hex");
function inventory(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((p) =>
    p.isDirectory() ? inventory(`${dir}/${p.name}`) : [`${dir}/${p.name}`],
  );
}
const preserved = [
  ...inventory(beforeRoot),
  "public/visuals/velvet-overlay/sprites/envelope.png",
  "src/content/visuals/assets.json",
  "src/content/visuals/velvet-overlay.json",
  "src/content/spaces.ts",
  "src/engine/parser.ts",
];
const originalHashes = Object.fromEntries(preserved.map((p) => [p, digest(p)]));
writeFileSync(
  ".visuals/street-polish.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Street polish / isolated draft comparison</title><main id="root"></main><script type="module" src="/.visuals/street-polish.tsx"></script></html>',
);
writeFileSync(
  ".visuals/street-polish.tsx",
  `
import React from 'react';import {createRoot} from 'react-dom/client';
import {StreetDraftVisual} from '../scripts/street-draft-component';import {deriveVisualState} from '../src/visuals/derive';import '../src/styles.css';
const root=createRoot(document.getElementById('root'));
window.polishReview=(state,revision,label,mode='on')=>{
const d=deriveVisualState(state);const layersRoot='docs/visuals/reviewed-sources/street/'+(revision==='before'?'draft-v1':'draft-v2-polish');
root.render(<section id="polish-capture" data-revision={revision} data-label={label} style={{width:640,maxWidth:'100%',margin:'0 auto'}}>
<style>{'body{margin:0;padding:18px;background:#110e17;color:#d8c2cf}*{box-sizing:border-box}.location-visual{margin:0;width:100%;border:0}.visual-viewport{animation:none}.visual-light{transition:none}h1{font:14px monospace;margin:0 0 14px}.state-note{font:12px monospace;line-height:1.6}'}</style>
<h1>STREET / {revision.toUpperCase()} / {label}</h1><StreetDraftVisual key={revision} descriptor={d} mode={mode} layersRoot={layersRoot}/>
<p className="state-note">{state.world.entities.side_door.open?'Side door open':state.world.entities.side_door.locked?'Side door closed and locked':'Side door closed'} · {d.lighting} · Same architecture, placement and colour treatment.</p>
</section>);return {time:state.time,room:d.roomId,npcs:d.npcPresence.map(n=>n.id),crowd:d.crowdLevel,envelopeLocation:state.world.entities.envelope.location,door:{open:state.world.entities.side_door.open,locked:state.world.entities.side_door.locked}};
};`,
);
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const unexpectedRequests: string[] = [];
const unexpectedFailures: string[] = [];
const records: any[] = [];
let expectedFailure = "";
try {
  const raster = await browser.newPage({
    viewport: { width: 320, height: 224 },
  });
  for (const f of readdirSync(`${root}/layers`).filter((f) =>
    f.endsWith(".svg"),
  )) {
    await raster.setContent(
      `<style>html,body{margin:0;background:transparent;width:320px;height:224px}svg{display:block}</style>${readFileSync(`${root}/layers/${f}`, "utf8")}`,
    );
    await raster.screenshot({
      path: resolve(root, "layers", f.replace(".svg", ".png")),
      omitBackground: true,
    });
  }
  await raster.close();
  const page = await browser.newPage({
    viewport: { width: 800, height: 850 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (!r.url().startsWith(url + "/") && !r.url().startsWith("data:"))
      unexpectedRequests.push(r.url());
  });
  page.on("requestfailed", (r) => {
    if (!expectedFailure || !r.url().includes(expectedFailure))
      unexpectedFailures.push(r.url());
  });
  await page.goto(`${url}/.visuals/street-polish.html`);
  await page.waitForFunction(
    () => typeof (window as any).polishReview === "function",
  );
  let state = ensureWorld(newGame("NIGHT-0"));
  function command(text: string, ok = true) {
    const r = executeCommand(state, text);
    expect(r.ok, text).toBe(ok);
    state = r.state;
  }
  command("take envelope");
  command("go outside");
  const open = structuredClone(state);
  command("close side door");
  const closed = structuredClone(state);
  command("open side door");
  command("drop envelope");
  const dropped = structuredClone(state);
  async function show(
    s: typeof state,
    revision: string,
    label: string,
    size: "desktop" | "mobile" = "desktop",
    mode = "on",
  ) {
    await page.setViewportSize(
      size === "desktop"
        ? { width: 800, height: 850 }
        : { width: 390, height: 844 },
    );
    const record = await page.evaluate(
      ({ s, revision, label, mode }) =>
        (window as any).polishReview(s, revision, label, mode),
      { s, revision, label, mode },
    );
    await expect(page.locator("#polish-capture")).toHaveAttribute(
      "data-revision",
      revision,
    );
    await expect(page.locator("#polish-capture")).toHaveAttribute(
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
      const urls = [
        ...Array.from(document.images).map((i) => i.src),
        ...Array.from(document.querySelectorAll("svg image")).map((i) =>
          i.getAttribute("href")!,
        ),
      ];
      await Promise.all(
        urls.map(
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(record.npcs).toEqual([]);
    expect(record.crowd).toBe("quiet");
    if (mode !== "off") {
      const b = await page.locator(".visual-viewport").boundingBox();
      expect(b!.width).toBe(size === "desktop" ? 640 : 354);
      expect(b!.height).toBeCloseTo(b!.width * 0.7, 1);
      await page.locator(".visual-viewport").screenshot({
        path: resolve(output, `${label}-${size}-${revision}-viewport.png`),
      });
    }
    await page.locator("#polish-capture").screenshot({
      path: resolve(output, `${label}-${size}-${revision}.png`),
    });
    records.push({ ...record, revision, label, size, mode });
  }
  for (const size of ["desktop", "mobile"] as const)
    for (const [label, s] of [
      ["open", open],
      ["closed", closed],
      ["dropped", dropped],
    ] as const)
      for (const revision of ["before", "after"])
        await show(s, revision, label, size);
  // Positive and negative cases through the existing parser and descriptor.
  command("go inside");
  command("go outside");
  await show(state, "after", "return");
  await expect(page.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  command("take envelope");
  await show(state, "after", "retaken");
  await expect(
    page.locator(
      '.draft-owner[data-owner="envelope"],.draft-owner [data-effect-owner="envelope"]',
    ),
  ).toHaveCount(0);
  const absent = structuredClone(open);
  absent.world!.entities.detail_street_bin.visible = false;
  await show(absent, "after", "bin-absent");
  await expect(
    page.locator(
      '.draft-owner[data-owner="detail_street_bin"],.draft-owner [data-effect-owner="detail_street_bin"]',
    ),
  ).toHaveCount(0);
  const damaged = structuredClone(open);
  damaged.world!.entities.detail_street_bin.properties.damaged = true;
  await show(damaged, "after", "bin-damaged");
  await expect(
    page.locator('.draft-owner[data-owner="detail_street_bin"]'),
  ).toHaveCount(0);
  // With all three changed owners absent/inactive, before and after must match exactly.
  const neutral = structuredClone(closed);
  neutral.world!.entities.detail_street_bin.visible = false;
  for (const rev of ["before", "after"]) await show(neutral, rev, "neutral");
  await show(closed, "after", "closed-no-spill");
  await expect(
    page.locator('.draft-owner [data-effect-owner="side_door"]'),
  ).toHaveCount(0);
  await show(dropped, "after", "reduced", "mobile", "reduced");
  await expect(page.locator("[data-draft-weather]")).toHaveCount(0);
  await show(dropped, "after", "off", "mobile", "off");
  await expect(
    page.locator(".location-visual img,.location-visual svg"),
  ).toHaveCount(0);
  while (state.time < 1600)
    command(`wait ${Math.min(1600 - state.time, 180)} minutes`);
  command("go inside", false);
  await show(state, "after", "locked");
  expect(state.world!.entities.side_door.locked).toBe(true);
  await expect(
    page.locator('.draft-owner [data-effect-owner="side_door"]'),
  ).toHaveCount(0);
  command("go front door");
  expect(state.world!.room).toBe("bar");
  for (const [file, owner, s, flag] of [
    ["bin.png", "detail_street_bin", open, "bin"],
    ["door-open.png", "side_door", open, "door"],
    ["envelope.png", "envelope", dropped, "envelope"],
  ] as const) {
    expectedFailure = `draft-v2-polish/layers/${file}`;
    await page.route(`**/draft-v2-polish/layers/${file}`, (r) => r.abort());
    await page.reload();
    await page.waitForFunction(
      () => typeof (window as any).polishReview === "function",
    );
    await page.evaluate(
      ({ s, owner }) =>
        (window as any).polishReview(s, "after", `${owner}-failure`),
      { s, owner },
    );
    await expect(page.locator(".street-draft")).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(page.locator(".street-draft")).toHaveAttribute(
      `data-art-${flag}`,
      "false",
    );
    await expect(
      page.locator(
        `.draft-owner[data-owner="${owner}"],.draft-owner [data-effect-owner="${owner}"]`,
      ),
    ).toHaveCount(0);
    await page
      .locator("#polish-capture")
      .screenshot({ path: resolve(output, `fallback-${owner}.png`) });
    await page.unroute(`**/draft-v2-polish/layers/${file}`);
  }
  await page.close();
  // Recheck the ordinary UI in a fresh isolated context, with test-only response injection.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  await context.route("**/src/components/Atmosphere.tsx", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const needle =
      'import { LocationVisual } from "/src/components/LocationVisual.tsx";';
    expect(body).toContain(needle);
    await route.fulfill({
      response,
      body: body.replace(
        needle,
        'import { StreetPolishedDraftVisual as LocationVisual } from "/scripts/street-draft-component.tsx";',
      ),
    });
  });
  const app = await context.newPage();
  app.on("pageerror", (e) => errors.push(e.message));
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
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  await app.evaluate(() => document.fonts.ready);
  await app.screenshot({
    path: resolve(output, "ordinary-ui-after-desktop.png"),
    fullPage: true,
  });
  const savedBefore = await saved();
  await app.reload();
  expect(await saved()).toEqual(savedBefore);
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    1,
  );
  await app.setViewportSize({ width: 390, height: 844 });
  expect(
    await app.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await app.screenshot({
    path: resolve(output, "ordinary-ui-after-mobile.png"),
    fullPage: true,
  });
  await cmd("take envelope");
  await expect(app.locator('.draft-owner[data-owner="envelope"]')).toHaveCount(
    0,
  );
  await context.close();
  expect(errors).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
  expect(unexpectedFailures).toEqual([]);
  for (const [f, sha] of Object.entries(originalHashes))
    expect(digest(f), f).toBe(sha);
  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        status: "passed-draft-unactivated",
        records,
        preservedHashes: originalHashes,
        checks: [
          "before/after open, closed and dropped at desktop and mobile",
          "fixed sprite sizes and positions",
          "drop/return/take and reload",
          "bin absence/damage",
          "closed/locked door removes open effects",
          "failed bin/door/envelope remove their effects",
          "On/Reduced/Off",
          "front entrance remains usable after side-door lock",
          "ordinary UI through isolated request injection",
          "all prior draft files and protected gameplay/art unchanged",
        ],
        errors,
        unexpectedRequests,
        unexpectedFailures,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Street polish: desktop/mobile comparisons, custody, door states, all three primary-image failures, modes and isolated ordinary UI passed. Prior draft unchanged.",
  );
} finally {
  await browser.close();
}
