import { useSyncExternalStore } from "react";

import data from "./settings.json";
import { createStore } from "../store";

/** Figma 10 (branch) and 10.3 (fee and payment). */
export type Settings = {
  branchName: string;
  /** Baht per started hour, for every slot type. Greater than 0, at most 2 decimals. */
  pricePerHour: number;
  /** Minutes a car may take to leave after paying. */
  exitGraceMinutes: number;
  /** Charge again, from the last payment, when a car leaves after the grace period. */
  recalcOvertime: boolean;
};

const hasTwoDecimalsAtMost = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-9;

export function isSettings(value: unknown): value is Settings {
  if (typeof value !== "object" || value === null) return false;
  const { branchName, pricePerHour, exitGraceMinutes, recalcOvertime } = value as Record<string, unknown>;
  return (
    typeof branchName === "string" &&
    branchName !== "" &&
    typeof pricePerHour === "number" &&
    Number.isFinite(pricePerHour) &&
    pricePerHour > 0 &&
    hasTwoDecimalsAtMost(pricePerHour) &&
    Number.isInteger(exitGraceMinutes) &&
    (exitGraceMinutes as number) > 0 &&
    typeof recalcOvertime === "boolean"
  );
}

/** Checks the JSON seed and throws, naming the file, when it is invalid. */
export function loadSettings(input: unknown): Settings {
  if (!isSettings(input)) throw new Error("settings.json is invalid");
  const { branchName, pricePerHour, exitGraceMinutes, recalcOvertime } = input;
  return Object.freeze({ branchName, pricePerHour, exitGraceMinutes, recalcOvertime });
}

const SEED: Settings = loadSettings(data);

const store = createStore<Settings>({
  domain: "settings",
  seed: SEED,
  validate: isSettings,
});

// Server-safe seed read. Client components should call useSettings() instead.
export function getSettings(): Settings {
  return { ...SEED };
}

export function useSettings(): Settings {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export function setSettings(next: Settings): void {
  store.set(next);
}
