# Velvet fixed layout v1

Non-metric art coordinates: x west to east, y front/south to back/north. Rectangle, dimensions and unspecified route positions are composition choices, not additional parser geography. Front wall is a camera cutaway, not an exit.

Authoritative generation reference; pending human layout review, with no shipping approval.

## Permanent elements

- **One staircase / upstairs** (`stairs`): One staircase beside the salon; main floor toward a small stage. Art footprint `[132, 146, 176, 224]`; entity `architectural relationship`.
- **Fixed counter / bare surface** (`counter`): Fixed bar counter, bare surface. Art footprint `[14, 18, 80, 139]`; entity `counter`.
- **Fixed bottle shelving / empty** (`shelves`): Fixed bottle shelving, no loose cups or readable labels. Art footprint `[0, 98, 10, 157]`; entity `detail_bar_shelves`.
- **High street-facing window** (`window`): High street-facing window. Art footprint `[316, 45, 320, 103]`; entity `detail_bar_window`.
- **Distant small stage beyond east route** (`stage-view`): One staircase beside the salon; main floor toward a small stage. Art footprint `[307, 166, 320, 217]`; entity `architectural relationship`.

## Routes

- **Vestibule / south** → `vestibule`; south edge, span `[100, 145]`.
- **Outside / front door** → `street`; south edge, span `[235, 280]`.
- **Upstairs via the single staircase** → `landing`; north edge, span `[132, 176]`.
- **Kitchen / service opening** → `kitchen`; west edge, span `[30, 72]`.
- **Stage / east** → `stage`; east edge, span `[164, 219]`.
- **Salon / beside stairs** → `salon`; north edge, span `[186, 230]`.
- **Archive / service-table route** → `archive`; west edge, span `[175, 216]`.

West kitchen, east stage and south vestibule follow parser aliases. Other edge positions, the rectangular drawing envelope, camera and dimensions are explicit art choices. Route marks express traversal; no physical door state is asserted. Stage is a small distant view at the east opening. No upstairs balcony is implied.

## Runtime reservations

- `npc-floor`: NPCs and movable objects; no figures baked in; `[97, 24, 235, 130]`.
- `right-floor`: Additional dynamic object / NPC space; `[244, 34, 300, 137]`.
- `foreground`: Foreground overlays / transient clutter; `[86, 0, 307, 20]`.

Bare counter and empty shelving exclude loose contents. NPCs, evidence, movable props (including glasses), stools, lamps, clock state, bins, stateful doors, damage, clutter, weather, crowds and lighting variation remain runtime layers. These drawing zones do not replace the shipping compositor's reviewed coordinates.

Candidate 01 from seed 8317 informed clear floor and depth only; no generated pixels or invented gallery geometry were used.
