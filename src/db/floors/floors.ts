import { SLOT_TYPES } from "@/db/slot-types/slot-types";
import data from "./floors.json";

export const SLOT_STATUSES = ["free", "occupied", "disabled", "unknown"] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const OBJECT_KINDS = ["lane", "arrow", "pillar", "gate-in", "gate-out", "elevator", "stairs", "door"] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** All lengths are metres from the floor's top-left corner (16 px = 1 m in Figma). */
export type Slot = {
  id: string;
  /** A slot-type id from slot-types.json */
  type: string;
  x: number;
  y: number;
  width: number;
  length: number;
  rotation: number;
  status: SlotStatus;
  note?: string;
};

export type LayoutObject = {
  id: string;
  kind: ObjectKind;
  x: number;
  y: number;
  width: number;
  length: number;
  /** Degrees. Arrows point right at 0. */
  rotation?: number;
};

export type Floor = {
  id: string;
  name: string;
  order: number;
  width: number;
  length: number;
  slots: readonly Slot[];
  objects: readonly LayoutObject[];
};

export type Building = { id: string; name: string; floors: readonly Floor[] };

const rec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isText = (v: unknown): v is string => typeof v === "string" && v !== "";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const unique = (ids: string[]) => new Set(ids).size === ids.length;

function isRect(v: Record<string, unknown>): boolean {
  return isNum(v.x) && isNum(v.y) && isNum(v.width) && isNum(v.length);
}

function isSlot(v: unknown): v is Slot {
  return (
    rec(v) &&
    isText(v.id) &&
    SLOT_TYPES.some((t) => t.id === v.type) &&
    isRect(v) &&
    isNum(v.rotation) &&
    SLOT_STATUSES.includes(v.status as SlotStatus) &&
    (v.note === undefined || typeof v.note === "string")
  );
}

function isObject(v: unknown): v is LayoutObject {
  return (
    rec(v) &&
    isText(v.id) &&
    OBJECT_KINDS.includes(v.kind as ObjectKind) &&
    isRect(v) &&
    (v.rotation === undefined || isNum(v.rotation))
  );
}

function isFloor(v: unknown): v is Floor {
  return (
    rec(v) &&
    isText(v.id) &&
    isText(v.name) &&
    isNum(v.order) &&
    isNum(v.width) &&
    isNum(v.length) &&
    Array.isArray(v.slots) &&
    v.slots.every(isSlot) &&
    unique(v.slots.map((s: Slot) => s.id)) &&
    Array.isArray(v.objects) &&
    v.objects.every(isObject) &&
    unique(v.objects.map((o: LayoutObject) => o.id))
  );
}

function isBuilding(v: unknown): v is Building {
  return (
    rec(v) &&
    isText(v.id) &&
    isText(v.name) &&
    Array.isArray(v.floors) &&
    v.floors.every(isFloor) &&
    unique(v.floors.map((f: Floor) => f.id))
  );
}

export function isBuildingList(value: unknown): value is readonly Building[] {
  return Array.isArray(value) && value.every(isBuilding) && unique(value.map((b: Building) => b.id));
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Validates the seed and returns it deep-frozen. Throws naming the file when it is invalid. */
export function loadFloors(input: unknown): readonly Building[] {
  if (!isBuildingList(input)) throw new Error("floors.json is invalid");
  return deepFreeze(structuredClone(input));
}

const FLOORS: readonly Building[] = loadFloors(data);

export function getFloors(): readonly Building[] {
  return FLOORS;
}

/** Slots per slot-type id; types with no slot on the floor are absent. */
export function countSlotsByType(floor: Floor): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of floor.slots) out[s.type] = (out[s.type] ?? 0) + 1;
  return out;
}

export function countSlotsByStatus(floor: Floor): Record<SlotStatus, number> {
  const out: Record<SlotStatus, number> = { free: 0, occupied: 0, disabled: 0, unknown: 0 };
  for (const s of floor.slots) out[s.status] += 1;
  return out;
}
