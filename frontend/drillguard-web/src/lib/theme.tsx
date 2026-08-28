"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
export type SidebarStyle = "navy" | "light";

type Ctx = {
  theme: Theme;
  sidebar: SidebarStyle;
  setTheme: (t: Theme) => void;
  setSidebar: (s: SidebarStyle) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

/** Read a stored preference during client initialisation; SSR gets the default. */
function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : fallback;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialisers: the stored value is applied on the very first client
  // render, so no effect ever has to call setState (and nothing can overwrite
  // the stored choice with the SSR default). Persistence lives in the setters.
  const [theme, setThemeState] = useState<Theme>(() =>
    stored("dg-theme", ["light", "dark"] as const, "light"),
  );
  const [sidebar, setSidebarState] = useState<SidebarStyle>(() =>
    stored("dg-sidebar", ["navy", "light"] as const, "navy"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // dark theme always uses the navy sidebar (per the dark variants)
    document.documentElement.dataset.sidebar = theme === "dark" ? "navy" : sidebar;
  }, [theme, sidebar]);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem("dg-theme", t);
    setThemeState(t);
  }, []);
  const setSidebar = useCallback((s: SidebarStyle) => {
    localStorage.setItem("dg-sidebar", s);
    setSidebarState(s);
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, sidebar, setTheme, setSidebar }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme outside ThemeProvider");
  return c;
}
