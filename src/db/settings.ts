import { useSyncExternalStore } from "react";

import data from "./settings.json";
import { createStore } from "./store";

export type Settings = { branchName: string };

export function isSettings(value: unknown): value is Settings {
  if (typeof value !== "object" || value === null) return false;
  const { branchName } = value as Record<string, unknown>;
  return typeof branchName === "string" && branchName !== "";
}

const SEED: Settings = Object.freeze({ branchName: data.branchName });

const store = createStore<Settings>({
  domain: "settings",
  seed: SEED,
  validate: isSettings,
});

// Server-safe seed read. Client components should call useSettings() instead.
export function getSettings(): Settings {
  return { branchName: SEED.branchName };
}

export function useSettings(): Settings {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export function setSettings(next: Settings): void {
  store.set(next);
}
