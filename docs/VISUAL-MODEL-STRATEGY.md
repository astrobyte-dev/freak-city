# Visual model strategy

Keep SDXL Turbo as the **fast concept backend**. Use a separately evaluated **production backend** when better surface detail, coherent environments or important illustration quality justifies the time and memory cost. Neither model owns geography or runtime state. No new model has been downloaded or tested in this pass.

The current evidence is local: text-only Turbo finds the mood but invents architecture; whole-image img2img trades geometry for finish. Regional inpainting is the next bounded experiment using the same cached weights. Its results are in the [production report](VISUAL-PRODUCTION-REPORT.md). Evaluate control first, then compare model quality within the same masks.

| Use                    | Fast concept backend                                    | Production backend requirement                                                             |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Mood and scene studies | Turbo, small seeded batches; geometry non-authoritative | Better anatomy, framing and coherent environments for selected hero moments                |
| Canonical rooms        | Turbo can study materials within reviewed masks         | Strong img2img/inpainting and material continuity; still hard-bound to the approved layout |
| Dynamic overlays       | Procedural layers and authored pixel shapes first       | Optional reviewed sprite/material assistance; simulation binding stays separate            |

## Candidate evaluation criteria

- Local/offline operation after an explicitly approved download; a pinned revision and retained source images.
- Good environment rendering, img2img and mask transitions. No requirement that one invocation finish a room.
- Structural adherence measured with the existing reference and masks; count changed protected pixels and separately inspect invented features _inside_ editable regions.
- Grungy adult nightlife, restrained private/service spaces, coherent silhouettes, deep shadows with readable midtones; current shipping art remains non-explicit and adult-only.
- RTX 4070 12 GB feasibility measured at batch size one and the target aspect ratio. Record peak VRAM, full run time, package versions and whether any explicit offload was used. Feasibility is unproven until measured; no silent CPU fallback.
- Licensing for the exact checkpoint and eventual distribution/use, including any fine-tune or adapter terms. Keep the original license and revision with the evaluation record.
- Reproducible seeds/scheduler/settings and compatibility with Diffusers or the trusted external-adapter interface. Model-specific steps and guidance must not inherit Turbo's limits blindly.

## Recommended next model comparison, subject to approval

A **standard SDXL-family production checkpoint, preferably with an inpainting-focused option**, is a sensible first comparison because it fits the existing adapter architecture. The official SDXL base model is a useful baseline, not a promise of the best current model or a guaranteed style match. Its model card documents base/refiner operation; loading both together is unnecessary for an initial bounded test. [Official SDXL model card](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0).

Diffusers documents regular-checkpoint inpainting as possible, with visible quality/transition trade-offs versus purpose-trained inpainting weights. That supports testing a suitable inpainting backend if Turbo's region surfaces remain weak. [Official inpainting guide](https://huggingface.co/docs/diffusers/using-diffusers/inpaint).

A standard SDXL checkpoint may be practical on this GPU at batch one, but that is an engineering hypothesis, not a benchmark from this pass. Explicit tiling/offload are available optimization options; they affect speed and must be recorded rather than selected silently. [Diffusers memory guidance](https://huggingface.co/docs/diffusers/optimization/memory).

The Turbo model card currently identifies `sai-nc-community` and points commercial users to Stability's licensing terms. SDXL base identifies CreativeML Open RAIL++-M, which includes use restrictions and obligations. These are checkpoint-specific terms, not blanket clearance for every fine-tune or future commercial release. Review the exact intended use before choosing shipping provenance. [Turbo model card](https://huggingface.co/stabilityai/sdxl-turbo), [SDXL base license](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md).

**Recommendation:** retain Turbo now; prepare a production-quality comparison after human review of the masks and proof images. Request approval for the exact checkpoint, license, expected multi-GB download/cache use and experiment size before downloading it. ControlNet/depth/line conditioning is a separate escalation if masked surfaces still imply false geometry. None has been installed.

## Adapter contract

`tools/visual-gen/backends.py` registers explicit backend definitions: model identity, supported conditioning modes, maximum steps, guidance constraints and factory. Factories receive device, CPU opt-in, revision, offline, reference and inpaint settings. Instances expose `environment` and `generate(spec, settings, seed, reference=..., mask=...)`. The integrated `--backend` option selects a registered backend; unknown identifiers fail. Existing IDs cannot be silently replaced.

Only `sdxl` and deliberately non-ML `fixture` are installed registrations. A future reviewed backend adds its own loader/settings validation, never a hidden substitution. Candidate metadata uses the selected model identity and actual environment. Fixtures and imported human corrections cannot claim a fresh model execution.
