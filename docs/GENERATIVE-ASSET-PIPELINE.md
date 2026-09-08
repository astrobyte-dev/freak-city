# Local visual generation and review

**Development spoilers · PRE-ALPHA / ACTIVE DEVELOPMENT.** Python and model weights are development tools only. The browser receives ordinary reviewed image files. No inference service, Torch, Diffusers, Transformers, Python runtime or model download is added to the game or Pages deployment.

## Collaborator package and corrections

All four supplied files are preserved byte-for-byte in `tools/visual-gen/original/`. No earlier collaborator git history was supplied. The original implementation is `imagegrouptool.py`; both original guides incorrectly invoke `imagegentoo.py`. Use the new `adapter.py` entry point or npm commands below. The original files remain reference material, not setup instructions for the integrated workflow.

The original script parses style, repeatable prompt, prompt-file, count and output-directory options; prompt-file takes precedence. It cycles a 20-concept pool, loads `stabilityai/sdxl-turbo`, runs two steps at guidance zero, downscales with nearest neighbour, quantizes to 48 colours, boosts contrast 1.3 and writes generic numbered PNGs. It runs at import time, imports model libraries before help, has no seed or metadata, and always asks for `variant="fp16"` even when selecting float32 CPU execution. The guides describe CUDA well but do not explain that CPU branch. They do not pin generation dimensions or randomness. `G:\LLMModels` is only their example cache location, not a requirement.

The integrated modules preserve the crunch concept, use manifests instead of an unrelated cyberpunk concept pool, add deterministic per-candidate seeds, explicit device selection, error diagnostics, safe names, sidecars, contact sheets, draft isolation, optimization and human promotion. CUDA requests FP16 weights; explicitly authorized CPU execution requests default FP32 weights. Imports are lazy, so dry runs work without Torch. Model generation never silently falls back to CPU.

## Local setup

