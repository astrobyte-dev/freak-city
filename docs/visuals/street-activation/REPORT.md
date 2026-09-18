# Street artwork activated on the feature branch

The owner approved **street draft-v2-polish on 2026-09-14** for ordinary development play on `feature/state-driven-visuals`. [Hash-bound approval](human-approval.json). Current envelope readability is accepted; further polish is deferred.

The existing importer/promotion workflow reproduced the retained source, crop, palette master and display before registering the lossless background. The ten approved overlay/effect PNGs were copied unchanged to the shipping tree. Door, sign, bin and envelope effects remain grouped with their simulation owners. Open-door shading disappears on closing/locking; moving, taking, hiding or damaging an object removes its owned artwork/effects. The existing renderer supplies procedural and text fallback if the approved plate or an object's image is unavailable.

The new street renderer is selected only in the ordinary street view. It requires the approved plate hash and a successfully loaded matching background. Runtime URLs use the configured application base path; no draft documents, authoring tools or model code are imported into the game. The Velvet renderer, assets, layout and simulation are unchanged.

## Saved evidence

- [Ordinary development play: desktop](ordinary-desktop.png) · [mobile](ordinary-mobile.png)
- [Open side door](street-open-desktop.png) · [closed](street-closed-desktop.png) · [02:40 locked](street-locked-mobile.png)
- [Reduced mode](mode-reduced-mobile.png) · [Off mode](mode-off-mobile.png)
- [Missing background fallback](fallback-plate-mobile.png) · [missing bin fallback](fallback-bin-mobile.png) · [missing door fallback](fallback-door-open-mobile.png)
- [Headless integration checks](checks.json) · [pixel/hash verification](pixel-validation.json) · [shipping inventory](shipping-assets.json) · [promotion provenance](promotion.json)

## Verification results

- Ordinary UI checks passed without response injection: open/close, automatic side-door lock and alternate front entry; envelope drop/return/take; owned reflections; exact save/reload; On/Reduced/Off persistence; desktop/mobile layout.
- Missing bin, sign, both door states, envelope and background were tested at mobile size. No detached owned effects remain. The envelope's established mobile fallback is the accessible **In view** list and parser text; it remains takeable when its image fails.
- Six shipping-compositor captures match the approved draft **pixel-for-pixel** at desktop and mobile framing. The promoted WebP reproduces the reviewed PNG exactly; every shipping layer matches its approved master hash.
- Six ordinary-play Velvet viewports (early, late, dawn at desktop/mobile) match the pre-activation captures byte-for-byte. The bar registry entry and 188 protected files, including gameplay, approved Velvet artwork and both street draft packages, are unchanged.
- Production build, formatting and registry checks, all **1,011 JavaScript tests** and **64 deterministic Python pipeline tests** passed. The full `npm run check` chain passed, including narrative QA, scripted/randomized playtests, 12 parser campaigns, 60 natural-language campaigns and the embodiment audit. Narrative QA retains its existing non-failing motel-exit review flag; this work did not change it.

The original draft reports retain their historical unactivated status. This approval and activation record supersede that status without rewriting the reviewed evidence. Recheck with `npx tsx scripts/street-activation-browser.ts`, `npx tsx scripts/street-activation-composite.ts` and `python tools/visual-gen/validate_street_activation.py` against a background development server. The baseline is retained evidence, not a new baseline to regenerate after activation.

All work used background commands and headless browsers. No desktop control or visible windows were used. Local AI experiments remain parked. Merging and public deployment are not authorized; the deployment workflow runs on `main`, which this checkpoint does not update.
