import { chromium, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { SAVE_KEY } from "../src/engine/save";

const output = "docs/design/human-opening-review";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const url = process.env.PLAYTEST_URL ?? "http://127.0.0.1:5173";
const checks: string[] = [];
const errors: string[] = [];
const submissions: {
  viewport: string;
  typed: string;
  submitted: string;
  fieldAfter: string;
  transcriptDelta: number;
}[] = [];
const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
try {
  for (const [size, viewport] of Object.entries({
    desktop: { width: 1280, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    const input = page.getByRole("textbox", { name: "Command", exact: true });
    await input.pressSequentially("take envelope");
    await input.press("Enter");
    await page
      .getByRole("textbox", { name: "YOUR ALIAS" })
      .pressSequentially("Ash");
    await page.getByRole("checkbox", { name: /18 or older/ }).check();
    await page
      .getByRole("button", { name: "Enter as Ash", exact: true })
      .click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    const commands = [
      "read letter",
      "open envelope",
      "read invitation",
      "go outside",
      "open bin",
      "touch brick wall",
    ];
    for (const command of commands) {
      const before = await saved(page);
      await input.pressSequentially(command);
      await input.press("Enter");
      await expect(input).toHaveValue("");
      await expect(input).toBeFocused();
      await expect
        .poll(async () => (await saved(page)).world.transcript.length)
        .toBe(before.world.transcript.length + 1);
      const after = await saved(page);
      expect(after.world.transcript.at(-1).command).toBe(command);
      submissions.push({
        viewport: size,
        typed: command,
        submitted: after.world.transcript.at(-1).command,
        fieldAfter: await input.inputValue(),
        transcriptDelta:
          after.world.transcript.length - before.world.transcript.length,
      });
    }
    const beforeEmpty = await saved(page);
    await input.press("Enter");
    await input.pressSequentially("   ");
    await input.press("Enter");
    expect(await saved(page)).toEqual(beforeEmpty);
    // Explicitly remove only the whitespace draft, never a submitted command.
    await input.press("ControlOrMeta+A");
    await input.press("Backspace");
    await input.pressSequentially("look");
    await input.dispatchEvent("compositionstart");
    await input.press("Enter");
    expect(await saved(page)).toEqual(beforeEmpty);
    await expect(input).toHaveValue("look");
    await input.dispatchEvent("compositionend");
    await input.press("Enter");
    await expect(input).toHaveValue("");
    await expect
      .poll(async () => (await saved(page)).world.transcript.length)
      .toBe(beforeEmpty.world.transcript.length + 1);
    await input.pressSequentially("a newer draft");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("look");
    await input.press("ArrowDown");
    await expect(input).toHaveValue("a newer draft");
    await page.reload();
    await expect(input).toHaveValue("a newer draft");
    await input.press("ControlOrMeta+A");
    await input.press("Backspace");
    await input.pressSequentially("exa");
    await input.press("Tab");
    await expect(input).toHaveValue("examine");
    await input.press("Escape");
    await input.press("ControlOrMeta+A");
    await input.press("Backspace");
    await input.pressSequentially("levitate piano");
    await page
      .getByRole("button", { name: "Submit command", exact: true })
      .click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await page.reload();
    await expect(input).toHaveValue("");
    await page.screenshot({
      path: `${output}/input-fixed-${size}.png`,
      fullPage: true,
    });
    checks.push(
      `${size}: consecutive typing/Enter, one dispatch per command, unsupported responses, empty Enter, composition, history, completion, reload and button focus passed`,
    );
    await context.close();
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  const fixtureUrl = "/scripts/command-input-fixture.tsx";
  await page.evaluate(async (path) => {
    (await import(path)).mount();
  }, fixtureUrl);
  const input = page
    .getByRole("textbox", { name: "Command", exact: true })
    .filter({ visible: true });
  await input.pressSequentially("read letter");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await input.pressSequentially("newer draft");
  await page.evaluate(async (path) => {
    (await import(path)).respond();
  }, fixtureUrl);
  await expect(page.getByRole("log").filter({ visible: true })).toContainText(
    "within reach",
  );
  await expect(input).toHaveValue("newer draft");
  expect(
    await page.evaluate(async (path) => (await import(path)).calls, fixtureUrl),
  ).toEqual(["read letter"]);
  // Two submit events in one turn cannot dispatch the same captured text twice.
  await input.evaluate((el) => {
    const form = el.closest("form")!;
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(input).toHaveValue("");
  expect(
    await page.evaluate(async (path) => (await import(path)).calls, fixtureUrl),
  ).toEqual(["read letter", "newer draft"]);
  checks.push(
    "real CommandTerminal with delayed handler: pending response preserves newer draft; duplicate form events dispatch once",
  );
  await context.close();
  expect(errors).toEqual([]);
  writeFileSync(
    `${output}/input-checks.json`,
    JSON.stringify(
      {
        status: "passed",
        headless: true,
        isolated: true,
        personalSavesAccessed: false,
        checks,
        submissions,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(checks.join("\n"));
} finally {
  await browser.close();
}
