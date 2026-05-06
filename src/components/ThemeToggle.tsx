import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-full backdrop-blur-md border shadow-glass hover:scale-110 hover:rotate-12 transition-transform duration-200"
      style={{ background: "var(--glass-background)", borderColor: "var(--glass-border)" }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="hidden h-5 w-5 text-amber-400 dark:block" />
      <Moon className="h-5 w-5 text-indigo-600 dark:hidden" />
    </button>
  );
};