import { validateTrial, type TrialState } from "./state";
import type { StorageLike } from "../engine/save";

export const TRIAL_SAVE = "freak-city:sable-trial:v1:autosave";
export const TRIAL_BOOKMARK = "freak-city:sable-trial:v1:bookmark";
export const TRIAL_DRAFT = "freak-city:sable-trial:v1:draft";
export const TRIAL_PLAYTEST = "freak-city:sable-trial:v1:playtest";
/** Keep the exact older bytes before a migrated state can be autosaved. */
export function preservePrevious(
  storage: StorageLike,
  key: string,
  raw: string,
) {
  let index = 1;
  while (storage.getItem(`${key}:preserved:${index}`) !== null) {
    if (storage.getItem(`${key}:preserved:${index}`) === raw) return;
    index++;
  }
  storage.setItem(`${key}:preserved:${index}`, raw);
}
export function readTrial(storage: StorageLike, key = TRIAL_SAVE) {
  try {
    const raw = storage.getItem(key);
    const original = raw ? JSON.parse(raw) : null;
    const state = original ? validateTrial(original) : null;
    const migrated = state && original.revision !== state.revision;
    if (migrated) preservePrevious(storage, key, raw!);
    return {
      state,
      error: null,
      notice: migrated
        ? "Trial save migrated to shared vessel custody. The original save is preserved locally."
        : null,
    };
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
  const next = JSON.stringify(validateTrial(state));
  const previous = storage.getItem(key);
  if (previous) {
    let revision: unknown;
    try {
      revision = JSON.parse(previous).revision;
    } catch {
      /* Preserve unreadable bytes too. */
    }
    if (revision !== state.revision) preservePrevious(storage, key, previous);
  }
  storage.setItem(key, next);
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
