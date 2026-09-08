# Portable visual experiment evidence

This directory fills the gaps in the earlier committed reports without copying complete raw batches. **All art is unpromoted development evidence.** The authoritative next task is in [WORKSTATION-HANDOFF.md](../../WORKSTATION-HANDOFF.md).

| Experiment                   | Contact sheet                                                             | Full prompt specification               |
| ---------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| Real Turbo textures          | [8 candidates](49ad3f1999c7-contact-sheet.webp)                           | [Prompt](49ad3f1999c7-prompt-spec.json) |
| Text-only canonical rooms    | [8 candidates](../../../screenshots/visuals/v2-canonical-bar-drafts.webp) | [Prompt](54fd0e217eac-prompt-spec.json) |
| Whole-image img2img          | [4 candidates](../velvet-bar-layout/contact-sheet.webp)                   | [Prompt](9fd505aa2cdf-prompt-spec.json) |
| Regional masks               | [2 candidates](../production-pivot/masked-contact-sheet.webp)             | [Prompt](130222c57cd7-prompt-spec.json) |
| Expressive Turbo scenes      | [4 candidates](../production-pivot/scene-contact-sheet.webp)              | [Prompt](cf0d1dd767d8-prompt-spec.json) |
| SDXL Base + small ControlNet | [3 candidates](../controlnet-bakeoff/contact-sheet.webp)                  | [Prompt](319346d00a51-prompt-spec.json) |

[batch-ledger.json](batch-ledger.json) records all 29 candidate filenames, seeds, model/backend/environment, actual settings, image hashes, original sidecar hashes and draft status. Its file references are repository-relative where the artifact is portable; candidate filenames identify the old raw files, most of which intentionally remain local. The original sidecar hashes document original bytes; copied JSON is formatted for this repository while preserving field values. It does not grant approval or guarantee identical generated pixels on different hardware.

## Strongest scene style reference

The four files under `scene-02/` preserve the selected **Turbo** scene direction, seed 42782 from run `cf0d1dd767d8`:

- [512 display candidate](scene-02/bar__scene-illustration__early__candidate-02.png).
- [Original 640 source](scene-02/sources/bar__scene-illustration__early__candidate-02.png).
- [320 pixel master](scene-02/pixels/bar__scene-illustration__early__candidate-02.png).
- [Full sidecar](scene-02/bar__scene-illustration__early__candidate-02.json), with relative source/master links and unchanged image hashes.

These three PNGs are byte-preserved and together with the sidecar occupy approximately 543 KB before repository JSON formatting. This is a non-authoritative scene illustration with no approved named-character identity or scene binding. Review ambiguous reflections/figures, hands/anatomy and bartender interpretation before any later cleanup or promotion. It is **not** the external ChatGPT canonical candidate expected on the next workstation.

## First texture batch findings recovered from the old workstation

Run `49ad3f1999c7` completed on CUDA on 2026-09-08: 8 candidates, seeds 2741–2748, 640 × 448 generation, 2 steps, guidance 0, 320 × 224 output, 48 colours and contrast 1.3. Cached loading/generation/output took about 11.33 seconds; initial model download/load preflight took 101.43 seconds. Model and environment are in the ledger.

The sheets show abstract burgundy/charcoal material rather than complete places. Candidates 03/06 are comparatively subdued; 04/05/07 have stronger crack-like or raised details, and 07 has a pronounced horizontal band. Those patterns require damage/architecture review; none was approved or tested as a final room plate. This experiment proved the real CUDA pipeline and provenance, not canonical room quality.

Historical reproduction command, **not the next task**:

```sh
npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --generate --device cuda --revision 71153311d3dbb46851df1931d3ca6e939de83304 --offline
```

It requires separately installed GPU dependencies/cached weights. Use a separate output directory for an authorized reproduction. No new generation occurred during the handoff.
