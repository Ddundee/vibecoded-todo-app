export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: Theme): void {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l());
}

/** For useSyncExternalStore: reads the live theme without ever calling
 * setState from inside an effect body — React re-invokes this snapshot
 * getter on every render and after `subscribeTheme` notifies it. */
export function getThemeSnapshot(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}

export function subscribeTheme(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Inlined into a <script> tag in the root layout so the correct theme
 * class is applied before first paint — avoids a flash of the wrong
 * theme that a useEffect-based approach would cause. Kept as a plain
 * string (not imported/executed normally) since it has to run
 * synchronously in <head>, before React hydrates.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;
