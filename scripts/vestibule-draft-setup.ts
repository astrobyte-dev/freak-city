// Draft-only export and authored blockout; never edits shipping files.
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import { generationDefinition } from "../src/content/visuals/generation";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";

const root = "docs/visuals/reviewed-sources/vestibule/draft-v1";
if (existsSync(`${root}/protected-files.json`))
  throw new Error("Refusing to overwrite the retained draft setup/baseline.");
mkdirSync(`${root}/review`, { recursive: true });
mkdirSync(`${root}/layers`, { recursive: true });
const hash = (f: string) =>
  createHash("sha256").update(readFileSync(f)).digest("hex");
const inventory = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((p) =>
    p.isDirectory() ? inventory(`${dir}/${p.name}`) : [`${dir}/${p.name}`],
  );
writeFileSync(
  `${root}/protected-files.json`,
  JSON.stringify(
    Object.fromEntries(
      [...inventory("src"), ...inventory("public")].map((f) => [f, hash(f)]),
    ),
    null,
    2,
  ) + "\n",
);
const manifest = generationDefinition(
  "vestibule",
  ensureWorld(newGame("NIGHT-0")),
  "canonical-room",
);
writeFileSync(
  `${root}/world-manifest.json`,
  JSON.stringify(manifest, null, 2) + "\n",
);
const layout = {
  id: "velvet-vestibule-layout",
  version: 1,
  roomId: "vestibule",
  status: "draft",
  frame: [320, 224],
  coordinatePolicy:
    "Non-metric image coordinates. View from just inside the entrance toward the bar; left/right follow room prose. Near-left side-door return is behind the corridor, not a second toilet route.",
  routes: [
    {
      to: "street",
      name: "outside",
      position: "near-left foreground / behind",
      door: "side_door",
    },
    { to: "bar", name: "bar", position: "far center / ahead" },
    {
      to: "washroom",
      name: "washroom",
      position: "left wall / middle distance",
    },
    {
      to: "cloakroom",
      name: "cloakroom",
      position: "right wall / middle distance",
    },
  ],
  permanent: [
    { role: "corridor shell and route voids", fact: "staticArchitecture:0" },
  ],
  bakedEntities: [],
  chairResolution: {
    mode: "off-camera prose detail",
    rendered: false,
    newEntity: false,
    notes:
      "The prose chair is acknowledged but outside this composition. No chair is baked, drawn, or tied to Inez disappearance. Existing procedural Inez is a presence marker, not a new seated pose or identity asset.",
  },
  openings: {
    side_door: [
      [0, 45],
      [47, 64],
      [47, 202],
      [0, 224],
    ],
    washroom: [
      [68, 68],
      [103, 82],
      [103, 144],
      [68, 163],
    ],
    bar: [
      [138, 48],
      [181, 48],
      [181, 125],
      [138, 125],
    ],
    cloakroom: [
      [226, 73],
      [263, 56],
      [263, 177],
      [226, 157],
    ],
  },
  reserved: {
    bench: [55, 168, 117, 203],
    ledge: [246, 145, 303, 172],
    heater: [125, 152, 144, 183],
    notice: [76, 48, 103, 67],
    book: [259, 138, 273, 145],
    bag: [284, 127, 298, 149],
    inezContact: [204, 174],
    floorEnvelope: [165, 199],
    ledgeEnvelope: [250, 143],
  },
  references: [
    "docs/visuals/velvet-architecture-cleanup/candidate/sources/original.png",
    "docs/visuals/reviewed-sources/street/draft-v1/generated-source.png",
  ],
};
if (manifest.exits.some((e) => !layout.routes.some((r) => r.to === e.to)))
  throw Error("Route mismatch");
writeFileSync(
  `${root}/layout-proposal.json`,
  JSON.stringify(layout, null, 2) + "\n",
);
writeFileSync(`${root}/layout.json`, JSON.stringify(layout, null, 2) + "\n");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="672" viewBox="0 0 320 224"><path d="M0 0H320L208 25H112Z" fill="#241c28"/><path d="M0 0L112 25V124L0 224Z" fill="#61343f"/><path d="M320 0L208 25V124L320 224Z" fill="#4a2734"/><path d="M112 25H208V124H112Z" fill="#4e2b3b"/><path d="M0 224L112 124H208L320 224Z" fill="#3b3037"/>${Object.values(
  layout.openings,
)
  .map(
    (points) =>
      `<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="#100e18" stroke="#87606a" stroke-width="2"/>`,
  )
  .join(
    "",
  )}<path d="M0 223L112 124H138M181 124H208L320 223" fill="none" stroke="#927175" stroke-width="2"/></svg>`;
writeFileSync(`${root}/layout-guide.svg`, svg);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 672 } });
  await page.setContent(`<style>body{margin:0}</style>${svg}`);
  await page.screenshot({ path: `${root}/layout-guide.png` });
} finally {
  await browser.close();
}
console.log(
  "Vestibule draft layout, manifest and shipping-file baseline retained; headless guide rendered.",
);
