# Street: focused polish review

**2026-09-14 — draft complete, unactivated; personal visual review pending.**

[Before/after gallery](review/index.html) · [Desktop comparison](review/comparison-dropped-desktop.png) · [Mobile comparison](review/comparison-dropped-mobile.png)

One native-SVG polish pass builds on the [retained first draft](../draft-v1/REPORT.md). No image generation or local model work was needed. The original imported architecture plate, composition, window, awning, colour treatment and all object placements remain unchanged.

- **Bin:** irregular painted-metal wear and quieter panel shading replace the flat treatment. Tight contact darkening and broken, subdued reflections ground the same silhouette and folded umbrella.
- **Open doorway:** restrained recess shading and lower reflected colour add depth inside the existing opening. No interior geometry, fixtures or people were added. The shading belongs to the open door state; closing or locking removes it and its pavement effect.
- **Dropped envelope:** the approved PNG remains byte-identical, exactly 10 × 6 source pixels at its original position. A small, subdued pavement contrast patch and tighter contact shadow improve separation without a glowing outline or enlarged marker. Both effects leave with the envelope.

## Saved comparisons

| State | Desktop (640 × 448 art) | Mobile (354 × 248 art, 390 px browser) |
| --- | --- | --- |
| Open side door | [Before / after](review/comparison-open-desktop.png) | [Before / after](review/comparison-open-mobile.png) |
| Closed side door | [Before / after](review/comparison-closed-desktop.png) | [Before / after](review/comparison-closed-mobile.png) |
| Open + dropped envelope | [Before / after](review/comparison-dropped-desktop.png) | [Before / after](review/comparison-dropped-mobile.png) |

Also saved: [ordinary UI desktop](review/ordinary-ui-after-desktop.png), [ordinary UI mobile](review/ordinary-ui-after-mobile.png), state/failure screenshots and the individual original-size before/after images used by the gallery. All captures used isolated headless Chromium; no visible windows, existing browser sessions or desktop control were used.

## Verification

[Headless gameplay checks](review/checks.json) and [pixel checks](review/pixel-validation.json) passed:

- All six before/after pairs have **zero changed pixels outside the affected object regions**. Window and awning crops match exactly. With the door closed, envelope held and bin absent, the entire before/after viewport is identical.
- Door opening/closing differences remain local to its layer and effects. Drop, leave/return, take and save/reload retain correct envelope custody; taking it removes its complete visual group. Bin absence/damage removes its artwork and effects.
- Failed bin, open-door or envelope image loads remove the corresponding effects and leave procedural fallback. On/Reduced/Off modes and mobile layout passed.
- The side door locks at 02:40, loses its open-state effects and rejects entry; the existing front entrance still reaches the bar.
- Hash checks preserve all first-draft files and protected shipping art/gameplay files (76 files total). Closed-door, sign, sign-effect and rain raster pixels are unchanged. The envelope retains its approved hash.
- Production build and all 9 focused Velvet regression tests passed. The production bundle contains no street draft/review component references; `git diff --check` passed.

The [provenance record](provenance.json) identifies five revised SVG masters and their raster derivatives. The review-only component selects these layers while continuing to use the unchanged first-draft plate and composition. Shipping artwork is not registered or activated.

## Personal review

1. Does the bin's material and ground contact fit the surrounding painting?
2. Does the open threshold feel deeper without suggesting a newly invented interior?
3. At the saved mobile size, can you distinguish the dropped envelope without it looking highlighted?

Perceptual success remains your decision; technical checks establish containment and correct state response. No further polish or artwork activation will proceed from this report. Accepted backlog items remain deferred. Work stays on `feature/state-driven-visuals`; local AI experiments, merging and deployment remain on hold.
