# Local visual generation and human review

**Development spoilers · PRE-ALPHA / ACTIVE DEVELOPMENT.** Python, Torch and model weights remain local development tools. The browser receives only reviewed static art. No model, inference API or Python dependency enters the game bundle or Pages deployment.

## Preserved collaborator package

The four original files remain under `tools/visual-gen/original/`; `ORIGINAL-SHA256SUMS` records their source bytes. Older Windows Git checkouts may convert LF to CRLF; v2 adds `.gitattributes` to preserve LF and the original source hashes. Do not run the old module on import: it loads a model at module scope. Both old guides refer to `imagegentoo.py`, but the actual original is `imagegrouptool.py`. The integrated entry point is `adapter.py`.

The original two-step/guidance-zero SDXL Turbo workflow, configurable retro crunch and seed handling remain intact. V2 adds role-aware prompts, reviewed architecture composition, illustration cues and display upscaling. The first real texture batch is preserved locally as a **texture-role experiment**, seeds 2741–2748, run `49ad3f1999c7`; its original candidates and sidecars are unchanged and unpromoted.

## Setup and Windows environment

Use Node 22 (`.nvmrc`) and Python 3.10+ in a virtual environment. Install a CUDA-enabled Torch wheel appropriate to the machine before the remaining requirements. Model packages are optional for normal game development; Pillow alone runs the Python pipeline tests.

```powershell
py -3.10 -m venv .venv
. .\.venv\Scripts\Activate.ps1
# Verified on the current RTX 4070 / NVIDIA 610.47 workstation:
python -m pip install torch==2.11.0+cu128 --index-url https://download.pytorch.org/whl/cu128
python -m pip install -r tools/visual-gen/requirements.txt
$env:VISUAL_PYTHON = (Resolve-Path .venv\Scripts\python.exe).Path
$env:PYTHONUTF8 = '1'
```

Respect `HF_HOME` and normal Hugging Face cache settings. On this workstation the existing cache is `C:\Users\thr3e\.cache\huggingface`, outside the repository. Do not hard-code the collaborator's example `G:\LLMModels`. Allow room for multi-GB weights and temporary downloads. The loader checks critically low free space, unavailable CUDA, missing packages, model-load errors and GPU memory exhaustion. It never silently switches to CPU. CPU requires both `--device cpu --allow-cpu`; none of the real batches used CPU inference.

The local ignored `.visuals/setup/Activate.ps1` restores Node 22, the venv, `VISUAL_PYTHON`, UTF-8 I/O and the existing cache. Exact installed versions are in `.visuals/setup/requirements-lock.txt`. Python 3.10.11, Torch 2.11.0+cu128, Diffusers 0.39.0, Transformers 4.57.6, Accelerate 1.14.0 and Pillow 12.3.0 ran the v2 batch successfully.

## Roles

| CLI role             | Prompt/content                                                                 | Promotion contract                                                                                 |
| -------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `texture` (default)  | Original empty abstract material plate                                         | Human background-only/world-fact review; v1 metadata supported                                     |
| `canonical-room`     | Grounded permanent room architecture and fixed furniture                       | Single `canonical` variant, architecture review, adjusted overlay composition, non-explicit review |
| `scene-illustration` | Cinematic authored hint; anonymous adults and non-explicit nightlife permitted | Existing scene/room binding, caption, time bands, required NPCs and boundary themes                |
| `overlay`            | Isolated atmospheric layer study                                               | Draft only until a mask and simulation binding contract is implemented                             |

Named NPCs, plot props, evidence, temporary damage, player belongings and stateful doors cannot be baked into a canonical room plate. Scene illustrations explicitly have `authoritativeGeometry: false`. A draft canonical candidate has `authoritativeArchitecture: false`; only reviewed canonical provenance and the shipping registry set it to true.

## Integrated commands

```sh
npm run visuals -- --room velvet-bar --variant late --count 8 --seed 2741 --dry-run
npm run visuals -- --room velvet-bar --role canonical-room --count 8 --seed 8317 --pixel-width 320 --display-width 512 --revision 71153311d3dbb46851df1931d3ca6e939de83304 --dry-run
npm run visuals -- --room velvet-bar --role canonical-room --count 8 --seed 8317 --pixel-width 320 --display-width 512 --revision 71153311d3dbb46851df1931d3ca6e939de83304 --generate --device cuda --offline
npm run visuals -- --room velvet-bar --role scene-illustration --variant late --count 2 --seed 9451 --dry-run
npm run visuals:validate
python -m unittest discover -s tools/visual-gen/tests -v
```

