import data from "./slot-types.json";

export type SlotType = {
  id: string;
  name: string;
  /** lucide icon name */
  icon: string;
  /** DESIGN-STYLE colour token name (never hex) */
  color: string;
  /** Default size in metres. */
  width: number;
  length: number;
  isDefault: boolean;
};

const isText = (v: unknown): v is string => typeof v === "string" && v !== "";
const isSize = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

function isSlotType(value: unknown): value is SlotType {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    isText(t.id) &&
    isText(t.name) &&
    isText(t.icon) &&
    isText(t.color) &&
    isSize(t.width) &&
    isSize(t.length) &&
    typeof t.isDefault === "boolean"
  );
}

export function isSlotTypeList(value: unknown): value is readonly SlotType[] {
  return (
    Array.isArray(value) &&
    value.every(isSlotType) &&
    new Set(value.map((t) => t.id)).size === value.length
  );
}

/** Validates the seed and returns it deep-frozen. Throws naming the file when it is invalid. */
export function loadSlotTypes(input: unknown): readonly SlotType[] {
  if (!isSlotTypeList(input)) throw new Error("slot-types.json is invalid");
  return Object.freeze(input.map((t) => Object.freeze({ ...t })));
}

export const SLOT_TYPES: readonly SlotType[] = loadSlotTypes(data);

export function getSlotTypes(): readonly SlotType[] {
  return SLOT_TYPES;
}
