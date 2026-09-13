# FREAK//CITY visual language

**PRE-ALPHA / ACTIVE DEVELOPMENT.** Visual authoring v2: stable canonical places, cinematic illustrated moments, live simulation-driven state. The world remains authoritative. See [architecture](VISUAL-ARCHITECTURE.md) and [generation/review](GENERATIVE-ASSET-PIPELINE.md).

## Identity

32-bit pixel-map character and PS1-era texture roughness. Adult underground neo-noir nightlife in an old city: expensive decay, rain-slicked red-light streets, dirty brick, stained concrete, worn interiors, practical lamps, cheap fluorescent back rooms, wet pavement and reflective puddles. Public nightlife can use vivid hot pink/magenta with cyan contrast and deep black shadow. Private rooms lean crimson; service and home spaces have their own restrained palettes. Retain dirty midtones so rooms and overlay silhouettes remain readable.

Velvet Quarter is an adult underground venue district, not a generic futuristic cyberpunk city. Technology appears as local texture: an existing sign, camera, clock or appliance. Cyberpunk influence is modular and district-dependent. Do not add holograms, circuitry, towers or neon everywhere merely to signal genre.

Atmosphere may include haze, smoke-like mist, lonely early-morning streets, bars at closing, loading docks, dressing-room references and worn VIP corridors. These are style directions, not permission to create new rooms or imply a smoking/substance-use event in the simulation.

## Three complementary views

- **Canonical room plates:** readable environmental establishing views with depth, grounded permanent architecture and fixed furniture, and usable space for dynamic overlays. One physical identity persists through the night. No named NPCs, stateful doors, evidence, changing custody, temporary damage or player belongings baked into the plate.
- **Scene illustrations:** occasional cinematic moments. Anonymous adult crowds, distant performers in stagewear, silhouettes, provocative non-explicit nightlife fashion, masks, tension and intimate framing are appropriate when compatible with the authored scene and boundaries. These are illustrations, not parser maps or new encounters.
- **Dynamic overlays:** named NPC presence, movable objects, evidence, doors, lights, consequences and atmosphere come from runtime state. The texture role remains useful for grunge and material studies.

Adults-only tone comes through atmosphere, implication, adult presentation and framing. Shipping art remains non-explicit. Do not invent a mystery clue to make a picture more dramatic. Named-character staging requires actual presence and human review; no final face or outfit is defined by this pass.

## Families

| Family                   | Materials, palette and lighting                                                                                               | Current rooms                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Public Velvet            | Vivid hot pink/magenta, cyan contrast, deep black, polished grime, worn wood; reflective material response with live lighting | bar, stage, vestibule                             |
| Private / VIP            | Crimson, warm pink, darker intimacy, aged wood; mirrors only where already present                                            | salon, office, exchange-room, landing             |
| Backstage / work spaces  | Harsh fluorescent work light, pink spill, worn surfaces; cables or garments only in their actual rooms                        | kitchen, cloakroom                                |
| Service areas            | Dirty neutral concrete, dull steel, industrial/practical lights, restrained neon spill; ugly but readable                     | loading-bay, washroom, archive, motel             |
| Exteriors                | Rain, deep shadow, existing signs, pink/cyan glow and reflections; sheltered or enclosed treatments where appropriate         | street, kiosk (sheltered), taxi (enclosed/window) |
| Apartment / private home | Muted, lonely, less theatrical, old paint/enamel and inexpensive practical light; cold dawn                                   | apartment                                         |

These are art families, not new locations or permission to invent furniture. There is no separate playable VIP booth, dressing room or backstage room in the current 17-room world. Map the brief's atmosphere onto existing rooms and preserve their actual geometry. See the complete [asset plan](VISUAL-ASSET-PLAN.md).

The compact model styles, fuller audit styles and role presets live in `src/content/visuals/generation.ts` and `manifest.ts`. District styles can change without rewriting the prompt builder.

## Pixel treatment

Generation → nearest-neighbour downscale → palette crunch → contrast → nearest-neighbour display upscale. The canonical preset generates 640 × 448, crunches to 320 × 224 / 48 colours / contrast 1.15, then displays at 640 × 448 with exact 2× pixels. Illustrations retain 512 × 358; canonical output also supports `--display-width 512`. That option rounds height and produces unequal pixel-block widths. Nothing is blurred or cropped. See the [fixed Velvet reference and strength experiment](VISUAL-GEOMETRY-REPORT.md): crimson, black, worn materials and PS1 character remain the style target, while geometry has priority.

`--pixel-width`, `--colors`, `--contrast` and `--display-width` override the role preset. Original texture defaults remain 320 pixels / 48 colours / contrast 1.3 / display width 320. The expressive scene preset uses 64 colours and contrast 1.10 to retain saturated midtones; canonical stays at 48 / 1.15 with exact 640 display. Keep the pixel master when upscaling so later WebP encoding does not resample an already uneven grid.

## Production treatment

Canonical rooms use reviewed geometry, surface masks, staged beautification and optional manual cleanup. AI output is a production ingredient. Correcting a door, stair, window, stray prop or fake lettering is legitimate when its parent source, editor, tool and changes are recorded. Human correction still requires architecture and actual runtime-composite review. The [staged production workflow](VISUAL-PRODUCTION-REPORT.md) replaces the goal of making one whole-image img2img invocation finish the room.

Scene illustrations may use freer framing, silhouettes, reflective floors, dark backgrounds and stronger pink/cyan nightlife. They do not define parser geography and should appear only at a few curated compatible moments. Reject minors, explicit sexual imagery, branded logos, distracting fake story text, obvious malformed anatomy and character/scene mismatches. Generic model avoidance phrases are not a substitute for human inspection.

Review room readability, geometry, palette and overlays at desktop and mobile sizes. Strong contrast can erase midtones; crack-like texture can falsely imply damage. Canonical and illustration images remain fully in frame on mobile. UI text remains clean and modern.

## Typography reference

Pixel Operator is a collaborator-provided style reference for a later typography discussion. Its licence and distribution terms have not been verified in this pass. No font was downloaded or bundled, and the existing UI typography is unchanged. A later UI redesign must verify the exact font files and licence before adoption.

## Current review status

The first real texture batch remains a **texture-role experiment**, unpromoted. V2 canonical-room candidates are also drafts until architecture, composition and world facts are checked by a human. A pleasing contact sheet is not approval of the runtime composite.
