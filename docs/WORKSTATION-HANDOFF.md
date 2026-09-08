# Workstation handoff

**Start here on the next machine.** Checkpoint prepared 2026-09-09. This document records the user's current direction and supersedes older reports' “next step” recommendations. No chat history, old activation script, GPU cache or access to the previous workstation is required to continue development.

## Branch, commit and public build

| Item                             | State                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Repository                       | <https://github.com/astrobyte-dev/freak-city>                                                                     |
| Current branch                   | `feature/state-driven-visuals`                                                                                    |
| HEAD at handoff audit            | `df5ee6525c5bbfb46f7338f5ad7448beb70fbb6c` — completed ControlNet experiment and documentation                    |
| Current checkout HEAD            | Run `git rev-parse HEAD` after pulling; the handoff commits necessarily follow the audit commit recorded above    |
| Draft PR                         | [#1](https://github.com/astrobyte-dev/freak-city/pull/1), OPEN and DRAFT; **do not merge**                        |
| Main / preserved public baseline | `f9487c4d0deba800b1dd86617b3bd2eb5216992b`, also protected by the existing `pre-state-driven-visuals` checkpoint  |
| Public Pages                     | Existing blind-playtest build at <https://astrobyte-dev.github.io/freak-city/>; visual branch has not replaced it |
| Approval status                  | No generated candidate promoted; no external ChatGPT canonical image imported                                     |

Use Git's current HEAD and remote comparison as the exact checkpoint identity; embedding a commit's own hash inside its contents is not possible. The final handoff commit is visible in the branch history and PR. Do not check out the audit commit to resume: check out and pull the branch.

**Protected scope:** do not alter gameplay, story, parser semantics, relationships, THE PULL, central mystery or current blind-playtest narrative. Do not deploy/merge or promote art without human review. Do not restart or re-architect the visual system. No new visual experiment is part of this handoff.

## What is working

- The original parser/world simulation remains intact. The visual system reads actual state through `deriveVisualState`; visuals do not invent simulation facts.
- All **17 rooms** have manifests, permanent/dynamic partitions, entity anchors, NPC/atmosphere zones and review facts. The [17-room asset plan](VISUAL-ASSET-PLAN.md) groups production priorities; [VISUAL-STYLE.md](VISUAL-STYLE.md) defines six art-direction families.
- Three gameplay visual products remain distinct: **canonical room plates**, **cinematic scene illustrations**, **simulation overlays**. Tooling additionally supports texture studies and unpromotable overlay studies.
- Local SDXL Turbo supports seeded generation, retained source/master/display images, metadata, contact sheets and offline cached inference. Its expressive scene preset is useful and must be preserved.
- Canonical room production uses a **320 × 224 master → 640 × 448 exact 2× nearest-neighbour display**. Current default: 48 colours, contrast 1.15. The scene preset stays 320 / 64 colours / contrast 1.10 / 512 display.
- Reviewed canonical assets can suppress only their explicitly baked static entity glyphs; dynamic NPCs/objects, time/weather, custody and state remain runtime layers. On/Reduced/Off, image failure fallback and text equivalents work.
- The review/promotion workflow requires human world-fact, architecture, composition and non-explicit review, plus reference/control validation when used. Generated pixels, masks, reference/control files and masters have provenance checks. Manual edits create new drafts with parent/editor/tool/notes.
- Latest implementation validation: **1,000 JS tests**, **48 Python tests**, normal/Pages builds, formatting, asset validation, parser/content/embodiment checks and GitHub CI passed. Browser evidence includes real early/late/dawn/mobile composites; schematic overlays still need final art.

Key code: `src/visuals/`, `src/components/LocationVisual.tsx`, `src/content/visuals/`, `scripts/visuals.ts`, `scripts/visual-review-composite.ts`, `tools/visual-gen/`. Read [VISUAL-ARCHITECTURE.md](VISUAL-ARCHITECTURE.md) before editing integration. Preserve `tools/visual-gen/original/` and its SHA inventory.

## Visual experiment history

All outputs below are real model runs on the previous RTX 4070 unless explicitly labelled a procedural fixture. None is shipping art. The [portable evidence index](visuals/experiment-history/README.md) links all six contact sheets, prompt specifications and a ledger of all **29** candidate hashes/settings. Earlier test-count statements describe their historical checkpoints.

| Order / run                                            | Settings                                                                                   | What it proved / decision                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Texture plates / `49ad3f1999c7`                     | Turbo; 8; seeds 2741–2748; 2 steps; late                                                   | CUDA generation, seeds, sidecars and palette pipeline work. Burgundy/charcoal material studies, with some crack-like detail requiring review. Useful texture evidence, not full room art or approved assets.                                                                                                                                                                         |
| 2. Text-only canonical / `54fd0e217eac`                | Turbo; 8; seeds 8317–8324; 2 steps; historical 512 display                                 | Found composition and mood but invented galleries/architecture. Candidate 01 influenced loose composition goals only. Rejected as authoritative room art. [V2 report](VISUAL-V2-REPORT.md).                                                                                                                                                                                          |
| 3. Whole-image img2img / `9fd505aa2cdf`                | Turbo; 4; same seed 19421; 4 steps; denoise .25/.5/.75/1                                   | Low denoise retained crude blockout; higher denoise removed/moved features and invented architecture. Established exact 320→640 preference and fixed reference workflow. [Geometry report](VISUAL-GEOMETRY-REPORT.md).                                                                                                                                                               |
| 4. Regional masks / `130222c57cd7`                     | Turbo; 2; same seed 36271; 4 steps; denoise .5/.75                                         | Zero protected-pixel changes; stronger material passes still invented a door-like panel and crate-like counter inside masks. Keep masks; reject as final canonical art. [Production report](VISUAL-PRODUCTION-REPORT.md).                                                                                                                                                            |
| 5. Expressive scenes / `cf0d1dd767d8`                  | Turbo; 4; seeds 42781–42784; 4 steps; early                                                | Successful pink/cyan nightlife mood. **Candidate 02** is the strongest quiet scene direction, but reflections, anatomy, extra figures and bartender identity need review. It is non-authoritative and unpromoted. Full candidate/source/master/sidecar now preserved in the [scene reference](visuals/experiment-history/scene-02/bar__scene-illustration__early__candidate-02.png). |
| 6. SDXL Base + small Canny ControlNet / `319346d00a51` | 3; same seed 51863; 30 requested/25 effective steps; denoise .85; CFG 5; control .35/.65/1 | 24.223 s total; 5,673.5 MiB peak allocated VRAM. Protected outlines survive, but surfaces remain crude and false window/recess patterns appear inside walls. **C: insufficient.** [ControlNet report](CONTROLNET-BAKEOFF-REPORT.md).                                                                                                                                                 |

Turbo is useful for fast expressive/cinematic illustration. Turbo/SDXL/ControlNet have **not** solved production-quality canonical rooms. Canonical rooms still need stable geometry and higher-quality surface/material editing. The runtime overlay architecture remains useful, but final sprites/materials require a proper art pass. Read [DYNAMIC-OVERLAY-ART-PLAN.md](DYNAMIC-OVERLAY-ART-PLAN.md) for stable named NPC identities, sizing, anchors, palette inheritance, state variants and occlusion; no full sprite library exists yet.

## Current approved production direction

**HIGH-QUALITY EXTERNAL / CHATGPT IMAGE EDITING FOR HERO CANONICAL ROOMS.** This is the user's next approved investigation, replacing the prior report's proposal to investigate another local model family.

| Lane                                          | Intended responsibility                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| ChatGPT / high-quality external image editing | Hero canonical room creation/refinement against the fixed geometry contract |
| SDXL Turbo                                    | Cinematic scene illustrations and rapid visual exploration                  |
| Runtime compositor                            | Actual NPC/object/time/weather/state presentation                           |
| Human cleanup                                 | Allowed and expected before final asset approval                            |

**No external ChatGPT canonical image has been imported into this repository yet. The next workstation will receive/provide that image separately.** Do not confuse the preserved Turbo scene image with that forthcoming canonical candidate. Do not generate a replacement merely because the external file is absent; receiving it is the next input dependency.

**DO NOT DOWNLOAD FLUX, QWEN OR ANOTHER LARGE MODEL YET.** The Kontext recommendation and hardware/licence estimates remain historical R&D notes, not current authorization. No local model cache is needed for the next image-import/pixel/composite evaluation.

## NEXT TASK

1. Receive the strongest externally generated ChatGPT Velvet Bar candidate, preserving the original file and any supplied prompt/model/edit information.
2. Import it as a **draft canonical-room** asset, with honest external-source provenance, hashes and `authoritativeArchitecture: false`. Record unknown provenance as unknown. Do not fabricate an SDXL execution, ControlNet reference, seed or approved status.
3. Compare it to Velvet's geometry contract and the existing pending-review layout. Check the one stair beside salon, bare counter footprint, high street-facing window, empty shelving, stage relationship, room envelope, all seven routes and usable overlay floor. Reject extra windows/doors/stairs/galleries and baked NPCs, evidence or movable props.
4. If useful, perform **one targeted cleanup edit**, preserving its parent and edit notes. Do not begin another broad generation matrix.
5. Compare original source → 320 master → exact 640 display. Inspect full source before destructive resampling; do not silently crop away world facts. Resolve aspect/composition explicitly if the supplied image is not 10:7.
6. Compare 48 versus 64 colours **only if needed** for material/lighting quality. Preserve the canonical 320→640 grid.
7. Render actual early/late/dawn/mobile `LocationVisual` composites using isolated unapproved bindings.
8. Assess NPC/prop overlay mismatch, anchors and occlusion against [the overlay art plan](DYNAMIC-OVERLAY-ART-PLAN.md).
9. Classify the workflow A (productionizable), B (promising with specified human cleanup), or C (insufficient), and explain geometry/style trade-offs.
10. Present the review evidence. **Do not promote or merge without human review.**

**Import tooling limitation:** `tools/visual-gen/import_edit.py` imports an edit of an existing staged parent candidate; it is not yet a standalone external-image importer. The next session may add the smallest honest external-draft import path needed, reusing the existing manifest, pixel, metadata and review contracts. Do not mislabel the external image as a generated child of a Turbo fixture to satisfy the current CLI. No external importer or image has been fabricated during this handoff.

Geometry sources: [facts](visuals/velvet-bar-layout/facts.md), [top-down](visuals/velvet-bar-layout/top-down.svg), [reference](visuals/velvet-bar-layout/reference.png), `src/content/visuals/layouts/bar.json`, `src/content/visuals/architecture.ts` and actual room exits in `src/content/spaces.ts`. The layout is a fixed nonmetric art composition pending human review, not measured parser geography. Velvet has seven routes but no stateful Door entity bound to those exits; do not invent seven door leaves.

## Fresh laptop setup — no model weights

Install Git, **Node 22** (the `.nvmrc` major; previous validated patch 22.23.2) and **Python 3.10+** (previous machine 3.10.11) through the machine's approved installation method. No NVIDIA GPU is required for these steps. In PowerShell, from your chosen development parent directory:

```powershell
git clone --branch feature/state-driven-visuals https://github.com/astrobyte-dev/freak-city.git
cd freak-city
git status --short
git rev-parse HEAD
git rev-list --left-right --count HEAD...origin/feature/state-driven-visuals
node --version
npm.cmd ci
npm.cmd run check
npm.cmd run format:check
npm.cmd run visuals:validate
npm.cmd run build:playtest
```

The comparison should read `0 0`. Use Node 22 before `npm ci`. `build:playtest` builds locally; it does not deploy. The initial `npm run check` includes the normal build, so both output paths are covered. No API keys, Python packages or model weights are required for JavaScript checks.

For non-ML Python tests, pixel processing, deterministic masks/edges and dry runs:

```powershell
py -3.10 -m venv .venv
# If a different supported Python 3.10+ is installed, select that version instead.
$env:VISUAL_PYTHON = (Resolve-Path .venv/Scripts/python.exe).Path
$env:PYTHONUTF8 = '1'
& $env:VISUAL_PYTHON -m pip install -r tools/visual-gen/requirements-test.txt
& $env:VISUAL_PYTHON -m unittest discover -s tools/visual-gen/tests -v
npm.cmd run visuals -- --room velvet-bar --role canonical-room --count 1 --dry-run --output .visuals/handoff-dry-run
```

This uses the venv interpreter directly, avoiding PowerShell activation-policy or `python3` Windows-alias issues. The test requirements contain Pillow and pinned OpenCV (which installs NumPy), **not Torch, Diffusers or a Hugging Face client**. The handoff was checked in a newly created environment with those ML packages absent: all 48 tests pass. Tests use fixtures/mocks and temporary directories, not model downloads. Repeating the identical dry-run output deliberately refuses overwrite; inspect the existing plan or choose a separate intentional output directory.

On macOS/Linux, create the venv with `python3 -m venv .venv`, use `.venv/bin/python` for the same pip/unittest commands and set `VISUAL_PYTHON` to that interpreter before running `npm run visuals`.

For local UI review, run `npm.cmd run dev -- --host 127.0.0.1 --port 5182 --strictPort`. Install the browser binary with `npx playwright install chromium` if needed. After the future image is staged in `.visuals/`, use `npx tsx scripts/visual-review-composite.ts --batch <draft-directory> --output <review-directory>` and then `python tools/visual-gen/review_page.py --batch <draft-directory> --output <review-directory>` with the venv Python in place of `python`. The review page is portable HTML once its images are staged. These commands do not approve or ship the test binding.

## Optional historical local-model setup

Do not install or download models for the next task. If historical model reproduction is explicitly requested later, follow [GENERATIVE-ASSET-PIPELINE.md](GENERATIVE-ASSET-PIPELINE.md) and the pinned [model inventory](../tools/visual-gen/controlnet-models.json). Select a Torch wheel for that machine's actual GPU/driver; the old `cu128` install is evidence from the RTX 4070, not a universal laptop requirement. Never silently use CPU generation.

- Turbo: `stabilityai/sdxl-turbo`, revision `71153311d3dbb46851df1931d3ca6e939de83304`.
- SDXL Base: `stabilityai/stable-diffusion-xl-base-1.0`, revision `462165984030d82259a11f4367a4eed129e94a7b`.
- Small Canny: `diffusers/controlnet-canny-sdxl-1.0-small`, revision `edd85f64c5f87dfb6d73762949d9daca16389518`.
- The Base/ControlNet selected files total **7,261,453,271 bytes**. No weights, venv or caches are in git. See [the bake-off report](CONTROLNET-BAKEOFF-REPORT.md) for licence notes and measured memory/time; see [model strategy](VISUAL-MODEL-STRATEGY.md) for the current split.
- Respect an existing `HF_HOME`. When unset, the normal Hugging Face cache is under the user's home (`.cache/huggingface`); there is no need to create it for non-ML work. Do not copy old absolute paths or `.visuals/setup/Activate.ps1` to the new machine.

## Portable material and intentionally local files

Git contains architecture, all room manifests/plans, style families, production/model strategy, both overlay plans, historical reports, all six real contact sheets, fixed layout reference/facts, representative runtime/review screenshots, exact prompt specifications, candidate/settings/hash ledger, the selected full-resolution Turbo scene reference and model revision/size inventories.

New selective preservation is under `docs/visuals/experiment-history/`. Scene 02's PNG source, pixel master and display are preserved unchanged, alongside semantically identical formatted sidecar JSON. These are documentation/reference assets outside `public/`; none is approved. Contact sheets already in git are linked, not duplicated.

Intentionally left on the old machine and ignored: complete `.visuals/generated/` batches/review pages (about 9.4 MB at audit), other raw sources and pixel masters, `.visuals/jobs/` manifests, temporary browser fixtures, `.visuals/setup/` activation/absolute Node path, package locks/install logs and validation output, `.venv/`, `node_modules/`, `dist/` and the external Hugging Face cache. The new test-only audit venv is also ignored. Nothing was deleted. Full raw history is not a GitHub backup; only the selected evidence is portable. The complete old local batches are optional archival material and are not needed for the next task.

The **only expected missing input for the next task is the separately supplied external ChatGPT Velvet canonical candidate**. It has never been present in this repository/session, so no lost local file is being hidden by this handoff.

## Reading order and handoff validation

Read this document, [VISUAL-MODEL-STRATEGY.md](VISUAL-MODEL-STRATEGY.md), [VISUAL-ARCHITECTURE.md](VISUAL-ARCHITECTURE.md), [VISUAL-STYLE.md](VISUAL-STYLE.md), [VISUAL-ASSET-PLAN.md](VISUAL-ASSET-PLAN.md), the [ControlNet findings](CONTROLNET-BAKEOFF-REPORT.md), [overlay art plan](DYNAMIC-OVERLAY-ART-PLAN.md) and [pipeline guide](GENERATIVE-ASSET-PIPELINE.md). Historical reports preserve old decisions and commands; their earlier next-step proposals do not override this handoff.

The handoff changes documentation, selected reference evidence and a shared non-ML dependency list used by CI. Validation covers a fresh minimal Python environment (48 tests and integrated dry run), evidence hashes/sidecar equivalence, portable links, formatting and asset checks. The underlying development checkpoint already passed the complete 1,000-test JS suite and GitHub CI; the final handoff push receives the same CI checks. Confirm the latest PR checks before further work. Keep PR #1 draft.
