# Optional ComfyUI visual workstation

Current preparation: [exact Kontext package, shared-workstation findings and download proposal](KONTEXT-LOCAL-EVALUATION-PROPOSAL.md). The [portable UI/API workflow](../tools/comfyui/workflows/velvet-kontext-dev-fp8-v1.md) has been statically validated against available core nodes. No model has been downloaded or run; this concrete preparation supersedes the earlier reserved-workflow/payload-not-yet-selected statements below.

ComfyUI is a first-class optional authoring tool. It is never a game build step, runtime service or required dependency. Its only interchange with the production pipeline is a retained image plus provenance and optional workflow JSON. Manual tools, hosted tools and other local models use the same source-import/review path.

Current workstation: NVIDIA RTX 4070, **12 GB VRAM**, **32 GB host RAM**; ComfyUI already installed. This task prepares the workflow only. No workstation installation/update, model download or inference is authorized here.

## Round trip

1. Read the asset's [provider-neutral contract](art-contracts/README.md), world/layout facts and approval scope. Use `export_art.py` from the [common pipeline guide](PROVIDER-NEUTRAL-ART-PIPELINE.md#export-and-import) to export the retained source PNG, brief, manifest, optional layout and hashes into `.visuals/exports/<asset>-<experiment>/`.
2. Copy `source.png` into the existing ComfyUI `input/` directory under a portable name such as `freak-city-bar-source.png`. Do not edit the repository's approved source in place. Translate the brief into model-specific prompt/node inputs while retaining the original brief.
3. Use a local image-edit workflow, with an image loader feeding the edit model, text instruction, explicit seed/settings, decode and PNG save. Keep any resizing visible in the workflow and record source/model-input/output dimensions independently. Avoid hosted/API nodes for the local bake-off. Node names and exact workflow depend on the selected pinned model and ComfyUI version.
4. Save PNGs from ComfyUI `output/` into `.visuals/imports/<asset>/<experiment>/source.png`. Save the actual workflow JSON and `authoring.json` next to them. Retain both the UI workflow and API-format export when useful; UI workflow JSON is the portable editing graph, while an API export records execution inputs. Embedded PNG workflow metadata is useful evidence but cannot replace the explicit JSON files.
5. Import with `import_external.py --source-type local-generation`, supplying `--authoring-json`, `--workflow` and `--art-contract`, plus the existing source/manifest/crop/parent arguments. The importer performs no inference. Source type describes the image's origin, not the quality of the tool. Hosted workflows use `hosted-generation`; manual-only sources use `manual-edit`.
6. Review the retained source, unwanted differences, framing, pixel master and real runtime state compositions through the normal review page/compositor. An edited source always begins as a draft. Preserve the entire approved source bundle in the repository before promotion. A successful ComfyUI execution does not grant art approval or replace an occupied canonical variant.

## Provenance and workflow storage

Portable reusable workflows live at **`tools/comfyui/workflows/`**. That directory is reserved now with its maintenance rules; no fabricated or untested executable workflow is presented as working. Once a model/workflow is approved and tested, retain `<purpose>-v1.json` there with a same-name Markdown companion containing node descriptions, required ComfyUI version, node-pack repositories/revisions, input/output names, model file roles and a licence/source inventory. Retain a byte-exact workflow copy with each imported candidate; the importer hashes that copy so changes to the shared workflow cannot rewrite history.

Use model basenames/relative ComfyUI model folders and portable input filenames. No model weights, credentials, tokens, user-specific absolute paths, downloaded caches or machine environments belong in Git. Inspect JSON prompts, widgets and custom-node config before retention. The importer rejects obvious absolute/parent-traversal paths and credential fields; manual inspection covers embedded values it cannot reliably recognize.

Example `authoring.json` structure (descriptive placeholders; replace with real measured facts):

```json
{
  "authoringTool": "ComfyUI",
  "modelFamily": "Selected image-edit family",
  "model": "publisher/exact-model",
  "revision": "exact upstream commit",
  "checkpointSha256": null,
  "sourceUrl": "https://huggingface.co/publisher/exact-model",
  "license": "exact licence identifier/version",
  "seed": 19421,
  "settings": {
    "sampler": "record actual value",
    "scheduler": "record actual value",
    "steps": 20,
    "guidance": null,
    "denoise": null,
    "quantization": "record actual format",
    "offload": "record actual strategy",
    "sourceDimensions": [1448, 1086],
    "modelInputDimensions": null,
    "outputDimensions": null
  },
  "environment": {
    "comfyUIRevision": "record actual commit",
    "customNodes": [],
    "checkpoints": [],
    "gpu": "NVIDIA RTX 4070",
    "vramGB": 12,
    "hostRamGB": 32
  },
  "manualEdits": []
}
```

List every diffusion checkpoint, text encoder, VAE, LoRA and auxiliary model under `environment.checkpoints`, with filename, upstream URL/revision, hash, bytes and licence. Record actual runtime/node versions and driver. A missing value stays null or absent; never infer a seed from the output filename. Quantization is part of model identity. Seeds do not guarantee byte-identical results across devices, package versions or kernels.

If a ComfyUI result is subsequently cleaned in Krita/Aseprite, retain the untouched output as `parentSource`, the edited PNG as the new source and append `manualEdits` with editor/tool/notes/date and before/after hashes. Use `manual-edit` for that new import; its authoring history can retain the earlier model facts. Preserve both stages rather than claiming the model produced the cleaned pixels.

## Controlled local image-edit bake-off — prepared, not run

