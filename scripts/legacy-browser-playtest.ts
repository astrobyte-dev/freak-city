import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { scenes } from "../src/content/scenes";
import { newGame } from "../src/engine/game";
import { playExpandedRoute } from "../tests/expanded-routes";
import { phoneReplies } from "../src/content/phone";
import { routes } from "../tests/routes";
import { SAVE_KEY } from "../src/engine/save";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors: string[] = [];
const external: string[] = [];
const a11y: { screen: string; violations: unknown[] }[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (
    !r.url().startsWith("http://localhost:5173") &&
    !r.url().startsWith("data:")
  )
    external.push(r.url());
});
async function audit(screen: string) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  a11y.push({
    screen,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
}
await page.goto("http://localhost:5173");
await page.evaluate(() => document.fonts.ready);
await expect(page.locator("h1")).toContainText("An address.");
await page.screenshot({
  path: "artifacts/desktop-opening.png",
  fullPage: true,
});
await audit("desktop opening");
await page.getByRole("button", { name: "Settings", exact: true }).click();
await expect(page.getByRole("dialog")).toBeVisible();
await page
  .getByRole("button", { name: "Your boundaries Allowed, implied only, skip" })
  .click();
await page
  .getByRole("button", { name: "Skip all optional mature themes" })
  .click();
await expect(page.locator(".segmented button.selected")).toHaveCount(11);
await audit("boundaries");
await page.getByRole("button", { name: "Close dialog" }).click();
await page
  .locator("button.choice:not(:disabled)")
  .filter({ hasText: "“This is the place.”" })
  .click();
await page.getByRole("textbox", { name: "YOUR ALIAS" }).fill("Ash");
await page.getByRole("checkbox", { name: /I’m 18 or older/ }).check();
await page.getByRole("button", { name: "Enter as Ash", exact: true }).click();
await expect(page.locator("h1")).toContainText("A name you can");
for (const id of routes.honest
  .slice(1)
  .flatMap((id) =>
    [
      "boundary_sender",
      "debt_sender",
      "distance_sender",
      "focus_ledger",
    ].includes(id)
      ? [id, "decide_now"]
      : [id],
  )) {
  const s = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  const c = scenes[s.scene].choices.find((c) => c.id === id)!;
  if (!c) throw new Error(`Missing ${id} in ${s.scene}`);
  await page
    .locator("button.choice:not(:disabled)")
    .filter({ hasText: c.label })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).scene,
        SAVE_KEY,
      ),
    )
    .toBe(c.to);
}
await expect(
  page.getByText("FIRST NIGHT COMPLETE", { exact: true }),
).toBeVisible();
await page.screenshot({ path: "artifacts/desktop-ending.png", fullPage: true });
await audit("ending");
const ended = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
await page.reload();
await expect(page.locator("h1")).toContainText("Some names");
expect(
  JSON.parse(
    (await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))!,
  ),
).toEqual(JSON.parse(ended!));
await page.getByRole("button", { name: "Journal", exact: true }).click();
await expect(page.getByRole("dialog")).toContainText("Inez Vale");
await audit("journal");
await page.getByRole("button", { name: "Close dialog" }).click();
await page.getByRole("button", { name: /Phone, .* unread messages/ }).click();
await expect(page.getByRole("dialog")).toContainText("Inez");
await audit("phone");
await page.getByRole("button", { name: "Close dialog" }).click();
for (const name of ["Belongings", "The city"]) {
  await page.getByRole("button", { name, exact: true }).click();
  await audit(name);
  await page.getByRole("button", { name: "Close dialog" }).click();
}
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(
  ({ key, s }) => localStorage.setItem(key, JSON.stringify(s)),
  { key: SAVE_KEY, s: newGame() },
);
await page.reload();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "artifacts/mobile-opening.png", fullPage: true });
expect(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
).toBe(true);
await audit("mobile opening");
await page.getByRole("button", { name: "Toggle navigation" }).click();
await page.getByRole("button", { name: "People", exact: true }).click();
await expect(page.getByRole("dialog")).toBeVisible();
await audit("mobile people");
await page.screenshot({ path: "artifacts/mobile-people.png", fullPage: true });
await page.keyboard.press("Escape");
await expect(page.getByRole("dialog")).toHaveCount(0);
await page.getByRole("button", { name: "Settings", exact: true }).click();
await audit("mobile settings");
await page
  .getByRole("button", {
    name: "THE PULL Private thematic engagement & reflection",
  })
  .click();
