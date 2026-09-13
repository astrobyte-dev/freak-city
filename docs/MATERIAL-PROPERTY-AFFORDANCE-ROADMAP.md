# Future material / property / affordance system

**Roadmap only. No parser, simulation or content implementation in the visual pass.**

Objects could eventually inherit behaviour from what they are: `material`, `breakable`, `flammable`, `transparent`, `liquid`, `container`, `wearable`, `electronic`, `sharp`, `fragile` and `conductive`. Candidate global verbs include BREAK, SHATTER, BURN, SPILL, CUT, OPEN, LOCK, WEAR and DRINK.

For example, a glass material may permit a SHATTER attempt, while explicit properties, tool requirements, accessibility, force and scene constraints decide whether it succeeds. A material tag alone must not make every window breakable or create a route through a wall.

A later design pass should define typed properties, action preconditions, reusable outcomes, containment/custody rules and explicit authored exceptions. Reuse existing resolution, visibility and reachability checks. Record state changes through normal simulation events and saves; visuals read the resulting state rather than causing it.

Review evidence destruction, irreversible choices, NPC ownership, locked routes, player safety boundaries and narrative invariants before applying global actions. Add deterministic state-transition and save-migration tests, then migrate a small set of ordinary objects before expanding. Preserve clear parser feedback for failed or unsupported attempts.

The visual architecture's dynamic layers and baked-entity fallback can depict these future changes. Removable damage/architecture masks will eventually allow a shattered window without discarding an entire room plate. No part of this roadmap authorizes that gameplay change now.