`velvet-bar` aliases canonical room ID `bar`. A generation request requires one explicit room. No whole-city generation is automatic. A room request without `--generate` or `--fixture` defaults to dry-run. Fixture mode remains explicitly procedural and is never represented as SDXL output. The optional illustration example above only prepares a plan; no real illustration batch was generated in this pass.

`canonical-room` accepts only `--variant canonical` or no variant. One identity persists across time bands; lighting/state changes belong to runtime presentation. Seeds advance by candidate index modulo 2^32. A new CPU Torch random generator supplies each seed to CUDA inference; this is not CPU model generation. Reproducibility depends on the pinned model, packages, hardware and kernels, not just the seed.

Other controls: `--steps 1..4`, `--width`, `--height`, `--pixel-width`, `--display-width`, `--colors`, `--contrast`, `--revision`, `--offline`, and `--output`. Reusing an identical configuration refuses to overwrite the existing run. Use an explicitly different experiment output directory if a repeat is intended; do not delete history to bypass the guard.

## Manifest and prompt contract

The TypeScript producer validates the role, initializes a separate simulation snapshot and records real room descriptions, exits, entities, explicit permanent facts, an exhaustive dynamic entity/door partition, placement zones and review facts. It never modifies a player save. Nonportable objects are not automatically fixed: they need an explicit authoring declaration. Evidence, doors, owned objects, portable items and closable containers cannot become fixed room furniture.

The canonical prompt uses actual architecture fields and a compact district style. It no longer begins with “Empty abstract texture plate.” The full audit includes all required/forbidden facts and exits; the compact prompt fits CLIP without silently truncating. The v2 bar prompt uses 60 of 77 tokens in both tokenizers:

> 32-bit pixel art, PS1, crimson noir. Velvet / the bar interior. single staircase beside salon, distant small stage, high street window, fixed bar counter, bottle shelves. Wide deep establishing view, clear overlay space. No people, props, extra stairs or exits.

The bar's red booths were an example in the brief, not established source facts, and are not added to its manifest. Negative wording is review guidance, not an enforcement mechanism. SDXL Turbo at guidance zero does not enforce negative prompts; the real v2 sheet includes architectural contradictions that require rejection or further controlled authoring.

