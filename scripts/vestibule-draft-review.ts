// Headless only: retained composites, real parser states, isolated ordinary UI.
import { chromium, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { SAVE_KEY } from "../src/engine/save";
import { VISUAL_PREFERENCE_KEY } from "../src/visuals/preferences";
import { velvetState } from "./velvet-pilot-fixture";
import type { GameState } from "../src/engine/types";

const root = "docs/visuals/reviewed-sources/vestibule/draft-v1";
const output = `${root}/review`;
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
mkdirSync(output, { recursive: true });
mkdirSync(".visuals", { recursive: true });
const digest = (f: string) =>
  createHash("sha256").update(readFileSync(f)).digest("hex");
const protectedHashes = JSON.parse(
  readFileSync(`${root}/protected-files.json`, "utf8"),
);
const command = (s: GameState, text: string) => {
  const r = executeCommand(s, text);
  expect(r.ok, text).toBe(true);
  return r.state;
};
const waitUntil = (s: GameState, t: number) => {
  while (s.time < t)
    s = command(s, `wait ${Math.min(180, t - s.time)} minutes`);
  return s;
};
let arrived = ensureWorld(newGame("NIGHT-0"));
for (const text of ["take envelope", "go outside", "go inside"])
  arrived = command(arrived, text);
const cases: {
  label: string;
  state: GameState;
  open: boolean;
  present: boolean;
  placement: string;
}[] = [];
for (const present of [true, false])
  for (const open of [true, false])
    for (const placement of ["floor", "ledge"]) {
      // Both presence cases use the same real night band, enabling exact pixel containment checks.
      let state = waitUntil(structuredClone(arrived), present ? 1442 : 1455);
      state = command(
        state,
        placement === "floor" ? "drop envelope" : "put envelope on ledge",
      );
      if (!open) state = command(state, "close side door");
      cases.push({
        label: `${open ? "open" : "closed"}-${present ? "present" : "absent"}-${placement}`,
        state,
        open,
        present,
        placement,
      });
    }
writeFileSync(
  `${root}/state-fixtures.json`,
  JSON.stringify(
    cases.map((c) => ({ label: c.label, state: c.state })),
    null,
    2,
  ) + "\n",
);
writeFileSync(
  ".visuals/vestibule-draft.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestibule / isolated draft</title><main id="root"></main><script type="module" src="/.visuals/vestibule-draft.tsx"></script></html>',
);
writeFileSync(
  ".visuals/vestibule-draft.tsx",
  `
import React from 'react';import {createRoot} from 'react-dom/client';import {VestibuleDraftVisual} from '../scripts/vestibule-draft-component';import {deriveVisualState} from '../src/visuals/derive';import '../src/styles.css';
const root=createRoot(document.getElementById('root'));
window.vestibuleReview=(s,label,mode='on')=>{const d=deriveVisualState(s);root.render(<section id="draft-capture" data-label={label} style={{width:640,maxWidth:'100%',margin:'0 auto'}}>
<style>{'body{margin:0;padding:18px;background:#110e17;color:#d8c2cf}*{box-sizing:border-box}.location-visual{margin:0;width:100%;border:0}.visual-viewport{animation:none}.visual-light{transition:none}h1{font:14px monospace;margin:0 0 14px}.notes{font:12px/1.6 monospace}'}</style>
<h1>VESTIBULE / DRAFT / {label}</h1><VestibuleDraftVisual descriptor={d} mode={mode}/><p className="notes">Street behind / near-left edge · toilets left · bar ahead · cloakroom right.<br/>Chair remains off-camera; Inez uses the existing procedural presence marker.<br/>Envelope: {s.world.entities.envelope.location}. Door: {s.world.entities.side_door.open?'open':s.world.entities.side_door.locked?'locked':'closed'}.</p></section>);return{label,time:s.time,npcs:d.npcPresence.map(n=>n.id),objects:d.canonicalObjects.map(e=>({id:e.id,location:e.location})),lighting:d.lighting};};
`,
);
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const records: any[] = [];
try {
  const raster = await browser.newPage({
    viewport: { width: 320, height: 224 },
  });
  for (const file of readdirSync(`${root}/layers`).filter((f) =>
    f.endsWith(".svg"),
  )) {
    await raster.setContent(
      `<style>html,body{margin:0;background:transparent;width:320px;height:224px}svg{display:block}</style>${readFileSync(`${root}/layers/${file}`, "utf8")}`,
    );
    await raster.screenshot({
      path: resolve(root, "layers", file.replace(".svg", ".png")),
      omitBackground: true,
    });
  }
  await raster.close();
  const page = await browser.newPage({
    viewport: { width: 800, height: 850 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${url}/.visuals/vestibule-draft.html`);
  await page.waitForFunction(
    () => typeof (window as any).vestibuleReview === "function",
  );
  const owner = (id: string) =>
    page.locator(`.vestibule-owner[data-owner="${id}"]`);
  const fx = (id: string) =>
    page.locator(`.vestibule-owner [data-effect-owner="${id}"]`);
  async function loaded(p: Page) {
    await p.evaluate(async () => {
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
              const i = new Image();
              i.onload = () => ok();
              i.onerror = () => no(new Error(src));
              i.src = src;
            }),
        ),
      );
    });
  }
  async function show(
    s: GameState,
    label: string,
    size = "desktop",
    mode = "on",
  ) {
    await page.setViewportSize(
      size === "desktop"
        ? { width: 800, height: 850 }
        : { width: 390, height: 844 },
    );
    const record = await page.evaluate(
      ({ s, label, mode }) => (window as any).vestibuleReview(s, label, mode),
      { s, label, mode },
    );
    await expect(page.locator("#draft-capture")).toHaveAttribute(
      "data-label",
      label,
    );
    if (mode !== "off")
      await expect(page.locator(".vestibule-draft")).toHaveAttribute(
        "data-active",
        "true",
      );
    await loaded(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".pixel-rain,.pixel-reflection")).toHaveCount(0);
    await expect(
      page.locator('[data-chair], [data-owner="chair"]'),
    ).toHaveCount(0);
    if (mode !== "off")
      await page
        .locator(".visual-viewport")
        .screenshot({ path: resolve(output, `${label}-${size}-viewport.png`) });
    await page
      .locator("#draft-capture")
      .screenshot({ path: resolve(output, `${label}-${size}.png`) });
    records.push({ ...record, size, mode });
  }
  for (const size of ["desktop", "mobile"])
    for (const c of cases) {
      await show(c.state, c.label, size);
      await expect(owner("side_door")).toHaveAttribute(
        "data-open",
        String(c.open),
      );
      await expect(fx("side_door")).toHaveCount(c.open ? 1 : 0);
      await expect(page.locator('[data-visual-npc="inez"]')).toHaveCount(
        c.present ? 1 : 0,
      );
      await expect(page.locator(".vestibule-draft")).toHaveAttribute(
        "data-envelope-placement",
        c.placement,
      );
      await expect(fx("envelope")).toHaveCount(1);
      await expect(owner("ledge")).toHaveCount(1);
    }
  await show(arrived, "held");
  await expect(owner("envelope")).toHaveCount(0);
  await show(command(structuredClone(arrived), "drop phone"), "other-object");
  await expect(owner("envelope")).toHaveCount(0);
  const floor = cases.find((c) => c.label === "open-present-floor")!.state;
  const ledge = cases.find((c) => c.label === "open-present-ledge")!.state;
  let returned = command(command(ledge, "go bar"), "go vestibule");
  await show(returned, "returned-ledge");
  await expect(page.locator(".vestibule-draft")).toHaveAttribute(
    "data-envelope-placement",
    "ledge",
  );
  returned = command(returned, "take envelope");
  await show(returned, "retaken");
  await expect(owner("envelope")).toHaveCount(0);
  await expect(fx("envelope")).toHaveCount(0);
  const locked = waitUntil(structuredClone(ledge), 1600);
  await show(locked, "locked", "mobile");
  await expect(fx("side_door")).toHaveCount(0);
  expect(executeCommand(locked, "go outside").ok).toBe(false);
  expect(command(command(locked, "go bar"), "go outside").world!.room).toBe(
    "street",
  );
  await show(waitUntil(structuredClone(arrived), 1478), "inez-return");
  await expect(page.locator('[data-visual-npc="inez"]')).toHaveCount(1);
  await show(waitUntil(structuredClone(arrived), 1620), "inez-departed");
  await expect(page.locator('[data-visual-npc="inez"]')).toHaveCount(0);
  for (const route of ["go bar", "go cloakroom", "go washroom", "go outside"])
    expect(command(structuredClone(arrived), route).world!.room).not.toBe(
      "vestibule",
    );
  for (const mode of ["reduced", "off"]) {
    await show(ledge, mode, "mobile", mode);
    if (mode === "off")
      await expect(
        page.locator(".visual-viewport,.vestibule-owner"),
      ).toHaveCount(0);
    else await expect(fx("envelope")).toHaveCount(1);
  }
  for (const id of [
    "ledge",
    "detail_vestibule_bench",
    "detail_vestibule_notice",
    "detail_vestibule_heater",
    "detail_vestibule_book",
    "detail_vestibule_bag",
  ])
    for (const kind of ["absent", "damaged"]) {
      const s = structuredClone(ledge);
      if (kind === "absent") s.world!.entities[id].visible = false;
      else s.world!.entities[id].properties.damaged = true;
      await show(s, `${id}-${kind}`);
      await expect(owner(id)).toHaveCount(0);
      await expect(fx(id)).toHaveCount(0);
      if (id === "ledge") {
        await expect(owner("envelope")).toHaveCount(0);
        await expect(fx("envelope")).toHaveCount(0);
      }
    }
  const hiddenContents = structuredClone(ledge);
  hiddenContents.world!.entities.ledge.open = false;
  await show(hiddenContents, "ledge-closed");
  await expect(owner("envelope")).toHaveCount(0);
  for (const [name, id] of [
    ["door-open", "side_door"],
    ["door-closed", "side_door"],
    ["ledge", "ledge"],
    ["bench", "detail_vestibule_bench"],
    ["notice", "detail_vestibule_notice"],
    ["heater", "detail_vestibule_heater"],
    ["book", "detail_vestibule_book"],
    ["bag", "detail_vestibule_bag"],
    ["envelope", "envelope"],
    ["plate", ""],
  ] as const) {
    const pattern =
      name === "plate"
        ? "**/candidate/vestibule__canonical-room__canonical__64-colours.png"
        : `**/vestibule/draft-v1/layers/${name}.png`;
    await page.route(pattern, (r) => r.abort());
    await page.reload();
    await page.waitForFunction(
      () => typeof (window as any).vestibuleReview === "function",
    );
    const s =
      name === "door-closed"
        ? cases.find((c) => c.label === "closed-present-ledge")!.state
        : ledge;
    await page.evaluate(
      ({ s, label }) => (window as any).vestibuleReview(s, label),
      { s, label: `fallback-${name}` },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    if (name === "plate") {
      await expect(page.getByTestId("location-visual")).toHaveAttribute(
        "data-base",
        "procedural",
      );
      await expect(page.locator(".vestibule-owner")).toHaveCount(0);
    } else {
      await expect(page.locator(".vestibule-draft")).toHaveAttribute(
        "data-active",
        "true",
      );
      await expect(owner(id)).toHaveCount(0);
      await expect(fx(id)).toHaveCount(0);
      if (name === "ledge") await expect(fx("envelope")).toHaveCount(0);
    }
    await page.locator(".visual-context summary").click();
    await expect(
      page.locator(".visual-context li").filter({ hasText: "dry ledge" }),
    ).toBeVisible();
    await page
      .locator("#draft-capture")
      .screenshot({ path: resolve(output, `fallback-${name}-mobile.png`) });
    await page.unroute(pattern);
  }
  await page.close();
  // Before/after snapshots use ordinary UI in isolated contexts; only vestibule requests are adapted.
  async function appPage(inject: boolean) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      reducedMotion: "reduce",
    });
    if (inject)
      await context.route("**/src/components/Atmosphere.tsx", async (r) => {
        const response = await r.fetch();
        const body = await response.text();
        const needle =
          'import { LocationVisual } from "/src/components/LocationVisual.tsx";';
        expect(body).toContain(needle);
        await r.fulfill({
          response,
          body: body.replace(
            needle,
            'import { VestibuleDraftVisual as LocationVisual } from "/scripts/vestibule-draft-component.tsx";',
          ),
        });
      });
    const app = await context.newPage();
    app.on("pageerror", (e) => errors.push(e.message));
    await app.goto(url);
    return { context, app };
  }
  async function appLoad(app: Page, s: GameState, mode = "on") {
    s = structuredClone(s);
    s.started = true;
    s.alias = "Ash";
    await app.evaluate(
      ({ s, key, pref, mode }) => {
        localStorage.setItem(key, JSON.stringify(s));
        localStorage.setItem(pref, mode);
      },
      { s, key: SAVE_KEY, pref: VISUAL_PREFERENCE_KEY, mode },
    );
    await app.reload({ waitUntil: "networkidle" });
  }
  let street = ensureWorld(newGame("NIGHT-0"));
  for (const t of ["take envelope", "go outside", "drop envelope"])
    street = command(street, t);
  for (const inject of [false, true]) {
    const { context, app } = await appPage(inject);
    for (const size of ["desktop", "mobile"])
      for (const [room, s] of [
        ["street", street],
        ["bar", velvetState("early", "dropped").state],
      ] as const) {
        await app.setViewportSize(
          size === "desktop"
            ? { width: 1440, height: 1100 }
            : { width: 390, height: 844 },
        );
        await appLoad(app, s);
        await loaded(app);
        const file = `${room}-${size}-${inject ? "after" : "before"}.png`;
        await app
          .locator(".visual-viewport")
          .screenshot({ path: resolve(output, file) });
        if (inject)
          expect(digest(resolve(output, file))).toBe(
            digest(resolve(output, `${room}-${size}-before.png`)),
          );
      }
    if (inject) {
      await appLoad(app, floor);
      await expect(app.locator(".vestibule-draft")).toHaveAttribute(
        "data-active",
        "true",
      );
      const saved = () =>
        app.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
      const cmd = async (text: string) => {
        const input = app.getByRole("textbox", {
          name: "Command",
          exact: true,
        });
        await input.fill(text);
        await input.press("Enter");
      };
      for (const size of ["desktop", "mobile"]) {
        await app.setViewportSize(
          size === "desktop"
            ? { width: 1440, height: 1100 }
            : { width: 390, height: 844 },
        );
        await app.screenshot({
          path: resolve(output, `ordinary-${size}.png`),
          fullPage: true,
        });
      }
      await cmd("take envelope");
      await expect(
        app.locator('.vestibule-owner[data-owner="envelope"]'),
      ).toHaveCount(0);
      await cmd("put envelope on ledge");
      await expect(app.locator(".vestibule-draft")).toHaveAttribute(
        "data-envelope-placement",
        "ledge",
      );
      const before = await saved();
      await app.reload({ waitUntil: "networkidle" });
      expect(await saved()).toEqual(before);
      await expect(app.locator(".vestibule-draft")).toHaveAttribute(
        "data-envelope-placement",
        "ledge",
      );
      await cmd("go bar");
      await cmd("go vestibule");
      await expect(app.locator(".vestibule-draft")).toHaveAttribute(
        "data-envelope-placement",
        "ledge",
      );
      await cmd("close side door");
      await expect(
        app.locator('.vestibule-owner[data-owner="side_door"]'),
      ).toHaveAttribute("data-open", "false");
      await cmd("open side door");
      await expect(
        app.locator('.vestibule-owner [data-effect-owner="side_door"]'),
      ).toHaveCount(1);
      for (const mode of ["reduced", "off", "on"]) {
        await app
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await app
          .getByLabel("Environmental visuals", { exact: true })
          .selectOption(mode);
        await app.getByRole("button", { name: "Close dialog" }).click();
        if (mode === "off")
          await expect(app.locator(".vestibule-owner")).toHaveCount(0);
        else
          await expect(
            app.locator('.vestibule-owner[data-owner="envelope"]'),
          ).toHaveCount(1);
      }
      expect(
        await app.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await context.close();
  }
  expect(errors).toEqual([]);
  for (const [f, sha] of Object.entries(protectedHashes))
    expect(digest(f), f).toBe(sha);
  const provenance = JSON.parse(
    readFileSync(`${root}/layer-provenance.json`, "utf8"),
  );
  for (const [name, a] of Object.entries<any>(provenance.layers)) {
    a.png = `${name}.png`;
    a.pngSha256 = digest(`${root}/layers/${name}.png`);
  }
  writeFileSync(
    `${root}/layer-provenance.json`,
    JSON.stringify(provenance, null, 2) + "\n",
  );
  writeFileSync(
    `${output}/checks.json`,
    JSON.stringify(
      {
        status: "passed-draft-unactivated",
        records,
        errors,
        protectedFileCount: Object.keys(protectedHashes).length,
        approvedRoomPixelMatches: 4,
        checks: [
          "16 desktop/mobile door-presence-custody combinations",
          "floor and ledge envelope contacts",
          "shared door commands, 02:40 lock and bar escape",
          "Inez procedural presence/absence/return/departure",
          "all four routes",
          "custody, leave/return/take and exact save/reload",
          "all owner absence/damage, closed ledge hides contents",
          "10 mobile image failures, no orphaned effects",
          "On/Reduced/Off",
          "ordinary UI via isolated response injection",
          "street and Velvet pixel-identical; all src/public hashes unchanged",
          "no chair artwork or new character image",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Vestibule draft composites and headless state/fallback checks passed; shipping source/art unchanged.",
  );
} finally {
  await browser.close();
}
