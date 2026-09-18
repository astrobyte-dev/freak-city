import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { createInterface } from "node:readline";
import { mkdirSync, appendFileSync } from "node:fs";

// Interactive, isolated UI evidence capture. Commands are typed, never filled.
const output =
  process.env.OPENING_REVIEW_OUTPUT ??
  `artifacts/human-opening-review-${Date.now()}`;
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
let context: BrowserContext;
let page!: Page;
let step = 0;
async function fresh() {
  if (context) await context.close();
  context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  });
  page = await context.newPage();
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
}
async function capture(action: unknown) {
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  const record = {
    step: ++step,
    action,
    input: await input.inputValue(),
    visible: await page.locator("body").innerText(),
    screenshot: `${output}/before-${String(step).padStart(2, "0")}.png`,
  };
  await page.screenshot({ path: record.screenshot, fullPage: true });
  appendFileSync(`${output}/initial-ui.jsonl`, JSON.stringify(record) + "\n");
  console.log(
    JSON.stringify({ ...record, visible: record.visible.slice(-8000) }),
  );
}
await fresh();
await capture("fresh opening; implementation not inspected");
try {
  for await (const line of createInterface({ input: process.stdin })) {
    try {
      const action = JSON.parse(line);
      if (action.quit) break;
      if (action.fresh) await fresh();
      const input = page.getByRole("textbox", { name: "Command", exact: true });
      if (action.clear) {
        await input.press("ControlOrMeta+A");
        await input.press("Backspace");
      }
      if (action.type !== undefined) {
        await input.pressSequentially(action.type);
        await input.press("Enter");
        const alias = page.getByRole("textbox", { name: "YOUR ALIAS" });
        if (await alias.isVisible()) {
          await alias.pressSequentially("Ash");
          await page.getByRole("checkbox", { name: /18 or older/ }).check();
          await page
            .getByRole("button", { name: "Enter as Ash", exact: true })
            .click();
        }
      }
      await capture(action);
    } catch (error) {
      console.log(JSON.stringify({ error: String(error) }));
    }
  }
} finally {
  await browser.close();
}
