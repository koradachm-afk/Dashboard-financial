import data from "./banks.json";

export type Bank = {
  /** Short bank code, e.g. "KBANK" */
  id: string;
  /** Thai display name */
  name: string;
};

const isText = (v: unknown): v is string => typeof v === "string" && v !== "";

function isBank(value: unknown): value is Bank {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return isText(b.id) && isText(b.name);
}

export function isBankList(value: unknown): value is readonly Bank[] {
  return (
    Array.isArray(value) &&
    value.every(isBank) &&
    new Set(value.map((b: Bank) => b.id)).size === value.length
  );
}

/** Validates the seed and returns it deep-frozen. Throws naming the file when it is invalid. */
export function loadBanks(input: unknown): readonly Bank[] {
  if (!isBankList(input)) throw new Error("banks.json is invalid");
  return Object.freeze(input.map((b) => Object.freeze({ ...b })));
}

export const BANKS: readonly Bank[] = loadBanks(data);

export function getBanks(): readonly Bank[] {
  return BANKS;
}
