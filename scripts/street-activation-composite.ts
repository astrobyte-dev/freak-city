// Verify the shipping compositor against approved screenshots at identical framing.
import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { newGame } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";

const output = "docs/visuals/street-activation";
mkdirSync(output, { recursive: true });
mkdirSync(".visuals", { recursive: true });
writeFileSync(
  ".visuals/street-active.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><main id="root"></main><script type="module" src="/.visuals/street-active.tsx"></script></html>',
);
writeFileSync(
  ".visuals/street-active.tsx",
  `
import React from 'react';import {createRoot} from 'react-dom/client';
import {StreetLocationVisual} from '../src/components/StreetLocationVisual';
import {deriveVisualState} from '../src/visuals/derive';import '../src/styles.css';
const root=createRoot(document.getElementById('root'));
window.activeReview=(state,label)=>root.render(<section data-label={label} style={{width:640,maxWidth:'100%',margin:'0 auto'}}>
<style>{'body{margin:0;padding:18px;background:#110e17;color:#d8c2cf}*{box-sizing:border-box}.location-visual{margin:0;width:100%;border:0}.visual-viewport{animation:none}.visual-light{transition:none}h1{font:14px monospace;margin:0 0 14px}'}</style>
<h1>STREET / AFTER / {label}</h1><StreetLocationVisual descriptor={deriveVisualState(state)} mode="on" preview /></section>);
`,
);
let state = ensureWorld(newGame("NIGHT-0"));
const command = (text: string) => {
  const r = executeCommand(state, text);
  expect(r.ok).toBe(true);
  state = r.state;
};
command("take envelope");
command("go outside");
const open = structuredClone(state);
command("close side door");
const closed = structuredClone(state);
command("open side door");
command("drop envelope");
const dropped = structuredClone(state);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto(
    `${process.env.VISUAL_DEV_URL ?? "http://127.0.0.1:5173"}/.visuals/street-active.html`,
  );
  await page.waitForFunction(
    () => typeof (window as any).activeReview === "function",
  );
  for (const size of ["desktop", "mobile"]) {
    await page.setViewportSize(
      size === "desktop"
        ? { width: 800, height: 850 }
        : { width: 390, height: 844 },
    );
    for (const [label, s] of [
      ["open", open],
      ["closed", closed],
      ["dropped", dropped],
    ] as const) {
      await page.evaluate(
        ({ s, label }) => (window as any).activeReview(s, label),
        { s, label },
      );
      await expect(page.locator("section")).toHaveAttribute(
        "data-label",
        label,
      );
      await expect(page.locator(".street-art")).toHaveAttribute(
        "data-active",
        "true",
      );
      await page.evaluate(async () => {
        await document.fonts.ready;
        const urls = [
          ...Array.from(document.images).map((i) => i.src),
          ...Array.from(document.querySelectorAll("svg image")).map((i) =>
            i.getAttribute("href")!,
          ),
        ];
        await Promise.all(
          urls.map(
            (src) =>
              new Promise<void>((ok, no) => {
                const i = new Image();
                i.onload = () => ok();
                i.onerror = () => no(new Error(src));
                i.src = src;
              }),
          ),
        );
      });
      await page.locator(".visual-viewport").screenshot({
        path: resolve(output, `approved-match-${label}-${size}.png`),
      });
    }
  }
  console.log(
    "Six shipping-compositor viewports captured at the approved draft framing.",
  );
} finally {
  await browser.close();
}
