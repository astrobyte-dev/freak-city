# Velvet canonical approval

The project owner approved the corrected Velvet room on 2026-09-09 and authorized promotion on `feature/state-driven-visuals`. The useful correction evidence was committed and pushed first at `fdb3f4b05dd6845d5038ef8bb1c941cdfdbda800`; origin matched local HEAD.

The existing `promote.py` workflow validated retained source, parent, manifest, framing, palette master and exact display pixels before writing the canonical registry entry. It records `status: canonical`, `authoritativeArchitecture: true`, and the existing typed human review flags. The source candidate stays immutable with its original draft metadata; the separate [hash-bound human approval](visuals/velvet-architecture-cleanup/human-approval.json) records the subsequent decision.

The feature runtime now selects `public/visuals/generated/bar--canonical-room--canonical--8b5c100cebc6.webp`: 640 × 448, 52,040 bytes, SHA-256 `8b5c100cebc6b363a02a0891970e3b92e596f4b6a4b7b862ea0462fc895130b1`. It is the lossless exact 2× display of the 320 × 224, 64-colour-treatment master (63 distinct colours after contrast). Full source and prior 48-colour experiments remain preserved. Promotion changes neither simulation nor the room's permanent facts.

The camera, one central stair, fixed left bar, shelving, high right window, east passage and recessed stage, open floor, envelope, magenta/cyan identity, reflective floor and grungy materials are locked. Future correction must be manual/deterministic and justified by actual world-design change. Do not regenerate this room.

## Provisional hero-room production workflow

Authoritative world facts → authoritative layout → high-quality ChatGPT/external image edit → targeted architecture correction → human review → 320-pixel master → 64-colour treatment → exact 2× 640 display → runtime compositor.

Velvet proves one successful room. Repeatability across rooms remains provisional. SDXL Turbo remains useful for scene illustrations, mood exploration and rapid concepts. Earlier experiments are evidence for this evolution and must stay intact.

The separately requested Mara/two-patron/core-prop overlay pilot needs human art review before production activation or expansion. The retained composition is the plate-review baseline; new sprite contacts and masks are a separate art proposal. PR #1 stays draft. No merge, main update or public Pages deployment is authorized.
