# Velvet external-edit canonical review

**2026-09-09 · B: strong, with targeted correction/manual cleanup still required. DRAFT, UNPROMOTED, ARCHITECTURE REVIEW REQUIRED.** This is a promising hero-room workflow, not an approved plate or proof that every room can be produced repeatably. The actual supplied ChatGPT source was evaluated, followed by exactly one built-in image-edit cleanup. No local ML inference or model download occurred.

[Open the complete source/pixel/runtime review](visuals/external-edit/cleanup-review/index.html), [original-source comparison](visuals/external-edit/original-review/index.html), [four-way exact 640 display comparison](visuals/external-edit/display-comparison.png), [measurements and hashes](visuals/external-edit/measurements.json).

## Repository and protected scope

Work resumed in the existing Windows checkout on `feature/state-driven-visuals`. Fetch and fast-forward checks confirmed local HEAD and origin at `a9f11fd60dc576fd7588abe11d2098a10fd10982`, with zero divergence and a clean initial tree. PR #1 was OPEN/DRAFT with successful CI at that checkpoint. This evaluation adds local tooling, tests and development evidence; it does not change the shipping registry, gameplay, parser, world geometry, main branch, or public blind-playtest deployment. No push, merge, promotion or deployment was performed.

All six earlier experiments remain preserved. Turbo's cinematic scene preset is unchanged. The responsibility split remains: high-quality external editing for place; Turbo illustrations for feeling; runtime overlays for changing state; simulation/parser for truth; human review for shipping.

## Received source and honest provenance

The supplied file was `C:/Users/thr3e/Downloads/neon_noir_nightclub_lobby.png`: opaque RGB PNG, **1448 × 1086**, **2,544,767 bytes**, with no embedded PNG metadata. Its SHA-256 is `58dd60c77b8ff01dc38a723f2a2ef33a49073128b258d62de07e01d2be1d88b2`. The retained original is byte-identical. Creation time, upstream prompt, earlier parent, model and version were not provided; no values were invented.

Original import: `e092e615c3fa`. Cleanup import: `26e7ff28bcad`. Both use `sourceType: external-reviewed-edit`, role `canonical-room`, variant `canonical`, `reviewStatus: draft`, `authoritativeArchitecture: false`, and `architectureReviewState: pending-human-review`. “Reviewed edit” identifies the external-source lane; it is **not** human architecture approval.

The new standalone importer records the editor/service description, import timestamp, unknown source creation time and model/version, retained world-manifest hash, source hash, optional parent-source hash, exact crop, processing settings and Pillow version, unquantized master hash, palette master hash and display hash. `modelExecuted: false` describes the **import operation**, which performs no inference. The separately recorded cleanup was a real built-in image-edit invocation. Original metadata contains no claimed generation prompt; its generated manifest brief is labelled as review guidance only.

The cleanup source is also 1448 × 1086, **2,349,328 bytes**, hash `af70facbd4f79b75cca2160b9ff0cb5514d5560d952fe5e66a9114ee4602cd6c`. Its parent record retains the supplied original bytes. The service was the built-in `image_gen` tool; its underlying model/version was not exposed. [Exact edit prompt](visuals/external-edit/edit-prompt.txt).

## World-fact and geometry review

The reference is the existing [Velvet fixed layout](visuals/velvet-bar-layout/facts.md), its [blockout](visuals/velvet-bar-layout/reference.png), `src/content/visuals/layouts/bar.json`, permanent facts and actual room exits. The world was not changed to fit the image. The layout's nonmetric composition remains pending human approval.

