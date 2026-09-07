import { validateSave } from "./game";
import type { GameState } from "./types";
export const SAVE_KEY = "freak-city:v1:autosave";
const BOOKMARK_KEY = "freak-city:v1:bookmark";
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function saveGame(s: GameState, storage: StorageLike = localStorage) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(s));
    return null;
  } catch {
    return "Your browser could not save. Export your run before closing this tab.";
  }
}
export function loadGame(storage: StorageLike = localStorage): {
  state: GameState | null;
  error: string | null;
} {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return { state: raw ? validateSave(JSON.parse(raw)) : null, error: null };
  } catch {
    return {
      state: null,
      error:
        "The local save could not be read. It has been left intact; start a new run or import a valid backup.",
    };
  }
}
export function bookmark(s: GameState, storage: StorageLike = localStorage) {
  if (s.mode === "livewire") throw new Error("Live Wire keeps one autosave.");
  storage.setItem(BOOKMARK_KEY, JSON.stringify(s));
}
export function restoreBookmark(
  current: GameState,
  storage: StorageLike = localStorage,
) {
  if (current.mode === "livewire")
    throw new Error("Live Wire keeps decisions permanent.");
  const raw = storage.getItem(BOOKMARK_KEY);
  if (!raw) throw new Error("No bookmark yet.");
  const s = validateSave(JSON.parse(raw));
  if (s.mode === "livewire")
    throw new Error("Live Wire runs cannot be restored as bookmarks.");
  return s;
}
export function eraseLocal(storage: StorageLike = localStorage) {
  storage.removeItem(SAVE_KEY);
  storage.removeItem(BOOKMARK_KEY);
}
export function exportSave(s: GameState) {
  return JSON.stringify(s, null, 2);
}
export function importSave(raw: string, current: GameState) {
  if (current.mode === "livewire")
    throw new Error("Import is disabled during Live Wire.");
  if (raw.length > 2_000_000) throw new Error("Save file is too large.");
  const s = validateSave(JSON.parse(raw));
  if (s.mode === "livewire")
    throw new Error("Live Wire backups cannot be used to rewind.");
  return s;
}
