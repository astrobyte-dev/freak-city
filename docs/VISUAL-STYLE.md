# FREAK//CITY visual language

**PRE-ALPHA / ACTIVE DEVELOPMENT.** Visual authoring v2: stable canonical places, cinematic illustrated moments, live simulation-driven state. The world remains authoritative. See [architecture](VISUAL-ARCHITECTURE.md) and [generation/review](GENERATIVE-ASSET-PIPELINE.md).

## Identity

32-bit pixel-map character and PS1-era texture roughness. Adult underground neo-noir nightlife in an old city: expensive decay, rain-slicked red-light streets, dirty brick, stained concrete, worn interiors, practical lamps, cheap fluorescent back rooms, wet pavement and reflective puddles. Crimson and deep red form a major colour family; hot pink and magenta are selective accents, cyan provides contrast. Deep shadow must retain enough dirty midtones to read the room.

Velvet Quarter is an adult underground venue district, not a generic futuristic cyberpunk city. Technology appears as local texture: an existing sign, camera, clock or appliance. Cyberpunk influence is modular and district-dependent. Do not add holograms, circuitry, towers or neon everywhere merely to signal genre.

Atmosphere may include haze, smoke-like mist, lonely early-morning streets, bars at closing, loading docks, dressing-room references and worn VIP corridors. These are style directions, not permission to create new rooms or imply a smoking/substance-use event in the simulation.

## Three complementary views

- **Canonical room plates:** readable environmental establishing views with depth, grounded permanent architecture and fixed furniture, and usable space for dynamic overlays. One physical identity persists through the night. No named NPCs, stateful doors, evidence, changing custody, temporary damage or player belongings baked into the plate.
- **Scene illustrations:** occasional cinematic moments. Anonymous adult crowds, distant performers in stagewear, silhouettes, provocative non-explicit nightlife fashion, masks, tension and intimate framing are appropriate when compatible with the authored scene and boundaries. These are illustrations, not parser maps or new encounters.
- **Dynamic overlays:** named NPC presence, movable objects, evidence, doors, lights, consequences and atmosphere come from runtime state. The texture role remains useful for grunge and material studies.

Adults-only tone comes through atmosphere, implication, adult presentation and framing. Shipping art remains non-explicit. Do not invent a mystery clue to make a picture more dramatic. Named-character staging requires actual presence and human review; no final face or outfit is defined by this pass.

## Families

| Family         | Materials, palette and lighting                                                        | Scope                       |
| -------------- | -------------------------------------------------------------------------------------- | --------------------------- |
| Velvet Quarter | Crimson, dried wine, black, brass, wet stone; old architecture and low practical light | Existing venue and entrance |
| Service road   | Worn steel, stained concrete, dirty asphalt; functional light and damp reflections     | Loading bay                 |
| Domestic       | Old paint, dull enamel, cold ambient light, inexpensive lamps                          | Apartment                   |
| The Static     | Cheap electronics and restrained CRT cyan                                              | Future reference only       |
| Saint          | Ritual architecture, shadow, warm candle/incandescent references                       | Future reference only       |
| Meat Market    | Warehouse grime, harsh fluorescent light, punk signage                                 | Future reference only       |

The compact model styles, fuller audit styles and role presets live in `src/content/visuals/generation.ts` and `manifest.ts`. District styles can change without rewriting the prompt builder.

## Pixel treatment

Generation → nearest-neighbour downscale → palette crunch → contrast → nearest-neighbour display upscale. The canonical preset generates 640 × 448, crunches to 320 × 224 / 48 colours / contrast 1.15, then displays at 640 × 448 with exact 2× pixels. Illustrations retain 512 × 358; canonical output also supports `--display-width 512`. That option rounds height and produces unequal pixel-block widths. Nothing is blurred or cropped. See the [fixed Velvet reference and strength experiment](VISUAL-GEOMETRY-REPORT.md): crimson, black, worn materials and PS1 character remain the style target, while geometry has priority.

`--pixel-width`, `--colors`, `--contrast` and `--display-width` override the role preset. Original texture defaults remain 320 pixels / 48 colours / contrast 1.3 / display width 320. Keep the pixel master when upscaling so later WebP encoding does not resample an already uneven grid.

Review room readability, geometry, palette and overlays at desktop and mobile sizes. Strong contrast can erase midtones; crack-like texture can falsely imply damage. Canonical and illustration images remain fully in frame on mobile. UI text remains clean and modern.

## Typography reference

Pixel Operator is a collaborator-provided style reference for a later typography discussion. Its licence and distribution terms have not been verified in this pass. No font was downloaded or bundled, and the existing UI typography is unchanged. A later UI redesign must verify the exact font files and licence before adoption.

## Current review status

The first real texture batch remains a **texture-role experiment**, unpromoted. V2 canonical-room candidates are also drafts until architecture, composition and world facts are checked by a human. A pleasing contact sheet is not approval of the runtime composite.