The [official model card](https://huggingface.co/stabilityai/sdxl-turbo) describes Turbo's generation constraints. Its typical training resolution is 512 × 512; this pipeline's 640 × 448 is a compositor-oriented experiment, not a guarantee of geometry quality. See [Diffusers reproducibility guidance](https://huggingface.co/docs/diffusers/main/using-diffusers/reproducibility).

## Pixels, output and provenance

Role presets live in the room manifest. Canonical defaults: 640 × 448 source, 320 × 224 pixel crunch, 48 colours, contrast 1.15, then exact 640 × 448 nearest-neighbour display output. Illustrations retain 512 × 358. Texture defaults preserve contrast 1.3 and display width 320. CLI options override presets, including `--display-width 512` for canonical images. Width 512 uses a rounded height and uneven pixel-block widths. No blur or crop is applied.

When display width differs from pixel width, the original crunched master is retained under `pixels/`, with a hash in the display sidecar. Promotion verifies that the pixel master reproduces the reviewed display candidate exactly before using it to encode WebP. This avoids a second sampling of the uneven 320→512 grid. The uncrunched diffusion image is not separately retained in this version.

```text
.visuals/jobs/bar--canonical-room.json
.visuals/generated/bar/plans/<run>/prompt-spec.json + dry-run.json
.visuals/generated/bar/raw/<run>/prompt-spec.json
.visuals/generated/bar/raw/<run>/bar__canonical-room__canonical__candidate-01.png
.visuals/generated/bar/raw/<run>/bar__canonical-room__canonical__candidate-01.json
.visuals/generated/bar/raw/<run>/pixels/<candidate>.png
.visuals/generated/bar/review/<run>/contact-sheet.webp
```

Each sidecar records role, layer, audit/model prompt, required/forbidden facts, review contract, seed, pinned model revision, backend, execution flag, CUDA/GPU/package details, source/pixel/display dimensions, nearest-neighbour settings, hashes, timestamp and draft status. No tokens or personal cache paths are recorded. Contact sheets label role, candidate, seed and backend. Canonical run IDs and prompts exclude the simulation clock/NPC snapshot so clock changes cannot redefine room identity.

## Human review and promotion

Inspect the contact sheet and original candidate against required/forbidden facts, then test the proposed overlay placement at desktop/mobile scale. For architecture, check all entrances/exits, exactly one established staircase, fixed-furniture placement, window geometry and absence of changing props. A reviewer must edit a composition JSON for the selected image; generation's schematic layout is only a starting reference.

Canonical composition JSON contains `anchors`, `npcZones`, `atmosphereZones` and `foregroundZones`, using the same 320 × 224 schema as the manifest. Required dynamic anchors and all stateful doors must be covered, with no invented entity IDs. Four NPC positions and nonempty atmosphere/foreground zones are required. The chosen plate's actual geometry must be assessed by a human; bounds validation cannot do that.

After explicit human approval, the separate canonical promotion command is:

```sh
python tools/visual-gen/promote.py --candidate EXACT_DRAFT.png --reviewer PUBLIC_ALIAS --notes "Inspected architecture and actual overlays" --approve-world-facts --approve-architecture --composition REVIEWED_LAYOUT.json --non-explicit
```

Texture promotion retains the original `--approve-world-facts` flow. Illustration promotion additionally requires `--non-explicit --illustration SCENE_BINDING.json`. The binding contains `sceneId`, `caption`, `timeBands`, `requiredNPCs` and `themes`; the scene must already exist and match the room, and all depicted named NPCs/themes must be declared. Build validation checks bindings; runtime checks scene, time, actual presence and boundary settings. Overlay-study promotion is intentionally blocked pending alpha-mask and simulation-binding support.

Promotion preserves draft files and sidecars, writes reviewed provenance locally, encodes lossless WebP and adds a hash-bound registry entry. It refuses existing room/role/variant ownership (illustrations also distinguish scene ID) and enforces the 150 KB cap. Build checks reject drafts, missing role-specific approval, invalid composition/bindings, unsupported paths, missing files, bad dimensions, changed hashes and unregistered shipping files. Runtime decode failure still falls back safely.

**No candidate from either real batch has been promoted.** Nothing under `.visuals/` is automatically shipped or uploaded.

## Extension point and checks

The current production strategy is defined in [the 17-room asset plan](VISUAL-ASSET-PLAN.md) and [staged production report](VISUAL-PRODUCTION-REPORT.md). Canonical rooms use fixed layouts, bounded surfaces and optional honest manual corrections; scene illustrations use their own expressive preset; dynamic overlays remain simulation-driven. Historical whole-image commands below/above remain reproducibility records, not the recommended final-room method.

An external trusted adapter still receives `--manifest ABSOLUTE_JSON --output ABSOLUTE_DIRECTORY` without a shell. It must honor the manifest role. Internally a backend implements `generate(spec, options, seed) -> PIL.Image`. The integrated adapter supports text-only and optional validated layout img2img using the same SDXL Turbo weights. `conditioning` records reference/layout/mask hashes. The separate `sdxl-controlnet` backend adds deterministic Canny and structural guidance; see the bounded command below.

## Fixed Velvet layout and controlled img2img

Use the [geometry report](VISUAL-GEOMETRY-REPORT.md) for the current four-candidate experiment, exact integrated commands, labelled references and review findings. The earlier eight-candidate commands above document historical V2 reproduction; they are not the current next step.

`npm run visuals -- --room velvet-bar --role canonical-room --layout` creates `.visuals/layouts/bar/v1/layout.json`, `reference.png`, `top-down.svg`, `perspective.png` and `facts.md`. This deterministic bundle fixes art coordinates grounded in all seven actual routes. Regeneration is idempotent; differing output in the same directory is refused. The adapter's `--reference PATH/layout.json` verifies current blueprint/facts, pixels and dimensions, then copies the bundle into the batch's `reference/` folder. No cropping, downloaded control model or implicit CPU fallback occurs.

`--strength 0.5` uses one denoising setting with incrementing seeds. `--strengths 0.25,0.5,0.75,1 --steps 4 --count 4` instead shares the exact base seed and prompt across four distinct effective schedules. Higher denoising strength retains less reference structure. Invalid/NaN strengths, zero effective steps and redundant effective schedules fail before model loading. Metadata and contact-sheet labels record each candidate's setting. Fixture mode verifies plumbing only; its procedural images do not simulate img2img conditioning.

Guided canonical promotion additionally requires `--approve-reference-geometry`: human approval of the layout and comparison of the actual image to its staircase, boundaries, exits, fixed furniture and window. All existing approval flags and reviewed runtime composition remain required. Modified reference files block promotion. Beautiful images that change geometry must be rejected.

## Regional surfaces, editable sources and review

`--regions walls,floor,counter,shelves,stairs` with a validated `--reference` selects regional inpainting through the same cached Turbo weights. Each surface receives its own deterministic seed/prompt and hard mask. Black pixels stay protected; white interiors can change. The adapter composites each pass and restores protected palette colours after crunch, recording changed protected pixels at source and master scale. It also records mask files/hashes and per-pass settings. This protects real openings and silhouettes but does not prevent a fake feature from being painted _inside_ an editable surface. Inspect the actual art.

All new candidates retain the pre-crunch PNG in `sources/`, including freely generated illustrations. `sourceImage`, `pixelSource` and display hashes distinguish editing inputs from display masters. `python tools/visual-gen/import_edit.py --help` documents the explicit manual-correction import: parent draft, edited source, editor, tool, notes and output directory. Import creates a new unapproved draft, preserves parent image/metadata and reference/masks, clears inherited approval/protected-pixel claims, and records that no model executed during the import. Edit a copy, never overwrite the original generated file or sidecar.

Use `python tools/visual-gen/review_page.py --batch BATCH_DIRECTORY --output REVIEW_DIRECTORY` for role-specific review. Canonical pages show layout/facts, candidate, masks and runtime snapshots when available; absent snapshots are explicitly marked pending. With local Vite on 5182, `npx tsx scripts/visual-review-composite.ts --batch BATCH_DIRECTORY --output REVIEW_DIRECTORY` creates actual `LocationVisual` composites with clearly labelled, unapproved in-memory test bindings. It also checks late/dawn and mobile. Run the page builder afterward. Neither tool writes a shipping registry entry.

The scene preset is 320 pixels / 64 colours / contrast 1.10 / configurable 512 display, with family-appropriate cinematic prompts. Canonical remains 320 / 48 / 1.15 / exact 640 display. `--backend` selects an explicit registration in `backends.py`; Turbo, a non-ML fixture and the pinned SDXL ControlNet canonical experiment are registered. Additional production models require their own capability limits and an approved download. See [model strategy](VISUAL-MODEL-STRATEGY.md).

Run full JS checks, Python tests, normal/Pages builds, visual validation and formatting. With preview on port 5181 and development Vite on 5182, run the existing visual browser suite with `PLAYTEST_URL`/`VISUAL_DEV_URL`, then `npm run test:visuals:roles:browser`. The latter verifies reviewed geometry, mobile framing, scene illustration/return, Off/Reduced and failure fallback using isolated nonshipping test images. See [v2 results](VISUAL-V2-REPORT.md) and the [architecture](VISUAL-ARCHITECTURE.md).

## SDXL ControlNet canonical bake-off

See [the measured result and model/licence inventory](CONTROLNET-BAKEOFF-REPORT.md). The Turbo scene preset is unchanged. This is a separate production backend; historical Turbo canonical commands above are reproduction records.

In the existing GPU virtual environment:

```powershell
. .\.visuals\setup\Activate.ps1
python -m pip install -r tools/visual-gen/requirements-controlnet.txt
python tools/visual-gen/prepare_controlnet.py --download --report .visuals/setup/controlnet-download.json
npm run visuals -- --room velvet-bar --role canonical-room --backend sdxl-controlnet --reference docs/visuals/velvet-bar-layout/layout.json --regions walls,floor,counter,shelves,stairs --count 3 --seed 51863 --steps 30 --strength 0.85 --guidance-scale 5 --control-scales 0.35,0.65,1.0 --offline --generate
```

The example run already exists; a repeat refuses overwrite. Use an explicitly separate `--output` directory for intentional reproduction, not another exploratory batch. Substitute `--dry-run` for `--generate` to validate the control bundle without model loading.

The pinned FP16 loader always requires cached weights and CUDA. Explicit model CPU offload moves components between host and GPU while inference executes on CUDA. The original VAE uses its native float32 upcast; no additional VAE/refiner is downloaded. Canny uses the unchanged 640 ? 448 reference, RGB-to-gray, thresholds 20/40, aperture 3 and L1 gradient. These lower thresholds retain the dark opening/wall boundaries. There is no learned depth annotator or new layout.

`--control-scales` is the ControlNet residual multiplier, distinct from denoising `--strength`. The matrix fixes prompt/seed/denoising and rejects simultaneous `--strengths`. All selected existing regions form one inpainting mask for coherent room material treatment; hard restoration and protected palette restoration still guard the original boundaries. The canonical master/display contract is exactly 320 ? 640 nearest-neighbour.

Sidecars include model/control revisions, control PNG/hash/pixel hash/algorithm/source-reference hash, mask provenance, control schedule, union-mask strategy, inference time, peak allocated/reserved CUDA memory and explicit memory policy. `model-output/` preserves the pipeline output before hard restoration; `sources/` is the restored pre-crunch input; `pixels/` contains masters. None is an approved asset.

Generate actual runtime composites and the review page with the existing commands above. The page includes reference, control, candidate, composite, canonical facts and settings together. Promotion and manual-edit import validate the control's source hash and deterministic decoded pixels as well as existing reference/mask checks. Geometry review attests the reference AND control comparison; no automatic approval is inferred from a zero changed-pixel count.
