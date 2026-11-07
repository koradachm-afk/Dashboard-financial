import { getFloors } from "@/db/floors/floors";

export const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Pickup",
  "Hatchback",
  "Van / MPV",
  "รถไฟฟ้า",
] as const;
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

const rec = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isText = (value: unknown): value is string =>
  typeof value === "string" && value !== "";
const isTime = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value);
const isFee = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

function slotExists(floor: string, slot: string): boolean {
  return getFloors().some((building) =>
    building.floors.some(
      (floorData) =>
        floorData.id === floor &&
        floorData.slots.some((slotData) => slotData.id === slot),
    ),
  );
}

function isSession(value: unknown): value is Session {
  return (
    rec(value) &&
    isText(value.id) &&
    isText(value.plate) &&
    isText(value.province) &&
    (value.vehicleType === null ||
      VEHICLE_TYPES.includes(value.vehicleType as VehicleType)) &&
    isText(value.floor) &&
    (value.slot === null ||
      (isText(value.slot) && slotExists(value.floor, value.slot))) &&
    isTime(value.entryAt) &&
    (value.exitAt === null ||
      (isTime(value.exitAt) && value.exitAt >= value.entryAt)) &&
    isText(value.entryGate) &&
    (value.entryImage === null || isText(value.entryImage)) &&
    (value.fee === null || isFee(value.fee))
  );
}

export function isSessionList(value: unknown): value is readonly Session[] {
  return (
    Array.isArray(value) &&
    value.every(isSession) &&
    new Set(value.map((session: Session) => session.id)).size === value.length
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
export function loadSessions(
  input: unknown,
  source = "sessions.json",
): readonly Session[] {
  if (!isSessionList(input)) throw new Error(`${source} is invalid`);
  return deepFreeze(structuredClone(input));
}
