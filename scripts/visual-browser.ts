import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { newGame, advanceTime } from "../src/engine/game";
import { SAVE_KEY } from "../src/engine/save";
import { deriveVisualState } from "../src/visuals/derive";
import { VISUAL_PREFERENCE_KEY } from "../src/visuals/preferences";
const url = process.env.PLAYTEST_URL ?? "http://localhost:5181/";
const devURL = process.env.VISUAL_DEV_URL;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors: string[] = [];
const audits: { screen: string; violations: unknown[] }[] = [];
const commandMs: number[] = [];
let success = false;
page.on("pageerror", (e) => errors.push(e.message));
mkdirSync("screenshots/visuals", { recursive: true });
async function audit(screen: string) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  audits.push({ screen, violations: result.violations });
}
async function fixture(room: string, elapsed = 0) {
  let s = ensureWorld(newGame("NIGHT-0"));
  s.started = true;
  s.alias = "Stranger";
  advanceTime(s, elapsed);
  s.world!.room = room;
  s.world!.transcript = [];
  s = executeCommand(s, "look").state;
  await page.evaluate(
    ({ key, s, pref }) => {
      localStorage.setItem(key, JSON.stringify(s));
      localStorage.removeItem(pref);
    },
    { key: SAVE_KEY, s, pref: VISUAL_PREFERENCE_KEY },
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-room",
    room,
  );
  const actual = await page
    .locator("[data-visual-npc]")
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-visual-npc")).sort(),
    );
  expect(actual).toEqual(
    deriveVisualState(s)
      .npcPresence.map((n) => n.id)
      .sort(),
  );
  return s;
}
async function settings() {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
}
async function close() {
  await page.getByRole("button", { name: "Close dialog" }).click();
}
try {
  await page.goto(url, { waitUntil: "networkidle" });
  for (const [room, elapsed, name] of [
    ["street", 0, "01-velvet-exterior"],
    ["bar", 0, "02-bar-early"],
    ["bar", 320, "03-bar-dawn"],
    ["loading-bay", 0, "04-loading-bay"],
    ["apartment", 320, "05-apartment"],
  ] as const) {
    await fixture(room, elapsed);
    await page.evaluate(() => document.fonts.ready);
    await audit(name);
    await page.screenshot({
      path: `screenshots/visuals/${name}.png`,
      fullPage: true,
    });
  }
  await fixture("street");
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill("close side door");
  await input.press("Enter");
  await expect(
    page.locator('[data-visual-entity="side_door"]'),
  ).toHaveAttribute("data-open", "false");
  for (let i = 0; i < 12; i++) {
    await input.fill(i % 2 ? "close side door" : "open side door");
    const start = performance.now();
    await input.press("Enter");
    await expect(
      page.locator('[data-visual-entity="side_door"]'),
    ).toHaveAttribute("data-open", i % 2 ? "false" : "true");
    commandMs.push(performance.now() - start);
  }
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-paused",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-paused",
    "false",
  );
  await input.fill("open side door; go inside");
  await input.press("Enter");
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-room",
    "vestibule",
  );
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-paused",
    "false",
  );
  await input.fill("go outside");
  await input.press("Enter");
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-room",
    "street",
  );
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-paused",
    "false",
  );
  await settings();
  await page
    .getByLabel("Environmental visuals", { exact: true })
    .selectOption("reduced");
  await close();
  await expect(page.locator(".pixel-rain")).toHaveCount(0);
  await expect(page.getByTestId("location-visual")).toHaveAttribute(
    "data-paused",
    "true",
  );
  await settings();
  await page
    .getByLabel("Environmental visuals", { exact: true })
    .selectOption("off");
  await close();
  await expect(page.locator(".visual-viewport")).toHaveCount(0);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".visual-viewport")).toHaveCount(0);
  await audit("visuals-off");
  await page.locator(".visual-context summary").click();
  await expect(page.locator(".visual-context")).toContainText("side door");
  await fixture("bar");
  await page.setViewportSize({ width: 390, height: 844 });
  await audit("mobile-390");
  await page.screenshot({
    path: "screenshots/visuals/06-mobile.png",
    fullPage: true,
  });
  for (const width of [320, 390, 740]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".visual-viewport")
        .evaluate((e) => e.getBoundingClientRect().height),
    ).toBeLessThan(260);
    await expect(input).toBeVisible();
  }
  await page.setViewportSize({ width: 1440, height: 1080 });
  const metrics = await page.evaluate(() => ({
    resources: performance.getEntriesByType("resource").map((r) => ({
      name: new URL(r.name).pathname,
      bytes: (r as PerformanceResourceTiming).decodedBodySize,
    })),
    nodes: document.querySelectorAll(".location-visual *").length,
    animations: document
      .querySelector(".location-visual")!
      .getAnimations({ subtree: true })
      .map((a) => ({
        playState: a.playState,
        duration: a.effect?.getTiming().duration,
      })),
  }));
  if (devURL) {
    await page.goto(devURL, { waitUntil: "networkidle" });
    await fixture("bar");
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      SAVE_KEY,
    );
    await page.locator("h1").focus();
    await page.keyboard.press("Control+Shift+D");
    await page
      .getByTestId("visual-inspector")
      .locator(":scope > summary")
      .click();
    await page
      .getByLabel("Preview timeBand", { exact: true })
      .selectOption("dawn");
    await expect(
      page.locator(".visual-debug-preview [data-variant]"),
    ).toHaveAttribute("data-variant", "dawn");
    expect(
      await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
    ).toBe(saved);
    await close();
    const descriptor = deriveVisualState(ensureWorld(newGame()));
    descriptor.baseArt = {
      roomId: "taxi",
      variant: "base",
      status: "reviewed",
      file: "visuals/generated/deliberately-missing.webp",
      sha256: "test",
      width: 640,
      height: 448,
      review: {
        by: "test fixture",
        at: "2026-09-08",
        backgroundOnly: true,
        worldFactsChecked: true,
      },
    };
    mkdirSync(".visuals", { recursive: true });
    writeFileSync(
      ".visuals/fallback.html",
      '<html><body><div id="root"></div><script type="module" src="/ .visuals/fallback.tsx"></script></body></html>'.replace(
        "/ .visuals",
        "/.visuals",
      ),
    );
    writeFileSync(
      ".visuals/fallback.tsx",
      `import React from 'react'; import {createRoot} from 'react-dom/client'; import {LocationVisual} from '../src/components/LocationVisual';createRoot(document.getElementById('root')!).render(<LocationVisual descriptor={${JSON.stringify(descriptor)}} mode="on"/>);`,
    );
    await page.goto(new URL(".visuals/fallback.html", devURL).href);
    await expect(page.getByTestId("location-visual")).toHaveAttribute(
      "data-base",
      "procedural",
    );
    await expect(page.locator(".visual-world")).toBeVisible();
    await expect(page.locator(".visual-base")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
  expect(audits.flatMap((a) => a.violations)).toEqual([]);
  writeFileSync(
    "artifacts/visual-browser-metrics.json",
    JSON.stringify({ url, metrics, commandMs, audits, errors }, null, 2),
  );
  success = true;
  console.log(
    JSON.stringify(
      {
        success,
        accessibilityScans: audits.length,
        errors,
        commandMedianMs: [...commandMs].sort((a, b) => a - b)[
          Math.floor(commandMs.length / 2)
        ],
        metrics,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  if (!success)
    console.error("Visual browser validation failed; see assertion above.");
}
