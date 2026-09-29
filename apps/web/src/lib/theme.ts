export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "di-theme";

/**
 * Runs synchronously in <head> (see app/layout.tsx) so the right palette is on <html> before the
 * first paint. Stored choice wins; on a first visit we follow prefers-color-scheme.
 * Kept as a string because it is inlined into the document, not bundled.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/** Same resolution as THEME_INIT_SCRIPT. Client only. */
export function resolveTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // storage blocked: fall through to the system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Puts the theme on <html>. Pass persist to remember it as an explicit user choice. */
export function applyTheme(theme: Theme, { persist = false } = {}) {
  document.documentElement.setAttribute("data-theme", theme);
  if (!persist) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage blocked: the choice just won't survive a reload
  }
}
