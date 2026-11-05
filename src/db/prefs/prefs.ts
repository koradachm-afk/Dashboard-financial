import { useSyncExternalStore } from "react";

import { createStore } from "../store";

export type Theme = "light" | "dark";

/** Per-account preferences keyed by user id. */
export type Prefs = Readonly<Record<string, { theme: Theme }>>;

const THEMES: readonly string[] = ["light", "dark"];

export function isPrefs(value: unknown): value is Prefs {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      THEMES.includes((entry as Record<string, unknown>).theme as string),
  );
}

const store = createStore<Prefs>({
  domain: "prefs",
  seed: {},
  validate: isPrefs,
});

export function getThemeFor(userId: string, fallback: Theme): Theme {
  return store.get()[userId]?.theme ?? fallback;
}

export function setThemeFor(userId: string, theme: Theme): void {
  store.set({ ...store.get(), [userId]: { theme } });
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
