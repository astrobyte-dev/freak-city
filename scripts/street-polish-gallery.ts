// Static saved comparisons, rendered only in an isolated headless browser.
import { chromium, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = "docs/visuals/reviewed-sources/street/draft-v2-polish/review";
const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
const panels = ["desktop", "mobile"].flatMap((size) =>
  ["open", "closed", "dropped"].map((state) => {
    const width = size === "desktop" ? 640 : 354;
    return `<section id="${state}-${size}" class="comparison"><h2>${state === "dropped" ? "Open door + dropped envelope" : `${state} side door`} / ${size}</h2><div class="pair">${["before", "after"].map((revision) => `<figure><figcaption>${revision.toUpperCase()}${revision === "before" ? " · original draft" : " · focused polish"}</figcaption><a href="${state}-${size}-${revision}-viewport.png"><img width="${width}" height="${size === "desktop" ? 448 : 248}" src="${state}-${size}-${revision}-viewport.png" alt="${revision} ${state} street at ${size} size"></a></figure>`).join("")}</div></section>`;
  }),
);
writeFileSync(
  resolve(root, "index.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Street · focused polish review</title>
<style>html{color-scheme:dark}body{margin:24px;background:#110e17;color:#e6d8e2;font:15px/1.6 system-ui,sans-serif}h1{font-size:25px}h2{font-size:17px;margin:0 0 12px}a{color:#e9abc6}.comparison{background:#19141f;padding:16px;margin:24px 0;width:max-content;max-width:calc(100% - 32px);overflow:auto}.pair{display:flex;gap:20px;width:max-content}figure{margin:0}figcaption{font:12px/2 monospace;color:#bca4b9}img{display:block;image-rendering:pixelated}p{max-width:880px}.capture{max-width:none}.capture .pair{flex-wrap:nowrap}</style></head>
<body><h1>Street / one focused polish pass</h1><p><strong>Draft only · artwork unactivated · personal review pending.</strong> Architecture, composition, window, awning and overall colour treatment are preserved. Only bin material/contact, open-door recess/reflection, and dropped-envelope contact/contrast changed.</p><p>The approved envelope image remains exactly 10 × 6 source pixels at the same position. Mobile comparisons show the actual 354 × 248 viewport captured in a 390 px browser. Desktop art is 640 × 448. Scroll each pair horizontally if needed; click either image for its original PNG.</p><p><a href="../REPORT.md">Review report</a> · <a href="checks.json">Headless state checks</a> · <a href="pixel-validation.json">Pixel checks</a> · <a href="ordinary-ui-after-desktop.png">Ordinary UI / desktop</a> · <a href="ordinary-ui-after-mobile.png">Ordinary UI / mobile</a></p>
${panels.join("\n")}<p>Review: does the bin belong in the painting, does the open threshold feel deeper without implying a new interior, and can you distinguish the dropped envelope at mobile size? Technical checks cannot substitute for your visual approval.</p></body></html>`,
);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/${root}/index.html`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) => image.decode()),
    );
  });
  for (const size of ["desktop", "mobile"]) {
    for (const state of ["open", "closed", "dropped"]) {
      const panel = page.locator(`#${state}-${size}`);
      await panel.evaluate((element) => element.classList.add("capture"));
      await panel.screenshot({
        path: resolve(root, `comparison-${state}-${size}.png`),
      });
      await panel.evaluate((element) => element.classList.remove("capture"));
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    "Saved six labeled before/after comparison PNGs and a responsive static gallery; headless render passed.",
  );
} finally {
  await browser.close();
}
