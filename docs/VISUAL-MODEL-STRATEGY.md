# Visual model strategy

Use two explicit local backends with three separate visual products. **SDXL Turbo** remains the fast expressive model for scene illustrations, mood and atmosphere studies. **SDXL Base + structural ControlNet** is the first measured canonical-room production experiment. Simulation-driven overlays remain authored static assets and typed state; no model runs in the browser.

The Turbo text-only, img2img and regional canonical experiments are complete and preserved. Do not continue tiny Turbo canonical setting batches. The successful scene preset and scene candidate 02 from `cf0d1dd767d8` remain unchanged and unpromoted.

## Current controlled production result

The [ControlNet bake-off report](CONTROLNET-BAKEOFF-REPORT.md) records three Velvet images from SDXL Base 1.0 plus Diffusers small Canny ControlNet, using the original layout, protected regional masks, fixed denoising/prompt/seed and three control strengths. CUDA inference with explicit model offload fits the RTX 4070 12 GB. **Classification C: insufficient for final canonical rooms.** Fixed pixels survive; material quality and semantic architecture inside masks do not meet the bar.

This finding applies to the tested small ControlNet, base checkpoint, resolution and mask strategy. It is not proof that every SDXL checkpoint or larger ControlNet fails. The small model's own documentation identifies its experimental limits on complex conditioning. [Official small Canny model card](https://huggingface.co/diffusers/controlnet-canny-sdxl-1.0-small).

## Selection and production gates

Prefer documented local/offline models with explicit identities, pinned revisions, compatible Diffusers workflows, retained source images, repeatable seeds and measured GPU memory/time. Evaluate stairs, counter, high window, routes, room envelope and invented features separately from pixel preservation. A model cannot approve its own geometry.

Licences are checkpoint specific. This experiment uses SDXL Base's CreativeML Open RAIL++-M terms and the small ControlNet's declared Open RAIL++ licence; retain source/revision/licence records. Commercial asset potential does not imply a guarantee about any particular output. Turbo's licence remains a separate decision for any eventual scene promotion. [SDXL Base licence](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md), [Turbo model card](https://huggingface.co/stabilityai/sdxl-turbo).

## One next family, pending explicit approval

Recommend an **FLUX.1 Kontext editing/refinement evaluation**, using the existing layout and a tightly scoped material/lighting edit, if another model experiment is authorized. Its image editing objective is better aligned with refining a supplied room than repeatedly resampling a blockout. This is a hypothesis, not evidence that it will solve geometry. The report documents hardware estimates and the separate non-commercial model licence/commercial-use review needed before a local download. No Kontext or Qwen weights were downloaded and no second family was tested. [Official Kontext model card](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev).

## Adapter contract

`tools/visual-gen/backends.py` registers explicit model identities, supported conditioning modes, maximum steps, guidance constraints and lazy factories. `sdxl` retains Turbo's existing text/img2img/regional behavior. `fixture` remains procedural and cannot claim model execution. `sdxl-controlnet` adds only the controlled canonical inpaint mode, CUDA inference, fixed model revisions, explicit memory policy and offline-only loading.

`prepare_controlnet.py --download` is the separate explicit download operation; its inventory includes only selected FP16 safetensors/config/tokenizer/licence files. No alternate model, refiner, full-precision checkpoint or annotator is fetched implicitly. `HF_HOME` is respected. [Diffusers ControlNet guidance](https://huggingface.co/docs/diffusers/using-diffusers/controlnet), [memory/offload guidance](https://huggingface.co/docs/diffusers/optimization/memory).

ControlNet calls accept reference, mask and control images. Metadata records all identities, hashes, strengths, source/master images, environment and timings. Promotion requires existing human world-fact, architecture, non-explicit and composition review plus reference/control review and byte/pixel provenance validation. Human edits create new drafts and retain control provenance without inheriting approval. No registered backend writes shipping assets during generation.