| Fact                            | Supplied source / cleaned source                                                            | Assessment                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exactly one staircase           | One central straight flight with one upper opening; no second flight or balcony             | Strong match                                                                                                                                                         |
| Stair beside salon              | Dark rear opening immediately right of stair                                                | Relationship is plausible and matches reference; the pixels do not independently identify the destination                                                            |
| Left fixed counter              | Large left foreground counter, shelving behind it                                           | Strong positional match; preserve footprint                                                                                                                          |
| Bare counter                    | Original includes taps/faucets                                                              | Removed in the single cleanup; retain counter surface                                                                                                                |
| Empty fixed shelving            | Original contains many bottles/vessels                                                      | Removed; shelving stays in place                                                                                                                                     |
| High right street-facing window | One clear high right window with exterior light/rain texture                                | Main window placement matches                                                                                                                                        |
| Other glazing                   | Blue reflective inset at extreme left, behind/alongside shelving                            | Ambiguous extra window or mirror; not supported by the fixed contract. Neutralize in a later local correction rather than asserting a new feature                    |
| Rear openings/routes            | Salon-like opening right of stairs; left service recess partly obscured by bar              | Some route coverage remains ambiguous. Do not assign every dark patch a new exit                                                                                     |
| Left-of-stair panel             | Tall outlined panel on rear wall reads as a closed door                                     | Unsupported door-like architecture/state at that position. Restore wall material unless a reviewed treatment can express the actual west route without relocating it |
| Small stage / east route        | Low platform along the right wall inside the room; no clear east opening to a distant stage | **Unresolved geometry deviation.** A smaller platform alone does not satisfy the stage-through-east-opening relationship                                             |
| Room envelope                   | Rectilinear interior, no added mezzanine or gallery                                         | Broadly compatible; camera/ceiling depth are artistic interpretations, not measured geography                                                                        |
| Overlay floor                   | Large unobstructed central and right floor                                                  | Strong working space; crop retains it                                                                                                                                |
| Movable/stateful elements       | No people or stools baked in; multiple wall lamps and bright emissive strips remain         | Lamp fixtures are not the single dynamic lamp overlay. Require a fixture/emission separation decision before approval                                                |

Velvet has seven routes: vestibule and outside toward the camera/front, upstairs via the single staircase, west kitchen, east stage, salon beside stairs, and west archive/service-table route. The front routes can remain off-camera. The current image does not positively resolve the archive route or the east stage relationship. None of these exits has a stateful Door entity in Velvet; the image must not invent seven door leaves or a new locked doorway.

No named NPC, evidence, readable story clue, stool, nudity or explicit activity is visible in either plate. These observations do not substitute for human approval. Broad permanent wear and glossy floor treatment are atmosphere; they do not establish a new damage or indoor-rain event.

## One correction, then stop

The one edit removed loose shelf bottles/vessels and counter taps. It preserved the apparent camera, stair, window, counter outline, platform and floor perspective. It did **not** attempt to solve every architectural issue in one broad regeneration.

Pixel invariance was not achieved or claimed: **99.06% of source pixels differ**, with mean absolute RGB difference **5.806/255**. Much of that is small texture/colour variation; the result looks slightly smoother even outside the intended regions. This is a semantic preservation success, not a hard-mask edit. Both sources remain available, and the cleaned source is the stronger world-compatible input for this review.

Recommended subsequent corrections, **not performed**: restore the east opening/distant stage relationship; neutralize the rear door-like panel and ambiguous left glazing; separate unsupported lamps and lighting emissions from the permanent plate. Use tightly bounded paint/masks or manual cleanup. Keep successful geometry and materials. No further image generation was run.

## Framing and pixel comparison

Both sources received the same visually reviewed crop: **`[left=4, top=0, right=1444, bottom=1008]`** in original image coordinates. This removes four pixels from each side and 78 pixels of foreground floor at the bottom, retaining **92.30%** of the original area. The resulting **1440 × 1008** frame is exactly 10:7. The top, complete stair, counter base, high window and platform survive. No stretching, canvas extension, blur or camera change was applied.

Processing uses the existing pipeline: RGB → nearest-neighbour **320 × 224 unquantized master** → Pillow MEDIANCUT at 48 or 64 colours → contrast **1.15** → exact nearest-neighbour **640 × 448** display. Lossless WebP is encoded from the master. The scene-illustration preset and canonical default remain unchanged.

| Review output                              | Link                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| A: supplied high-resolution source         | [Original PNG](visuals/external-edit/original/sources/original.png)                          |
| A: selected cleaned high-resolution source | [Cleaned PNG](visuals/external-edit/cleanup/sources/original.png)                            |
| Explicitly cropped source                  | [1440 × 1008](visuals/external-edit/cleanup/sources/framed.png)                              |
| B: unquantized 320 master                  | [320 × 224](visuals/external-edit/cleanup/pixels/unquantized.png)                            |
| C: 48-colour master                        | [320 × 224](visuals/external-edit/cleanup/pixels/48-colours.png)                             |
| 64-colour master                           | [320 × 224](visuals/external-edit/cleanup/pixels/64-colours.png)                             |
| D: 640 display, 48 colours                 | [Exact 2× PNG](visuals/external-edit/cleanup/bar__canonical-room__canonical__48-colours.png) |
| D: 640 display, 64 colours                 | [Exact 2× PNG](visuals/external-edit/cleanup/bar__canonical-room__canonical__64-colours.png) |
| Original and cleanup, both palettes        | [Full-size four-way comparison](visuals/external-edit/display-comparison.png)                |

