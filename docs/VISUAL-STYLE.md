# FREAK//CITY visual language

**PRE-ALPHA / ACTIVE DEVELOPMENT.** This is an adaptable starting direction, not a promise of the final art style.

32-bit retro pixel/dot-map character; PS1-era texture roughness; grungy neo-noir nightlife; heavy shadow; wet streets and broken reflections; old brick, stained concrete and industrial surfaces. Use magenta and electric cyan as scarce accents. The ordinary dark surfaces should outweigh the bright ones. Atmosphere is melancholy and lived-in, not a wall of luminous signs.

## Shared rules

- Dirty neutrals, black, dried red, oxidized brass, concrete and inexpensive practical lighting give colour accents a purpose.
- Low-resolution scene shapes have crisp edges, small irregularities and restrained palettes. UI text uses the existing modern font system and is never pixelated.
- Do not add a door, window, object, character, evidence or damage because it would improve the composition. World truth wins over art direction.
- Show scheduled characters subtly and recognizably by their real names. Avoid defining final faces, outfits, bodies or poses in this pass.
- No rapid flicker, large parallax, flashing scanlines or perpetual high-contrast movement. The reader's attention belongs to the transcript and command bar.
- Anonymous atmosphere cannot imply new people with dialogue, a new encounter, or content outside the player's boundaries.

## Families

| Family         | Materials, palette and light                                                                                  | Scope                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Velvet Quarter | Expensive decay; dark red, black, brass, wet stone; low practical amber                                       | Current venue studies                    |
| Service road   | Worn steel, dirty concrete, wet asphalt, functional security light                                            | Current loading bay                      |
| Domestic       | Dull appliance enamel, old paint, familiar clutter represented only by canonical objects, cold ambient colour | Current apartment                        |
| The Static     | Cheap electronics, restrained cyan CRT light, digital noise                                                   | Future direction only; no district added |
| Saint          | Ritual architecture, deep shadow, candle/incandescent warmth                                                  | Future direction only                    |
| Meat Market    | Warehouse grime, harsh fluorescent light, punk signage                                                        | Future direction only                    |

The machine-readable shared style and current families live in `src/content/visuals/generation.ts`. The generation prompt builder uses a compact model prompt plus a complete audit specification; scene-specific world facts are retained for review rather than crammed into a truncated text encoder.

## Pixel treatment

The collaborator's original treatment is retained as a configurable starting point: nearest-neighbour downscale to 320 pixels wide, 48-colour median-cut quantization, contrast 1.3. The scene compositor uses a 320 × 224 frame; a canonical raster is doubled to 640 × 448 without interpolation and encoded as lossless WebP. No crop or blur is introduced during promotion.

These defaults suit the current schematic studies, but are not proven optimal for SDXL output. Compare 256/320 pixel widths, 32/48/64 colours and 1.0/1.15/1.3 contrast on a contact sheet. Excess contrast can erase dirty midtones; excessive crunch can turn a texture into an apparent object. Approve with the actual object/NPC overlays visible, not just the isolated plate.

The four committed fixture contact sheets demonstrate the tool contract. They are explicitly labelled procedural fixtures, are not SDXL output, and are not approved shipping assets.
