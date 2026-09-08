# FREAK//CITY local visual tools

Development-only Python tools. **No model is bundled with the game.** See [the full pipeline guide](../../docs/GENERATIVE-ASSET-PIPELINE.md) for setup, commands, cache, review, limitations and the external adapter contract.

| File                | Responsibility                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `original/`         | Four byte-preserved collaborator files; original guides use the wrong script filename                     |
| `adapter.py`        | CLI, batch/seed handling, metadata, raw candidates and contact sheets                                     |
| `generator.py`      | Lazy SDXL Turbo loader, explicit CUDA/CPU behavior, configurable retro crunch, deterministic test fixture |
| `prompt_builder.py` | World manifest to full audit prompt plus compact model prompt                                             |
| `contact_sheet.py`  | Labelled candidate comparison sheets                                                                      |
| `optimizer.py`      | Pixel-preserving lossless WebP; aspect-ratio and size guard                                               |
| `promote.py`        | Explicit human review, provenance, hash and shipping registry                                             |
| `review.py`         | Role-specific architecture/composition and illustration approval; overlay-study shipping restriction      |
| `tests/`            | Non-ML pipeline tests, including reproducibility and isolated promotion                                   |

```sh
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --dry-run
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --fixture
# Only on a machine configured for the model:
npm run visuals -- --room bar --variant late --count 8 --seed 2741 --generate
npm run visuals -- --room bar --role canonical-room --count 8 --seed 8317 --pixel-width 320 --display-width 512 --generate
```

Pillow is sufficient for fixture/tests. Torch and the other model dependencies are loaded only for actual SDXL generation. `python tools/visual-gen/adapter.py --help` works without them. Model weights use the normal Hugging Face cache, outside this repository. Never run the preserved original module as an import: its top-level code immediately parses arguments and loads the model.

V2 supports `texture` (the original default), `canonical-room`, `scene-illustration` and draft `overlay` studies. Canonical identity uses one `canonical` variant across all time bands. The first real texture batch remains preserved and unpromoted. See the pipeline guide for role-specific human review, pixel-master preservation, display upscale and future reference conditioning. Nothing is promoted automatically.

The supplied package's source has no separate licence notice. Original files and their provenance are preserved; no additional licence or authorship claim has been invented.