await audit("mobile interests");
await page.getByRole("button", { name: "Clear learned interests" }).click();
await expect
  .poll(async () =>
    page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).pull.entries.curiosity.interest,
      SAVE_KEY,
    ),
  )
  .toBe(0);
await page.getByRole("button", { name: "Close dialog" }).click();
await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("button", { name: "Bookmark", exact: true }).click();
await page.getByRole("button", { name: "Restore", exact: true }).click();
await expect(page.getByRole("dialog")).toHaveCount(0);
await page.getByRole("button", { name: "Settings", exact: true }).click();
await page
  .getByRole("button", {
    name: "Delete local data Remove this game’s saves and learned interests",
  })
  .click();
await page
  .getByRole("button", { name: "Delete local game data", exact: true })
  .click();
await expect
  .poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY))
  .toBeNull();
await expect(page.getByRole("dialog")).toHaveCount(0);
// Exercise the connected expansion through visible choices, including the richer phone.
await page.setViewportSize({ width: 1440, height: 1100 });
const fresh = newGame("NIGHT-0");
fresh.started = true;
fresh.alias = "Ash";
await page.evaluate(
  ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
  { key: SAVE_KEY, state: fresh },
);
await page.reload();
const expanded = playExpandedRoute(["mara", "celeste"]);
let expandedPhoneChecked = false;
for (const row of expanded.transcript) {
  const id = row.split(" → ")[1];
  const current = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  const choice = scenes[current.scene].choices.find((c) => c.id === id);
  if (!choice)
    throw new Error(`Expanded browser route missing ${id} at ${current.scene}`);
  await page
    .locator("button.choice:not(:disabled)")
    .filter({ hasText: choice.label })
    .click();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).scene,
        SAVE_KEY,
      ),
    )
    .toBe(choice.to);
  if (choice.to === "celeste_r8" && !expandedPhoneChecked) {
    await page.screenshot({
      path: "artifacts/expanded-celeste.png",
      fullPage: true,
    });
    await audit("expanded relationship");
    await page
      .getByRole("button", { name: /Phone, .* unread messages/ })
      .click();
    await expect(page.locator(".message-image")).toBeVisible();
    const reply = phoneReplies["celeste-later"].options[0].text;
    await page.getByRole("button", { name: new RegExp(reply) }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(reply) }),
    ).toHaveCount(0);
    await audit("expanded phone with image and authored replies");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit("mobile expanded phone");
    await page.screenshot({
      path: "artifacts/mobile-expanded-phone.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.reload();
    await expect
      .poll(async () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!).scene,
          SAVE_KEY,
        ),
      )
      .toBe("celeste_r8");
    expandedPhoneChecked = true;
  }
}
const expandedFinal = await page.evaluate(
  (key) => JSON.parse(localStorage.getItem(key)!),
  SAVE_KEY,
);
expect(expandedFinal.flags.mara_closed).toBe(true);
expect(expandedFinal.flags.celeste_closed).toBe(true);
expect(expandedPhoneChecked).toBe(true);
const report = {
  browser: "Chromium",
  expandedRoute: "Mara and Celeste, first meetings and closing returns",
  expandedPhoneReplyAndReload: expandedPhoneChecked,
  desktop: "1440x1100",
  mobile: "390x844",
  fullRoute: "honest with every optional mature theme skipped",
  reloadRestored: true,
  bookmarksRestored: true,
  interestsReset: true,
  localErasureVerified: true,
  noHorizontalOverflow: true,
  pageErrors: errors,
  externalRequests: external,
  a11y,
};
writeFileSync(
  "artifacts/browser-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      ...report,
      a11y: a11y.map((x) => ({ screen: x.screen, violations: x.violations })),
    },
    null,
    2,
  ),
);
await browser.close();
if (errors.length || external.length || a11y.some((x) => x.violations.length))
  process.exitCode = 1;