**48 colours does not destroy the atmosphere.** Magenta/cyan separation, reflection streaks, stair silhouette and room depth remain strong. It compresses subtle shadow colour and some reflection/material transitions. **64 is the preferred candidate setting for this hero room**, with a modest improvement and inexpensive size increase. The primary loss of fine source detail is the 320-pixel reduction itself; more palette entries cannot restore it. Contrast also deepens already dark surfaces.

| Source   | Palette budget / colours after contrast | 320 PNG bytes | 640 PNG bytes | Lossless 640 WebP bytes |
| -------- | --------------------------------------: | ------------: | ------------: | ----------------------: |
| Supplied |                                 48 / 48 |       104,892 |       120,149 |                  52,640 |
| Supplied |                                 64 / 61 |       109,305 |       127,072 |                  55,680 |
| Cleaned  |                                 48 / 47 |        95,402 |       110,310 |                  48,340 |
| Cleaned  |                                 64 / 61 |       103,041 |       121,011 |                  52,948 |

The cleaned unquantized master is 149,007 bytes. Contrast collapses some palette entries, hence 47/61 actual colours. The cleaned 64-colour WebP costs **4,608 bytes / 9.53%** more than 48 and remains well below the 150,000-byte cap. Mean absolute RGB error versus the same unquantized 320 master at contrast 1.15 falls from 5.190 to 4.978; this is a diagnostic, not a perceptual-quality score. **Shipping asset increase: zero bytes.** Portable development evidence occupies approximately 16 MB before Git compression.

## Actual runtime evidence

The review uses the real `LocationVisual`, `deriveVisualState`, `newGame`, and `advanceTime` with an isolated in-memory asset binding. It never writes an approved registry entry or saved game. The supplied [draft composition](visuals/external-edit/composition.json) is reviewed for bounds and canonical IDs, but is not a shipping composition approval. Fixed counter/shelf/window glyphs are suppressed only in that test binding; dynamic objects remain live.

| Snapshot        | Simulation facts                                                            | Preferred 64-colour evidence                                               |
| --------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Early           | 23:55 / time 1435; Mara present; busy anonymous atmosphere; amber lighting  | [Early](visuals/external-edit/cleanup-review/runtime-02.png)               |
| Late            | 02:40 / time 1600; no named NPCs; sparse anonymous atmosphere; low lighting | [Late](visuals/external-edit/cleanup-review/runtime-02-late.png)           |
| Dawn            | 05:15 / time 1755; no named NPCs; quiet; morning wash                       | [Dawn](visuals/external-edit/cleanup-review/runtime-02-dawn.png)           |
| Mobile          | 390-pixel viewport, early state with Mara; entire plate contained           | [Mobile](visuals/external-edit/cleanup-review/runtime-02-mobile.png)       |
| Empty reference | Plate only, explicitly **not** a simulation-state claim                     | [Reference](visuals/external-edit/cleanup-review/runtime-02-reference.png) |

The representative 48-colour early snapshot is retained as `runtime-01.png`; its remaining runtime snapshots and redundant thumbnail/WebP previews remain in the original local `.visuals/external/velvet-chatgpt-20260909/` review folders rather than the Git checkpoint. Both complete source/master/display provenance chains and the preferred 64-colour runtime set are portable. Git stores identical original/parent source bytes as one shared blob; both paths remain to keep each candidate's provenance independently verifiable. The harness records actual NPC IDs, clock, light, crowd, visible objects, successful image binding and registry hash in [runtime-composite.json](visuals/external-edit/cleanup-review/runtime-composite.json). It checks rendered NPC IDs against the descriptor, image decoding, mobile overflow, Off and Reduced. All eight existing visible objects remain in the text register, including the clock, which has no art anchor. The runtime stool is correctly present even though the canonical plate has no baked stools.

## Overlay art findings

