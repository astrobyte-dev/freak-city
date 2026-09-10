# FREAK//CITY owns its art pipeline

The simulation owns truth. The repository owns art contracts. Reviewed source images are the interchange format. Human approval decides what ships. No production asset should require the original AI model to remain maintainable.

This is the current production architecture, superseding provider-specific recommendations in older experiment reports. Any human artist, manual editor, hosted service, local model or future assistant can supply images. ComfyUI is an optional authoring workstation. Building and running the game requires only its JavaScript dependencies and reviewed static assets, with no Python, ML package, model, provider account or network inference call.

## Source architecture and provenance

Local ML availability must never block game development, runtime, deterministic asset processing or manual maintenance. The [Kontext evaluation is deferred without execution](KONTEXT-EVALUATION-STATUS.md); the [Qwen investigation recommends postponement](QWEN-LOCAL-EVALUATION-ASSESSMENT.md). External/hosted editors, manual tools, local ComfyUI models and future providers remain interchangeable authoring options. None is a required production backend.

The existing room importer `tools/visual-gen/import_external.py` now accepts these source types through the same processing and approval path:

| `sourceType`             | Meaning                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `external-reviewed-edit` | Externally supplied edit/image; exact authoring process may be unknown |
| `manual-edit`            | Hand-authored or manually maintained source                            |
| `local-generation`       | Source authored by a locally executed model                            |
| `hosted-generation`      | Source authored by a hosted model/service                              |

“Reviewed” in a source category does not grant runtime approval: every import is a new draft. Asset role (`canonical-room`, etc.) is independent of source type. The room import is opaque and 10:7; the character contract describes a separate transparent sprite role. Do not force characters through the room crop/quantizer. Other legacy generator roles remain optional authoring adapters.

New sidecars use `sourceSchemaVersion: 1`, `backend: source-image-import` and `provenance.origin` equal to the source type. `provenance.authoring` is a validated optional object. Tool/provider/model fields never select runtime art or bypass review. Required source attribution is a public editor/alias and specific notes; unknown tools/providers/models are null or absent.

| Authoring field                            | Record when known                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `authoringTool`, `provider`                | Application/service and provider separately; both optional                                                                          |
| `modelFamily`, `model`, `revision`         | Family, exact checkpoint/repository ID, immutable model revision                                                                    |
| `checkpointSha256`, `sourceUrl`, `license` | Checkpoint hash, authoritative source, applicable licence                                                                           |
| `seed`, `settings`                         | Integer seed or null; sampler, scheduler, steps, guidance, denoise, dimensions, quantisation/offload                                |
| `environment`                              | ComfyUI version/commit, node pack revisions, device, driver, runtime versions; additional checkpoint records for encoders/VAE/LoRAs |
| `manualEdits`                              | Ordered entries with `editor`, `tool`, `notes`; add date and before/after hashes when available                                     |

`modelExecuted: false`, top-level `model: null` and `seed: null` describe the **import operation**, which performs only pixel processing. Actual earlier model/seed facts belong in `provenance.authoring`. Do not fabricate unknown model versions or transfer generation claims to a manual edit. The optional legacy `--service` argument fills `authoringTool` for older commands.

The importer retains original source bytes, optional parent PNG, world manifest, optional contract and optional workflow JSON with SHA-256. It also retains framing, unquantized master, palette master and exact display. Processing settings are separate from authoring settings. Imported workflow copies are hash-checked and screened for obvious absolute paths/credentials. Review portable JSON manually as well; that screen is not a general secret detector.

Promotion validates all retained records and reproduces framing, palette and display pixels for every source type before applying the same human architecture/composition/non-explicit review. The runtime registry contains only role, geometry/composition, reviewed files/hashes/dimensions and approval facts. It never imports provenance, workflow or generator modules.

## Export and import

Run commands from the repository root, using the workstation's Python executable (`python` below). Pillow suffices for source import/review; the full historical Python suite also uses OpenCV. No ML install is needed.

Export a portable maintenance bundle; this only copies retained bytes and refuses to overwrite an existing directory:

```sh
python tools/visual-gen/export_art.py --source docs/visuals/velvet-architecture-cleanup/candidate/sources/original.png --contract docs/art-contracts/rooms/bar.md --manifest docs/visuals/velvet-architecture-cleanup/candidate/provenance/world-manifest.json --layout src/content/visuals/layouts/bar.json --output .visuals/exports/bar-maintenance-01
```

