# Visual authoring v2: canonical places and illustrated moments

**PRE-ALPHA / ACTIVE DEVELOPMENT · development spoilers.** Implemented on `feature/state-driven-visuals`; PR #1 remains draft. No public Pages deployment, merge, gameplay/content rewrite or asset promotion.

## What changed

The original compositor accepted only empty texture plates. V2 adds explicit `texture`, `canonical-room`, `scene-illustration` and `overlay` authoring roles while retaining the v1 texture workflow and original collaborator package. Canonical room prompts now describe actual permanent environments. Room identity is the single `canonical` variant; early/late/closing/dawn remain lighting and simulation states rather than separate generated buildings.

Room manifests distinguish static architecture, fixed furniture, dynamic objects/doors, NPC/atmosphere/foreground zones, illustration hints, required/forbidden facts and role-specific pixel presets. Explicit entity IDs connect permanent surfaces to the simulation. The bar uses its established counter, high street-facing window, shelving, one staircase beside the salon and view toward the small stage. No example booths, extra exits or new rooms were added to world content.

Human architecture promotion now requires an adjusted composition layout and explicit architecture/non-explicit review. Runtime suppresses only the approved baked entity sprites, positions dynamic layers against that reviewed layout and retains the complete text object list. If baked entity state changes or an image fails, it restores a procedural/texture view; the parser always wins.

Illustrations have `authoritativeGeometry: false` and an authored scene/room/time/NPC/boundary binding plus caption. They replace the geometric view briefly, then return after six seconds without delaying commands; each image appears at most once per component mount. Dynamic geometric sprites are suppressed during an alternate illustrated viewpoint. No illustration binding was added to the narrative or asset registry in this pass. Overlay generation is a draft atmospheric-study role; shipping raster overlays awaits alpha masks and state bindings. Existing runtime overlays continue working.

The updated [style guide](VISUAL-STYLE.md) emphasizes adult underground neo-noir, expensive decay, old city architecture, crimson/deep red, selective magenta and cyan contrast. Non-explicit nightlife can have performers, silhouettes, intimacy and atmosphere without inventing gameplay facts. Pixel Operator is documented only as an unverified font reference; no font or UI redesign was added.

## Real Velvet Bar batch

**SDXL Turbo ran on the RTX 4070 using CUDA FP16.** This is not a procedural fixture.

| Setting                     | Value                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Room / role                 | Velvet Bar (`bar`) / `canonical-room`                                                               |
| Variant / candidates        | `canonical` / 8                                                                                     |
| Seeds                       | 8317–8324, distinct from original 2741–2748                                                         |
| Run ID                      | `54fd0e217eac`                                                                                      |
| Model revision              | `stabilityai/sdxl-turbo` at `71153311d3dbb46851df1931d3ca6e939de83304`                              |
| Source / steps / guidance   | 640 × 448 / 2 / 0                                                                                   |
| Crunch                      | 320 × 224, 48 colours, contrast 1.15                                                                |
| Display                     | Nearest-neighbour 512 × 358                                                                         |
| Environment                 | Python 3.10.11; Torch 2.11.0+cu128; CUDA 12.8; Diffusers 0.39.0; Transformers 4.57.6; Pillow 12.3.0 |
| Integrated command duration | 11.38 seconds including cached loading and output processing                                        |

[View the draft contact sheet](../screenshots/visuals/v2-canonical-bar-drafts.webp). [Full prompt spec](visuals/bar-canonical-v2-prompt.json) and [candidate hashes/sizes](visuals/bar-canonical-v2-batch.json) are committed for review. Raw candidates, metadata and pixel masters remain in ignored local tooling storage; no shipping registry entry exists.

```powershell
. .\.visuals\setup\Activate.ps1
npm.cmd run visuals -- --room velvet-bar --role canonical-room --count 8 --seed 8317 --pixel-width 320 --display-width 512 --revision 71153311d3dbb46851df1931d3ca6e939de83304 --generate --device cuda --offline
```

That exact run already exists and refuses overwrites. Local files relative to the repository root:

- Contact sheet: `.visuals/generated/bar/review/54fd0e217eac/contact-sheet.webp`
- Eight display PNGs and matching JSON sidecars: `.visuals/generated/bar/raw/54fd0e217eac/`
- Names: `bar__canonical-room__canonical__candidate-01` through `candidate-08`.
- Full prompt: `prompt-spec.json` in the same raw directory.
- Preserved 320-pixel masters: the raw directory's `pixels/` subdirectory.
- Unpromoted WebP measurement copies: `.visuals/v2/optimized/`.
- Verification and logs: `.visuals/v2/`.

Compact model prompt, verified at 60/77 tokens in both CLIP tokenizers:

> 32-bit pixel art, PS1, crimson noir. Velvet / the bar interior. single staircase beside salon, distant small stage, high street window, fixed bar counter, bottle shelves. Wide deep establishing view, clear overlay space. No people, props, extra stairs or exits.

## Pixel upscale and file sizes

