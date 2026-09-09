// Approved shipping sprites in the real compositor and ordinary parser UI.
import { chromium, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { approvedVelvetPilot as velvetPilot } from "../src/content/visuals/velvet-overlay";
import {
  pilotProblems,
  velvetContacts,
  velvetCounter,
  velvetFloor,
} from "../src/visuals/velvet-pilot";
const output = resolve("docs/visuals/velvet-overlay-activation");
mkdirSync(output, { recursive: true });
mkdirSync(".visuals", { recursive: true });
const registry = readFileSync("src/content/visuals/assets.json");
const hash = (v: Buffer) => createHash("sha256").update(v).digest("hex");
if (pilotProblems(velvetPilot).length)
  throw new Error(pilotProblems(velvetPilot).join("\n"));
writeFileSync(
  ".visuals/velvet-pilot.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Velvet overlay pilot · approved activation</title><main id="root"></main><script type="module" src="/.visuals/velvet-pilot.tsx"></script></html>',
);
writeFileSync(
  ".visuals/velvet-pilot.tsx",
  `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {LocationVisual} from '../src/components/LocationVisual';
import {deriveVisualState} from '../src/visuals/derive';
import {deriveVelvetPilot,hasPilotReflection} from '../src/visuals/velvet-pilot';
import {velvetState} from '../scripts/velvet-pilot-fixture';
import {approvedVelvetPilot as velvetPilot} from '../src/content/visuals/velvet-overlay';
import '../src/styles.css';
const root=createRoot(document.getElementById('root'));
window.pilotReview=(options={})=>{
 const {band='early',envelope='held',staging='floor',width=640,mode='on',lighting,enabled=true,label='early'}=options;
 const {state,commands}=velvetState(band,envelope); const d=deriveVisualState(state,lighting?{lighting}:{});
 const pilot={...velvetPilot,maraStaging:staging};const entities=deriveVelvetPilot(d,pilot);
 root.render(<section id="pilot-review" data-label={label} style={{width,maxWidth:'100%',margin:'0 auto'}}>
 <style>{'.location-visual{margin:0;width:100%;border:0}.visual-viewport{animation:none}.visual-light{transition:none}body{margin:0;padding:16px;background:#110e17;box-sizing:border-box}*{box-sizing:border-box}'}</style>
 <p style={{font:'12px monospace',color:'#bd9dae'}}>APPROVED OVERLAY / FEATURE BRANCH / {label}</p>
 <LocationVisual descriptor={d} mode={mode} overlayPilot={enabled?pilot:undefined}/></section>);
 return {label,band,time:state.time,lighting:d.lighting,crowd:d.crowdLevel,npcs:d.npcPresence.map(n=>n.id),commands,
  envelopeLocation:state.world.entities.envelope.location,base:d.baseArt?.file,baseSha256:d.baseArt?.sha256,
  entities:entities.map(e=>({id:e.id,kind:e.kind,spriteId:e.spriteId,sha256:e.sprite.sha256,contact:e.contact,reflection:hasPilotReflection(e)})),
  lightingStudy:!!lighting,mode,width,enabled};
};window.pilotReview();
`,
);
const browser = await chromium.launch();
const errors: string[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 850 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    new URL(
      "/.visuals/velvet-pilot.html",
      process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5182",
    ).href,
  );
  await page.waitForFunction(
    () => typeof (window as any).pilotReview === "function",
  );
  async function show(options: Record<string, unknown>) {
    const record = await page.evaluate(
      (o) => (window as any).pilotReview(o),
      options,
    );
    await expect(page.locator("#pilot-review")).toHaveAttribute(
      "data-label",
      String(options.label),
    );
    await page.evaluate(async () => {
      const urls = [
        ...Array.from(document.images).map((i) => i.src),
        ...Array.from(document.querySelectorAll("svg image")).map((i) =>
          i.getAttribute("href")!,
        ),
      ];
      await Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((ok, no) => {
              const i = new Image();
              i.onload = () => ok();
              i.onerror = () => no(new Error("Image failed: " + url));
              i.src = url;
            }),
        ),
      );
    });
    await expect(page.locator(".location-visual")).toHaveAttribute(
      "data-base",
      record.base,
    );
    expect(record.baseSha256).toBe(velvetPilot.plateSha256);
    if (options.mode !== "off") {
      expect(
        await page
          .locator("[data-visual-npc]")
          .evaluateAll((ns) =>
            ns.map((n) => n.getAttribute("data-visual-npc")),
          ),
      ).toEqual(record.npcs);
      if (options.enabled !== false) {
        expect(await page.locator("[data-anonymous-patron]").count()).toBe(
          record.crowd === "busy" ? 5 : record.crowd === "sparse" ? 2 : 0,
        );
        const reflections = await page
          .locator("[data-reflection-owner]")
          .evaluateAll((ns) =>
            ns.map((n) => n.getAttribute("data-reflection-owner")).sort(),
          );
        expect(reflections).toEqual(
          record.entities
            .filter((e: any) => e.reflection)
            .map((e: any) => e.id)
            .sort(),
        );
        expect(
          await page
            .locator("[data-sprite-id] image")
            .evaluateAll((ns) =>
              ns.every(
                (n) => getComputedStyle(n).imageRendering === "pixelated",
              ),
            ),
        ).toBe(true);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    return record;
  }
  const records = [];
  for (const options of [
    { label: "early-640" },
    { label: "late-anonymous", band: "late" },
    { label: "dawn-empty", band: "dawn" },
    { label: "envelope-present", envelope: "dropped" },
    { label: "envelope-retaken", envelope: "retaken" },
    { label: "behind-counter", staging: "behind-counter" },
    { label: "early-320", width: 320 },
    { label: "mara-low-light-study", lighting: "low" },
    { label: "mara-morning-light-study", lighting: "morning" },
    { label: "canonical-runtime", enabled: false },
  ]) {
    const record = await show(options);
    await page
      .locator("#pilot-review")
      .screenshot({ path: resolve(output, options.label + ".png") });
    const size = await page.locator(".visual-viewport").boundingBox();
    expect(size?.width).toBe(options.width ?? 640);
    expect(size?.height).toBe((options.width ?? 640) * 0.7);
    records.push({ ...record, viewport: size });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await show({ label: "mobile-390" });
  await page
    .locator("#pilot-review")
    .screenshot({ path: resolve(output, "mobile-390.png") });
  records.push({
    ...mobile,
    viewport: await page.locator(".visual-viewport").boundingBox(),
    mobileNoOverflow: true,
  });
  await show({ label: "off", mode: "off" });
  await expect(page.locator(".visual-off")).toBeVisible();
  await expect(page.locator("svg,img")).toHaveCount(0);
  await show({ label: "reduced", mode: "reduced" });
  await expect(page.locator(".visual-reduced")).toBeVisible();
  // A failed primary sprite must take its owned reflection and shadow with it.
  await page.route("**/sprites/mara.png", (route) => route.abort());
  await page.reload();
  await expect(page.locator('[data-sprite-id="mara"]')).toHaveCount(0);
  await expect(page.locator('[data-reflection-owner="mara"]')).toHaveCount(0);
  await expect(page.locator(".visual-presence")).toContainText("Mara");
  await page.unroute("**/sprites/mara.png");
  // Enter through the ordinary application: no injected descriptor or overlay prop.
  await page.goto(process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5182");
  const command = async (text: string) => {
    const input = page.getByRole("textbox", { name: "Command", exact: true });
    await input.fill(text);
    await input.press("Enter");
  };
  await command("take envelope");
  await page.getByRole("textbox", { name: "YOUR ALIAS" }).fill("Ash");
  await page.getByRole("checkbox", { name: /18 or older/ }).check();
  await page.getByRole("button", { name: "Enter as Ash", exact: true }).click();
  for (const text of ["go outside", "go inside", "go bar", "drop envelope"])
    await command(text);
  await expect(
    page.locator('[data-review-status="approved-direction"]'),
  ).toBeVisible();
  await expect(page.locator('[data-sprite-id="mara"]')).toBeVisible();
  await expect(page.locator('[data-reflection-owner="envelope"]')).toHaveCount(
    1,
  );
  await page.screenshot({
    path: resolve(output, "ordinary-play-mobile.png"),
    fullPage: true,
  });
  await command("take envelope");
  await expect(page.locator('[data-sprite-id="envelope"]')).toHaveCount(0);
  await expect(page.locator('[data-reflection-owner="envelope"]')).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: resolve(output, "ordinary-play-desktop.png"),
    fullPage: true,
  });
  if (errors.length) throw new Error(errors.join("\n"));
  expect(readFileSync("src/content/visuals/assets.json").equals(registry)).toBe(
    true,
  );
  writeFileSync(
    resolve(output, "runtime.json"),
    JSON.stringify(
      {
        status: "approved-direction; active in ordinary feature play",
        registrySha256: hash(registry),
        checks: [
          "actual parser movement/custody",
          "actual early/late/dawn schedules",
          "exact 320 and 640 viewport",
          "nearest-neighbour sprite rendering",
          "entity-owned reflection presence/absence",
          "counter staging",
          "mobile without overflow",
          "Off",
          "Reduced",
          "sprite failure removes owned reflection; text retained",
          "ordinary application mobile/desktop parser play with default approved sprites",
        ],
        records,
        contacts: velvetContacts,
        counterPolygon: velvetCounter,
        floorPolygon: velvetFloor,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Velvet pilot: ${records.length} composites, custody/reflections/mobile/Off/Reduced/failure checks passed.`,
  );
} finally {
  await browser.close();
}