- **NPC identity/material:** Mara's schematic silhouette is readable but has flat masses and no approved identity art or matching magenta/cyan light response. Current NPC origins place feet 16 master pixels below the zone origin; future foot anchors must account for that instead of assuming bottom-centre already exists.
- **Props/scale:** the current 11 × 17 glass is conspicuously large on this counter; the 23 × 36 lamp competes with the room and duplicates baked lamps. The stool/bin resemble diagram symbols. Draft placements align rough contact positions, but do not fix sprite proportions or materials.
- **Grounding/reflections:** no actor-linked contact shadows or floor reflections accompany the strong baked glossy floor. This makes floating overlays more conspicuous. A present/absent actor or removed prop must take its reflection with it.
- **Occlusion:** the compositor has no counter foreground mask to hide a bartender's lower body. This review places Mara on open floor; it does not prove behind-counter occlusion. A reviewed counter mask is needed before a behind-bar placement can work.
- **Lighting:** a whole-image dawn wash cannot turn down neon tubes, window colour or their baked reflection streaks independently. The new plate provides concrete evidence for an albedo/emission/reflection separation or bounded fixture masks, with states tied to existing simulation. Do not create a new light-switch simulation merely to fit the image.
- **Palette/mobile:** richer plate colours expose neutral beige/grey glyphs. The base palette cap does not cap the full RGB/SVG composite. Mobile contains the full architecture and readable state text, but small sprite details need deliberate clusters and restrained highlights.

These specific requirements were added to [DYNAMIC-OVERLAY-ART-PLAN.md](DYNAMIC-OVERLAY-ART-PLAN.md). No NPC/prop sprite library or runtime rendering redesign was built.

## Validation and implementation

The new `import_external.py` reuses the manifest, canonical review contract, pixel functions and contact-sheet workflow. It supports standalone sources and an optional real parent source without inventing a Turbo parent. Promotion verifies retained source/manifest/parent/master hashes, reproduces crop/master/display, and still requires explicit human world-fact, architecture, composition and non-explicit review. `import_edit.py` directs external work to this path so it cannot accidentally inherit stale framing/provenance.

The runtime review tool accepts `--composition`, records each time band for every candidate, produces mobile and plate-only reference images for both palettes, checks image/NPC binding and verifies the registry is byte-identical afterward. The review page labels external sources, unknown provenance, unquantized masters, framing, palettes and runtime evidence honestly.

Validation passed: **1,000 JavaScript tests and 57 Python tests**, including nine new external-import/provenance/framing/palette/promotion cases; full `npm run check` (normal build, narrative/content checks, 12 parser campaigns, 60 natural-language campaigns and 117-scene embodiment audit); Pages build; formatting; asset validation; actual browser composites for both palettes, Off/Reduced and mobile. Both portable review pages loaded every image without page errors or desktop/mobile overflow. All four copied candidates passed source/framing/master provenance reproduction, and all report links resolved. The existing motel conditional-exit narrative review flag remains unchanged. [Final validation record](visuals/external-edit/validation.json). No expensive local inference was used.

To reproduce an import after preparing the current canonical manifest with the existing dry-run command:

```powershell
& .venv/Scripts/python.exe tools/visual-gen/import_external.py --manifest .visuals/jobs/bar--canonical-room.json --source SOURCE.png --output .visuals/NEW-EXTERNAL-REVIEW --editor 'PUBLIC DESCRIPTION' --service 'ACTUAL SERVICE; UNKNOWN MODEL IF UNAVAILABLE' --notes 'Specific provenance and edit notes' --framing-notes 'Reviewed crop rationale' --crop 4 0 1444 1008 --colors 48 64
```

Use those crop coordinates only for this 1448 × 1086 source/composition. New sources require their own review. Existing run IDs refuse overwrite. For another documented edit add `--parent-source ORIGINAL.png --edit-prompt-file PROMPT.txt`. Run `scripts/visual-review-composite.ts --batch BATCH --output REVIEW --composition COMPOSITION.json` with local Vite, then `review_page.py`. No command here grants promotion.

## Workflow classification and next step

**B.** Atmosphere, pixel treatment, manageable file size and a successful targeted edit make this the strongest tested canonical-room direction. Geometry remains imperfect; runtime compatibility exposes separate overlay/lighting work; manual cleanup is practical but not yet costed across rooms. One user-supplied source and one edit establish feasibility, not repeatability or stable service/model behavior. A is premature; C would understate the demonstrated improvement.

The next production step is a bounded Velvet architecture cleanup against the unchanged layout: resolve the east-stage opening first, then the door-like panel/left glazing and fixture separation. Human review of that corrected source and runtime composition should precede any promotion. Retain 64 colours as the preferred comparison candidate for this room, preserve 48 as a viable lower-budget option, keep Turbo's scene workflow, and download no additional model family.
