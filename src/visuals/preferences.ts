import type { VisualMode } from "./types";
export const VISUAL_PREFERENCE_KEY = "freak-city:environmental-visuals";
export function readVisualMode(): VisualMode {
  try {
    const value = localStorage.getItem(VISUAL_PREFERENCE_KEY);
    return value === "off" || value === "reduced" ? value : "on";
  } catch {
    return "on";
  }
}
export function storeVisualMode(value: VisualMode) {
  try {
    localStorage.setItem(VISUAL_PREFERENCE_KEY, value);
  } catch {
    /* Nonessential preference; gameplay and saves still work. */
  }
}
