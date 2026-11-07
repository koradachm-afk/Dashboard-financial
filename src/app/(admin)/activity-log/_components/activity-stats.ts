import {
  ACTIVITY_DAYS,
  ACTIVITY_VEHICLE_TYPES,
  getActivity,
  type ActivityData,
  type ActivityVehicleType,
} from "@/db/reports/reports";
import type { Session, VehicleType } from "@/db/sessions/sessions";

// Everything the Activity Log page shows is derived here, so the view only draws.
// The default criteria (11–17 Oct, the Figma 14 frame) read the pre-aggregated seed in reports/activity.json;
// any other criteria are computed from the sessions seed.

export const PAGE_SIZE = 10;

/** The mock "now" of the seed data (Figma 14 is drawn at 17 Oct 2026, 21:59). Parked cars count their stay up to here. */
export const REFERENCE_NOW = "2026-10-17 21:59";

export type TypeFilter = ActivityVehicleType | "all";

export type Criteria = {
  /** "YYYY-MM-DD", inclusive */
  from: string;
  to: string;
  /** "HH:MM", matched against the entry time */
  fromTime: string;
  toTime: string;
  type: TypeFilter;
  /** Plate search, spaces ignored */
  q: string;
};

const SEED = getActivity();
if (!SEED) throw new Error("activity.json has no default period");
const SEED_DATA: ActivityData = SEED;

export const DEFAULT_CRITERIA: Criteria = {
  from: SEED_DATA.period.from,
  to: SEED_DATA.period.to,
  fromTime: "00:00",
  toTime: "23:59",
  type: "all",
  q: "",
};

export const isDefaultCriteria = (c: Criteria) =>
  c.from === DEFAULT_CRITERIA.from &&
  c.to === DEFAULT_CRITERIA.to &&
  c.fromTime === DEFAULT_CRITERIA.fromTime &&
  c.toTime === DEFAULT_CRITERIA.toTime &&
  c.type === "all" &&
  c.q === "";

// ---------------------------------------------------------------------------
// URL <-> criteria (filters and page live in the URL: ?from=&to=&fromTime=&toTime=&type=&q=&page=)
// ---------------------------------------------------------------------------

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dayMs = 86_400_000;
const isDate = (v: string | undefined): v is string =>
  v !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
const isTime = (v: string | undefined): v is string => v !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export function parseCriteria(params: Params): Criteria {
  const from = first(params.from);
  const to = first(params.to);
  const fromTime = first(params.fromTime);
  const toTime = first(params.toTime);
  const type = first(params.type);
  let c: Criteria = {
    from: isDate(from) ? from : DEFAULT_CRITERIA.from,
    to: isDate(to) ? to : DEFAULT_CRITERIA.to,
    fromTime: isTime(fromTime) ? fromTime : DEFAULT_CRITERIA.fromTime,
    toTime: isTime(toTime) ? toTime : DEFAULT_CRITERIA.toTime,
    type: ACTIVITY_VEHICLE_TYPES.includes(type as ActivityVehicleType) ? (type as ActivityVehicleType) : "all",
    q: (first(params.q) ?? "").trim().slice(0, 20),
  };
  if (c.from > c.to) c = { ...c, from: c.to, to: c.from };
  if (c.fromTime > c.toTime) c = { ...c, fromTime: c.toTime, toTime: c.fromTime };
  return c;
}

export function parsePage(params: Params): number {
  const n = Number(first(params.page));
  return Number.isInteger(n) && n >= 1 && n <= 9999 ? n : 1;
}

