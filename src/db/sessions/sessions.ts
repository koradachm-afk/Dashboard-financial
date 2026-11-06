import { getFloors } from "@/db/floors/floors";
import data from "./sessions.json";

export const VEHICLE_TYPES = ["Sedan", "SUV", "Pickup", "Hatchback", "Van / MPV", "รถไฟฟ้า"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export type Session = {
  id: string;
  plate: string;
  /** Written in full, e.g. "กรุงเทพมหานคร" */
  province: string;
  /** null = the camera did not classify the vehicle (Figma shows no type) */
  vehicleType: VehicleType | null;
  /** A floor id from floors.json */
  floor: string;
  /** null = slot not known; otherwise a slot id on `floor` */
  slot: string | null;
  /** "YYYY-MM-DD HH:MM" */
  entryAt: string;
  /** Same format, or null while the car is still parked */
  exitAt: string | null;
  entryGate: string;
  entryImage: string | null;
  /** Baht, or null while unpaid / parked */
  fee: number | null;
};

const rec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isText = (v: unknown): v is string => typeof v === "string" && v !== "";
const isTime = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v);
const isFee = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

function slotExists(floor: string, slot: string): boolean {
  return getFloors().some((b) => b.floors.some((f) => f.id === floor && f.slots.some((s) => s.id === slot)));
}

function isSession(v: unknown): v is Session {
  return (
    rec(v) &&
    isText(v.id) &&
    isText(v.plate) &&
    isText(v.province) &&
    (v.vehicleType === null || VEHICLE_TYPES.includes(v.vehicleType as VehicleType)) &&
    isText(v.floor) &&
    (v.slot === null || (isText(v.slot) && slotExists(v.floor, v.slot))) &&
    isTime(v.entryAt) &&
    (v.exitAt === null || (isTime(v.exitAt) && v.exitAt >= v.entryAt)) &&
    isText(v.entryGate) &&
    (v.entryImage === null || isText(v.entryImage)) &&
    (v.fee === null || isFee(v.fee))
  );
}

export function isSessionList(value: unknown): value is readonly Session[] {
  return (
    Array.isArray(value) &&
    value.every(isSession) &&
    new Set(value.map((s: Session) => s.id)).size === value.length
  );
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Validates the seed and returns it deep-frozen. Throws naming the file when it is invalid. */
export function loadSessions(input: unknown): readonly Session[] {
  if (!isSessionList(input)) throw new Error("sessions.json is invalid");
  return deepFreeze(structuredClone(input));
}

const SESSIONS: readonly Session[] = loadSessions(data);

export function getSessions(): readonly Session[] {
  return SESSIONS;
}

export function isParked(session: Session): boolean {
  return session.exitAt === null;
}
