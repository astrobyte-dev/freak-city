# Velvet surgical-edit evaluation / Kontext dev FP8 v1

**DEFERRED / NOT EXECUTED (2026-09-10).** Acquisition and full hash verification succeeded; ComfyUI discovered all required models. No inference was submitted. Keep this exact graph for possible future use; do not resume it under the superseded single-run authorization. See the [closure record](../../../docs/KONTEXT-EVALUATION-STATUS.md). The historical preparation/use instructions below are retained, not an instruction to download or execute now.

Open [the UI workflow](velvet-kontext-dev-fp8-v1.json) in ComfyUI after approval. [The API export](velvet-kontext-dev-fp8-v1.api.json) encodes the same 15 core nodes and 17 links. [Model manifest](../kontext-model-proposal.json), [test contract](../velvet-kontext-test-contract.json), [download proposal](../../../docs/KONTEXT-LOCAL-EVALUATION-PROPOSAL.md).

## Compatibility and provenance

Validated against the active ComfyUI **0.18.1**, commit `31283d2892f54caf9bfdf6edb9c98cbfa88c5f0c`, frontend **1.42.10**, Python **3.14.3**, PyTorch **2.11.0+cu128**. Every required node was confirmed through read-only `/object_info/<node>` responses. No custom node, ComfyUI upgrade or package change is required by this graph. Model/input files are intentionally missing until approved; static validation cannot prove memory fit or image quality.

The graph follows the reference-latent conditioning and sampler connections in the installed official `comfyui-workflow-templates-media-image` **0.3.118** Kontext template. It is authored here as a simple single-source graph, without template subgraphs, API nodes or model-download widgets. The [official ComfyUI guide](https://docs.comfy.org/tutorials/flux/flux-1-kontext-dev) identifies the model components. Unlike its automatic aspect-bucket scaler, this workflow uses an explicit approved crop and aspect-preserving resize, making the no-edit control comparable to the result.

## Nodes and explicit settings

| Nodes       | Purpose                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 → 2 → 3   | Load retained 1448 × 1086 source PNG; approved crop `(x4,y0,1440,1008)`; Lanczos resize to 1120 × 784, no additional crop                                         |
| 4           | Load `flux1-dev-kontext_fp8_scaled.safetensors`, default dtype handling                                                                                           |
| 5 → 7       | DualCLIPLoader with `clip_l.safetensors`, verified existing `t5xxl_fp8_e4m3fn_scaled.safetensors`, type `flux`, device `default`; encode the contract instruction |
| 6 → 9       | Load `ae.safetensors`; encode normalized high-quality reference                                                                                                   |
| 7 → 10 → 11 | Add the encoded image as `ReferenceLatent`, then Flux embedded guidance **2.5**                                                                                   |
| 7 → 8       | Zero negative conditioning                                                                                                                                        |
| 12          | KSampler: seed **19421**, control after generation **fixed**, **20** steps, CFG **1.0**, **Euler**, **simple**, denoise **1.0**, one input image                  |
| 13 → 14     | Decode and save raw output, without repair, restoration or pixel quantization                                                                                     |
| 3 → 15      | Save the normalized no-edit control used for locality/geometry comparisons                                                                                        |

Denoise 1.0 is the reference-conditioned Kontext baseline from the template. The image remains a conditioning input through node 10; this is not text-only room generation. Do not treat its denoise value as equivalent to an SDXL img2img preservation guarantee. No hard mask restores pixels after sampling. The ROI is an evaluation mask, so unintended changes remain visible and measurable.

## Shared workstation use after approval

`COMFY_ROOT` below denotes whichever installed workstation the owner chooses. Never put its machine-specific absolute path in workflow JSON.

1. After download approval, add only the three missing manifest files to their specified `models/...` directories. Keep the existing verified T5 unchanged. Use exact revision URLs and verify SHA-256 before making any file visible to a loader. Never overwrite an existing file with a different hash. Refresh model selectors only when the shared session is idle; no restart is currently proposed.
2. After execution approval, copy the retained source PNG to `COMFY_ROOT/input/freak-city/velvet-kontext-v1-source.png`, preserving its contract hash. This namespace belongs to this experiment. No files have been copied into ComfyUI during preparation.
3. Confirm the queue is idle and the owner is ready for this memory-intensive run. Preserve the existing process and settings. Do not clear caches, interrupt jobs, unload another project's model, change launch arguments or start a second GPU instance automatically.
4. Load the UI workflow and check the three filename selections and source before one explicit queue action. Never batch additional models or seeds automatically. SaveImage creates numbered files under `COMFY_ROOT/output/freak-city/kontext-v1/`. Keep both raw and normalized-control PNGs.
5. Retain workflow/API JSON, source/control/output hashes, model manifest and measured execution metadata beside the outputs in FREAK//CITY's ignored `.visuals/imports/bar/kontext-v1/` workspace. For API execution, supply the UI graph as `extra_data.extra_pnginfo.workflow` along with the `prompt` API export so SaveImage can embed it; keep explicit sidecars regardless. Do not assume PNG metadata alone survives later editing.
6. Import the raw 1120 × 784 PNG through `import_external.py --source-type local-generation --colors 64 --contrast 1.15`, full-frame crop `[0,0,1120,784]`, the retained room manifest, room art contract, workflow file and actual authoring metadata. Retain the original high-quality source as parent plus the separately saved normalized control. Review 320 → 64 colours → 640 alongside the control. Every result stays a draft; never replace Velvet.

## Offline validation

```sh
python tools/comfyui/validate_workflow.py
```

Optionally pass `--schema <saved-object-info.json>` to check the graph against saved read-only node definitions. The validator makes no network call and imports no ComfyUI/ML package. It checks UI/API agreement, sockets, fixed settings, source hash, model filenames/payload totals and the ROI transform. Missing weights/source input are reported separately from structural validity. Validation does not execute the graph or authorize downloads.
