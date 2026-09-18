# Vestibule: one complete draft for visual review

**2026-09-14 — complete, unactivated.** One background source created with the built-in imagegen tool, imported through the existing workflow; separate native SVG object/effect masters and their transparent PNG derivatives. No local model work, shipping changes, merging or public deployment.

[Review gallery](review/index.html) · [Desktop overview](review/desktop-overview.png) · [Mobile overview](review/mobile-overview.png) · [Measured layout](layout-final.png)

## Composition and chair decision

The view looks along a compact dried-wine corridor: **street behind at the near-left edge, toilets farther along the left wall, bar ahead, cloakroom right**. The background contains only the corridor shell, trim, dry scuffed floor and four empty apertures. The imported master is 320 × 224 with a 64-colour treatment and exact 640 × 448 display. Warm material colour connects the approved rooms; there is no indoor rain, puddle layer or mirrored wet-floor reflection.

The prose chair is explicitly **off-camera beyond the near-right edge, beside the book/ledge zone**. It has no image, shadow, mask, permanent-fixture binding or new entity. This acknowledges the prose without inventing a fixed chair. Inez retains the game's existing procedural shape and label; her placement marks presence, not a newly authored standing/seated performance. Her identity artwork remains deferred.

## Separate objects and effects

- The existing shared `side_door` supplies open/closed/locked state from either side. Interior leaf art and restrained dry-threshold light are separate from the architecture; closing removes the open effect.
- Ledge, bench with paper shim, notice, heater, shut book and reinforced bag each have their own layer and local contact/shading. Heater light leaves with its owner. The ledge remains separate despite being omitted from the basic manifest's five detail-object IDs.
- The approved 10 × 6 envelope PNG is unchanged. Floor and ledge placements use distinct contact points and contact shadows. Taking it, hiding its contents, losing the ledge art or removing/damaging its support leaves no floating envelope effect.

The matrix includes **16 desktop/mobile composites**: open/closed door × Inez present/absent × envelope on floor/ledge. [Desktop ordinary-UI preview](review/ordinary-desktop.png) and [mobile preview](review/ordinary-mobile.png) were captured through isolated headless request injection. The normal development app remains unchanged.

## Checks completed

[State checks](review/checks.json) · [Pixel and source checks](review/pixel-validation.json) · [Final checks](review/final-checks.json)

- Real parser commands: all four routes; door open/close and 02:40 lock; blocked direct exit followed by vestibule → bar → street; Inez absence, return and 03:00 departure; envelope floor/ledge, return and take; another dropped object without false envelope substitution.
- Ordinary UI: custody actions, door commands, exact save/reload, leave/return and On/Reduced/Off. The dry interior contains no rain or wet-reflection layer.
- Defensive state checks: all six local object owners absent/damaged, closed ledge hides contents, and **10 mobile image failures** covering both door views, six objects, envelope and background. Fallback retains existing procedural/text information and removes owned effects.
- **16 pixel comparisons** confine door, envelope and NPC changes to their respective regions. All 17 authored layer bounds passed. Source/crop/palette/display replay is exact; approved envelope identity is byte-identical.
- Four ordinary street/Velvet desktop/mobile captures match before/after byte-for-byte. All **97 files under `src` and `public`** retain their baseline hashes. Build, registry validation and all **11 focused street/Velvet regression tests** passed; no vestibule draft references enter the production bundle.

## Review focus and retained sources

Review the four-route layout, dry material treatment, object cohesion and envelope distinction on the floor versus ledge. Notice/ENTRY lettering is small at mobile scale; the full established text remains in the ordinary interface. Procedural Inez is intentionally unchanged. These visual judgments await your review; no further polish is treated as accepted automatically.

[Generated source](generated-source.png), [authoring prompt](authoring-prompt.txt), [authoring metadata](authoring.json), [world manifest](world-manifest.json), [composition](composition.json), [layer provenance](layer-provenance.json) and the complete imported [candidate metadata](candidate/vestibule__canonical-room__canonical__64-colours.json) are retained. The original layout proposal and measured final layout are both saved. Future maintenance can edit native SVG masters or reimport the retained source without a local model.

Stop here for owner visual review. Keep the draft unactivated, Inez artwork deferred and the approved street/Velvet polish backlog unchanged. Work remains on `feature/state-driven-visuals`, entirely in the background.
