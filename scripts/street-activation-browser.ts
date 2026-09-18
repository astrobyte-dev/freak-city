import { chromium, expect, type Page } from "@playwright/test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { velvetState } from "./velvet-pilot-fixture";
import { SAVE_KEY } from "../src/engine/save";
import { VISUAL_PREFERENCE_KEY } from "../src/visuals/preferences";
import type { GameState } from "../src/engine/types";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import streetOverlay from "../src/content/visuals/street-overlay.json";

const root = "docs/visuals/street-activation";
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
const baseline = process.argv.includes("--baseline");
mkdirSync(root, { recursive: true });
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
const inventory = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((p) =>
    p.isDirectory() ? inventory(`${dir}/${p.name}`) : [`${dir}/${p.name}`],
  );
const protectedFiles = [
  ...inventory("src/engine"),
  ...inventory("public/visuals/velvet-overlay"),
  ...inventory("docs/visuals/reviewed-sources/street"),
  "src/components/LocationVisual.tsx",
  "src/components/VelvetOverlayPilot.tsx",
  "src/content/visuals/velvet-overlay.json",
  "src/content/visuals/velvet-overlay.ts",
  "src/visuals/velvet-pilot.ts",
  "src/styles.css",
  "src/content/spaces.ts",
  "src/content/visuals/layouts/bar.json",
];
const registry = JSON.parse(
  readFileSync("src/content/visuals/assets.json", "utf8"),
);
const bar = registry.find((a: any) => a.roomId === "bar");
protectedFiles.push(`public/${bar.file}`);
if (baseline && existsSync(`${root}/baseline.json`))
  throw new Error(
    "Refusing to overwrite the retained pre-activation baseline.",
  );
if (baseline)
  writeFileSync(
    `${root}/baseline.json`,
    JSON.stringify(
      {
        bar,
        hashes: Object.fromEntries(
          protectedFiles.map((f) => [f, hash(readFileSync(f))]),
        ),
      },
      null,
      2,
    ) + "\n",
  );

