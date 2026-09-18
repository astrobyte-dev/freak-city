/** Stable ordering and occurrence identity shared by authored campaigns. */
export interface TimedEvent {
  id: string;
  at: number;
  status: "pending" | "fired" | "cancelled";
}
export function nextDueEvent<T extends TimedEvent>(
  events: T[],
  target: number,
) {
  return events
    .filter((e) => e.status === "pending" && e.at <= target)
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))[0];
}
export function scheduleOnce<T extends TimedEvent>(events: T[], event: T) {
  if (events.some((e) => e.id === event.id)) return false;
  events.push(structuredClone(event));
  return true;
}