The approved Velvet artwork is the **input reference**, never a replacement target. Use its retained 1448 × 1086 high-quality source, SHA-256 `3b6bcb06d78bc43a636e782c082891842d0054c93be1073200826cbcd103c9f2`. Do not regenerate the room from text. The old pendant lamps are already absent from this approved source, so asking to remove one would be an invalid experiment.

Instead, the proposed bounded target is the small rectangular wall poster immediately right of the salon opening, approximately source pixels `[923,312,1007,422]`. Before the future run, manually confirm and trace its exact mask, store its hash, and freeze that same target for every candidate. Removing it in a disposable copy tests surgical editing without changing any world design or production registry. This mask is not a production architecture change.

Reusable test instruction: “Remove only the small rectangular wall poster immediately right of the salon opening. Fill that patch with the surrounding distressed wall. Preserve the camera, every opening, stair, counter, shelves, window, neon tubes, floor, perspective, colour, texture and all other pixels as closely as possible. Add nothing.” Retain the exact translated prompt with each workflow/run.

Use the identical source, target mask, prompt intent and baseline processing for each family. First retain a no-edit processing control to distinguish resize/quantization changes from model changes. Run a single-image batch, fixed seed 19421, then 19422 and 19423 only within the future approved run budget; repeat the first seed once to check reproducibility. Freeze each family's documented scheduler/settings before comparisons. Record family-specific settings rather than pretending numerically equal guidance/steps mean equal algorithms. No repair pass before the raw result is measured; manual or masked compositing cleanup is a separately labelled result.

| Measure               | Evidence to retain                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Edit accuracy         | Target removed cleanly; no remnant/added fixture; human 0–5 score and target crop                                              |
| Geometry preservation | Compare stair/door/window/counter edges and fixed landmarks; displacement in source pixels; reject new routes or camera shifts |
| Style preservation    | Human 0–5 score at source and 320/640 runtime scale; palette/material/silhouette differences                                   |
| Unintended changes    | Absolute-difference image; changed-pixel fraction and mean RGB error outside the frozen mask, before any hard restoration      |
| VRAM / RAM            | Peak dedicated GPU memory and process/system RAM; note monitoring method, offload and OOM                                      |
| Time                  | Cold model-load time and warm end-to-end inference time separately, in seconds                                                 |
| Resolution            | Retained source, actual model input, raw output, any explicitly reviewed normalized comparison, pixel/display sizes            |
| Model payload         | Exact files/revisions/hashes, individual and total downloaded bytes, final disk footprint and temporary/cache duplication      |
| Reproducibility       | Workflow hash, prompt, seed, settings, node/runtime versions; repeated-output hash and image difference                        |
| Licence suitability   | Model/quantization/node licences, restrictions on evaluation/production, unresolved conditions; separate from visual score     |

Do not silently stretch mismatched output back to the input. Report changed resolution as a result; use a separately recorded normalization for comparisons. Canonical import still requires an explicit reviewed 10:7 crop. Keep raw outputs, masks, metrics and review under a separate experiment directory; never overwrite Velvet or promote a bake-off result.

## First candidate and hardware strategy

Recommended first **evaluation** baseline: **FLUX.1 Kontext [dev], Comfy-Org `flux1-dev-kontext_fp8_scaled.safetensors`**, using the official native image-edit workflow. It has a documented ComfyUI path and explicit FP8 diffusion/text-encoder options. This recommendation is a testable starting point, not a claim that it outperforms alternatives. [Official workflow and component list](https://docs.comfy.org/tutorials/flux/flux-1-kontext-dev), [Comfy-Org checkpoint listing](https://huggingface.co/Comfy-Org/flux1-kontext-dev_ComfyUI/tree/main/split_files/diffusion_models).

For the 12 GB card, plan batch size 1, FP8 weights/text encoder, CPU offload and tiled VAE only if required. Keep the unmodified high-quality source, record any workflow scaling, and start at a bounded roughly one-megapixel model input after approval. **Fit and inference speed are unmeasured estimates**, especially with only 32 GB RAM and encoder/activation overhead. If it OOMs or thrashes host memory, stop and report; propose a separately pinned lower-bit variant before another download. Never assume the diffusion file alone represents total payload or memory use.

Kontext [dev] has the FLUX.1 [dev] Non-Commercial License; model use and output rights have distinct terms. Treat it as an evaluation candidate pending review of the exact intended use, not blanket production clearance. [Publisher licence](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev/blob/main/LICENSE.md). A second candidate is **Qwen Image Edit**, for example the versioned `Qwen/Qwen-Image-Edit-2509` family, whose official model card identifies Apache-2.0; a particular quantized package and all its components still need their own source/licence/memory review. [Official Qwen model card](https://huggingface.co/Qwen/Qwen-Image-Edit-2509). Another suitable model can use the same experiment contract. No local performance ranking has been established.

## Mandatory future download decision

Before **any** model download, report the exact model and quantization, source URLs and pinned revisions, licences, exact per-file/total download size, expected final disk use including caches/temporary copies, the estimated VRAM/RAM/offload strategy and expected limitations. Include auxiliary encoders/VAE/LoRAs and new custom-node requirements. Inspect existing workstation files read-only to avoid redundant downloads. Then **wait for the owner's approval**, as explicitly required by the task. No approval is implied by this recommendation, the experiment plan or availability of disk space.

Exact download/disk totals are deliberately not asserted here: no complete pinned payload has been selected or approved. Prepare that concrete inventory at the next download decision, using current upstream file metadata. Current work ends at this documented plan and human review.
