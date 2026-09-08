import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { SAVE_KEY } from "../src/engine/save";
const url = process.env.PLAYTEST_URL ?? "http://localhost:4173/freak-city/";
const capture = process.env.CAPTURE_SCREENSHOTS === "1";
const outdir = "screenshots";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors: string[] = [],
  failedRequests: string[] = [],
  externalRequests: string[] = [],
  assets: { url: string; status: number }[] = [];
const audits: { screen: string; violations: unknown[] }[] = [];
let completed = false,
  failure: string | undefined;
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("requestfailed", (r) => failedRequests.push(r.url()));
page.on("request", (r) => {
  if (new URL(r.url()).origin !== new URL(url).origin)
    externalRequests.push(r.url());
});
page.on("response", (r) => {
  assets.push({ url: r.url(), status: r.status() });
});
async function state() {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
}
async function command(text: string) {
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill(text);
  await input.press("Enter");
}
async function close() {
  await page.getByRole("button", { name: "Close dialog" }).click();
}
async function audit(screen: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  audits.push({ screen, violations: result.violations });
}
async function shot(name: string) {
  if (!capture) return;
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `${outdir}/${name}.png`, fullPage: true });
}
try {
  if (capture) mkdirSync(outdir, { recursive: true });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("h1")).toContainText("An address");
  await expect(page.locator("button.choice")).toHaveCount(0);
  await shot("01-opening");
  await audit("opening");
  await command("take envelope");
  await expect(
    page.getByRole("checkbox", { name: /I’m 18 or older/ }),
  ).not.toBeChecked();
  await page.getByRole("textbox", { name: "YOUR ALIAS" }).fill("Stranger");
  await page.getByRole("checkbox", { name: /I’m 18 or older/ }).check();
  await page
    .getByRole("button", { name: "Enter as Stranger", exact: true })
    .click();
  await expect
    .poll(async () => (await state()).inventory.includes("envelope"))
    .toBe(true);
  await command("phone");
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot("04-phone");
  await close();
  await command("open it; take invitation; go outside; go inside; go bar");
  await expect.poll(async () => (await state()).world.room).toBe("bar");
  await shot("02-velvet");
  await command("lean against the bar");
  await command("look at the glass");
  await command("smell the room");
  await shot("03-transcript");
  await audit("parser transcript");
  await command("inventory");
  await expect(page.getByRole("dialog")).toContainText("invitation");
  await shot("05-belongings");
  await close();
  for (const panel of ["journal", "map"]) {
    await command(panel);
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit(panel);
    await close();
  }
  await command('text Mara "where are you?"');
  await command("wait 3");
  await expect
    .poll(async () =>
      (await state()).messages.some((m: { from: string }) => m.from === "Mara"),
    )
    .toBe(true);
  const saved = await state();
  await page.reload({ waitUntil: "networkidle" });
  expect((await state()).world).toEqual(saved.world);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("playtest-build")).toContainText(
    "PRE-ALPHA HUMAN PLAYTEST BUILD",
  );
  await expect(page.getByTestId("playtest-build")).toContainText(
    "0.1.0-playtest.1",
  );
  const audio = page.getByRole("checkbox", { name: /Atmospheric audio/ });
  await expect(audio).not.toBeChecked();
  await audio.check();
  await expect(audio).toBeChecked();
  await audio.uncheck();
  await close();
  await page.getByRole("button", { name: "Boundaries", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Skip all optional mature themes" }),
  ).toBeVisible();
  await close();
  await page.getByRole("log").focus();
  await page.keyboard.press("Control+Shift+D");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await command("look around");
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await audit("mobile");
  await shot("06-mobile");
  // Exercise the phone's real artwork path without exposing this private test fixture in a screenshot.
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    s.messages.push({
      id: "publication-asset-check",
      from: "VELVET",
      text: "Entrance photograph",
      at: s.time,
      read: false,
      attachment: "velvetExterior",
    });
    localStorage.setItem(key, JSON.stringify(s));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "networkidle" });
  await command("phone");
  const img = page.locator(".message-image");
  await expect(img).toBeVisible();
  await expect
    .poll(async () =>
      img.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  const metadata = await page.request.get(
    new URL("build.json", url).toString(),
  );
  if (new URL(url).host.endsWith("github.io")) expect(metadata.ok()).toBe(true);
  expect(assets.filter((a) => a.status >= 400)).toEqual([]);
  expect(assets.some((a) => /\.woff2?(?:\?|$)/.test(a.url))).toBe(true);
  expect(assets.some((a) => a.url.endsWith("velvet-exterior.png"))).toBe(true);
  expect(assets.some((a) => /\.css(?:\?|$)/.test(a.url))).toBe(true);
  expect(assets.some((a) => /\.js(?:\?|$)/.test(a.url))).toBe(true);
  expect(
    assets
      .filter((a) => /\.(?:js|css|png|woff2?)(?:\?|$)/.test(a.url))
      .every((a) => a.url.startsWith(url)),
  ).toBe(true);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(audits.flatMap((a) => a.violations)).toEqual([]);
  completed = true;
  console.log(
    `Publication browser validation passed against ${url}: assets, adulthood, parser, movement, panels, local save/reload, opt-in audio, no debugger, mobile; ${audits.length} accessibility scans; zero external requests/runtime errors.`,
  );
} catch (error) {
  failure = error instanceof Error ? error.stack : String(error);
  throw error;
} finally {
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    `artifacts/publication-browser-${new URL(url).host.endsWith("github.io") ? "hosted" : "local"}.json`,
    JSON.stringify(
      {
        completed,
        target: url,
        failure,
        errors,
        failedRequests,
        externalRequests,
        assets,
        audits,
      },
      null,
      2,
    ) + "\n",
  );
  await browser.close();
}
