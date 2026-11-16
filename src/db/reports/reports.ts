import { getFloors } from "@/db/floors/floors";
import activityData from "./activity.json";
import dashboardData from "./dashboard.json";
import financialData from "./financial.json";
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

export type HeatMetric = "count" | "hours" | "rate";
export type HeatQuery = {
  /** Default "count". "hours" and "rate" (whole percent) exist for 30 days only. */
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

// ---------------------------------------------------------------------------
// Activity Log (Figma 14, 14.9): the default 7-day range only.
// ---------------------------------------------------------------------------

export const ACTIVITY_VEHICLE_TYPES = ["sedan", "suv", "pickup", "hatchback", "van", "ev"] as const;
export type ActivityVehicleType = (typeof ACTIVITY_VEHICLE_TYPES)[number];
export const ACTIVITY_DAYS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."] as const;

type TypeCounts = Readonly<Record<ActivityVehicleType, number>>;

export type ActivityData = {
  period: { from: string; to: string; label: string };
  kpis: {
    entries: number;
    entriesPerDay: number;
    exits: number;
    parkedNow: number;
    /** Minutes. */
    avgStayMin: number;
    /** "จาก 1,367 คันที่ออกแล้ว" */
    avgStayBasis: number;
    /** "1,395 รายการ" */
    rows: number;
  };
  /** The "สรุปตามประเภทรถ" table. Share is a percent; stay is in minutes. */
  types: readonly { id: ActivityVehicleType; label: string; vehicles: number; sharePct: number; avgStayMin: number }[];
  total: { vehicles: number; sharePct: number; avgStayMin: number };
  /** Average entries per hour: `values[day][hour]`, days จ.–อา., hours 00–23. */
  heatGrid: { days: readonly string[]; values: readonly (readonly number[])[] };
  /** Stacked bars "ตามชั่วโมง": values are the node names of the Figma bars (exact). */
  hourlyByType: readonly ({ hour: number } & TypeCounts)[];
  /** Stacked bars "ตามวัน" (14.9). */
  dailyByType: readonly ({ date: string } & TypeCounts)[];
};

const isTypeCounts = (v: Record<string, unknown>) => ACTIVITY_VEHICLE_TYPES.every((t) => isInt(v[t]));

function isActivityData(v: unknown): v is ActivityData {
  if (!rec(v)) return false;
  const { period, kpis, types, total, heatGrid, hourlyByType, dailyByType } = v;
  return (
    rec(period) &&
    isText(period.from) &&
    isText(period.to) &&
    isText(period.label) &&
    rec(kpis) &&
    ["entries", "entriesPerDay", "exits", "parkedNow", "avgStayMin", "avgStayBasis", "rows"].every((k) => isInt(kpis[k])) &&
    Array.isArray(types) &&
    types.length === ACTIVITY_VEHICLE_TYPES.length &&
    types.every(
      (t, i) =>
        rec(t) &&
        t.id === ACTIVITY_VEHICLE_TYPES[i] &&
        isText(t.label) &&
        isInt(t.vehicles) &&
        isNum(t.sharePct) &&
        isInt(t.avgStayMin),
    ) &&
    rec(total) &&
    isInt(total.vehicles) &&
    isNum(total.sharePct) &&
    isInt(total.avgStayMin) &&
    rec(heatGrid) &&
    Array.isArray(heatGrid.days) &&
    heatGrid.days.length === ACTIVITY_DAYS.length &&
    heatGrid.days.every((d, i) => d === ACTIVITY_DAYS[i]) &&
    Array.isArray(heatGrid.values) &&
    heatGrid.values.length === ACTIVITY_DAYS.length &&
    heatGrid.values.every((row) => Array.isArray(row) && row.length === 24 && row.every(isInt)) &&
    Array.isArray(hourlyByType) &&
    hourlyByType.length === 24 &&
    hourlyByType.every((h, i) => rec(h) && h.hour === i && isTypeCounts(h)) &&
    Array.isArray(dailyByType) &&
    dailyByType.length === 7 &&
    dailyByType.every((d) => rec(d) && isText(d.date) && isTypeCounts(d))
  );
}

export function loadActivity(input: unknown): ActivityData {
  return load("activity.json", input, isActivityData);
}

const ACTIVITY = loadActivity(activityData);

/** Defaults to the stored 11–17 Oct range; any other range returns `null`. */
export function getActivity(from: string = ACTIVITY.period.from, to: string = ACTIVITY.period.to): ActivityData | null {
  return from === ACTIVITY.period.from && to === ACTIVITY.period.to ? ACTIVITY : null;
}

/** The busiest cell of the heat grid ("หนาแน่นที่สุด พ. 08:00–08:59 เฉลี่ย 31.0 คัน/ชม."). First one wins a tie. */
export function getActivityPeak(): { day: string; hour: number; value: number } {
  let best = { day: ACTIVITY.heatGrid.days[0], hour: 0, value: -1 };
  ACTIVITY.heatGrid.values.forEach((row, d) =>
    row.forEach((value, hour) => {
      if (value > best.value) best = { day: ACTIVITY.heatGrid.days[d], hour, value };
    }),
  );
  return best;
}

// ---------------------------------------------------------------------------
// Financial Overview (Figma 13 – 13.12): one entry per period Figma has a frame for.
// ---------------------------------------------------------------------------

export type FinancialPeriod =
  | { kind: "day"; date: string }
  | { kind: "month"; month: string }
  | { kind: "year"; year: number };

export const FINANCIAL_PERIODS: readonly FinancialPeriod[] = [
  { kind: "day", date: "2026-11-16" },
  { kind: "day", date: "2026-11-15" },
  { kind: "day", date: "2026-11-14" },
  { kind: "month", month: "2026-11" },
  { kind: "month", month: "2026-10" },
  { kind: "year", year: 2026 },
  { kind: "year", year: 2025 },
];

/** `text` is Figma's wording; `pct` is absent when Figma has no previous period to compare with. */
export type FinancialDelta = { pct?: number; text: string };

export const FINANCIAL_SERIES_UNITS = ["hour", "day", "month"] as const;
export type FinancialSeriesUnit = (typeof FINANCIAL_SERIES_UNITS)[number];

/** Keys are slot-type ids from slot-types.json. Values are baht. */
export const FINANCIAL_SLOT_TYPES = ["car", "ev", "accessible", "vip"] as const;
export type FinancialSlotType = (typeof FINANCIAL_SLOT_TYPES)[number];

export const FINANCIAL_DURATIONS = ["le1h", "1to3h", "3to6h", "gt6h"] as const;
export type FinancialDurationId = (typeof FINANCIAL_DURATIONS)[number];

export type FinancialData = {
  period: FinancialPeriod;
  /** The period label printed in the header, e.g. "จ. 16 พ.ย. 2026". */
  label: string;
  kpis: {
    /** Baht. */
    revenue: number;
    payments: number;
    /** Baht per payment. */
    avgFee: number;
    /** The "ช่วงรายรับสูงสุด" card: the slice label as printed, its baht and its share of revenue in percent. */
    peak: { label: string; revenue: number; sharePct: number };
    comparison: { revenue: FinancialDelta; payments: FinancialDelta; avgFee: FinancialDelta };
  };
  /**
   * The revenue chart: hours 0–23 for a day (up to the last full hour), days 1–31 for a month,
   * months 1–12 for a year. Only the slices Figma shows are stored (2025 has Oct–Dec only).
   */
  series: { unit: FinancialSeriesUnit; points: readonly { x: number; revenue: number }[] };
  bySlotType: Readonly<Record<FinancialSlotType, number>>;
  byDuration: readonly { id: FinancialDurationId; label: string; revenue: number; count: number }[];
};

type FinancialFile = { periods: readonly FinancialData[] };

const isDelta = (v: unknown): v is FinancialDelta =>
  rec(v) && isText(v.text) && (v.pct === undefined ? Object.keys(v).length === 1 : typeof v.pct === "number" && Number.isFinite(v.pct) && Object.keys(v).length === 2);

function isFinancialPeriod(v: unknown): v is FinancialPeriod {
  if (!rec(v) || Object.keys(v).length !== 2) return false;
  if (v.kind === "day") return isText(v.date);
  if (v.kind === "month") return isText(v.month);
  return v.kind === "year" && isInt(v.year);
}

const samePeriod = (a: FinancialPeriod, b: FinancialPeriod) => JSON.stringify(a) === JSON.stringify(b);

function isFinancialData(v: unknown): v is FinancialData {
  if (!rec(v) || !isFinancialPeriod(v.period) || !isText(v.label)) return false;
  const { kpis, series, bySlotType, byDuration } = v;
  if (!rec(kpis) || !isInt(kpis.revenue) || !isInt(kpis.payments) || !isInt(kpis.avgFee)) return false;
  const { peak, comparison } = kpis;
  if (!rec(peak) || !isText(peak.label) || !isInt(peak.revenue) || !isNum(peak.sharePct)) return false;
  if (!rec(comparison) || !sameKeys(comparison, ["revenue", "payments", "avgFee"]) || !Object.values(comparison).every(isDelta)) return false;
  if (!rec(series) || !(FINANCIAL_SERIES_UNITS as readonly unknown[]).includes(series.unit)) return false;
  if (!Array.isArray(series.points) || !series.points.every((p) => rec(p) && isInt(p.x) && isInt(p.revenue) && Object.keys(p).length === 2)) return false;
  if (!rec(bySlotType) || !sameKeys(bySlotType, FINANCIAL_SLOT_TYPES) || !Object.values(bySlotType).every(isInt)) return false;
  return (
    Array.isArray(byDuration) &&
    byDuration.length === FINANCIAL_DURATIONS.length &&
    byDuration.every((d, i) => rec(d) && d.id === FINANCIAL_DURATIONS[i] && isText(d.label) && isInt(d.revenue) && isInt(d.count))
  );
}

function isFinancialFile(v: unknown): v is FinancialFile {
  if (!rec(v) || !Array.isArray(v.periods) || v.periods.length !== FINANCIAL_PERIODS.length) return false;
  const periods: unknown[] = v.periods;
  return FINANCIAL_PERIODS.every((p, i) => {
    const d = periods[i];
    return isFinancialData(d) && samePeriod(d.period, p);
  });
}

export function loadFinancial(input: unknown): FinancialFile {
  return load("financial.json", input, isFinancialFile);
}

const FINANCIAL = loadFinancial(financialData);

/** `null` for any period Figma has no frame for. */
export function getFinancial(period: FinancialPeriod): FinancialData | null {
  return FINANCIAL.periods.find((d) => samePeriod(d.period, period)) ?? null;
}

// ---------------------------------------------------------------------------
// Dashboard (Figma 12, 12.23 – 12.25).
// Not stored, because they are computed: slot counts and alerts (floors) and the
// revenue-per-day bars (getDailyRevenue, from financial.json).
// ---------------------------------------------------------------------------

export const DASHBOARD_RANGES = ["today", "yesterday", "7d", "30d"] as const;
export type DashboardRangeId = (typeof DASHBOARD_RANGES)[number];

type DashboardKpi = { value: number; comparison: Required<FinancialDelta> };

export type DashboardRange = {
  kpis: {
    /** Baht. */
    revenue: DashboardKpi;
    entries: DashboardKpi;
    /** Minutes. */
    avgStayMin: DashboardKpi;
  };
  /**
   * The "รถเข้า–ออก" chart, vehicles per hour (today: 00–22; yesterday: 00–23) or per day (7d, 30d).
   * Read from the line geometry and rounded to whole vehicles, hence `approx`; the sums match the KPIs.
   */
  inOut: {
    title: string;
    subtitle: string;
    unit: "hour" | "day";
    approx: true;
    entries: readonly number[];
    exits: readonly number[];
    /** The dashed line: yesterday for today, the 15th for yesterday, the previous 7 / 30 days. */
    compare: { label: string; values: readonly number[] };
  };
};

/** Pairs are free / total exactly as the card prints them. */
export type DashboardFreeByType = { id: FinancialSlotType; label: string; free: number; total: number };

type VehicleDelta = { value: number; pct: number };
export type VehicleComparison = {
  period: { from: string; to: string; label: string };
  types: readonly {
    id: ActivityVehicleType;
    label: string;
    entries: number;
    sharePct: number;
    avgStayMin: number;
    revenue: number;
    perVehicle: number;
  }[];
  /** "ส่วนต่าง" row, Sedan minus SUV. `sharePts` is in percentage points. */
  diff: {
    entries: VehicleDelta;
    sharePts: number;
    avgStayMin: VehicleDelta;
    revenue: VehicleDelta;
    perVehicle: VehicleDelta;
  };
  /** Entries per day from the line dots (rounded, hence `approx`). */
  daily: { approx: true; dates: readonly string[]; sedan: readonly number[]; suv: readonly number[] };
};

type DashboardFile = {
  ranges: Readonly<Record<DashboardRangeId, DashboardRange>>;
  freeByType: readonly DashboardFreeByType[];
  vehicleComparison: VehicleComparison;
  recentActivity: { count: number; label: string };
};

const isDeltaFull = (v: unknown): v is Required<FinancialDelta> =>
  isDelta(v) && v.pct !== undefined;
const isDashboardKpi = (v: unknown): v is DashboardKpi => rec(v) && isInt(v.value) && isDeltaFull(v.comparison) && Object.keys(v).length === 2;
const isIntArray = (v: unknown, length?: number): v is number[] =>
  Array.isArray(v) && (length === undefined || v.length === length) && v.every(isInt);
const isVehicleDelta = (v: unknown): v is VehicleDelta => rec(v) && isInt(v.value) && isNum(v.pct);

function isDashboardRange(v: unknown): v is DashboardRange {
  if (!rec(v) || !rec(v.kpis) || !sameKeys(v.kpis, ["revenue", "entries", "avgStayMin"])) return false;
  if (!Object.values(v.kpis).every(isDashboardKpi)) return false;
  const c = v.inOut;
  if (!rec(c) || !isText(c.title) || !isText(c.subtitle) || (c.unit !== "hour" && c.unit !== "day") || c.approx !== true) return false;
  if (!isIntArray(c.entries) || !isIntArray(c.exits, c.entries.length)) return false;
  return rec(c.compare) && isText(c.compare.label) && isIntArray(c.compare.values) && c.compare.values.length > 0;
}

function isVehicleComparison(v: unknown): v is VehicleComparison {
  if (!rec(v) || !rec(v.period) || !isText(v.period.from) || !isText(v.period.to) || !isText(v.period.label)) return false;
  if (!Array.isArray(v.types) || v.types.length !== 2) return false;
  const typesOk = v.types.every(
    (t, i) =>
      rec(t) &&
      t.id === (["sedan", "suv"] as const)[i] &&
      isText(t.label) &&
      isInt(t.entries) &&
      isNum(t.sharePct) &&
      isInt(t.avgStayMin) &&
      isInt(t.revenue) &&
      isInt(t.perVehicle),
  );
  const { diff, daily } = v;
  if (!typesOk || !rec(diff) || !isVehicleDelta(diff.entries) || !isNum(diff.sharePts) || !isVehicleDelta(diff.avgStayMin)) return false;
  if (!isVehicleDelta(diff.revenue) || !isVehicleDelta(diff.perVehicle)) return false;
  return (
    rec(daily) &&
    daily.approx === true &&
    Array.isArray(daily.dates) &&
    daily.dates.length > 0 &&
    daily.dates.every(isText) &&
    isIntArray(daily.sedan, daily.dates.length) &&
    isIntArray(daily.suv, daily.dates.length)
  );
}

function isDashboardFile(v: unknown): v is DashboardFile {
  if (!rec(v) || !rec(v.ranges) || !sameKeys(v.ranges, DASHBOARD_RANGES)) return false;
  const ranges = v.ranges;
  if (!DASHBOARD_RANGES.every((r) => isDashboardRange(ranges[r]))) return false;
  const free = v.freeByType;
  const freeOk =
    Array.isArray(free) &&
    free.length === FINANCIAL_SLOT_TYPES.length &&
    free.every((t, i) => rec(t) && t.id === FINANCIAL_SLOT_TYPES[i] && isText(t.label) && isInt(t.free) && isInt(t.total) && t.free <= t.total);
  return freeOk && isVehicleComparison(v.vehicleComparison) && rec(v.recentActivity) && isInt(v.recentActivity.count) && isText(v.recentActivity.label);
}

export function loadDashboard(input: unknown): DashboardFile {
  return load("dashboard.json", input, isDashboardFile);
}

const DASHBOARD = loadDashboard(dashboardData);

/** `null` for any range Figma has no frame for (the custom range has none). */
export function getDashboard(range: string): DashboardRange | null {
  return (DASHBOARD_RANGES as readonly string[]).includes(range) ? DASHBOARD.ranges[range as DashboardRangeId] : null;
}

/** "ว่างแยกตามประเภท" as printed (24/50, 2/6, 1/2, 1/3); not reconciled with the floor plan. */
export function getFreeByType(): readonly DashboardFreeByType[] {
  return DASHBOARD.freeByType;
}

export function getVehicleComparison(): VehicleComparison {
  return DASHBOARD.vehicleComparison;
}

/** The "190 รายการ" count of the recent-activity card (the rows themselves are sessions). */
export function getRecentActivityCount(): number {
  return DASHBOARD.recentActivity.count;
}

/**
 * Revenue per day for the `days` days ending on `endDate` (YYYY-MM-DD), read from the daily series of
 * financial.json (the Dashboard "รายรับ 14 วันล่าสุด" bars). `null` when a day is not in the stored months.
 */
export function getDailyRevenue(endDate: string, days: number): { date: string; revenue: number }[] | null {
  const end = new Date(`${endDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(end.getTime()) || !Number.isInteger(days) || days < 1) return null;
  const out: { date: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    const month = getFinancial({ kind: "month", month: date.slice(0, 7) });
    const revenue = month?.series.points.find((p) => p.x === Number(date.slice(8)))?.revenue;
    if (revenue === undefined) return null;
    out.push({ date, revenue });
  }
  return out;
}
