import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(
  new URL("./evidence/beat-milestone/", import.meta.url),
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
});
await context.addInitScript({
  content: `(() => {
 localStorage.setItem('freak-city:v1:autosave','synthetic protected autosave');
 localStorage.setItem('freak-city:v1:bookmark','synthetic protected bookmark');
 sessionStorage.setItem('freak-city:draft','synthetic draft');
 const calls=[]; Object.defineProperty(window,'__storageCalls',{value:calls});
 for(const name of ['getItem','setItem','removeItem','clear']) {
  const original=Storage.prototype[name];
  Storage.prototype[name]=function(...args){calls.push(name);return Reflect.apply(original,this,args)};
 }
})()`,
});
const page = await context.newPage();
const errors: string[] = [];
const checks: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const room = page.locator("#room");
const dialog = page.getByRole("dialog");
async function settled() {
  await expect(room).toHaveAttribute("data-moving", "false", {
    timeout: 12000,
  });
}
async function point(x: number, y: number) {
  const canvas = page.locator("canvas"),
    b = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: (x * b.width) / 960, y: (y * b.height) / 640 },
  });
}
async function choose(name: string) {
  await page
    .locator("#targets")
    .getByRole("button", { name, exact: true })
    .click();
}
async function act(name: string) {
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
  await expect(dialog).not.toBeVisible();
}
async function fits() {
  const b = (await page.locator(".response").boundingBox())!;
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.y + b.height).toBeLessThanOrEqual(768);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const r = (await room.boundingBox())!;
  expect(r.y + r.height).toBeLessThan(b.y);
}
try {
  await page.goto(
    process.env.PROTOTYPE_URL ?? "http://127.0.0.1:5174/__prototype/",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await settled();
  await fits();
  for (const [x, y, label] of [
    [790, 330, "Inez"],
    [777, 344, "Inez"],
    [341, 286, "Bench"],
    [619, 374, "Bench"],
    [181, 221, "Heater"],
    [244, 309, "Heater"],
    [91, 151, "Toilet notice"],
    [818, 211, "Dry ledge"],
    [775, 225, "Black envelope"],
  ] as const) {
    await point(x, y);
    await expect(page.locator("#selection")).toHaveText(label);
    await settled();
  }
  checks.push(
    "Natural head, torso and furniture-edge clicks select visible shapes; envelope wins its overlap with ledge.",
  );
  await choose("Inez");
  await act("Talk to Inez");
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("The alias you want used here")).toBeFocused();
  await page.screenshot({ path: output + "01-alias.png" });
  await page.getByLabel("The alias you want used here").fill("Night Finch");
  await page
    .getByRole("button", { name: "Use this alias only", exact: true })
    .click();
  await settled();
  await expect(page.locator("#speech")).toContainText(
    "Your alias: Night Finch",
  );
  await expect(page.locator("#speech")).toContainText("full name");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Conversation closed.");
  await choose("Inez");
  await act("Talk to Inez");
  await expect(page.locator("#speech")).toContainText("I'm listening");
  await expect(page.locator("#alias")).toHaveCount(0);
  await close();
  checks.push(
    "Typed alias submits; repeated Talk respects introduction; Escape closes without a walking message.",
  );
  await choose("Black envelope");
  await act("Take envelope");
  await act("Open envelope");
  await expect(
    page.locator("#inventory").getByRole("button", {
      name: "The invitation (inside envelope)",
      exact: true,
    }),
  ).toBeVisible();
  await act("Read invitation");
  await expect(page.getByRole("status")).toContainText("COME ALONE");
  await expect(page.locator("#thought")).toContainText("23:41");
  await expect(page.locator("#private-response")).toBeVisible();
  await fits();
  await page.screenshot({ path: output + "02-read-laptop.png" });
  await page
    .locator("#inventory")
    .getByRole("button", {
      name: "The invitation (inside envelope)",
      exact: true,
    })
    .click();
  await act("Show invitation to Inez");
  await expect(page.locator("#speech")).toContainText("I can see it");
  await dialog
    .getByRole("button", { name: "Ask who sent the invitation", exact: true })
    .click();
  await settled();
  await expect(page.locator("#speech")).toContainText(
    "Check the routing record",
  );
  await expect(page.locator("#objective")).toContainText("beat is complete");
  await page.screenshot({ path: output + "03-response.png" });
  await close();
  await fits();
  await page.screenshot({ path: output + "04-objective-laptop.png" });
  expect(
    await page.locator("#inventory button").allTextContents(),
  ).not.toContain("your phone");
  await expect(page.locator("#belonging-note")).toBeVisible();
  checks.push(
    "Invitation opens, reads, discloses and leads to the authored routing-record objective; latest feedback stays visible at 1366×768.",
  );
  await point(180, 500);
  await settled();
  await page
    .getByRole("button", { name: "Use envelope on ledge", exact: true })
    .click();
  await page
    .locator("#inventory")
    .getByRole("button", { name: "black envelope", exact: true })
    .click();
  await settled();
  await expect(page.locator("#selection")).toHaveText("Carried envelope");
  await page.waitForTimeout(3200);
  await expect(page.locator("#custody")).toHaveAttribute(
    "data-location",
    "player",
  );
  await expect(page.getByRole("status")).not.toContainText("Walking to");
  await choose("Inez");
  await page
    .locator("#actions")
    .getByRole("button", { name: "Talk to Inez", exact: true })
    .click();
  await choose("Bench");
  await settled();
  await expect(page.getByRole("status")).not.toContainText("Walking to");
  await expect(dialog).not.toBeVisible();
  await choose("Inez");
  await page
    .locator("#actions")
    .getByRole("button", { name: "Talk to Inez", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await settled();
  await expect(page.getByRole("status")).toHaveText("Walking cancelled.");
  checks.push(
    "Inventory and room-target changes cancel pending actions; Escape cancels approach without stale callbacks.",
  );
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(
    await page.evaluate(() => Reflect.get(window, "__storageCalls")),
  ).toEqual([]);
  expect(
    await page.evaluate(() => localStorage["freak-city:v1:autosave"]),
  ).toBe("synthetic protected autosave");
  expect(
    await page.evaluate(() => localStorage["freak-city:v1:bookmark"]),
  ).toBe("synthetic protected bookmark");
  expect(await page.evaluate(() => sessionStorage["freak-city:draft"])).toBe(
    "synthetic draft",
  );
  checks.push(
    "Zero storage API calls; synthetic normal-game autosave, bookmark and draft remain unchanged; zero desktop axe violations.",
  );
  await page.reload();
  await settled();
  await expect(page.locator("#objective")).toContainText("give the alias");
  await choose("Black envelope");
  await act("Take envelope");
  await act("Open envelope");
  await choose("Inez");
  await act("Ask Inez to watch the envelope");
  await expect(page.locator("#agreement")).toHaveText("No agreement");
  if (await dialog.isVisible()) await close();
  await page
    .locator("#inventory")
    .getByRole("button", { name: "black envelope", exact: true })
    .click();
  await act("Close envelope");
  await choose("Inez");
  await act("Ask Inez to watch the envelope");
  await dialog.getByRole("button", { name: "No, thanks", exact: true }).click();
  await settled();
  await close();
  await choose("Inez");
  await act("Ask Inez to watch the envelope");
  await dialog
    .getByRole("button", { name: "Yes, please", exact: true })
    .click();
  await settled();
  await expect(page.locator("#agreement")).toContainText("active");
  await close();
  await choose("Black envelope");
  await act("Take envelope");
  await expect(page.locator("#agreement")).toContainText("fulfilled");
  checks.push(
    "Reload resets isolated fixture; open-envelope safekeeping refuses; closed-envelope decline/accept/collection remains intact.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox())!.width)
    .toBeLessThan(390);
  await point(600, 500);
  await settled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  checks.push(
    "390px layout and scaled room input still work without horizontal overflow.",
  );
  expect(errors).toEqual([]);
  writeFileSync(
    output + "browser-results.json",
    JSON.stringify({ passed: true, checks, errors, headless: true }, null, 2) +
      "\n",
  );
  console.log(JSON.stringify({ passed: true, checks }, null, 2));
} catch (error) {
  await page.screenshot({ path: output + "failure.png" });
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
