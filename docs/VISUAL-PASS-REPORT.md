# State-driven visual pass and collaborator integration

**PRE-ALPHA / ACTIVE DEVELOPMENT · development spoilers.** Work is isolated on `feature/state-driven-visuals`. The original public build is preserved by `pre-state-driven-visuals` at `f9487c4`, alongside `v0.1.0-playtest.1` and the earlier parser checkpoint. Main/Pages have not been replaced by this preview.

## Implemented

- Typed, read-only `GameState → deriveVisualState → VisualDescriptor → LocationVisual` flow using the parser's actual visibility, containment, carried-item and NPC-location rules.
- Manifests for all 17 persistent rooms; pixel studies for Velvet exterior, the bar, loading bay and apartment; conservative abstract fallbacks for the other rooms.
- Canonical object shapes, open/closed doors, damage hooks, actual named NPC silhouettes, state-aware object register, time lighting, anonymous crowd atmosphere, rain/reflection/haze and 160 ms room transitions.
- On/Reduced/Off settings, reduced-motion and hidden/offscreen pausing, short mobile viewport, text equivalents, image failure fallback and optional single-neighbour idle prefetch.
- Development inspector with descriptor, required/forbidden facts and independent visual overrides.
- Preserved collaborator originals; modular prompt builder, local SDXL adapter, configurable crunch, deterministic seeds, raw PNG/JSON candidates, contact sheets, explicit human promotion, lossless WebP optimization and build-time reviewed-asset checks.

Story, parser, engine, relationship content, THE PULL, dialogue and first-night pacing files are unchanged. No mystery routes or Motel content were added. No production model, Python package or inference API dependency was introduced.

## Collaborator audit

The original `imagegrouptool.py` cycles prompts, runs SDXL Turbo at two steps/guidance zero and applies 320-pixel nearest-neighbour downscale, 48-colour quantization and 1.3 contrast before writing PNGs. Both supplied guides instead say `imagegentoo.py`. The old loader always requests fp16 weights even on its float32 CPU branch. It lacks explicit seeds, dimensions, metadata, model-loading diagnostics and approval stages, and performs work at import time.

All four originals were preserved byte-for-byte. Their SHA-256 inventory is [ORIGINAL-SHA256SUMS](../tools/visual-gen/ORIGINAL-SHA256SUMS). The integrated entry point is `adapter.py`; generator internals are imported lazily. See [pipeline documentation](GENERATIVE-ASSET-PIPELINE.md) for the complete reconciliation and local setup.

## Screenshots and contact sheets

These are developer fixtures illustrating the existing world, not a new human playthrough. Screenshots use the placeholder alias Stranger. Time-band screenshots advance the real scheduler. They do not represent new authored story events.

| View                                          | Screenshot                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Velvet exterior and canonical entrance        | [Exterior](../screenshots/visuals/01-velvet-exterior.png) |
| Early bar with actual Mara presence           | [Early bar](../screenshots/visuals/02-bar-early.png)      |
| Dawn bar after scheduled departures           | [Dawn bar](../screenshots/visuals/03-bar-dawn.png)        |
| Loading bay, existing camera and loading door | [Loading bay](../screenshots/visuals/04-loading-bay.png)  |
| Apartment                                     | [Apartment](../screenshots/visuals/05-apartment.png)      |
| 390-pixel phone viewport                      | [Mobile](../screenshots/visuals/06-mobile.png)            |

Three deterministic **procedural fixture** candidates were generated for each proof-of-concept room, with seeds 2741–2743 and full sidecars. Review sheets: [street](../screenshots/visuals/fixtures-street.webp), [bar](../screenshots/visuals/fixtures-bar.webp), [loading bay](../screenshots/visuals/fixtures-loading-bay.webp), [apartment](../screenshots/visuals/fixtures-apartment.webp). These deliberately plain texture tests prove batching and review tooling; they are **not SDXL output or canonical art**. No candidate has been promoted to the shipping registry. An eight-candidate dry run also produced the [late-bar prompt specification](visuals/bar-late-prompt.json).

## Measurements

The comparable baseline is the Pages build from `f9487c4`, using the same installed dependencies. JS totals sum all production JS chunks; gzip is measured with Node zlib, not an assumed hosting transfer ratio.

| Production JS |  Baseline | Visual preview |     Delta |
| ------------- | --------: | -------------: | --------: |
| Uncompressed  | 669,914 B |      682,312 B | +12,398 B |
| Gzip          | 215,306 B |      220,105 B |  +4,799 B |

