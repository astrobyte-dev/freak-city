import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createFixture } from "./simulation";
import { clearSegment, walkable, type Point } from "./navigation";

const output = fileURLToPath(new URL("./evidence/", import.meta.url));
mkdirSync(output, { recursive: true });
const url = process.env.PROTOTYPE_URL ?? "http://127.0.0.1:5174/__prototype/";
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
});
const page = await context.newPage();
const errors: string[] = [];
const checks: string[] = [];
const sentinels = {
  "freak-city:v1:autosave": JSON.stringify(createFixture()),
  "freak-city:v1:bookmark": "synthetic bookmark: must stay byte-identical",
};
// Raw test instrumentation avoids tsx's name-preservation helper in the browser.
await context.addInitScript({
  content: `(() => {
  const values = ${JSON.stringify(sentinels)};
  for(const [key,value] of Object.entries(values)) localStorage.setItem(key,value);
  sessionStorage.setItem("freak-city:draft","synthetic unfinished draft");
  const calls=[];
  Object.defineProperty(window,"__prototypeStorageCalls",{value:calls});
  for(const method of ["getItem","setItem","removeItem","clear"]){
    const original=Storage.prototype[method];
    Object.defineProperty(Storage.prototype,method,{value:function(...args){
      calls.push(method+":"+args[0]); return Reflect.apply(original,this,args);
    }});
  }
})()`,
});
page.on("pageerror", (e) => errors.push(e.message));
const room = page.locator("#room");
const canvas = page.locator("canvas");
async function point(): Promise<Point> {
  return room.evaluate((e) => ({
    x: Number((e as HTMLElement).dataset.x),
    y: Number((e as HTMLElement).dataset.y),
  }));
}
async function canvasClick(x: number, y: number) {
  const box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: (x * box.width) / 960, y: (y * box.height) / 640 },
  });
}
async function settled() {
  await expect(room).toHaveAttribute("data-moving", "false", {
    timeout: 12000,
  });
}
async function choose(name: string) {
  await page
    .locator("#targets")
    .getByRole("button", { name, exact: true })
    .click();
}
async function action(name: string) {
  await page
    .locator("#actions")
    .getByRole("button", { name, exact: true })
    .click();
  await settled();
}
async function close() {
  await page
    .getByRole("button", { name: "Close conversation", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
try {
  await page.goto(url);
  await expect(canvas).toBeVisible();
  await settled();
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "ledge",
  );
  const clock = await page.locator("#clock").getAttribute("data-seconds");
  await page.screenshot({ path: output + "01-room.png", fullPage: true });
  await canvasClick(480, 180);
  const samples: Point[] = [{ x: 480, y: 540 }];
  await expect(room).toHaveAttribute("data-moving", "true");
  while ((await room.getAttribute("data-moving")) === "true") {
    samples.push(await point());
    await page.waitForTimeout(40);
  }
  samples.push(await point());
  expect(samples.every((p) => walkable(p))).toBe(true);
  expect(
    samples.every((p, i) => i === 0 || clearSegment(samples[i - 1], p)),
  ).toBe(true);
  expect(
    Math.hypot(samples.at(-1)!.x - 480, samples.at(-1)!.y - 180),
  ).toBeLessThan(2);
  expect(await page.locator("#clock").getAttribute("data-seconds")).toBe(clock);
  checks.push(
    "Visible click-to-walk routed around the bench with continuous footprint clearance; no story time elapsed.",
  );
  await canvasClick(480, 60);
  await expect(page.getByRole("status")).toContainText("can't reach");
  expect(await point()).toEqual(samples.at(-1));
  checks.push("Unreachable wall click produces feedback and no movement.");
  await canvasClick(775, 225);
  await expect(page.locator("#selection")).toHaveText("Black envelope");
  await page
    .getByRole("button", { name: "Take envelope", exact: true })
    .dblclick();
  await settled();
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "player",
  );
  expect(await point()).toEqual({ x: 740, y: 330 });
  await expect(
    page
      .locator("#targets")
      .getByRole("button", { name: "Black envelope", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator("#inventory")
      .getByRole("button", { name: "black envelope", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Take envelope", exact: true }),
  ).toHaveCount(0);
  expect(
    await page
      .locator("#journal h3")
      .filter({ hasText: "Take envelope" })
      .count(),
  ).toBe(1);
  checks.push(
    "Canvas target selection, approach, double click cancellation, one physical take and inventory consistency.",
  );
  await page
    .getByRole("button", { name: "Use envelope on ledge", exact: true })
    .click();
  await settled();
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "ledge",
  );
  await choose("Black envelope");
  await action("Take envelope");
  checks.push(
    "Inventory use places the real envelope on the ledge; it can be collected again.",
  );
  await choose("Inez");
  await action("Talk to Inez");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#speech")).not.toBeEmpty();
  await page.screenshot({
    path: output + "02-conversation.png",
    fullPage: true,
  });
  await close();
  await choose("Inez");
  await action("Ask Inez to watch the envelope");
  await expect(page.locator("#speech")).toContainText("00:15");
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "player",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "No, thanks", exact: true })
    .click();
  await settled();
  await expect(page.locator("#agreement")).toHaveText("No agreement");
  await close();
  await choose("Inez");
  await action("Ask Inez to watch the envelope");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Yes, please", exact: true })
    .click();
  await settled();
  await expect(page.locator("#agreement")).toContainText("active");
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "ledge",
  );
  await page.screenshot({ path: output + "03-agreement.png", fullPage: true });
  await close();
  await choose("Black envelope");
  await action("Take envelope");
  await expect(page.locator("#agreement")).toContainText("fulfilled");
  await page.screenshot({ path: output + "04-collected.png", fullPage: true });
  checks.push(
    "Existing authored conversation opens/closes; declined offer changes no custody; accepted agreement and observed collection use established outcomes.",
  );
  await page
    .getByRole("button", { name: "Private thought", exact: true })
    .click();
  await expect(page.locator("#journal h3").first()).toHaveText(
    "Private thought",
  );
  const beforeThink = await page.locator("#clock").getAttribute("data-seconds");
  await page
    .getByRole("button", { name: "Private thought", exact: true })
    .click();
  expect(await page.locator("#clock").getAttribute("data-seconds")).toBe(
    beforeThink,
  );
  checks.push("Private commentary is displayed separately and is untimed.");
  while (
    Number(await page.locator("#clock").getAttribute("data-seconds")) <
    1455 * 60
  )
    await page
      .getByRole("button", { name: "Wait one minute", exact: true })
      .click();
  await expect(
    page.locator("#targets").getByRole("button", { name: "Inez", exact: true }),
  ).toHaveCount(0);
  checks.push(
    "NPC marker and interaction disappear when the existing schedule moves Inez away.",
  );
  expect(
    await page.evaluate(() => Reflect.get(window, "__prototypeStorageCalls")),
  ).toEqual([]);
  expect(
    await page.evaluate(() => Object.fromEntries(Object.entries(localStorage))),
  ).toEqual(sentinels);
  expect(await page.evaluate(() => sessionStorage["freak-city:draft"])).toBe(
    "synthetic unfinished draft",
  );
  checks.push(
    "No storage reads/writes/removals: synthetic autosave, bookmark and session draft unchanged.",
  );
  await page.reload();
  await settled();
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "ledge",
  );
  await expect(page.locator("#agreement")).toHaveText("No agreement");
  checks.push(
    "Reload restarts the disposable fixture, without loading the sentinel autosave.",
  );
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => (await canvas.boundingBox())!.width)
    .toBeLessThan(390);
  await canvasClick(600, 500);
  await settled();
  const mobilePoint = await point();
  expect(Math.hypot(mobilePoint.x - 600, mobilePoint.y - 500)).toBeLessThan(4);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: output + "05-mobile.png", fullPage: true });
  checks.push(
    "390px layout fits; scaled canvas input walks to the expected logical position. Desktop accessibility scan: zero violations.",
  );
  expect(errors).toEqual([]);
  writeFileSync(
    output + "browser-results.json",
    JSON.stringify(
      {
        passed: true,
        url,
        headed: true,
        checks,
        errors,
        movementSamples: samples,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  await page.screenshot({ path: output + "failure.png", fullPage: true });
  writeFileSync(
    output + "browser-results.json",
    JSON.stringify(
      { passed: false, checks, errors, error: String(error) },
      null,
      2,
    ) + "\n",
  );
  throw error;
} finally {
  await browser.close();
}
