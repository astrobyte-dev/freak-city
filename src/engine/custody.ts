import type { Entity } from "./world-types";

export function carriedBy(
  entities: Record<string, Entity>,
  id: string,
  holder = "player",
) {
  let e = entities[id];
  const seen = new Set<string>();
  while (e && !seen.has(e.id)) {
    seen.add(e.id);
    if (e.destroyed) return false;
    if (e.location === holder) return true;
    e = entities[e.location];
  }
  return false;
}
export function visibleAt(
  entities: Record<string, Entity>,
  id: string,
  room: string,
  people: Record<string, string> = {},
) {
  let e = entities[id];
  const seen = new Set<string>();
  if (!e || !e.visible || e.destroyed) return false;
  if (e.properties.onPerson && Object.hasOwn(people, e.location))
    return people[e.location] === room;
  if (e.kind === "Door" && e.properties.otherSide === room) return true;
  while (e && !seen.has(e.id)) {
    seen.add(e.id);
    if (!e.visible || e.destroyed) return false;
    if (e.location === room || e.location === "player") return true;
    const parent = entities[e.location];
    if (!parent || parent.open === false) return false;
    e = parent;
  }
  return false;
}
