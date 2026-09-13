# Street exterior draft — ready for personal visual review

**Draft only; unactivated.** One exterior treatment, generated with the built-in imagegen tool, imported through the existing source-image workflow, and combined with separate code-authored pixel layers. No local model experiment, new character, gameplay change, merge or deployment.

Open the [review gallery](review/index.html) when convenient. Start with [open door](review/01-open-door.png), [closed door](review/02-closed-door.png) and [dropped envelope](review/03-dropped-envelope.png). [Ordinary desktop UI](review/16-ordinary-ui-desktop.png), [mobile UI](review/17-ordinary-ui-mobile.png) and [locked side entrance](review/18-ordinary-ui-locked.png) show the isolated draft inside the existing game interface.

## What was made

- [Authored layout v2](layout.json) and [annotated diagram](layout-final.svg), preserving all five existing routes. The front entrance, loading bay, kiosk and home continuations remain off-camera and available through the existing parser/text. Only the side entrance is shown as a doorway.
- [Retained architectural source](generated-source.png), [320 × 224 master](candidate/pixels/64-colours.png) and [640 × 448 display](candidate/street__canonical-room__canonical__64-colours.png). The 64-colour/1.15 import produces 58 colours. The explicit 10:7 crop removes only 4/5 pixels from the sides and 3/3 from top/bottom of the 1499 × 1049 source.
- Editable SVG masters and transparent PNGs for open/closed door, VELVET sign, street bin with its described folded umbrella, and separately owned effects. The exact approved envelope PNG is reused at a new draft street contact; no new envelope identity is invented. [Layer provenance](layer-provenance.json).
- Thirteen state compositions, two image-failure captures and three ordinary-UI captures, plus viewport-only copies for image comparison. Rain is clipped around the awning shelter and frosted window. No people, parked taxi, additional door, lamp or clue-bearing text were added.

The retained exterior was inspected as a reference: its damp masonry, entrance framing and wet street were useful; extra doors, lamps, shutters and service lettering were excluded. The approved bar supplied distressed material and magenta/cyan colour direction. The new frosted window carries diffuse light but no visible interior or faces. Window light/material reflections remain scenery; the door spill, sign emission/reflection, bin shadow/reflection and envelope reflection are separate removable effects.

## Layout and visual limits to review

The generated source followed the facade arrangement but shifted the opening/window upward and left relative to the [initial guide](layout-guide.png). That shift is disclosed: [proposal v1](layout-proposal-v1.json) is retained, while [layout v2](layout.json) and [composition](composition.json) record the measured source coordinates. No pixels were secretly patched to hide drift. Fixed room facts and route identities are unchanged.

The camera is near-frontal and the door/sign/bin use simpler pixel shapes than the textured wall. Please assess their cohesion, sign scale, envelope visibility and the strength of the reflection fragments. These are draft visual judgments, not newly accepted polish. Closed/unlocked and closed/locked share the same door artwork; the simulation text carries lock status, with no invented padlock. The frosted-window glow remains present at dawn under the existing light treatment; there is no new switch or weather simulation.

## Checks completed

- Existing import replay passed after retention: source, crop, provenance, pixel master and display reproduce exactly. All primary layers have transparent backgrounds; the envelope bytes match the approved master.
- Pixel differences between open/closed images are confined to the door and its owned spill. Dropping/retaking the envelope changes only its sprite/reflection region. Other architecture pixels remain identical. [Art checks](review/art-validation.json).
- Real parser commands verified open/close, drop/take, leave/return, the 02:40 side-door lock, rejected side entry and successful front entry. No schedules or room data were modified.
- Headless previews passed 320/640 dimensions, 390-pixel mobile containment, On/Reduced/Off, absent/damaged object cases and missing-image fallbacks. A failed bin image removes its owned effects and restores its procedural glyph; a failed plate restores the normal procedural renderer.
- An isolated headless browser substituted the review component only in its own response for `Atmosphere.tsx`. The ordinary UI passed custody, exact save/reload, mobile and alternate-entry checks; a fresh context without that substitution used the unchanged normal app. No existing browser/profile was touched. No unexpected failed requests, external requests or page errors were recorded. [Headless results](review/checks.json).
- TypeScript/production build passed; the 9 existing Velvet regression tests passed. The approved art registries, room definitions and parser hashes remained unchanged. Draft files are not imported into or included in the production app.

## Reproduction and retained inputs

From the repository root, with the existing local dev server running:

```sh
python tools/visual-gen/street_draft_layers.py
npx tsx scripts/street-draft-review.ts
python tools/visual-gen/validate_street_draft.py
```

These overwrite only this draft's generated layer/review evidence. `VISUAL_DEV_URL` can select another local server. No command loads a model or promotes an asset. The [exact generation prompt](authoring-prompt.txt), [authoring metadata](authoring.json), [world manifest](world-manifest.json), complete [import sidecar](candidate/street__canonical-room__canonical__64-colours.json) and reference hashes in [art validation](review/art-validation.json) are retained. Native SVG sources are the editable overlay masters; optional future manual edits remain new drafts.

**Next step: owner visual review.** Keep the artwork unactivated until then. Velvet's completed background validation and deferred polish remain unchanged. Continue on `feature/state-driven-visuals`, with local AI experiments, merging and public deployment on hold.
