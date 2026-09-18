import { chromium, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root = "docs/visuals/reviewed-sources/vestibule/draft-v1";
const output = `${root}/review`;
const c = JSON.parse(readFileSync(`${root}/composition.json`, "utf8"));
const layout = JSON.parse(readFileSync(`${root}/layout.json`, "utf8"));
const labels = [
  ["street", "STREET / behind", 4, 199],
  ["washroom", "TOILETS / left", 70, 133],
  ["bar", "BAR / ahead", 144, 53],
  ["cloakroom", "CLOAKROOM / right", 229, 148],
];
const plan = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="672" viewBox="0 0 320 224"><image href="candidate/vestibule__canonical-room__canonical__64-colours.png" width="320" height="224"/><g fill="none" stroke="#9dcacf" stroke-width=".8">${Object.entries<
  number[][]
>(layout.openings)
  .map(([, p]) => `<polygon points="${p.map((p) => p.join(",")).join(" ")}"/>`)
  .join("")}${Object.entries<any>(c.anchors)
  .filter(([id]) => id !== "side_door")
  .map(
    ([, a]) =>
      `<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" stroke="#e7b47d"/>`,
  )
  .join(
    "",
  )}</g><g font-family="monospace" font-size="5" fill="#f9e9ce" stroke="#11111c" stroke-width="1.5" paint-order="stroke">${labels.map(([, label, x, y]) => `<text x="${x}" y="${y}">${label}</text>`).join("")}<text x="182" y="98">INEZ / procedural</text><text x="240" y="217">CHAIR: off-camera →</text></g></svg>`;
writeFileSync(`${root}/layout-final.svg`, plan);
const panels = (size: string) =>
  [
    "open-present-floor",
    "closed-present-floor",
    "open-absent-ledge",
    "closed-absent-ledge",
  ]
    .map(
      (label) =>
        `<figure><figcaption>${label.replaceAll("-", " ")} · ${size}</figcaption><img src="${label}-${size}-viewport.png" width="${size === "desktop" ? 640 : 354}" height="${size === "desktop" ? 448 : 248}" alt="${label} ${size}"></figure>`,
    )
    .join("");
const allCases = [
  "open-present-floor",
  "open-present-ledge",
  "closed-present-floor",
  "closed-present-ledge",
  "open-absent-floor",
  "open-absent-ledge",
  "closed-absent-floor",
  "closed-absent-ledge",
];
writeFileSync(
  `${output}/index.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vestibule draft / visual review</title><style>html{color-scheme:dark}body{margin:24px;background:#110e17;color:#e5d6de;font:15px/1.6 system-ui,sans-serif}h1{font-size:27px}h2{font-size:19px}a{color:#e8aac4}p{max-width:900px}img{display:block;image-rendering:pixelated;max-width:100%;height:auto}figure{margin:0}figcaption{font:12px/2 monospace}.scroll{max-width:100%;overflow:auto}.sheet{background:#19141f;padding:16px;display:grid;grid-template-columns:repeat(2,max-content);gap:18px;width:max-content}.sheet img{max-width:none}.sheet h2{grid-column:1/-1;margin:0}table{border-collapse:collapse}td,th{padding:8px 20px 8px 0;text-align:left;border-bottom:1px solid #443442}</style></head><body>
<h1>Vestibule / one complete draft</h1><p><strong>Unactivated · personal visual review pending.</strong> Dried-wine corridor, dry interior. Street behind at the near-left edge; toilets left; bar ahead; cloakroom right. Objects and effects remain separate. Inez retains the existing procedural representation.</p><p>The chair mentioned in prose is explicitly beyond the near-right camera edge, beside the book/ledge zone. No chair artwork, permanent fixture or new entity was added.</p><p><a href="../REPORT.md">Concise report</a> · <a href="checks.json">State checks</a> · <a href="pixel-validation.json">Pixel checks</a> · <a href="ordinary-desktop.png">Ordinary UI / desktop</a> · <a href="ordinary-mobile.png">Ordinary UI / mobile</a></p>
<h2>Authored layout and empty architecture</h2><p>Route outlines and object boxes below are review annotations only.</p><a href="../layout-final.svg"><img src="../layout-final.png" width="960" height="672" alt="Measured corridor layout with four routes and separate object zones"></a><p><a href="../generated-source.png">Retained generated source</a> · <a href="../candidate/vestibule__canonical-room__canonical__64-colours.png">Imported architecture only</a> · <a href="../authoring-prompt.txt">Authoring prompt</a></p>
${["desktop", "mobile"].map((size) => `<h2>${size === "desktop" ? "Desktop" : "Mobile"} overview</h2><div class="scroll"><section class="sheet" id="${size}-sheet"><h2>${size === "desktop" ? "640 × 448 art" : "354 × 248 art / 390 px browser"} · draft</h2>${panels(size)}</section></div>`).join("")}
<h2>Complete state matrix</h2><table><tr><th>State</th><th>Desktop</th><th>Mobile</th></tr>${allCases.map((label) => `<tr><td>${label.replaceAll("-", " ")}</td><td><a href="${label}-desktop.png">Review</a></td><td><a href="${label}-mobile.png">Review</a></td></tr>`).join("")}</table>
<h2>Additional checks</h2><p><a href="held-desktop.png">Envelope held</a> · <a href="returned-ledge-desktop.png">Return to ledge</a> · <a href="retaken-desktop.png">Retaken</a> · <a href="locked-mobile.png">02:40 lock</a> · <a href="inez-return-desktop.png">Inez returns</a> · <a href="inez-departed-desktop.png">Inez leaves</a> · <a href="reduced-mobile.png">Reduced</a> · <a href="off-mobile.png">Off</a> · <a href="fallback-ledge-mobile.png">Missing ledge</a> · <a href="fallback-plate-mobile.png">Missing background</a></p>
<p>Review route readability, dry material treatment, object cohesion and envelope separation on floor versus ledge. The small notice remains readable through the ordinary text interface. This draft does not request Inez identity approval or activate any new artwork.</p></body></html>`,
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const url = process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173";
  await page.goto(`${url}/${root}/layout-final.svg`);
  await page
    .locator("svg")
    .screenshot({ path: resolve(root, "layout-final.png") });
  await page.goto(`${url}/${output}/index.html`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((i) => i.decode()));
  });
  for (const size of ["desktop", "mobile"])
    await page
      .locator(`#${size}-sheet`)
      .screenshot({ path: resolve(output, `${size}-overview.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    "Static review gallery, measured layout annotation and desktop/mobile overview PNGs saved headlessly.",
  );
} finally {
  await browser.close();
}
