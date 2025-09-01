// src/utils/yearPref.ts
const KEY = "owneros:lastYear";

export function getLastYear(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setLastYear(year: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(year));
  } catch {}
}