/** "" for the defaults, otherwise "?from=…" with only the values that differ. */
export function toQuery(c: Criteria, page = 1): string {
  const p = new URLSearchParams();
  (["from", "to", "fromTime", "toTime"] as const).forEach((k) => {
    if (c[k] !== DEFAULT_CRITERIA[k]) p.set(k, c[k]);
  });
  if (c.type !== "all") p.set("type", c.type);
  if (c.q) p.set("q", c.q);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// Vehicle types
// ---------------------------------------------------------------------------

export const TYPE_ID: Record<VehicleType, ActivityVehicleType> = {
  Sedan: "sedan",
  SUV: "suv",
  Pickup: "pickup",
  Hatchback: "hatchback",
  "Van / MPV": "van",
  "รถไฟฟ้า": "ev",
};

/** Series order and colour are fixed per type (DESIGN-STYLE 11); `dot` is a Tailwind class, `fill` the same colour for Recharts. */
export const TYPE_META: Record<ActivityVehicleType, { label: string; dot: string; fill: string }> = {
  sedan: { label: "Sedan", dot: "bg-chart-1", fill: "var(--pp-chart-1)" },
  suv: { label: "SUV", dot: "bg-chart-2", fill: "var(--pp-chart-2)" },
  pickup: { label: "Pickup", dot: "bg-chart-3", fill: "var(--pp-chart-3)" },
  hatchback: { label: "Hatchback", dot: "bg-chart-4", fill: "var(--pp-chart-4)" },
  van: { label: "Van / MPV", dot: "bg-chart-5", fill: "var(--pp-chart-5)" },
  ev: { label: "รถไฟฟ้า", dot: "bg-chart-6", fill: "var(--pp-chart-6)" },
};

// ---------------------------------------------------------------------------
// Dates and formatting
// ---------------------------------------------------------------------------

const dayOf = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / dayMs);
const dateOf = (day: number) => new Date(day * dayMs).toISOString().slice(0, 10);
/** Monday = 0 … Sunday = 6, the order of the heat grid rows. */
const weekdayIndex = (date: string) => (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
const minutesOf = (t: string) => Date.parse(`${t.slice(0, 10)}T${t.slice(11, 16)}:00Z`) / 60_000;

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;
const dayMonth = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;

/** "11 ต.ค. – 17 ต.ค. 2026" (Figma 14 spells out both months); one day is "17 ต.ค. 2026". */
export function formatPeriod(from: string, to: string): string {
  if (from === to) return `${dayMonth(from)} ${from.slice(0, 4)}`;
  if (from.slice(0, 4) !== to.slice(0, 4)) return `${dayMonth(from)} ${from.slice(0, 4)} – ${dayMonth(to)} ${to.slice(0, 4)}`;
  return `${dayMonth(from)} – ${dayMonth(to)} ${to.slice(0, 4)}`;
}

export const formatPeriodWithTime = (c: Criteria) => `${formatPeriod(c.from, c.to)} · ${c.fromTime}–${c.toTime}`;

export const formatInt = (n: number) => n.toLocaleString("en-US");

/** `40 นาที` under an hour, otherwise `1 ชม. 06 น.`. */
export function formatStay(min: number): string {
  const m = Math.max(0, Math.round(min));
  return m < 60 ? `${m} นาที` : `${Math.floor(m / 60)} ชม. ${String(m % 60).padStart(2, "0")} น.`;
}

export const stayMinutes = (s: Session) => Math.max(0, minutesOf(s.exitAt ?? REFERENCE_NOW) - minutesOf(s.entryAt));

// ---------------------------------------------------------------------------
// Filtering and sorting
// ---------------------------------------------------------------------------

export function filterSessions(all: readonly Session[], c: Criteria): Session[] {
  const q = c.q.replace(/\s+/g, "").toLowerCase();
  return all.filter((s) => {
    const date = s.entryAt.slice(0, 10);
    const time = s.entryAt.slice(11, 16);
    if (date < c.from || date > c.to) return false;
    if (time < c.fromTime || time > c.toTime) return false;
    if (c.type !== "all" && (s.vehicleType === null || TYPE_ID[s.vehicleType] !== c.type)) return false;
    return !q || s.plate.replace(/\s+/g, "").toLowerCase().includes(q);
  });
}

/** Newest entry first, or oldest first; the id breaks ties so the order is stable. */
export function sortSessions(rows: readonly Session[], order: "desc" | "asc"): Session[] {
  const sign = order === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => sign * (a.entryAt.localeCompare(b.entryAt) || a.id.localeCompare(b.id)));
}

// ---------------------------------------------------------------------------
// Summary: KPIs, heat grid, charts and the per-type table
// ---------------------------------------------------------------------------

export type Summary = Pick<ActivityData, "kpis" | "types" | "total" | "heatGrid" | "hourlyByType" | "dailyByType">;

