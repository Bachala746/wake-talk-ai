import { useCallback, useLayoutEffect, useState } from "react";

const THEME_SWITCH_CLASS = "theme-switching";

const applyTheme = (isDark: boolean) => {
  const root = document.documentElement;
  root.classList.add(THEME_SWITCH_CLASS);
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";

  window.setTimeout(() => {
    root.classList.remove(THEME_SWITCH_CLASS);
  }, 320);
};

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useLayoutEffect(() => {
    applyTheme(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
};
