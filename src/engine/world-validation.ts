import type { GameState } from "./types";
import { npcIds } from "./types";
import { createEntities, rooms } from "../content/spaces";
import { scenes } from "../content/scenes";

export function validateWorld(s: GameState): void {
  const w = s.world;
  if (!w) return;
  if (
    !rooms[w.room] ||
    (w.previousRoom && !rooms[w.previousRoom]) ||
    w.visitedRooms.some((id) => !rooms[id])
  )
    throw new Error("Save contains an unavailable room.");
  const expected = createEntities(s);
  if (
    Object.keys(expected).length !== Object.keys(w.entities).length ||
    Object.keys(expected).some((id) => !w.entities[id])
  )
    throw new Error("Save has an incomplete entity model.");
  for (const [id, e] of Object.entries(w.entities)) {
    if (e.id !== id || e.kind !== expected[id].kind)
      throw new Error("Save contains an invalid entity identity.");
    if (
      !rooms[e.location] &&
      !w.entities[e.location] &&
      !["player", "unplaced", "destroyed", ...npcIds].includes(e.location)
    )
      throw new Error("Save contains an invalid entity location.");
    const seen = new Set([id]);
    let parent = w.entities[e.location];
    while (parent) {
      if (seen.has(parent.id))
        throw new Error("Save contains a containment cycle.");
      seen.add(parent.id);
      parent = w.entities[parent.location];
    }
    if (
      e.worn &&
      (!e.portable || e.kind !== "Wearable" || e.location !== "player")
    )
      throw new Error("Save contains an invalid worn item.");
  }
  const carried = Object.values(w.entities)
    .filter((e) => {
      let item: typeof e | undefined = e;
      while (item) {
        if (item.destroyed) return false;
        if (item.location === "player") return true;
        item = w.entities[item.location];
      }
      return false;
    })
    .map((e) => e.id)
    .sort();
  if (JSON.stringify([...s.inventory].sort()) !== JSON.stringify(carried))
    throw new Error("Save inventory disagrees with entity custody.");
  for (const [room, scene] of Object.entries(w.encounters))
    if (!rooms[room] || !scenes[scene])
      throw new Error("Save contains an invalid encounter.");
  for (const [npc, scene] of Object.entries(w.conversations))
    if (!npcIds.includes(npc as (typeof npcIds)[number]) || !scenes[scene])
      throw new Error("Save contains an invalid conversation.");
  for (const entry of w.transcript)
    if (!rooms[entry.room] || entry.at > s.time)
      throw new Error("Save contains an invalid transcript location or time.");
  if (
    w.pending &&
    w.pending.candidates.some(
      (id) =>
        !w.entities[id] && !npcIds.includes(id as (typeof npcIds)[number]),
    )
  )
    throw new Error("Save contains an invalid clarification.");
}
