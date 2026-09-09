# Velvet architecture correction

**Human approval received, 2026-09-09.** The owner approved this exact corrected 64-colour plate and authorized feature-branch promotion. [Hash-bound approval record](visuals/velvet-architecture-cleanup/human-approval.json). Its camera, architecture, palette identity and material treatment are locked. No further generative edit is authorized. The evaluation below records the earlier review checkpoint; its pending-approval statements are historical. Overlay art requires its own pilot review.

**2026-09-09 · A: ready for human visual approval as the Velvet canonical plate.** The candidate remains **DRAFT / UNPROMOTED / HUMAN APPROVAL PENDING**. This is the requested plate assessment, not a claim that the broader external-edit workflow is repeatable across rooms. The accepted workflow classification remains B.

[Open source, master and runtime review](visuals/velvet-architecture-cleanup/review/index.html) · [Corrected high-resolution source](visuals/velvet-architecture-cleanup/candidate/sources/original.png) · [Exact 640 display](visuals/velvet-architecture-cleanup/candidate/bar__canonical-room__canonical__64-colours.png).

## Checkpoint completed before editing

The accepted external-edit experiment was committed as **`bbb7693f0f6632a1a8dabbc1a24c43a805a64ee2`**, “Evaluate external Velvet edits with preserved provenance and runtime evidence”, and pushed successfully to `origin/feature/state-driven-visuals`. [GitHub checkpoint](https://github.com/astrobyte-dev/freak-city/commit/bbb7693f0f6632a1a8dabbc1a24c43a805a64ee2). The working tree was clean before this correction began.

The checkpoint includes the report, original and cleaned source provenance, 48/64 masters/displays, display comparison, representative runtime evidence, import/review tooling and tests. Eight redundant previews were omitted after verifying their unchanged local copies. Caches, working folders, browser scratch output and model weights were not committed. Duplicate original/parent bytes share a Git blob while their separate paths keep provenance verifiable.

Checkpoint validation passed: **1,000 JS tests, 57 Python tests, build, formatting, asset validation and four retained provenance chains**. GitHub Development checks subsequently passed for this exact commit. PR #1 is OPEN/DRAFT. Neither main nor the public Pages build was changed; Pages deploys on main pushes, not this feature branch.

The new correction and its review evidence are a separate local change after that checkpoint, awaiting the owner's visual approval. No second correction pass, promotion, merge or deployment occurred.

## Four bounded corrections

Review used the unchanged [authoritative layout facts](visuals/velvet-bar-layout/facts.md), [blockout](visuals/velvet-bar-layout/reference.png), current bar exits and `detail_bar_light` definition in `src/content/affordances.ts`. Coordinates below identify approximate source-image regions in the **1448 × 1086** parent, not new world coordinates.

| Target                  | Precise mismatch                                                                                                                                                                                                               | Correction and result                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A: east opening / stage | The low platform at roughly x1165–1448, y515–622 occupied the main room against a solid right wall. The fixed layout instead has an east passage with a small stage beyond it.                                                 | Removed the in-room platform and restored the wall/floor junction. One doorless opening now passes through the right side wall near its rear corner, rearward/left of the high window. A small low stage edge is visible **beyond** the threshold. This depicts the existing east route, not an extra exit. It remains readable in the 320 master, 640 display and mobile composite. |
| B: rear door-like panel | Tall outlined rectangle immediately left of stairs, roughly x502–597, y312–545, implied an unsupported rear door or recess.                                                                                                    | Replaced by continuous opaque worn plaster. No door outline, niche or new opening remains. The real dark salon opening immediately right of stairs is retained.                                                                                                                                                                                                                      |
| C: left glazing         | At the extreme left behind/alongside shelving, roughly x0–52, y287–411, a blue rectangular inset read as another glazed window/mirror with exterior reflections.                                                               | Replaced with opaque wall continuing the shelving wall. Cyan illumination remains, but the framed glazed/exterior view is gone. The actual high right street-facing window is preserved.                                                                                                                                                                                             |
| D: lighting fixtures    | Three discrete shaded lamps near (123,201), (352,277), (1191,272) duplicated/implied props outside the permanent-entity contract. The actual bar pendant is `detail_bar_light`, an amber shade reserved for the runtime layer. | Removed the three shades/mounts and healed their small surface regions. Kept the integrated linear neon trim, stair-edge illumination and colour spill as the locked decorative material/lighting treatment. No new light entity, switch, state or simulation fact was introduced. The existing pendant overlay remains.                                                             |

The integrated strips sit on the existing room envelope/counter/stair surfaces and express the owner's accepted art direction. They are not new movable prop bindings. Their brightness continues to receive the existing runtime time-band wash; this pass does not add individual fixture switching or physically based lighting. Future overlay work remains deferred.

Exactly one central staircase and upper opening remain. The left bar footprint, bare counter, empty shelving, high right window, ceiling, camera, open central floor, tile perspective, grime and magenta/cyan relationship remain visually consistent with the parent. The stage no longer protrudes into the bar. No people, stools, bottles, loose props, readable signs, second stairs, balconies, booths, mezzanines or unsupported additional exits were added.

The dark west service recess remains. Counter occlusion and the camera cutaway limit what can be seen of other west/front routes; the image is not being used to relocate them or invent extra door leaves. The existing salon and upstairs relationships remain intact. As before, Velvet's exits have no stateful Door entities, so the corrected east passage is open and doorless.

## One image-edit invocation and provenance

Image editing was available through the built-in `image_gen` tool. Exactly **one** invocation performed all four local corrections. The high-quality edit target was the previous cleaned source, not an indexed master or an older SDXL candidate:

- Parent: [cleaned high-resolution source](visuals/external-edit/cleanup/sources/original.png), SHA-256 `af70facbd4f79b75cca2160b9ff0cb5514d5560d952fe5e66a9114ee4602cd6c`.
- Supporting image: the existing Velvet blockout, explicitly labelled **geometry reference only**, not a style reference.
- [Exact submitted prompt](visuals/velvet-architecture-cleanup/edit-prompt.txt) and [input roles/hashes](visuals/velvet-architecture-cleanup/edit-context.json).
- Corrected source: 1448 × 1086 RGB PNG, **2,279,015 bytes**, SHA-256 `3b6bcb06d78bc43a636e782c082891842d0054c93be1073200826cbcd103c9f2`.
- Draft import run: **`b0ab62fb3b0f`**, source type `external-reviewed-edit`. Model/version remains unknown because the tool did not expose it. The original input bytes, parent, world manifest, crop and derivative hashes remain in the [candidate sidecar](visuals/velvet-architecture-cleanup/candidate/bar__canonical-room__canonical__64-colours.json).

The edit is not pixel-locked: 98.98% of source pixels differ, with mean absolute RGB difference 5.111/255. Small texture changes occur outside the requested regions. Visual inspection finds the successful style and structural invariants retained; no exact protected-pixel claim is made. No SDXL, ControlNet, FLUX, Qwen, replacement generator or model download was used.

## 64-colour processing only

The corrected source retains the parent's dimensions and camera, so the same reviewed crop applies: `[4,0,1444,1008]`, yielding **1440 × 1008**. This trims four pixels per side and 78 bottom-floor pixels. The new east opening, stage edge and threshold stay inside the crop. No stretch or canvas extension was used.

Existing pipeline: source → nearest-neighbour **320 × 224 master** → **64-colour MEDIANCUT**, contrast **1.15** → exact nearest-neighbour **640 × 448 display**. There was no reason to reopen the palette comparison; **zero new 48-colour outputs** were made. The previous 48-colour evidence and tooling option remain intact.

| Output                 | File                                                                                                          |     Bytes |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | --------: |
| Corrected source       | [High-resolution PNG](visuals/velvet-architecture-cleanup/candidate/sources/original.png)                     | 2,279,015 |
| Unquantized 320 master | [320 × 224 PNG](visuals/velvet-architecture-cleanup/candidate/pixels/unquantized.png)                         |   145,096 |
| 64-colour master       | [320 × 224 PNG](visuals/velvet-architecture-cleanup/candidate/pixels/64-colours.png)                          |   100,656 |
| Exact 2× display       | [640 × 448 PNG](visuals/velvet-architecture-cleanup/candidate/bar__canonical-room__canonical__64-colours.png) |   119,579 |
| Lossless display       | [640 × 448 WebP](visuals/velvet-architecture-cleanup/review/display-64.webp)                                  |    52,040 |

There are 63 distinct colours after contrast merges some palette entries. The WebP remains below the 150,000-byte cap. [Measurements and hashes](visuals/velvet-architecture-cleanup/measurements.json). Shipping bytes added: **zero**.

## Minimum runtime review

Only the four requested new screenshots were generated, using the actual compositor and simulation with an isolated draft binding. The same [draft overlay composition](visuals/velvet-architecture-cleanup/composition.json) was retained; no NPC/prop sprite or shipping anchor was changed.

| State                      | Actual simulation                                                                                | Evidence                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Early, 23:55 / 1435        | Mara present; busy anonymous atmosphere; amber wash                                              | [Early with Mara](visuals/velvet-architecture-cleanup/review/runtime-01.png) |
| Late, 02:40 / 1600         | No named NPCs; **sparse anonymous atmosphere remains**, so this is not a wholly empty simulation | [Late](visuals/velvet-architecture-cleanup/review/runtime-01-late.png)       |
| Dawn, 05:15 / 1755         | No named NPCs; quiet; morning wash                                                               | [Dawn](visuals/velvet-architecture-cleanup/review/runtime-01-dawn.png)       |
| Mobile, 390-pixel viewport | Early state with Mara; full plate contained                                                      | [Mobile](visuals/velvet-architecture-cleanup/review/runtime-01-mobile.png)   |

The opening remains distinguishable from the high window; the small stage sits behind it. Floor space remains usable for the unchanged schematic overlays. No false rear/left opening survives. Real NPC IDs match the rendered NPC nodes, every candidate image decoded and bound successfully, and mobile has no horizontal overflow. The [runtime record](visuals/velvet-architecture-cleanup/review/runtime-composite.json) contains the exact state and unchanged registry hash. Existing schematic overlay quality is accepted for now and was not redesigned.

The review harness gained only `--minimal`, which skips optional reference screenshots and Off/Reduced checks already covered by the completed experiment. Default behavior is unchanged. The new option was exercised with this one candidate and emitted exactly four screenshots. No unnecessary full sprite or browser-test expansion was run.

## Final gate

**A — ready for the owner's visual approval as the Velvet canonical plate.** The four identified architecture mismatches are resolved in the source and remain resolved after pixel processing and runtime composition. This assessment does not change `reviewStatus: draft` or `authoritativeArchitecture: false`.

Human visual approval is the next step. No further edit is recommended before that review. PR #1 remains draft; the corrected art has not been promoted, merged or deployed. The accepted experiment is safely pushed at `bbb7693`; this new correction remains separate local review work.
