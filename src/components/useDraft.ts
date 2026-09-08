import { useEffect, useState } from "react";
function readDraft(key: string) {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
/** Local to this tab, including reloads; changing seeds never copies a draft. */
export function useDraft(key: string) {
  const [draft, setDraft] = useState(() => ({ key, value: readDraft(key) }));
  useEffect(() => {
    const clear = () => setDraft({ key, value: "" });
    window.addEventListener("freak-city:erase-drafts", clear);
    return () => window.removeEventListener("freak-city:erase-drafts", clear);
  }, [key]);
  const value = draft.key === key ? draft.value : readDraft(key);
  useEffect(() => {
    try {
      if (value) sessionStorage.setItem(key, value);
      else sessionStorage.removeItem(key);
    } catch {
      /* Keep the in-memory draft when storage is unavailable. */
    }
  }, [key, value]);
  return [value, (value: string) => setDraft({ key, value })] as const;
}
