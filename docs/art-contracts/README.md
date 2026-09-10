# Provider-neutral art contracts

Contract format version 1 is Markdown with the fixed sections in [TEMPLATE.md](TEMPLATE.md). Use repository-relative links, an asset ID, role, version, approval scope, authoritative references and the retained source. Write instructions an artist can act on without provider syntax or conversation history. Model prompts may translate the brief; they never replace it.

World/simulation → art contract → any authoring tool → reviewed source image → FREAK//CITY processing → runtime. The simulation owns truth, the repository owns contracts, and human approval decides what ships.

Contracts complement `src/content/world.ts`, room/layout manifests, composition anchors and schedules. They cannot add exits, entities, biography, custody or presence. Resolve conflicts against those authoritative files and the locked approved source; record intentional design changes explicitly before changing art. Separate story facts from approved visual choices and provisional staging.

Current contracts: [Velvet / bar](rooms/bar.md), [Mara](characters/mara.md). No other room or character production is authorized. Current approval applies to the retained Velvet room and bounded overlay direction only.

Keep contracts provider-neutral. Retain source type, authoring tool, model and workflow facts in the [source provenance](../PROVIDER-NEUTRAL-ART-PIPELINE.md). The importer snapshots the contract and its SHA-256; edits to the live brief cannot silently rewrite a candidate's review basis. Existing historical candidates retain their original world contracts and do not require a destructive metadata migration.

For every important production asset retain: high-quality source PNG, contract, provenance, pixel master, display asset and hash-bound human approval. Preserve workflow JSON and manual-edit history where applicable. A native pixel drawing is itself an editable source/master; a layered Aseprite/Krita/Photoshop document is a useful addition, never the sole interchange format.

**No production asset should require the original AI model to remain maintainable.** See the [manual workflow](../PROVIDER-NEUTRAL-ART-PIPELINE.md#manual-edit-workflow) and [optional ComfyUI workstation](../COMFYUI-VISUAL-WORKFLOW.md).
