"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export const THEMES = ["gris", "claro", "azul"] as const;
export type Theme = (typeof THEMES)[number];

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "argo-pos-theme";
const DEFAULT_THEME: Theme = "gris";
const listeners = new Set<() => void>();

function isTheme(value: string | null): value is Theme {
  return value === "gris" || value === "claro" || value === "azul";
}

function migrateLegacyTheme(value: string | null): Theme | null {
  if (value === "dark") return "gris";
  if (value === "light") return "claro";
  return null;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.remove("dark");
  root.style.colorScheme = "light";
}

function readTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  const migrated = migrateLegacyTheme(stored);
  if (migrated) return migrated;
  return DEFAULT_THEME;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return readTheme();
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    emit();
  }, []);

  const cycleTheme = useCallback(() => {
    const index = THEMES.indexOf(theme);
    const next = THEMES[(index + 1) % THEMES.length] ?? DEFAULT_THEME;
    setTheme(next);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