Display width is configurable per role preset and CLI. A 320 → 512 upscale uses nearest-neighbour and rounds 358.4 to 358 rows; the original pixel master is retained and hashed. Palette colours are preserved without blurry interpolation. Pixel blocks have uneven widths at 1.6×; 640 gives an exact 2× alternative. Promotion verifies that the master reproduces the reviewed display image, then optimizes from that master. The uncrunched 640 × 448 diffusion image is not separately saved.

| Candidate | Seed | Display PNG bytes | Pixel-master bytes | Lossless WebP bytes |
| --------- | ---: | ----------------: | -----------------: | ------------------: |
| 01        | 8317 |            74,875 |             64,032 |              29,432 |
| 02        | 8318 |            82,357 |             70,184 |              31,146 |
| 03        | 8319 |            67,788 |             57,271 |              25,692 |
| 04        | 8320 |            74,423 |             63,928 |              28,350 |
| 05        | 8321 |            81,951 |             70,099 |              31,076 |
| 06        | 8322 |            92,342 |             77,364 |              36,272 |
| 07        | 8323 |            66,295 |             56,348 |              27,458 |
| 08        | 8324 |            70,291 |             59,590 |              26,126 |

The 1040 × 456 contact sheet is 129,884 bytes; each original JSON sidecar is 12,432 bytes. All eight candidate hashes are distinct, all display/master hashes match metadata, and all images decode and contain nonblank content. The WebP copies are measurements, not promotions. Shipping raster weight remains zero because the registry is empty.

## Initial art evaluation and limitations

The visual direction now reads as a bar/club interior rather than a wall texture. There are no obvious named characters in the contact sheet. Candidate 01 offers a relatively clear floor and central staircase and is a useful composition discussion point, not an approved image.

Several candidates depict gallery/balcony-like structures absent from the established bar. Candidates 06 and 07 appear to introduce multiple staircases; 07 also resembles several stacked rooms. Loose objects, door-like openings and window placement need careful scrutiny throughout. The high street-facing window and small stage are not reliably represented. These drafts have **not** demonstrated full canonical geometry compliance, and none should be promoted on atmosphere alone.

Text-only Turbo at guidance zero cannot enforce forbidden facts or exact counts. Every candidate is an alternative draft; the eventual shipping identity must be one selected, reviewed room, not a changing selection of these eight layouts. A fixed layout reference, masks or guided generation is the next likely control point. `conditioning` reserves those inputs and rejects unsupported modes today; no new conditioning dependency was installed.

Canonical composition has been tested with isolated browser fixtures, not human-aligned against one of these real images. Whole-plate fallback is used if permanent entity state changes; removable architecture masks remain future work. The scene timer is presentation-local and may replay after reload. Human reviewers must declare all relevant illustration themes/NPCs. GPU/library changes may change seeded output. Diffusers emitted the existing empty-list AutoencoderKL dtype advisory but completed successfully with nonblank images.

The optional real scene-illustration batch was not run. First review and constrain the canonical room geometry; scene prompt/metadata/runtime support is already tested without adding authored story beats.

## Validation

The existing full `npm run check` passed, including narrative QA with zero errors, deterministic/fuzz routes, 12 parser campaigns, 60 natural-language campaigns and the embodiment audit. The existing Motel conditional-exit review note remains. Final full JS tests: **994 passed across 7 files** (the original 963 plus 31 new checks). Python pipeline: **20 passed** (the original 9 plus 11 new checks). Both normal and Pages-path production builds, visual asset validation, full Prettier formatting and diff-whitespace checks passed. Coverage includes roles, prompts, manifest separation, authority, upscale, metadata, promotion restrictions and runtime fallback.

Existing visual browser suite: 7 accessibility scans, zero violations/page errors. Added visual-role browser suite: 4 accessibility scans, zero violations/page errors, canonical sprite suppression, reviewed anchors, stable time-band base, mobile containment, illustration/return, Off/Reduced and failed-image fallback. Test-only images and scene bindings remain isolated in `.visuals/`.

Windows checkout portability: added `.gitattributes` to retain LF text files, resolving CRLF-only Prettier failures and preserving original package hashes. No story/parser text content changed.

The original real texture run is preserved byte-for-byte for its PNGs/sidecars and labelled `texture-role experiment` in a sibling note. It proved local GPU loading, seeds, pinned-model provenance, metadata and contact sheets; the existing tests exercised optimization/review. It remains unpromoted.

## Roadmap and next review

[Material/property/affordance roadmap](MATERIAL-PROPERTY-AFFORDANCE-ROADMAP.md): future material and capability tags could support shared BREAK/SHATTER/BURN/SPILL/CUT/OPEN/LOCK/WEAR/DRINK behaviour while preserving parser, custody, access and story constraints. This pass implements none of that engine work.

Review the bar sheet for atmosphere and composition, identify a promising direction, then establish a fixed room layout showing the real staircase, high window, counter, stage relationship and reserved dynamic zones. Reject invented balconies/exits and removable props before a human aligns the compositor and approves architecture. Review that proposed composite at desktop and mobile sizes before promotion. Keep PR #1 draft and main's public blind-playtest build unchanged throughout.