const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  async function load(s: GameState, mode = "on") {
    s = structuredClone(s);
    s.started = true;
    s.alias = "Ash";
    await page.evaluate(
      ({ s, key, pref, mode }) => {
        localStorage.setItem(key, JSON.stringify(s));
        localStorage.setItem(pref, mode);
      },
      { s, key: SAVE_KEY, pref: VISUAL_PREFERENCE_KEY, mode },
    );
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("location-visual")).toHaveAttribute(
      "data-room",
      s.world!.room,
    );
  }
  async function capture(name: string, target: Page = page) {
    await target.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((i) => i.complete && i.naturalWidth)
          .map((i) => i.decode()),
      );
    });
    await target
      .locator(".visual-viewport")
      .screenshot({ path: resolve(root, `${name}.png`) });
  }
  for (const size of ["desktop", "mobile"]) {
    await page.setViewportSize(
      size === "desktop"
        ? { width: 1440, height: 1100 }
        : { width: 390, height: 844 },
    );
    for (const band of ["early", "late", "dawn"] as const) {
      await load(velvetState(band, "dropped").state);
      await capture(`velvet-${band}-${size}-${baseline ? "before" : "after"}`);
    }
  }
  if (!baseline) {
    const retained = JSON.parse(readFileSync(`${root}/baseline.json`, "utf8"));
    expect(bar).toEqual(retained.bar);
    for (const [f, sha] of Object.entries(retained.hashes))
      expect(hash(readFileSync(f)), f).toBe(sha);
    for (const size of ["desktop", "mobile"])
      for (const band of ["early", "late", "dawn"]) {
        const prefix = `${root}/velvet-${band}-${size}`;
        expect(hash(readFileSync(`${prefix}-after.png`)), prefix).toBe(
          hash(readFileSync(`${prefix}-before.png`)),
        );
      }
    const street = registry.find((a: any) => a.roomId === "street");
    expect(street.sha256).toBe(streetOverlay.plateSha256);
    for (const asset of Object.values(streetOverlay.layers))
      expect(hash(readFileSync(`public/${asset.file}`))).toBe(asset.sha256);
    let state = ensureWorld(newGame("NIGHT-0"));
    const setup = (command: string) => {
      const r = executeCommand(state, command);
      expect(r.ok, command).toBe(true);
      state = r.state;
    };
    setup("take envelope");
    setup("go outside");
    const open = structuredClone(state);
    setup("close side door");
    const closed = structuredClone(state);
    setup("open side door");
    setup("drop envelope");
    const dropped = structuredClone(state);
    const owner = (id: string) =>
      page.locator(`.street-owner[data-owner="${id}"]`);
    const effect = (id: string) =>
      page.locator(`.street-owner [data-effect-owner="${id}"]`);
    const saved = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
    const command = async (text: string) => {
      const input = page.getByRole("textbox", { name: "Command", exact: true });
      await input.fill(text);
      await input.press("Enter");
    };
    const active = async () => {
      await expect(page.locator(".street-art")).toHaveAttribute(
        "data-active",
        "true",
      );
      await expect(page.getByTestId("location-visual")).toHaveAttribute(
        "data-base",
        street.file,
      );
    };
    for (const size of ["desktop", "mobile"]) {
      await page.setViewportSize(
        size === "desktop"
          ? { width: 1440, height: 1100 }
          : { width: 390, height: 844 },
      );
      for (const [name, s] of [
        ["open", open],
        ["closed", closed],
        ["dropped", dropped],
      ] as const) {
        await load(s);
        await active();
        await expect(owner("side_door")).toHaveAttribute(
          "data-open",
          String(name !== "closed"),
        );
        await expect(effect("side_door")).toHaveCount(
          name === "closed" ? 0 : 1,
        );
        await expect(owner("envelope")).toHaveCount(name === "dropped" ? 1 : 0);
        await expect(effect("envelope")).toHaveCount(
          name === "dropped" ? 1 : 0,
        );
        await expect(effect("detail_street_bin")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await capture(`street-${name}-${size}`);
        if (name === "dropped")
          await page.screenshot({
            path: resolve(root, `ordinary-${size}.png`),
            fullPage: true,
          });
      }
    }
    // Ordinary UI commands, no request injection or synthetic rendering.
    const beforeReload = await saved();
    await page.reload({ waitUntil: "networkidle" });
    expect(await saved()).toEqual(beforeReload);
    await expect(effect("envelope")).toHaveCount(1);
    await command("go inside");
    await expect(page.getByTestId("location-visual")).toHaveAttribute(
      "data-room",
      "vestibule",
    );
    await expect(page.locator(".street-owner")).toHaveCount(0);
    await command("go outside");
    await expect(owner("envelope")).toHaveCount(1);
    await command("take envelope");
    await expect(owner("envelope")).toHaveCount(0);
    await expect(effect("envelope")).toHaveCount(0);
    expect((await saved()).world.entities.envelope.location).not.toBe("street");
    await command("close side door");
    await expect(owner("side_door")).toHaveAttribute("data-open", "false");
    await expect(effect("side_door")).toHaveCount(0);
    await command("open side door");
    await expect(effect("side_door")).toHaveCount(1);
    await command("drop envelope");
    await expect(effect("envelope")).toHaveCount(1);
    for (const mode of ["reduced", "off", "on"]) {
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page
        .getByLabel("Environmental visuals", { exact: true })
        .selectOption(mode);
      await page.getByRole("button", { name: "Close dialog" }).click();
      if (mode === "off") {
        await expect(page.locator(".visual-viewport")).toHaveCount(0);
        await expect(page.locator(".street-owner")).toHaveCount(0);
      } else {
        await active();
        await expect(effect("envelope")).toHaveCount(1);
        await expect(page.locator("[data-street-weather]")).toHaveCount(
          mode === "on" ? 1 : 0,
        );
      }
      await page.screenshot({
        path: resolve(root, `mode-${mode}-mobile.png`),
        fullPage: true,
      });
      const s = await saved();
      await page.reload({ waitUntil: "networkidle" });
      expect(await saved()).toEqual(s);
      expect(
        await page.evaluate(
          (k) => localStorage.getItem(k),
          VISUAL_PREFERENCE_KEY,
        ),
      ).toBe(mode);
    }
    while ((await saved()).time < 1600)
      await command(
        `wait ${Math.min(1600 - (await saved()).time, 180)} minutes`,
      );
    await command("go inside");
    expect((await saved()).world.room).toBe("street");
    expect((await saved()).world.entities.side_door.locked).toBe(true);
    await expect(effect("side_door")).toHaveCount(0);
    await capture("street-locked-mobile");
    await command("go front door");
    await expect(page.getByTestId("location-visual")).toHaveAttribute(
      "data-room",
      "bar",
    );
    await expect(page.locator(".street-owner")).toHaveCount(0);
    // Negative states cannot leave detached effects.
    for (const id of ["detail_street_bin", "detail_street_sign", "envelope"])
      for (const kind of ["absent", "damaged"]) {
        const s = structuredClone(dropped);
        if (kind === "absent") s.world!.entities[id].visible = false;
        else s.world!.entities[id].properties.damaged = true;
        await load(s);
        await active();
        await expect(owner(id)).toHaveCount(0);
        await expect(effect(id)).toHaveCount(0);
      }
    // Missing primary images and base plate at mobile size must retain usable text/fallback.
    for (const [name, file, id] of [
      ["bin", streetOverlay.layers.bin.file, "detail_street_bin"],
      ["sign", streetOverlay.layers.sign.file, "detail_street_sign"],
      ["door-open", streetOverlay.layers["door-open"].file, "side_door"],
      ["door-closed", streetOverlay.layers["door-closed"].file, "side_door"],
      ["envelope", streetOverlay.layers.envelope.file, "envelope"],
      ["plate", street.file, ""],
    ]) {
      const pattern = `**/${file}`;
      await page.route(pattern, (r) => r.abort());
      await load(name === "door-closed" ? closed : dropped);
      if (name === "plate") {
        await expect(page.getByTestId("location-visual")).toHaveAttribute(
          "data-base",
          "procedural",
        );
        await expect(page.locator(".street-owner")).toHaveCount(0);
      } else {
        await active();
        await expect(owner(id)).toHaveCount(0);
        await expect(effect(id)).toHaveCount(0);
        if (id === "envelope") {
          // Mobile intentionally uses the accessible context list for unanchored fallback objects.
          await page.locator(".visual-context summary").click();
          await expect(
            page
              .locator(".visual-context li")
              .filter({ hasText: "black envelope" }),
          ).toBeVisible();
          await command("take envelope");
          expect((await saved()).world.entities.envelope.location).not.toBe(
            "street",
          );
        } else
          await expect(
            page.locator(`[data-visual-entity="${id}"]`).first(),
          ).toBeVisible();
      }
      await expect(
        page.getByRole("textbox", { name: "Command", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await capture(`fallback-${name}-mobile`);
      await page.unroute(pattern);
    }
    for (const [f, sha] of Object.entries(retained.hashes))
      expect(hash(readFileSync(f)), f).toBe(sha);
    writeFileSync(
      `${root}/checks.json`,
      JSON.stringify(
        {
          status: "passed-active-feature-only",
          ordinaryUI: true,
          requestInjection: false,
          headless: true,
          velvetPixelIdenticalViewports: 6,
          protectedHashes: Object.keys(retained.hashes).length,
          checks: [
            "desktop/mobile open, closed and dropped",
            "door UI commands and 02:40 lock",
            "alternate front entrance",
            "drop/return/take custody and owned effects",
            "full save/reload equality",
            "On/Reduced/Off and preference persistence",
            "absent/damaged owners remove effects",
            "mobile failures: bin, sign, both door states, envelope and background",
            "shipping layer hashes equal approved masters",
            "Velvet before/after pixel equality",
          ],
          errors,
        },
        null,
        2,
      ) + "\n",
    );
  }
  expect(errors).toEqual([]);
  console.log(
    baseline
      ? "Velvet baseline saved: six ordinary-play viewports and protected hashes."
      : "Velvet after captures saved.",
  );
} finally {
  await browser.close();
}
