# Kontext evaluation: DEFERRED / NOT EXECUTED

Recorded 2026-09-10. The owner has shelved the prepared FP8 experiment. The host-memory operating envelope proved impractical on the current 32 GB Windows development workstation while preserving VS Code, ComfyUI and normal Windows operation. This is an operational decision, not a measured model failure.

| Question                      | Evidence / result                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Acquisition                   | Succeeded: three approved files downloaded from the pinned sources; existing T5 reused                          |
| Integrity                     | Exact byte counts and full SHA-256 checks passed for all four components                                        |
| Discovery                     | Active ComfyUI discovered all model filenames without restarting                                                |
| Workflow                      | Static compatibility passed: 15 nodes / 17 links using available core nodes                                     |
| GPU availability              | Acceptable at the recorded preflights; approximately 9.2–10.6 GiB free, with the queue idle at the final checks |
| Inference submissions         | **Zero**; no model loading was requested by this experiment                                                     |
| Image quality / edit locality | **Unknown**: no generated output, normalized execution control or image comparison exists                       |
| Runtime fit / speed           | **Unknown**: no execution, sampling, OOM or measured inference peak exists                                      |

The original roughly 20 GiB available-RAM figure was a planning estimate, not a proven minimum. The owner later approved a 19.5 GiB experimental threshold. The final three-minute watch took 13 readings at 15-second intervals, peaked at 18.42 GiB and ended at 18.37 GiB. No inference was submitted. Earlier temporary availability near 19.59 GiB did not establish a stable operating envelope. Do not restart cleanup, polling or threshold negotiations for this shelved workflow.

The acquisition receipt, full hashes, licence notices, preflight snapshots and process logs remain in Git-ignored local evidence directories. Those logs and machine paths do not belong in Git. The [pinned component manifest](../tools/comfyui/kontext-model-proposal.json) remains the original preparation record; its approval fields are historical, not a current execution grant.

## Preserved work

Keep the downloaded Kontext diffusion checkpoint, CLIP-L, AE and existing T5 in place. No deletion, redownload or substitution is requested. The files' continued presence and exact sizes were checked read-only when recording this status; the full hash verification results are from acquisition and the subsequent preflight.

Retain the [original proposal](KONTEXT-LOCAL-EVALUATION-PROPOSAL.md), [UI/API workflow and guide](../tools/comfyui/workflows/velvet-kontext-dev-fp8-v1.md), and [test contract](../tools/comfyui/velvet-kontext-test-contract.json). The executable JSON and source image remain unchanged. The unused single-run authorization is superseded by this shelving decision; future execution requires a new explicit request. A 64 GB host-memory upgrade could justify revisiting the same preparation, but would not prove image quality or remove the separate licence review.

## Production continues independently

The [provider-neutral art pipeline](PROVIDER-NEUTRAL-ART-PIPELINE.md) accepts external/hosted editing, local ComfyUI output, manual editing and future providers through the same retained-source, provenance, pixel-processing and human-review path. Local model availability is optional authoring infrastructure. It must never block game development, runtime, asset processing or manual maintenance.

The next local candidate has been [researched, not installed or executed](QWEN-LOCAL-EVALUATION-ASSESSMENT.md). Recommendation **B** is to postpone it while external/manual editing meets the current production need. No visual ranking between Kontext, Qwen and the successful external edit has been established.
