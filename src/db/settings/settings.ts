import { useSyncExternalStore } from "react";

import data from "./settings.json";
import { createStore } from "../store";

/** Figma 10 (branch) and 10.3 (fee and payment). */
export type Settings = {
  branchName: string;
  branchLogo: string | null;
  /** Fallback baht per started hour. Greater than 0, at most 2 decimals. */
  pricePerHour: number;
  /** Optional per-slot-type hourly rates; missing entries use pricePerHour. */
  pricePerHourBySlotType: Readonly<Record<string, number>>;
  /** Initial hours free per parking session. Zero preserves the existing rate behavior. */
  freeParkingHours: number;
  /** Minutes a car may take to leave after paying. */
  exitGraceMinutes: number;
  /** Charge again, from the last payment, when a car leaves after the grace period. */
  recalcOvertime: boolean;
};

type StoredSettings = Omit<
  Settings,
  "branchLogo" | "freeParkingHours" | "pricePerHourBySlotType"
> & {
  branchLogo?: string | null;
  freeParkingHours?: number;
  pricePerHourBySlotType?: Readonly<Record<string, number>>;
};

const hasTwoDecimalsAtMost = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-9;
const isHourlyRate = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0 &&
  hasTwoDecimalsAtMost(value);

export function isSettings(value: unknown): value is StoredSettings {
  if (typeof value !== "object" || value === null) return false;
  const {
    branchName,
    branchLogo,
    pricePerHour,
    pricePerHourBySlotType,
    freeParkingHours,
    exitGraceMinutes,
    recalcOvertime,
  } = value as Record<string, unknown>;
  return (
    typeof branchName === "string" &&
    branchName !== "" &&
    (branchLogo === undefined ||
      branchLogo === null ||
      (typeof branchLogo === "string" &&
        /^data:image\/(?:png|svg\+xml);base64,/.test(branchLogo))) &&
    isHourlyRate(pricePerHour) &&
    (pricePerHourBySlotType === undefined ||
      (typeof pricePerHourBySlotType === "object" &&
        pricePerHourBySlotType !== null &&
        !Array.isArray(pricePerHourBySlotType) &&
        Object.entries(pricePerHourBySlotType).every(
          ([id, rate]) => id !== "" && isHourlyRate(rate),
        ))) &&
    (freeParkingHours === undefined ||
      (Number.isSafeInteger(freeParkingHours) && (freeParkingHours as number) >= 0)) &&
    Number.isInteger(exitGraceMinutes) &&
    (exitGraceMinutes as number) > 0 &&
    typeof recalcOvertime === "boolean"
  );
}

/** Checks the JSON seed and throws, naming the file, when it is invalid. */
export function loadSettings(input: unknown): Settings {
  if (!isSettings(input)) throw new Error("settings.json is invalid");
  return normalizeSettings(input);
}

function normalizeSettings(input: StoredSettings): Settings {
  return Object.freeze({
    branchName: input.branchName,
    branchLogo: input.branchLogo ?? null,
    pricePerHour: input.pricePerHour,
    pricePerHourBySlotType: Object.freeze({
      ...input.pricePerHourBySlotType,
    }),
    freeParkingHours: input.freeParkingHours ?? 0,
    exitGraceMinutes: input.exitGraceMinutes,
    recalcOvertime: input.recalcOvertime,
  });
}

const SEED: Settings = loadSettings(data);

const store = createStore<StoredSettings>({
  domain: "settings",
  seed: SEED,
  validate: isSettings,
});

// Server-safe seed read. Client components should call useSettings() instead.
export function getSettings(): Settings {
  return { ...SEED };
}

export function useSettings(): Settings {
  const stored = useSyncExternalStore(
    store.subscribe,
    store.get,
    store.getServerSnapshot,
  );
  return normalizeSettings(stored);
}

export function setSettings(next: Settings): void {
  store.set(next);
}

export function getPricePerHourForSlotType(
  settings: Settings,
  slotTypeId: string | null,
): number {
  return (
    (slotTypeId ? settings.pricePerHourBySlotType[slotTypeId] : undefined) ??
    settings.pricePerHour
  );
}

export function calculateParkingCharge(
  durationMinutes: number,
  pricePerHour: number,
  freeParkingHours: number,
): { billableMinutes: number; billedHours: number; amount: number } {
  const safeDuration = Number.isFinite(durationMinutes)
    ? Math.max(0, Math.floor(durationMinutes))
    : 0;
  const billableMinutes = Math.max(0, safeDuration - freeParkingHours * 60);
  const billedHours = Math.ceil(billableMinutes / 60);
  return {
    billableMinutes,
    billedHours,
    amount: billedHours * pricePerHour,
  };
}