const average = (xs: readonly number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

function computeSummary(rows: readonly Session[], c: Criteria): Summary {
  const days = Math.max(1, dayOf(c.to) - dayOf(c.from) + 1);
  const exited = rows.filter((s) => s.exitAt !== null);

  // Heat grid: entries per weekday and hour, divided by how many of that weekday the range holds.
  const weekdayCount = Array.from({ length: 7 }, () => 0);
  for (let d = dayOf(c.from); d <= dayOf(c.to); d++) weekdayCount[weekdayIndex(dateOf(d))] += 1;
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  rows.forEach((s) => (grid[weekdayIndex(s.entryAt.slice(0, 10))][Number(s.entryAt.slice(11, 13))] += 1));
  const values = grid.map((row, d) => row.map((n) => (weekdayCount[d] === 0 ? 0 : Math.round(n / weekdayCount[d]))));

  const zero = () => Object.fromEntries(ACTIVITY_VEHICLE_TYPES.map((t) => [t, 0])) as Record<ActivityVehicleType, number>;
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, ...zero() }));
  const daily = new Map<string, { date: string } & Record<ActivityVehicleType, number>>();
  for (let d = dayOf(c.from); d <= dayOf(c.to); d++) daily.set(dateOf(d), { date: dateOf(d), ...zero() });
  const perType = zero();
  const stays: Record<ActivityVehicleType, number[]> = { sedan: [], suv: [], pickup: [], hatchback: [], van: [], ev: [] };

  rows.forEach((s) => {
    if (s.vehicleType === null) return; // The camera did not classify it: counted in the KPIs, not in the type views.
    const id = TYPE_ID[s.vehicleType];
    hourly[Number(s.entryAt.slice(11, 13))][id] += 1;
    const day = daily.get(s.entryAt.slice(0, 10));
    if (day) day[id] += 1;
    perType[id] += 1;
    if (s.exitAt !== null) stays[id].push(stayMinutes(s));
  });
  const typed = ACTIVITY_VEHICLE_TYPES.reduce((sum, t) => sum + perType[t], 0);

  return {
    kpis: {
      entries: rows.length,
      entriesPerDay: Math.round(rows.length / days),
      exits: exited.length,
      parkedNow: rows.length - exited.length,
      avgStayMin: Math.round(average(exited.map(stayMinutes))),
      avgStayBasis: exited.length,
      rows: rows.length,
    },
    types: ACTIVITY_VEHICLE_TYPES.map((id) => ({
      id,
      label: TYPE_META[id].label,
      vehicles: perType[id],
      sharePct: typed === 0 ? 0 : Math.round((perType[id] / typed) * 1000) / 10,
      avgStayMin: Math.round(average(stays[id])),
    })),
    total: {
      vehicles: typed,
      sharePct: typed === 0 ? 0 : 100,
      avgStayMin: Math.round(average(ACTIVITY_VEHICLE_TYPES.flatMap((t) => stays[t]))),
    },
    heatGrid: { days: ACTIVITY_DAYS, values },
    hourlyByType: hourly,
    dailyByType: [...daily.values()],
  };
}

/** The seed for the default criteria (so the page matches Figma exactly); computed from the sessions otherwise. */
export function getSummary(rows: readonly Session[], c: Criteria): Summary {
  return isDefaultCriteria(c) ? SEED_DATA : computeSummary(rows, c);
}

/** The busiest cell of the grid; the first one wins a tie. */
export function heatPeak(grid: Summary["heatGrid"]): { day: string; hour: number; value: number } {
  let best = { day: grid.days[0], hour: 0, value: 0 };
  grid.values.forEach((row, d) =>
    row.forEach((value, hour) => {
      if (value > best.value) best = { day: grid.days[d], hour, value };
    }),
  );
  return best;
}

/** Y axis of the stacked charts: four steps, 35 apart for busy charts like Figma 14 (0 – 140). */
export function axisTicks(max: number): number[] {
  const step = max > 28 ? 35 * Math.ceil(max / 140) : max > 8 ? 5 * Math.ceil(max / 20) : Math.max(1, Math.ceil(max / 4));
  return Array.from({ length: 5 }, (_, i) => i * step);
}

/** The "1,395 รายการ" of the result bar and table footer: the seed count for the default criteria, the real count otherwise. */
export const totalRows = (rows: readonly Session[], c: Criteria, summary: Summary) =>
  isDefaultCriteria(c) ? summary.kpis.rows : rows.length;
