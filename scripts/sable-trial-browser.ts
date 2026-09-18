import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { TRIAL_BOOKMARK, TRIAL_DRAFT, TRIAL_SAVE } from "../src/trial/save";
import type { TrialState } from "../src/trial/state";
import { SAVE_KEY } from "../src/engine/save";
import { newGame } from "../src/engine/game";

const base = process.env.PLAYTEST_URL ?? "http://localhost:5181";
const output = resolve(
  process.env.SABLE_REPORT_DIR ?? "docs/design/sable-trial-review",
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results: unknown[] = [],
  errors: string[] = [],
  audits: unknown[] = [];
try {
  for (const path of ["direct", "vesper"] as const)
    for (const course of ["formal", "document"] as const) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      const legacy = JSON.stringify(newGame());
      await page.goto(
        `${base}${process.env.SABLE_TRIAL_PATH ?? "/?trial=sable"}`,
      );
      await page.evaluate(
        ({ legacy, key }) => {
          localStorage.setItem(key, legacy);
          localStorage.setItem(
            "freak-city:v1:bookmark",
            "legacy-bookmark-sentinel",
          );
          sessionStorage.setItem(
            "freak-city:command:NIGHT-0",
            "legacy-draft-sentinel",
          );
        },
        { legacy, key: SAVE_KEY },
      );
      await page.getByRole("textbox", { name: "Your alias" }).fill("Rowan");
      await page.getByRole("checkbox", { name: "I’m 18 or older." }).check();
      await page.getByRole("button", { name: "Begin the Sable trial" }).click();
      const input = page.getByRole("textbox", { name: "Command", exact: true });
      const state = async (): Promise<TrialState> =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!),
          TRIAL_SAVE,
        );
      async function command(command: string, failure = false) {
        const count = (await state()).transcript.length;
        await input.fill(command);
        await input.press("Enter");
        await expect
          .poll(async () => (await state()).transcript.length)
          .toBeGreaterThan(count);
        expect((await state()).transcript.at(-1)?.failed, command).toBe(
          failure,
        );
        await expect(input).toHaveValue("");
      }
      await command("talk to Sable");
      await command("tea");
      await command("ask Sable about roleplay");
      if (course === "document") await command("wait for two hours");
      for (const c of [
        "ask Sable about their memories",
        "go shop",
        "take photo",
        "read photo",
        "take listing",
        "read listing",
      ])
        await command(c);
      const beforeReading = (await state()).time;
      await command("think");
      await command("journal");
      expect((await state()).time).toBe(beforeReading);
      if (path === "direct") {
        await command("go bar");
        await command("show photo to Sable");
        await command("show listing to Sable");
        await command("I disagree");
      } else {
        await command("show photo to Vesper");
        await command("show listing to Vesper");
        await command("ask Vesper to tell Sable");
      }
      const pending = await state();
      await input.fill("ask Sable about the investigation");
      await page.reload();
      await expect(input).toHaveValue("ask Sable about the investigation");
      expect(await state()).toEqual(pending);
      await command("go home");
      for (let i = 0; i < 4; i++)
        await page
          .getByRole("button", {
            name: "Optional: rest to tomorrow, 18:00",
            exact: true,
          })
          .click();
      await command("wait for two hours");
      await command("go bar");
      expect((await state()).updateAt).toBeUndefined();
      await command("talk privately");
      let current = await state();
      expect(current.receipt?.path).toBe(path);
      expect(current.completed?.course).toBe(course);
      expect(current.updateAt).toBeDefined();
      await page.screenshot({
        path: resolve(output, `${path}-${course}-desktop.png`),
        fullPage: true,
      });
      await command(
        `ask Sable to show the ${course === "formal" ? "report" : "notebook"}`,
      );
      const delivered = (await state()).updateAt;
      await page.reload();
      await command("ask Sable about the update");
      expect((await state()).updateAt).toBe(delivered);
      expect(
        (await state()).transcript
          .flatMap((t) => t.lines)
          .filter((l) => l.startsWith("Sable: ‘It's been")),
      ).toHaveLength(1);
      expect(
        await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
      ).toBe(legacy);
      await page
        .getByRole("button", { name: "Trial settings", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Bookmark trial", exact: true })
        .click();
      expect(
        await page.evaluate(
          (key) => !!localStorage.getItem(key),
          TRIAL_BOOKMARK,
        ),
      ).toBe(true);
      await command("go bar");
      await page
        .getByRole("button", { name: "Restore trial bookmark", exact: true })
        .click();
      expect((await state()).room).toBe("booth");
      await page
        .getByRole("button", { name: "Trial settings", exact: true })
        .click();
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      audits.push({
        path,
        course,
        viewport: "desktop",
        violations: audit.violations,
      });
      expect(audit.violations).toEqual([]);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: resolve(output, `${path}-${course}-mobile.png`),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const mobileAudit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      audits.push({
        path,
        course,
        viewport: "mobile",
        violations: mobileAudit.violations,
      });
      expect(mobileAudit.violations).toEqual([]);
      current = await state();
      results.push({
        path,
        course,
        receipt: current.receipt,
        decision: current.decision,
        completed: current.completed,
        updateAt: current.updateAt,
        commands: current.transcript.length,
      });
      writeFileSync(
        resolve(output, `${path}-${course}-transcript.txt`),
        current.transcript
          .map((t) => `> ${t.command}\n${t.lines.join("\n")}`)
          .join("\n\n"),
      );
      await page
        .getByRole("button", { name: "Trial settings", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Delete trial data", exact: true })
        .click();
      expect(
        await page.evaluate((key) => localStorage.getItem(key), TRIAL_SAVE),
      ).toBeNull();
      expect(
        await page.evaluate((key) => sessionStorage.getItem(key), TRIAL_DRAFT),
      ).toBeNull();
      expect(
        await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY),
      ).toBe(legacy);
      expect(
        await page.evaluate(() =>
          localStorage.getItem("freak-city:v1:bookmark"),
        ),
      ).toBe("legacy-bookmark-sentinel");
      expect(
        await page.evaluate(() =>
          sessionStorage.getItem("freak-city:command:NIGHT-0"),
        ),
      ).toBe("legacy-draft-sentinel");
      await page.goto(base);
      await expect(page.getByRole("heading", { level: 1 })).not.toContainText(
        "A date that doesn't fit",
      );
      await context.close();
    }
  expect(errors).toEqual([]);
  writeFileSync(
    resolve(output, "browser-results.json"),
    JSON.stringify({ passed: true, results, audits, errors }, null, 2),
  );
  console.log(
    `Passed four full browser paths, eight accessibility scans, reload/draft/bookmark and legacy storage isolation. Evidence: ${output}`,
  );
} catch (error) {
  writeFileSync(
    resolve(output, "browser-results.json"),
    JSON.stringify(
      { passed: false, error: String(error), results, audits, errors },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