Compressed JavaScript increases by 2.23%. No Python or model package appears in those chunks.

The current-room and per-room added raster weight is **0 bytes** for these code-drawn studies. No city images are preloaded. Screenshots/contact sheets are development material outside `public/` and are not copied into the Pages bundle. Future plates have a 150,000-byte cap; current-room loading is immediate, adjacent loading is optional and idle, and Off mounts no image.

The last local Chromium run measured 88 visual DOM nodes at the bar and a 11.1 ms median command-to-door-update check over 12 commands. Command timing includes Playwright keyboard dispatch and assertion overhead; it is not a laboratory input-latency or battery measurement. The 160 ms fade is purely visual and does not queue or delay parser actions. Pure descriptor derivation was about 0.039 ms per call over 10,000 local Node iterations. Browser/device performance, real GPUs, scrolling power use and Safari/Firefox remain human-test targets.

Fixture optimization used the same production optimizer, without promotion:

| Room        | Raw PNG | Lossless WebP (640 × 448) | Reduction |
| ----------- | ------: | ------------------------: | --------: |
| Street      | 8,877 B |                   4,976 B |    43.95% |
| Bar         | 8,725 B |                   4,946 B |    43.31% |
| Loading bay | 8,877 B |                   4,976 B |    43.95% |
| Apartment   | 8,945 B |                   4,976 B |    44.37% |

These are fixture results, not predictions of SDXL image complexity or savings.

## Validation

- Full `npm run check`: **963 tests**, narrative QA with zero errors, deterministic/fuzz routes, 12 parser campaigns, 60 natural-language campaigns and embodiment audit. The pre-existing Motel conditional-exit review note remains.
- Python pipeline: **9 tests**, including deterministic seed/image output, prompt facts, CPU/CUDA weight options, dry runs without ML imports, sidecars, contact sheets, changed-source rejection, no-overwrite protection and promotion in a temporary repository.
- Existing browser suite: **11 accessibility scans**, parser input, IME, drafts, history/completion, panels, save/reload, narrow layouts and keyboard viewports.
- Publication browser suite against the production `/freak-city/` preview: **5 accessibility scans**, working assets, adulthood confirmation, parser, local saves, optional audio and production debugger exclusion; no unexpected requests or runtime errors.
- Visual browser suite: **7 accessibility scans**, four rooms and time states, canonical door changes, actual NPCs, mobile 320/390/740 widths, On/Reduced/Off persistence, reduced-motion, separate inspector preview and an intentionally failing image request that falls back to procedural art.
- Normal production build, GitHub Pages-path production build, visual asset/anchor checks and formatting.

Browser accessibility scans wait for finite entrance animations before evaluating settled text contrast. They retain all WCAG rules. Reduced-motion and normal-motion behavior are tested separately. These automated checks do not replace an assistive-technology or real-phone playtest.

## What did not run / limitations

**SDXL Turbo itself did not run.** Torch, Diffusers, Transformers and Accelerate were not installed, and the NVIDIA driver query failed. No weights were downloaded and no CPU inference was silently substituted. Pillow fixture generation, optimization and review/promote tests did run.

The art is intentionally schematic. Only four rooms have spatial studies; other objects use names instead of guessed sprites. Final faces, full architectural plates, per-character art, animation sheets, room-specific art variants and AVIF encoding are future work. Weather is the existing rainy night, not a new weather simulator. Time washes do not imply that tracked lights or objects changed state.

The first raster contract accepts **empty texture plates only**. Full illustrated rooms with baked doors/NPCs/evidence are unsuitable for this compositor until they have separately reviewed removable layers. SDXL's negative prompts cannot enforce forbidden facts; human inspection is authoritative. The 640 × 448 generation aspect is structurally validated but model quality is untested. Model reproducibility across hardware is not guaranteed; pin a model revision and environment when evaluating real candidates.

## Collaborator handoff and next step

Use `npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --generate` on the collaborator's configured machine. The manifest, full audit prompt, compact texture prompt, generation settings, seeds, raw PNGs, JSON sidecars and contact sheet are the handoff contract. `VISUAL_PYTHON` selects the local interpreter; `HF_HOME` selects the normal model cache. Do not use the old `imagegentoo.py` name or copy weights into the repository.

First compare real SDXL texture candidates with the canonical SVG layers at desktop/mobile sizes. Reject invented physical details, tune crunch/colour/contrast, then explicitly promote one human-approved plate and playtest the composite. Review this branch before merging; the current blind-playtest Pages build should remain available until the visual preview is accepted.
