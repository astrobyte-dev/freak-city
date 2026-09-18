# Provider-neutral art contracts

Contract format version 1 is Markdown with the fixed sections in [TEMPLATE.md](TEMPLATE.md). Use repository-relative links, an asset ID, role, version, approval scope, authoritative references and the retained source. Write instructions an artist can act on without provider syntax or conversation history. Model prompts may translate the brief; they never replace it.

World/simulation → art contract → any authoring tool → reviewed source image → FREAK//CITY processing → runtime. The simulation owns truth, the repository owns contracts, and human approval decides what ships.

Contracts complement `src/content/world.ts`, room/layout manifests, composition anchors and schedules. They cannot add exits, entities, biography, custody or presence. Resolve conflicts against those authoritative files and the locked approved source; record intentional design changes explicitly before changing art. Separate story facts from approved visual choices and provisional staging.

Current contracts: [Velvet / bar](rooms/bar.md), [Mara](characters/mara.md), and the [approved side-entrance brief](rooms/street.md). The owner approved street draft-v2-polish on 2026-09-14; its [exact background, overlays and state-owned effects are active in ordinary feature play](../visuals/street-activation/REPORT.md). Current envelope readability is accepted and further polish deferred. The retained Velvet room and bounded overlay approval remain unchanged. Merging and public deployment remain on hold.

The owner accepted the [vestibule brief](rooms/vestibule.md); its [complete draft and state composites](../visuals/reviewed-sources/vestibule/draft-v1/REPORT.md) now await personal visual review, unactivated. Procedural Inez is retained and her identity artwork deferred. See the original [remaining-room comparison](NEXT-ROOM-REVIEW.md). Future relevant scene briefs must carry the owner's [deliberate feet-framing preference](../VISUAL-STYLE.md#future-scene-framing-preference); it changes neither existing scenes nor approved art.

**Current art hold:** preserve the completed vestibule draft and validation evidence, unactivated with owner visual review pending. No next room or further polish. The consolidated briefs establish [agreed gameplay direction](../GAMEPLAY-DIRECTION-EXPLORATION.md); the owner has now authorized one [local envelope-safekeeping milestone](../design/INEZ-ENVELOPE-IMPLEMENTATION.md). That authorization does not activate draft artwork or change existing lore and content boundaries.

Keep contracts provider-neutral. Retain source type, authoring tool, model and workflow facts in the [source provenance](../PROVIDER-NEUTRAL-ART-PIPELINE.md). The importer snapshots the contract and its SHA-256; edits to the live brief cannot silently rewrite a candidate's review basis. Existing historical candidates retain their original world contracts and do not require a destructive metadata migration.

For every important production asset retain: high-quality source PNG, contract, provenance, pixel master, display asset and hash-bound human approval. Preserve workflow JSON and manual-edit history where applicable. A native pixel drawing is itself an editable source/master; a layered Aseprite/Krita/Photoshop document is a useful addition, never the sole interchange format.

**No production asset should require the original AI model to remain maintainable.** See the [manual workflow](../PROVIDER-NEUTRAL-ART-PIPELINE.md#manual-edit-workflow) and [optional ComfyUI workstation](../COMFYUI-VISUAL-WORKFLOW.md).
