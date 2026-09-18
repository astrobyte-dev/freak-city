import { validateTrial, type TrialState } from "./state";
import type { StorageLike } from "../engine/save";

export const TRIAL_SAVE = "freak-city:sable-trial:v1:autosave";
export const TRIAL_BOOKMARK = "freak-city:sable-trial:v1:bookmark";
export const TRIAL_DRAFT = "freak-city:sable-trial:v1:draft";
export const TRIAL_PLAYTEST = "freak-city:sable-trial:v1:playtest";
export function readTrial(storage: StorageLike, key = TRIAL_SAVE) {
  try {
    const raw = storage.getItem(key);
    return { state: raw ? validateTrial(JSON.parse(raw)) : null, error: null };
  } catch {
    return {
      state: null,
      error:
        "The trial save could not be read. It remains intact. Export it before choosing a new trial or importing a replacement.",
    };
  }
}
export function writeTrial(
  storage: StorageLike,
  state: TrialState,
  key = TRIAL_SAVE,
) {
  storage.setItem(key, JSON.stringify(validateTrial(state)));
}
export function importTrial(raw: string) {
  if (raw.length > 2_000_000) throw new Error("Trial save is too large.");
  return validateTrial(JSON.parse(raw));
}
export function eraseTrial(storage: StorageLike, session: StorageLike) {
  storage.removeItem(TRIAL_SAVE);
  storage.removeItem(TRIAL_BOOKMARK);
  storage.removeItem(TRIAL_PLAYTEST);
  session.removeItem(TRIAL_DRAFT);
}
