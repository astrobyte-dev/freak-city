import { chromium, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { SAVE_KEY } from "../src/engine/save";
import { VISUAL_PREFERENCE_KEY } from "../src/visuals/preferences";
import { velvetState } from "./velvet-pilot-fixture";
import type { GameState } from "../src/engine/types";

const output = "docs/design/inez-envelope-review";
mkdirSync(output, { recursive: true });
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const results: string[] = [];
const hash = (data: Buffer) => createHash("sha256").update(data).digest("hex");
const initial = () => {
  let s = ensureWorld(newGame("NIGHT-0"));
  for (const cmd of ["take envelope", "go outside", "go inside"])
    s = executeCommand(s, cmd).state;
  s.started = true;
  s.alias = "Ash";
  return s;
};
async function load(page: Page, state: GameState, mode = "on") {
  await page.evaluate(
    ({ state, key, pref, mode }) => {
      localStorage.setItem(
        key,
        JSON.stringify({ ...state, started: true, alias: "Ash" }),
      );
      localStorage.setItem(pref, mode);
    },
    { state, key: SAVE_KEY, pref: VISUAL_PREFERENCE_KEY, mode },
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}
async function cmd(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill(text);
  await input.press("Enter");
}
async function saved(page: Page): Promise<GameState> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
}
try {
  for (const [size, viewport] of Object.entries({
    desktop: { width: 1440, height: 1100 },
    mobile: { width: 390, height: 844 },
  })) {
    // New isolated context: never attaches to a user's browser or profile.
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await load(page, initial());
    await cmd(page, "ask Inez to watch my envelope");
    await expect(page.getByRole("log")).toContainText("00:15");
    const pending = await saved(page);
    expect(pending.world!.social!.offer).toBeDefined();
    await page.reload({ waitUntil: "networkidle" });
    await cmd(page, "yes, please");
    await expect
      .poll(async () => (await saved(page)).world!.entities.envelope.location)
      .toBe("ledge");
    expect(await page.locator(".vestibule-draft").count()).toBe(0);
    await page.screenshot({
      path: `${output}/${size}-accepted.png`,
      fullPage: true,
    });
    await cmd(page, "journal");
    await expect(page.getByRole("dialog")).toContainText("WHAT YOU AGREED");
    await expect(page.getByRole("dialog")).toContainText(
      "Collection still due",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${output}/${size}-journal.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await cmd(page, "go bar");
    await cmd(page, "joke with Mara");
    await cmd(page, "go vestibule");
    await cmd(page, "take envelope");
    await expect
      .poll(async () => (await saved(page)).world!.social!.agreements[0].status)
      .toBe("fulfilled");
    const completed = await saved(page);
    await page.reload({ waitUntil: "networkidle" });
    expect((await saved(page)).world!.social).toEqual(completed.world!.social);
    for (const mode of ["reduced", "off"]) {
      await load(page, initial(), mode);
      await cmd(page, "ask Inez to watch my envelope");
      await cmd(page, "sure");
      expect((await saved(page)).world!.entities.envelope.location).toBe(
        "ledge",
      );
      if (mode === "off")
        await expect(page.locator(".visual-viewport")).toHaveCount(0);
    }
    results.push(
      `${size}: pending offer reload, natural acceptance, journal, ordinary collection, save reload, reduced/off modes passed`,
    );
    if (size === "mobile") {
      let blockedImages = 0;
      await page.route("**/visuals/**", (route) => {
        if (route.request().resourceType() === "image") {
          blockedImages++;
          return route.abort();
        }
        return route.continue();
      });
      await load(page, executeCommand(initial(), "go outside").state);
      expect(blockedImages).toBeGreaterThan(0);
      await page.screenshot({
        path: `${output}/mobile-street-fallback.png`,
        fullPage: true,
      });
      await cmd(page, "go inside");
      await cmd(page, "ask Inez to watch my envelope");
      await cmd(page, "okay");
      await expect
        .poll(
          async () => (await saved(page)).world!.social!.agreements[0].status,
        )
        .toBe("active");
      await page.screenshot({
        path: `${output}/mobile-missing-art.png`,
        fullPage: true,
      });
      results.push(
        "mobile: blocked visual requests do not block care or text play",
      );
    }
    await context.close();
  }
  // Reproduce the retained capture's fresh context and desktop-to-mobile sequence.
  // The fixed page grain is screen-position dependent, so a scrolled gameplay
  // context is not an equivalent pixel baseline.
  const visualContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const page = await visualContext.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  for (const [size, viewport] of Object.entries({
    desktop: { width: 1440, height: 1100 },
    mobile: { width: 390, height: 844 },
  })) {
    await page.setViewportSize(viewport);
    let street = ensureWorld(newGame("NIGHT-0"));
    for (const text of ["take envelope", "go outside", "drop envelope"])
      street = executeCommand(street, text).state;
    for (const [room, state] of [
      ["street", street],
      ["bar", velvetState("early", "dropped").state],
    ] as const) {
      await load(page, state);
      await page.evaluate(async () => {
        const sources = [
          ...Array.from(document.images).map((i) => i.src),
          ...Array.from(document.querySelectorAll("svg image")).map((i) =>
            i.getAttribute("href")!,
          ),
        ];
        await Promise.all(
          sources.map(
            (src) =>
              new Promise<void>((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve();
                i.onerror = () => reject(new Error(src));
                i.src = src;
              }),
          ),
        );
      });
      const capture = await page
        .locator(".visual-viewport")
        .screenshot({ path: `${output}/${room}-${size}.png` });
      const retained = readFileSync(
        `docs/visuals/reviewed-sources/vestibule/draft-v1/review/${room}-${size}-before.png`,
      );
      expect(hash(capture), `${room}/${size} retained approved visual`).toBe(
        hash(retained),
      );
      results.push(`${room}/${size}: approved visual screenshot identical`);
    }
  }
  await visualContext.close();
  expect(errors).toEqual([]);
  writeFileSync(
    `${output}/browser-checks.json`,
    JSON.stringify(
      {
        status: "passed",
        headless: true,
        isolatedContexts: true,
        personalBrowserSavesAccessed: false,
        results,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(results.join("\n"));
} finally {
  await browser.close();
}
