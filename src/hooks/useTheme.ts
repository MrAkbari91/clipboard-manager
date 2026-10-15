import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("clipboard_brain_theme") as ThemeMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  const applyTheme = useCallback((targetTheme: ThemeMode) => {
    let effective: "light" | "dark" = "dark";

    if (targetTheme === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      effective = prefersDark ? "dark" : "light";
    } else {
      effective = targetTheme;
    }

    setResolvedTheme(effective);
    document.documentElement.setAttribute("data-theme", effective);
    document.body.setAttribute("data-theme", effective);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("clipboard_brain_theme", theme);

    // Listen for OS theme changes when in system mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme, applyTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "system";
      return "dark";
    });
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
