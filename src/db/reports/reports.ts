import { getFloors } from "@/db/floors/floors";
import heatMapData from "./heat-map.json";

// Pre-aggregated numbers for the report pages, exactly as Figma shows them.
// One JSON file = one page = one types/validator/loader block below.

const rec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v !== "";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);
const sameKeys = (obj: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(obj).length === keys.length && keys.every((k) => k in obj);

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Validates a seed and returns a deep-frozen copy. Throws naming the file when it is invalid. */
function load<T>(file: string, input: unknown, isValid: (v: unknown) => v is T): T {
  if (!isValid(input)) throw new Error(`${file} is invalid`);
  return deepFreeze(structuredClone(input));
}

// ---------------------------------------------------------------------------
// Heat map (Figma 15 – 15.8): floor B1, one entry per period Figma has a frame for.
// ---------------------------------------------------------------------------

export const HEAT_MAP_PERIODS = ["7d", "30d", "90d"] as const;
export type HeatMapPeriod = (typeof HEAT_MAP_PERIODS)[number];

/** `hours` and `rate` exist for 30 days only. `rate` is the whole percent shown in the 15.3 cell. */
export type HeatSlot = { count: number; hours?: number; rate?: number };
type Range = { min: number; max: number };

/** The "selected slot" card as Figma shows it; the start-hour bars are read from the node names (exact). */
export type HeatPanel = {
  count: number;
  hours: number;
  ratePct: number;
  /** Average stay per visit in minutes, as printed on the card. */
  avgStayMin: number;
  /** Visits that started in each hour 00–23. */
  startHours: readonly number[];
};

export type HeatMapData = {
  header: string;
  total: number;
  legend: { count: Range; hours?: Range; rate?: Range };
  slots: Readonly<Record<string, HeatSlot>>;
  /** One-decimal rates that Figma prints for some slots (hover, panel, lists). 30 days only. */
  rateExact?: Readonly<Record<string, number>>;
  panels: Readonly<Record<string, HeatPanel>>;
};

type HeatMapFile = { periods: Readonly<Record<HeatMapPeriod, HeatMapData>> };

const isRange = (v: unknown): v is Range => rec(v) && isNum(v.min) && isNum(v.max);

function slotIdsOfB1(): string[] {
  const b1 = getFloors()[0]?.floors.find((f) => f.id === "b1");
  return b1 ? b1.slots.map((s) => s.id) : [];
}

function isPanel(v: unknown): v is HeatPanel {
  return (
    rec(v) &&
    isInt(v.count) &&
    isInt(v.hours) &&
    isNum(v.ratePct) &&
    isInt(v.avgStayMin) &&
    Array.isArray(v.startHours) &&
    v.startHours.length === 24 &&
    v.startHours.every(isInt)
  );
}

function isHeatMapData(v: unknown, period: HeatMapPeriod, slotIds: readonly string[]): v is HeatMapData {
  if (!rec(v) || !isText(v.header) || !isInt(v.total)) return false;
  if (!rec(v.legend) || !isRange(v.legend.count)) return false;
  const full = period === "30d"; // only 30 days carries hours and rate
  if (full ? !isRange(v.legend.hours) || !isRange(v.legend.rate) : "hours" in v.legend || "rate" in v.legend) return false;
  if (!rec(v.slots) || !sameKeys(v.slots, slotIds)) return false;
  const slotOk = (s: unknown) =>
    rec(s) &&
    isInt(s.count) &&
    (full
      ? isInt(s.hours) && isNum(s.rate) && Object.keys(s).length === 3
      : Object.keys(s).length === 1);
  if (!Object.values(v.slots).every(slotOk)) return false;
  if (full) {
    if (!rec(v.rateExact) || !Object.entries(v.rateExact).every(([id, r]) => slotIds.includes(id) && isNum(r))) return false;
  } else if ("rateExact" in v) return false;
  return rec(v.panels) && Object.entries(v.panels).every(([id, p]) => slotIds.includes(id) && isPanel(p));
}

function isHeatMapFile(v: unknown): v is HeatMapFile {
  if (!rec(v) || !rec(v.periods) || !sameKeys(v.periods, HEAT_MAP_PERIODS)) return false;
  const periods = v.periods;
  const slotIds = slotIdsOfB1();
  return HEAT_MAP_PERIODS.every((p) => isHeatMapData(periods[p], p, slotIds));
}

export function loadHeatMap(input: unknown): HeatMapFile {
  return load("heat-map.json", input, isHeatMapFile);
}

const HEAT_MAP = loadHeatMap(heatMapData);

/** `null` for any period Figma has no frame for. */
export function getHeatMap(period: string): HeatMapData | null {
  return (HEAT_MAP_PERIODS as readonly string[]).includes(period) ? HEAT_MAP.periods[period as HeatMapPeriod] : null;
}

export type HeatMetric = "count" | "hours";
export type HeatQuery = {
  /** Default "count". "hours" exists for 30 days only. */
  metric?: HeatMetric;
  /** Slot-type id from slot-types.json (the type filter of 15.7), e.g. "ev". */
  type?: string;
};
export type RankedSlot = { id: string; type: string; value: number };

const SLOT_ROWS = ["A", "B", "C", "D"] as const;

/** Slots of B1 that match the query, most used first. Ties keep slot-id order (as Figma lists them). */
function ranked(period: string, { metric = "count", type }: HeatQuery = {}): RankedSlot[] {
  const data = getHeatMap(period);
  const b1 = getFloors()[0]?.floors.find((f) => f.id === "b1");
  if (!data || !b1) return [];
  const out: RankedSlot[] = [];
  for (const s of b1.slots) {
    if (type !== undefined && s.type !== type) continue;
    const value = data.slots[s.id]?.[metric];
    if (value !== undefined) out.push({ id: s.id, type: s.type, value });
  }
  return out.sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : 1));
}

