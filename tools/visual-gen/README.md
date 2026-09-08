# FREAK//CITY local visual tools

Development-only Python tools. **No model is bundled with the game.** See [the full pipeline guide](../../docs/GENERATIVE-ASSET-PIPELINE.md) for setup, commands, cache, review, limitations and the external adapter contract.

| File                  | Responsibility                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| `original/`           | Four byte-preserved collaborator files; original guides use the wrong script filename                     |
| `adapter.py`          | CLI, batch/seed handling, metadata, raw candidates and contact sheets                                     |
| `generator.py`        | Lazy SDXL Turbo loader, explicit CUDA/CPU behavior, configurable retro crunch, deterministic test fixture |
| `prompt_builder.py`   | World manifest to full audit prompt plus compact model prompt                                             |
| `contact_sheet.py`    | Labelled candidate comparison sheets                                                                      |
| `optimizer.py`        | Pixel-preserving lossless WebP; aspect-ratio and size guard                                               |
| `promote.py`          | Explicit human review, provenance, hash and shipping registry                                             |
| `review.py`           | Role-specific architecture/composition and illustration approval; overlay-study shipping restriction      |
| `layout_reference.py` | Deterministic Velvet blockout, parser/fixed-fact checks and reference bundle verification                 |
| `tests/`              | Non-ML pipeline tests, including reproducibility and isolated promotion                                   |

```sh
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --dry-run
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --fixture
# Only on a machine configured for the model:
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --generate
npm run visuals -- --room velvet-bar --role canonical-room --layout
# Current bounded geometry experiment; validate layout/tests before running:
npm run visuals -- --room velvet-bar --role canonical-room --reference .visuals/layouts/bar/v1/layout.json --count 4 --seed 19421 --steps 4 --strengths 0.25,0.5,0.75,1 --pixel-width 320 --display-width 640 --generate --device cuda
```

Pillow is sufficient for older fixture tools; the full non-ML tests also require pinned OpenCV (`opencv-python-headless==4.11.0.86`) for deterministic Canny. Torch and the other model dependencies are loaded only for actual SDXL generation. `python tools/visual-gen/adapter.py --help` works without them. Model weights use the normal Hugging Face cache, outside this repository. Never run the preserved original module as an import: its top-level code immediately parses arguments and loads the model.

The adapter supports `texture` (the original default), `canonical-room`, `scene-illustration` and draft `overlay` studies. Canonical identity uses one `canonical` variant across all time bands. V3 adds optional validated layout img2img and strength matrices with the existing SDXL weights. See the [geometry report](../../docs/VISUAL-GEOMETRY-REPORT.md), including model pin/offline commands. Earlier batches remain preserved and unpromoted. Nothing is promoted automatically.

The supplied package's source has no separate licence notice. Original files and their provenance are preserved; no additional licence or authorship claim has been invented.

## Production pivot

See [the 17-room plan](../../docs/VISUAL-ASSET-PLAN.md) and [current production workflow/proof commands](../../docs/VISUAL-PRODUCTION-REPORT.md). V4 adds:

- `backends.py`: explicit model/capability registration, retaining `sdxl` and `fixture`; the subsequent ControlNet experiment adds `sdxl-controlnet`.
- `regions.py`: visible-surface masks, per-region inpainting, protected-pixel and palette restoration. Use `--reference ... --regions walls,floor,counter,shelves,stairs`.
- Retained `sources/` images, region seeds/prompts, mask hashes, GPU memory and timing metadata.
- `import_edit.py`: import a manually corrected source with editor/tool/notes and immutable parent provenance; create a fresh draft.
- `review_page.py`: canonical facts/layout/candidate/composite review or separate scene-style review. `scripts/visual-review-composite.ts` renders actual nonshipping composite studies.
- A separate expressive 64-colour scene preset, six documented art families, and a future production-model evaluation contract.

Masks constrain pixel regions; they do not prove that the model has avoided invented features within a region. No automatic promotion, model replacement or additional model download occurs.

## Structural production experiment

`controlnet_backend.py` uses pinned SDXL Base plus Diffusers small Canny ControlNet through the official inpainting pipeline. `structural_control.py` derives and validates Canny provenance from the existing reference. `controlnet-models.json` and `prepare_controlnet.py` define the explicit selected-file download. Install `requirements-controlnet.txt` in the established GPU environment. Inference remains CUDA with documented model offload and cached-only loading.

The [ControlNet report](../../docs/CONTROLNET-BAKEOFF-REPORT.md) contains the exact three-candidate command, measured limitations and review outputs. Control scales vary independently of fixed denoising; canonical output remains exact 320 → 640. Scene presets and shipping assets are unchanged. The [overlay art plan](../../docs/DYNAMIC-OVERLAY-ART-PLAN.md) describes later consistent sprites; none are generated here.
