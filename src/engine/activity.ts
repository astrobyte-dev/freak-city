import type { GameState } from "./types";

// Curated work continues off screen. These events change surroundings, never evidence.
export const workplaceActivity = [
  {
    id: "bar-reset",
    at: 1448,
    room: "bar",
    text: "The towel has been replaced. Chipped glasses now stand together in a crate for the supplier.",
  },
  {
    id: "handover-note",
    at: 1482,
    room: "vestibule",
    text: "A fresh handover note sits under the entry book: pharmacy hours corrected, heater checked, one relief shift still to settle.",
  },
  {
    id: "kitchen-restock",
    at: 1505,
    room: "kitchen",
    text: "Someone has cleared the sink and restocked the cups. The fan casing is still waiting where it was left.",
  },
  {
    id: "stage-coil",
    at: 1520,
    room: "stage",
    text: "The spare cables are coiled now. A note on the equipment case asks tomorrow's crew to leave the adapter attached.",
  },
] as const;
export function installActivity(s: GameState) {
  for (const activity of workplaceActivity) {
    if (s.events.some((e) => e.id === `activity:${activity.id}`)) continue;
    if (activity.at <= s.time) {
      s.flags[`activity:${activity.id}`] = true;
      continue;
    }
    s.events.push({
      id: `activity:${activity.id}`,
      at: activity.at,
      status: "pending",
      effects: [{ type: "flag", key: `activity:${activity.id}`, value: true }],
    });
  }
}
export function activityDescription(s: GameState, room: string) {
  return workplaceActivity
    .filter((a) => a.room === room && s.flags[`activity:${a.id}`])
    .map((a) =>
      a.text.replace(
        "The fan casing is still waiting where it was left.",
        s.flags.fixedFan
          ? "The repaired fan is still running."
          : "The fan casing is still waiting where it was left.",
      ),
    )
    .join(" ");
}