The bundle includes `source.png`, `art-contract.md`, `world-manifest.json`, `layout.json` and a portable hash inventory. For future world changes, export the current manifest first with `npm run visuals -- --room bar --role canonical-room --dry-run` (writes `.visuals/jobs/bar--canonical-room.json` without inference), then pass that manifest. Compare it to the retained contract before authoring. Mara can be exported with her source and contract using the same command and without a room manifest.

## Manual-edit workflow

1. Copy/export the retained high-quality PNG and brief. Open the copy in Photoshop, Krita, Aseprite or another editor. Preserve original files; retain layered work if useful. Record the specific operation and before/after hashes.
2. Save the edited image to `.visuals/imports/bar/manual-01/source.png`. Keep a small `authoring.json`, for example:

   ```json
   {
     "authoringTool": "Krita",
     "manualEdits": [
       {
         "editor": "artist alias",
         "tool": "Krita",
         "notes": "Describe the exact correction here"
       }
     ]
   }
   ```

3. Create new room drafts with the same deterministic processor (command is for a future authorized edit, not authorization to change Velvet now):

   ```sh
   python tools/visual-gen/import_external.py --manifest .visuals/exports/bar-maintenance-01/world-manifest.json --source .visuals/imports/bar/manual-01/source.png --output .visuals/imported/bar --source-type manual-edit --editor "artist alias" --notes "Describe the exact correction" --framing-notes "Preserve approved crop" --crop 4 0 1444 1008 --colors 64 --contrast 1.15 --parent-source .visuals/exports/bar-maintenance-01/source.png --art-contract docs/art-contracts/rooms/bar.md --authoring-json .visuals/imports/bar/manual-01/authoring.json
   ```

4. The command reports `.visuals/imported/bar/raw/<run-id>/<candidate>.png`. Build the review page with `python tools/visual-gen/review_page.py --batch .visuals/imported/bar/raw/<run-id> --output .visuals/imported/bar/review/<run-id>`. Add real compositor comparisons using the existing `scripts/visual-review-composite.ts` workflow described in [the production report](VISUAL-PRODUCTION-REPORT.md). Source, full-resolution differences, master, display and state cases need human review. A passing hash check alone is not art approval.
5. Before production promotion, copy the **whole candidate directory**, contract/workflow and review evidence into a new `docs/visuals/reviewed-sources/<asset>/<revision>/` directory. Verify all hashes again after copying and commit the portable evidence. `.visuals/` is ignored scratch storage and cannot be the only retained production source.
6. After explicit approval of that candidate, use `promote.py --candidate <retained-candidate.png> --reviewer <alias> --notes <decision> --approve-world-facts --approve-architecture --composition <reviewed-composition.json> --non-explicit`. It refuses to replace an occupied variant. Replacing an existing canonical requires a separately authorized, deliberate registry retirement/replacement; keep the old source and approval. Current Velvet approval does not authorize such replacement.

For transparent character maintenance, export the native PNG or alpha cutout alongside the character brief, edit a copy, retain a new draft source/master and optional nearest-scaled review display. Preserve the reviewed canvas, palette and binary alpha. The native PNG is the shipping display source. The existing `velvet_overlay_art.py` is a deterministic reference for palette cleanup and reflection construction; its historical `main()` rewrites pilot evidence and must not be run on that approved directory. Work in a separate draft directory, derive a new reflection from the changed sprite and review identity/contacts/state in the compositor. A new sprite hash requires a new human attestation and deliberate update of the small overlay registry. No AI call is involved in any of these operations.

## Retention and migrations

Existing room sources, crops, masters, displays and original draft provenance stay byte-identical. Legacy `external-reviewed-edit` sidecars remain accepted by the validator. Legacy SDXL/ControlNet/human-edit experiments remain readable and retain their real history. New source imports use version 1 metadata; no mass rewrite of evidence or runtime/save schema migration occurred.

The overlay activation copies eight approved sprite masters and eight reflections unchanged to `public/visuals/velvet-overlay/sprites/` and adds a compact typed registry under `src/content/visuals/velvet-overlay.*`. Its separate [approval](visuals/velvet-overlay-pilot/human-approval.json) binds the original provenance, room hash and all shipping sprite/reflection hashes. Historical pending-review metadata is evidence of its creation state, superseded by that later approval. No room pixels or character sources were regenerated.

Any assistant or human can continue from this document, [the contracts](art-contracts/README.md), [ComfyUI plan](COMFYUI-VISUAL-WORKFLOW.md) and [workstation handoff](WORKSTATION-HANDOFF.md). PR #1 stays draft; this task stops for human review without merge, deployment, model downloads or expanded art production.