Use Python 3.10+ and a virtual environment. Pillow alone is enough for fixtures, optimization and Python tests. Actual generation additionally needs the model packages and a compatible GPU/Torch installation.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install 'pillow>=10,<13'
# For model generation, install the Torch wheel appropriate for your hardware first,
# then the remaining local requirements:
python -m pip install -r tools/visual-gen/requirements.txt
```

On Windows, activate `.venv\Scripts\Activate.ps1`. If npm cannot find the active Python, set `VISUAL_PYTHON` to its executable for `npm run visuals`; promotion/tests can also be run directly with `python` instead of `python3`.

The loader respects Hugging Face cache configuration, including `HF_HOME`; nothing hard-codes a drive. Set a cache location with enough free space before downloading. The old guide's 15–20 GB is a planning allowance, not an exact size guaranteed by this implementation. The loader checks for critically low free space but cannot predict every temporary download requirement. `--offline` requires cached weights. Missing dependencies, unavailable CUDA, model download/loading failures, weight variant/dtype errors and memory exhaustion produce actionable errors. No model install/download happens during `npm ci` or a browser build.

SDXL Turbo was **not run in this development environment**: model packages were absent and NVIDIA's driver query failed. The complete non-ML pipeline was exercised with explicitly labelled deterministic fixtures.

## Commands

```sh
npm run visuals                              # prepare manifests for existing rooms only
npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --dry-run
npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --fixture
npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --generate
npm run visuals:validate
npm run test:visual-gen
```

`velvet-bar` is a CLI alias for canonical room ID `bar`. The other proof-of-concept IDs are `street`, `loading-bay`, and `apartment`. The generation flag requires an explicit room; it cannot accidentally generate the city. A room request without `--generate` or `--fixture` defaults to a dry run. Dry-run plans and real candidate runs occupy separate directories. Reusing an identical candidate configuration refuses to overwrite its run; inspect the existing run or use another output directory.

Useful options: `--steps 2`, `--width 640 --height 448`, `--pixel-width 320`, `--colors 48`, `--contrast 1.3`, `--revision MODEL_COMMIT`, `--offline`, and `--output .visuals/my-experiment`. CPU requires both `--device cpu` and `--allow-cpu`. A seed is an unsigned 32-bit integer; candidate N uses `(seed + N - 1) mod 2^32`. Each call creates a fresh CPU Torch generator for that seed. Identical fixtures are byte-reproducible. SDXL reproducibility also depends on pinned model revision, library versions, hardware and kernels; cross-device equality is not promised. See [Diffusers reproducibility guidance](https://huggingface.co/docs/diffusers/main/using-diffusers/reproducibility).

The chosen 640 × 448 frame matches the compositor but is an untested model-quality tradeoff: Turbo was trained around 512 × 512. The adapter accepts other supported dimensions for experiments, while promotion rejects a mismatched aspect ratio instead of silently cropping. [The official model card](https://huggingface.co/stabilityai/sdxl-turbo) and [pipeline documentation](https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/sdxl_turbo) describe its generation constraints. Turbo does not enforce negative prompts at guidance zero. The full forbidden-fact list is review evidence, **not a model guarantee**.

## Manifest → prompt → candidates

The TypeScript manifest producer references canonical room descriptions, exits, entities, aliases, current state, NPC locations, time bands, lighting, weather, composition anchors and required/forbidden facts. Requested bands prepare a simulation snapshot by advancing the existing clock and scheduler. This never affects the player's save.

`prompt_builder.py` produces an engine-neutral PromptSpec: room/variant, complete audit prompt, compact model prompt, style, required/forbidden facts, state and layer. For this first compositor, only empty texture plates can ship. Recognizable architecture, objects, crowds and NPCs are excluded from the generated plate and supplied separately by runtime state. The compact style fields `model` and `familyModel` let a district change the actual model prompt without pasting an entire bible into CLIP. The actual model prompt is deliberately shorter than the full review document; the adapter rejects CLIP truncation instead of silently losing requirements.

An example is [bar-late-prompt.json](visuals/bar-late-prompt.json). Its audit prompt includes the real bar description and scheduled state. Its model prompt begins “Empty abstract texture plate” and requests only palette, lighting, texture and empty object zones. It does not add the sample brief's east-wall bar, booths or front windows to the game's geography.

`adapter.generate(manifest, options)` returns CandidateAsset records containing a PNG path, seed, backend and metadata. Every PNG has a JSON sidecar: roomId, variantId, full/model prompt, style, required/forbidden facts, state, seed, model, generation settings, final dimensions, creation time, generator version, review status, environment and source hash. Model-backed output records Torch/Diffusers versions, hardware class, dtype and requested revision. It records no tokens or personal cache paths.

```text
.visuals/jobs/<room>.json
.visuals/generated/<room>/plans/<configuration-hash>/dry-run.json
.visuals/generated/<room>/raw/<configuration-hash>/<room>__<variant>__rain__candidate-01.png
.visuals/generated/<room>/raw/<configuration-hash>/<room>__<variant>__rain__candidate-01.json
.visuals/generated/<room>/review/<configuration-hash>/contact-sheet.webp
.visuals/generated/canonical/<approved-file>.webp + provenance.json
public/visuals/generated/<room>--<variant>--<hash>.webp
```

`.visuals/`, virtual environments, bytecode and model weights are ignored. Raw candidates are never automatically deleted or published. Contact sheets label candidate number, seed and backend; fixture sheets explicitly say `fixture`.

## Human review and promotion

Compare the contact sheet, individual candidate, required/forbidden facts and runtime composite. Reject any recognizable door, prop, character, evidence, damage, sign or route baked into a texture plate. Inspect pixels at mobile and desktop scale: even abstract marks can accidentally resemble an interactable object. Verify palette, aspect ratio, boundaries, pixel readability and existing overlays. No computer-vision claim replaces this inspection.

After that review, a human may explicitly run:

```sh
npm run visuals:promote -- --candidate .visuals/generated/bar/raw/RUN/bar__late__rain__candidate-03.png --reviewer "public-alias" --notes "Inspected empty texture plate and runtime overlays against required/forbidden facts" --approve-world-facts
npm run visuals:validate
npm run build:playtest
```

Use the actual path printed by generation. The reviewer name and notes are intentional review input. Never put credentials or personal data there. Promotion checks the source hash, preserves the raw candidate/sidecar, optimizes by nearest-neighbour doubling and lossless WebP, records size/reduction, writes local canonical provenance and updates `src/content/visuals/assets.json` with human approval and the optimized hash. It refuses to overwrite an already approved room variant. Fixture promotion additionally requires `--allow-fixture`; tests exercise that only in a temporary repository. **No generated fixture has been promoted into this game's shipping registry.**

Build-time validation rejects draft/unregistered files, missing reviews, changed hashes, unsupported paths/formats, oversized assets and missing files. Human approval is bound to bytes by SHA-256; altering a plate requires another review. Native browser decode failure still falls back to the procedural scene. The optimizer emits WebP; reviewed AVIF is allowed in the registry, but no AVIF encoder workflow is included yet.

## Another generator

An external executable can implement `--manifest ABSOLUTE_JSON --output ABSOLUTE_DIRECTORY` and return zero on success. Invoke it with `npm run visuals -- --room bar --adapter /path/to/trusted-adapter`. Arguments are passed without a shell. This is deliberately a trusted local program, not a sandboxed plugin.

Inside Python, replace the SDXLTurbo class with another `generate(spec, options, seed) -> PIL.Image` backend; retain PromptSpec, CandidateAsset sidecars, deterministic naming, review and promotion. Do not import a model into `src/`, add an inference endpoint to the app, or allow a generator to modify room/entity data. An external tool supplies candidates and metadata; humans supply approval; the browser supplies stateful composition.
