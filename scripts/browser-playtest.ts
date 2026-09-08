import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { SAVE_KEY } from "../src/engine/save";
const url = process.env.PLAYTEST_URL ?? "http://localhost:5173";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors: string[] = [];
let completed = false;
let failure: string | undefined;
const audits: { screen: string; violations: unknown[] }[] = [];
page.on("pageerror", (e) => errors.push(e.message));
async function audit(screen: string) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  audits.push({ screen, violations: result.violations });
}
async function command(text: string) {
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.fill(text);
  await input.press("Enter");
}
async function state() {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
}
mkdirSync("artifacts", { recursive: true });
try {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("h1")).toContainText("An address");
  await expect(page.locator("button.choice")).toHaveCount(0);
  await audit("desktop opening");
  await command("take envelope");
  await page.getByRole("textbox", { name: "YOUR ALIAS" }).fill("Ash");
  await page.getByRole("checkbox", { name: /I’m 18 or older/ }).check();
  await page.getByRole("button", { name: "Enter as Ash", exact: true }).click();
  await expect
    .poll(async () => (await state()).inventory.includes("envelope"))
    .toBe(true);
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  await input.focus();
  await input.press("ArrowUp");
  await expect(input).toHaveValue("take envelope");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("");
  await input.fill("exa");
  await input.press("Tab");
  await expect(input).toHaveValue("examine");
  await input.press("Escape");
  await command(
    "open envelope; take invitation; put it in coat; go outside; go inside; go bar",
  );
  await command("ask Mara about invitation");
  await command("ask her why she recognised it");
  await expect(page.getByRole("log")).toContainText("handled deliveries");
  await expect.poll(async () => (await state()).world.room).toBe("bar");
  await page.screenshot({
    path: "artifacts/parser-desktop.png",
    fullPage: true,
  });
  await audit("desktop transcript");
  const saved = await state();
  await page.reload();
  expect((await state()).world).toEqual(saved.world);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("checkbox", { name: /Accessibility quick actions/ })
    .check();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("button", { name: "look", exact: true }),
  ).toBeVisible();
  for (const name of ["Belongings", "The city", "Journal"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await audit(name);
    await page.getByRole("button", { name: "Close dialog" }).click();
  }
  await command("phone");
  await page
    .getByRole("textbox", { name: "MESSAGE", exact: true })
    .fill("where are you?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await audit("phone composer");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await command("go upstairs; open office door; enter; open drawer");
  await expect(page.getByRole("log")).toContainText(
    "top drawer or bottom drawer",
  );
  await command("top drawer");
  await command("take receipt");
  await expect
    .poll(async () => (await state()).inventory.includes("receipt"))
    .toBe(true);
  await page.getByRole("button", { name: "Boundaries", exact: true }).click();
  await page
    .getByRole("button", { name: "Skip all optional mature themes" })
    .click();
  await audit("boundaries");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await input.scrollIntoViewIfNeeded();
  await command("look");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await audit("mobile transcript");
  await page.screenshot({
    path: "artifacts/parser-mobile.png",
    fullPage: true,
  });
  // Touch-accessible editing, persistence, composition, and constrained keyboard space.
  await input.fill("a draft to keep");
  await page
    .getByRole("button", { name: "Previous command", exact: true })
    .click();
  await expect(input).toHaveValue("look");
  await page.getByRole("button", { name: "Next command", exact: true }).click();
  await expect(input).toHaveValue("a draft to keep");
  await page.reload();
  await expect(input).toHaveValue("a draft to keep");
  await input.fill("exa");
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  await expect(input).toHaveValue("examine");
  await input.fill("wait 5");
  const beforeComposition = (await state()).world.commandHistory.length;
  await input.dispatchEvent("compositionstart");
  await input.press("Enter");
  expect((await state()).world.commandHistory.length).toBe(beforeComposition);
  await input.dispatchEvent("compositionend");
  await input.press("Enter");
  await expect
    .poll(async () => (await state()).world.commandHistory.length)
    .toBe(beforeComposition + 1);
  await command("levitate piano");
  await expect(input).toHaveValue("levitate piano");
  await command("phone");
  const messageInput = page.getByRole("textbox", {
    name: "MESSAGE",
    exact: true,
  });
  await messageInput.fill("A message draft");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await command("phone");
  await expect(messageInput).toHaveValue("A message draft");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await command("drop phone");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("button", { name: /^Phone, .* unread messages$/ })
    .click();
  // The composer reports failure without erasing what the player wrote.
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("phone isn't with you");
  await expect(messageInput).toHaveValue("A message draft");
  await audit("mobile phone failure and retained draft");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await command("take phone");
  await command("phone");
  // A response from a panel must not steal the reader's place in an older transcript.
  await page.getByRole("log").evaluate((el) => {
    el.scrollTop = 0;
    el.dispatchEvent(new Event("scroll"));
  });
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect(
    await page.getByRole("log").evaluate((el) => el.scrollTop),
  ).toBeLessThan(30);
  await page
    .getByRole("button", { name: "Return to latest response ↓" })
    .click();
  await expect
    .poll(async () =>
      page
        .getByRole("log")
        .evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
    )
    .toBeLessThan(5);
  await page.setViewportSize({ width: 390, height: 450 });
  await input.fill("think about the invitation");
  await input.scrollIntoViewIfNeeded();
  await input.focus();
  const bounds = await input.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(450);
  await audit("mobile reduced keyboard viewport");
  await page.setViewportSize({ width: 320, height: 568 });
  await input.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await audit("small phone width");
  await input.focus();
  await page.screenshot({
    path: "artifacts/parser-mobile-small.png",
    fullPage: true,
  });
  // Deleting game data also clears this tab's command and phone drafts.
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: /^Delete local data/ }).click();
  await page
    .getByRole("button", { name: "Delete local game data", exact: true })
    .click();
  await expect(input).toHaveValue("");
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) => k.startsWith("freak-city:")),
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
  expect(audits.flatMap((a) => a.violations)).toEqual([]);
  completed = true;
  console.log(
    `Parser browser checks passed; ${audits.length} accessibility scans, desktop/mobile, drafts, touch history/completion, IME, scroll retention, phone failures, narrow/keyboard viewports, clarification, panels and reload.`,
  );
} catch (error) {
  failure = error instanceof Error ? error.stack : String(error);
  throw error;
} finally {
  writeFileSync(
    "artifacts/parser-browser-report.json",
    JSON.stringify(
      { completed, target: url, failure, errors, audits },
      null,
      2,
    ),
  );
  await browser.close();
}