/** The "ใช้บ่อยที่สุด" list (default 6). */
export function mostUsedSlots(period: string, query: HeatQuery & { limit?: number } = {}): RankedSlot[] {
  return ranked(period, query).slice(0, query.limit ?? 6);
}

/** The "ใช้น้อยที่สุด" list (default 5): the tail of the ranking, least used first. */
export function leastUsedSlots(period: string, query: HeatQuery & { limit?: number } = {}): RankedSlot[] {
  return ranked(period, query)
    .slice(-(query.limit ?? 5))
    .reverse();
}

export type RowAverage = { row: string; slots: number; mean: number; average: number };

/** "ค่าเฉลี่ยตามแถว": slot count, exact mean and the mean rounded half up, as printed. */
export function getRowAverages(period: string, query: HeatQuery = {}): RowAverage[] {
  const list = ranked(period, query);
  return SLOT_ROWS.map((row) => {
    const values = list.filter((s) => s.id.startsWith(`${row}-`)).map((s) => s.value);
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { row, slots: values.length, mean, average: Math.round(mean) };
  });
}

/** "อันดับ n / N": the position in the ranked list (ties in slot-id order, as Figma). `null` when the slot is outside the query. */
export function getSlotRank(period: string, slotId: string, query: HeatQuery = {}): { rank: number; of: number } | null {
  const list = ranked(period, query);
  const index = list.findIndex((s) => s.id === slotId);
  return index < 0 ? null : { rank: index + 1, of: list.length };
}

/**
 * Average stay per visit in minutes. 30 days: hours / count. Other periods have no per-slot hours,
 * so only the slots with a card carry the printed value; everything else is null.
 */
export function getAverageStayMinutes(period: string, slotId: string): number | null {
  const data = getHeatMap(period);
  if (!data) return null;
  const slot = data.slots[slotId];
  if (period === "30d" && slot?.hours !== undefined && slot.count > 0) return Math.round((slot.hours * 60) / slot.count);
  return data.panels[slotId]?.avgStayMin ?? null;
}

/**
 * 30-day usage rate in percent. `exact` is true when Figma prints one decimal (hover, cards, lists);
 * otherwise it is the whole percent from the 15.3 cell.
 */
export function getSlotRate(slotId: string): { pct: number; exact: boolean } | null {
  const data = HEAT_MAP.periods["30d"];
  const exact = data.rateExact?.[slotId];
  if (exact !== undefined) return { pct: exact, exact: true };
  const rate = data.slots[slotId]?.rate;
  return rate === undefined ? null : { pct: rate, exact: false };
}
