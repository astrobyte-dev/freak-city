import { currentDrink } from "../src/trial/vessels";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TRIAL_SAVE, TRIAL_PLAYTEST } from "../src/trial/save";
import type { TrialState } from "../src/trial/state";

const base = process.env.PLAYTEST_URL ?? "http://localhost:5181";
const output = resolve(
  process.env.SABLE_REPORT_DIR ?? "docs/design/sable-playtest-review",
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors: string[] = [],
  externalRequests: string[] = [],
  audits: unknown[] = [];
const commands: unknown[] = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(base) && !/^(blob|data):/.test(request.url()))
      externalRequests.push(request.url());
  });
  await page.goto(`${base}${process.env.SABLE_TRIAL_PATH ?? "/?trial=sable"}`);
  await expect(page.getByRole("textbox", { name: "Your alias" })).toHaveValue(
    "Ash",
  );
  await page.evaluate(() =>
    localStorage.setItem("unrelated-personal-sentinel", "DO-NOT-EXPORT-ME"),
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Begin the Sable trial" }).click();
  const input = page.getByRole("textbox", { name: "Command", exact: true });
  const state = async (): Promise<TrialState> =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), TRIAL_SAVE);
  const archive = async () =>
    page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      TRIAL_PLAYTEST,
    );
  async function command(text: string, outcome = "handled") {
    await expect.poll(state).not.toBeNull();
    const count = (await state()).transcript.length;
    await input.fill(text);
    await input.press("Enter");
    await expect
      .poll(async () => (await state()).transcript.length)
      .toBe(count + 1);
    const entry = (await state()).transcript.at(-1)!;
    expect(entry.command).toBe(text);
    expect(entry.diagnostics!.at(-1)!.outcome, text).toBe(outcome);
    expect(
      await page.getByRole("log").locator("article").last().innerText(),
    ).toContain(entry.lines[0]);
    commands.push(entry);
    return entry.lines.join("\n");
  }
  async function download(button: RegExp, filename: string) {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: button }).click();
    const file = await pending;
    await file.saveAs(resolve(output, filename));
    return readFileSync(resolve(output, filename), "utf8");
  }
  await page
    .getByRole("button", { name: "Trial settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Bookmark trial", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Trial settings", exact: true })
    .click();
  // Preserve the original exploratory wording and order. Repeated WATER now serves
  // a second declared vessel; subsequent ambiguous nouns must clarify.
  for (const text of [
    "look",
    "talk with sable",
    "water please",
    "water",
    "sip water",
    "take water",
    "talk",
    "what is my usual water?",
    "no",
    "take",
    "help",
    "ask sable about memories",
    "tell me more",
    "what else do you remember?",
    "i agree",
    "i disagree",
    "think",
    "think",
    "ask",
    "look",
    "ash?",
    "talk",
    "yes",
    "?",
  ]) {
    const response = await command(
      text,
      [
        "take",
        "ask",
        "i agree",
        "i disagree",
        "sip water",
        "take water",
      ].includes(text)
        ? "clarified"
        : "handled",
    );
    if (text === "water please")
      expect(response).toContain("sets a glass of water");
    if (text === "yes") expect(response).not.toContain("sets a glass of water");
    if (text === "help" || text === "?")
      expect(response).not.toMatch(/TAKE PHOTO|SHOW PHOTO|relay/);
    if (text === "i disagree") expect(response).toContain("hospital");
    if (text === "ash?")
      expect(response).toContain("alias for this run is Ash");
  }
  // The two waters now require a named vessel before testing a refill.
  await command("finish cup");
  await command("talk");
  const offered = await state();
  await command("look");
  await command("inventory");
  const beforeReload = await state();
  await page.reload();
  expect(await state()).toEqual(beforeReload);
  expect((await state()).context).toEqual(offered.context);
  await command("yes");
  expect(currentDrink(await state())?.remaining).toBe(3);
  await command("ask sable about memories");
  await command("look");
  await page.reload();
  expect(await command("tell me more")).toContain("dream feels familiar");
  await command("i disagree", "clarified");
  await command("look");
  await page.reload();
  expect(await command("the dream")).toContain("The dream, then");
  await command("  look; inventory  ");
  const beforeExport = await state();
  await expect
    .poll(async () => (await archive()).segments[0].entries.length)
    .toBe(beforeExport.transcript.length);
  const archiveBefore = await archive();
  await page
    .getByRole("button", { name: "Export playtest", exact: true })
    .click();
  await page
    .getByLabel("What I was trying to do / What went wrong (optional)")
    .fill(
      "I wanted water and an ordinary conversation; checking the repaired opening.",
    );
  const markdown = await download(
    /^Download transcript/,
    "opening-transcript.md",
  );
  const diagnosticRaw = await download(
    /^Download diagnostics/,
    "opening-diagnostics-SPOILERS.json",
  );
  const diagnostic = JSON.parse(diagnosticRaw);
  expect(diagnostic.state).toEqual(beforeExport);
  expect(diagnostic.history).toEqual(archiveBefore);
  expect(diagnostic.identifiers.appVersion).not.toBe("not supplied");
  expect(diagnostic.identifiers.baseCommit).toMatch(/^[a-f0-9]{7}$/);
  expect(diagnosticRaw).not.toMatch(
    /DO-NOT-EXPORT-ME|C:\\\\Users|unrelated-personal-sentinel/,
  );
  let index = -1;
  for (const entry of beforeExport.transcript) {
    if (entry.command) {
      index = markdown.indexOf(`\n${entry.command}\n`, index + 1);
      expect(index, entry.command).toBeGreaterThan(-1);
    }
    for (const line of entry.lines) {
      index = markdown.indexOf(`\n${line}\n`, index + 1);
      expect(index, line).toBeGreaterThan(-1);
    }
  }
  expect(await state()).toEqual(beforeExport);
  expect(await archive()).toEqual(archiveBefore);
  for (const [label, width, height] of [
    ["desktop", 1280, 1000],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: resolve(output, `export-${label}.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    audits.push({ label, violations: audit.violations });
    expect(audit.violations).toEqual([]);
  }
  await page
    .getByLabel("What I was trying to do / What went wrong (optional)")
    .fill("");
  expect(await download(/^Download transcript/, "without-note.md")).toContain(
    "No note supplied.",
  );
  expect(await state()).toEqual(beforeExport);
  await page.getByRole("button", { name: "Close export" }).click();
  await page
    .getByRole("button", { name: "Trial settings", exact: true })
    .click();
  const restorable = await download(
    /^Export trial save$/,
    "restorable-trial-save.json",
  );
  expect(JSON.parse(restorable)).toEqual(beforeExport);
  await page.getByRole("button", { name: "Restore trial bookmark" }).click();
  await expect.poll(async () => (await state()).transcript.length).toBe(1);
  await command("look");
  await page
    .getByRole("button", { name: "Restart trial", exact: true })
    .click();
  await expect.poll(async () => (await state()).transcript.length).toBe(1);
  const imported = structuredClone(beforeExport) as any;
  delete imported.revision;
  delete imported.drink;
  delete imported.lastVesselId;
  delete imported.objectFocus;
  imported.observations = imported.observations.filter(
    (o: any) =>
      !o.evidence.some((id: string) =>
        ["trial-cup", "trial-glass", "trial-counter", "trial-menu"].includes(
          id,
        ),
      ),
  );
  for (const id of ["trial-cup", "trial-glass", "trial-counter", "trial-menu"])
    delete imported.entities[id];
  delete imported.thoughtsShown;
  for (const entry of imported.transcript) {
    delete entry.room;
    delete entry.startedAt;
    delete entry.startRoom;
    delete entry.diagnostics;
  }
  const upload = page.getByLabel("Import a Sable trial save");
  await upload.setInputFiles({
    name: "old-trial.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(page.getByRole("alert")).toContainText("Trial imported");
  expect(currentDrink(await state())).toBeUndefined();
  await page.reload();
  expect((await archive()).segments.map((s: any) => s.reason)).toEqual([
    "start",
    "bookmark",
    "restart",
    "import",
  ]);
  const preserved = await state();
  await upload.setInputFiles({
    name: "diagnostic.json",
    mimeType: "application/json",
    buffer: Buffer.from(diagnosticRaw),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Invalid or incompatible",
  );
  expect(await state()).toEqual(preserved);
  await page
    .getByRole("button", { name: "Export playtest", exact: true })
    .click();
  const branches = await download(
    /^Download transcript/,
    "restore-restart-import-transcript.md",
  );
  expect(branches).toContain("abandoned branch");
  expect(branches).toContain("separate run");
  expect(branches).toContain("Imported snapshot");
  expect(branches).toContain("Location not recorded");
  expect(branches).toContain("water please");
  expect(await state()).toEqual(preserved);
  await page.getByRole("button", { name: "Close export" }).click();
  await page
    .getByRole("button", { name: "Trial settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete trial data" }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), TRIAL_PLAYTEST),
  ).toBeNull();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("unrelated-personal-sentinel"),
    ),
  ).toBe("DO-NOT-EXPORT-ME");
  await page.getByRole("textbox", { name: "Your alias" }).fill("Rowan");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Begin the Sable trial" }).click();
  await command("talk");
  await command("water please");
  await command("finish glass");
  expect(await command("talk")).toContain("usual water, Rowan");
  expect(
    (await state()).transcript.flatMap((t) => t.lines).join(" "),
  ).not.toContain("Ash");
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
  writeFileSync(
    resolve(output, "browser-results.json"),
    JSON.stringify(
      {
        passed: true,
        commands,
        audits,
        errors,
        externalRequests,
        checks: [
          "user wording",
          "custom alias",
          "pending question reload",
          "hospital followup reload",
          "exact ordered Markdown",
          "pure local export",
          "optional note",
          "restorable save distinct",
          "bookmark/restart/import boundaries",
          "old-save missing history",
          "diagnostic import rejected",
          "unrelated storage preserved",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Passed exploratory opening, export downloads, reload and branch boundaries; two accessibility scans. " +
      output,
  );
} catch (error) {
  writeFileSync(
    resolve(output, "browser-results.json"),
    JSON.stringify(
      {
        passed: false,
        error: String(error),
        commands,
        audits,
        errors,
        externalRequests,
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
