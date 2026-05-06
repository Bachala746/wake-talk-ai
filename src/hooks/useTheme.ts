import { useCallback, useSyncExternalStore } from "react";

const THEME_SWITCH_CLASS = "theme-switching";
const STORAGE_KEY = "theme";
const SWITCH_DURATION_MS = 300;

let switchTimer: number | undefined;
let currentTheme = (() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "dark";
})();

const listeners = new Set<() => void>();

const persistTheme = (isDark: boolean) => {
  const save = () => localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  const scheduler = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  if (scheduler.requestIdleCallback) {
    scheduler.requestIdleCallback(save, { timeout: 500 });
  } else {
    window.setTimeout(save, 0);
  }
};

const applyTheme = (isDark: boolean) => {
  const root = document.documentElement;
  window.clearTimeout(switchTimer);
  root.classList.add(THEME_SWITCH_CLASS);
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";

  switchTimer = window.setTimeout(() => {
    root.classList.remove(THEME_SWITCH_CLASS);
  }, SWITCH_DURATION_MS);
};

const setTheme = (isDark: boolean) => {
  if (isDark === currentTheme) return;
  currentTheme = isDark;
  applyTheme(isDark);
  persistTheme(isDark);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => currentTheme;

export const useTheme = () => {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleTheme = useCallback(() => {
    setTheme(!currentTheme);
  }, []);

  return { isDark, toggleTheme };
};

if (typeof document !== "undefined") {
  applyTheme(currentTheme);
}
