import { getFloors, type Building, type Floor } from "@/db/floors/floors";
import {
  getAverageStayMinutes,
  getHeatMap,
  getSlotRate,
  HEAT_MAP_PERIODS,
  type HeatMapData,
  type HeatMapPeriod,
  type HeatMetric,
} from "@/db/reports/reports";

/** Everything the page keeps in the URL (`?building=&floor=&period=&metric=&type=&slot=`). */
export type HeatState = {
  buildingId: string;
  floorName: string;
  period: HeatMapPeriod;
  metric: HeatMetric;
  /** A slot-type id, or null for "ทุกประเภทช่อง". */
  type: string | null;
  /** The slot opened in the detail card, or null for the default one. */
  slot: string | null;
};

export const PERIOD_OPTIONS: readonly { value: HeatMapPeriod; label: string; days: number }[] = [
  { value: "7d", label: "7 วัน", days: 7 },
  { value: "30d", label: "30 วัน", days: 30 },
  { value: "90d", label: "90 วัน", days: 90 },
];

export const METRIC_OPTIONS: readonly { value: HeatMetric; label: string }[] = [
  { value: "count", label: "จำนวนครั้ง" },
  { value: "hours", label: "ชั่วโมงจอดรวม" },
  { value: "rate", label: "อัตราการใช้" },
];

export const ALL_TYPES = "all";

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function buildingOf(id: string | undefined): Building {
  const all = getFloors();
  return all.find((b) => b.id === id) ?? all[0];
}

export function floorOf(building: Building, name: string | undefined): Floor {
  const sorted = [...building.floors].sort((a, b) => a.order - b.order);
  return sorted.find((f) => f.name === name) ?? sorted.find((f) => f.name === "B1") ?? sorted[0];
}

/** Turns raw search params into a valid state: anything unknown falls back to the default. */
export function parseHeatQuery(params: RawParams): HeatState {
  const building = buildingOf(first(params.building));
  const floor = floorOf(building, first(params.floor));
  const period = HEAT_MAP_PERIODS.find((p) => p === first(params.period)) ?? "30d";
  const metric = METRIC_OPTIONS.find((m) => m.value === first(params.metric))?.value ?? "count";
  const type = floor.slots.some((s) => s.type === first(params.type)) ? (first(params.type) ?? null) : null;
  const slot = floor.slots.some((s) => s.id === first(params.slot)) ? (first(params.slot) ?? null) : null;
  return { buildingId: building.id, floorName: floor.name, period, metric, type, slot };
}

/** Figma has hours and usage rate for 30 days only; 7 and 90 days show the visit count (15.4, 15.5). */
export function effectiveMetric(period: HeatMapPeriod, metric: HeatMetric): HeatMetric {
  return period === "30d" ? metric : "count";
}

/** The metrics the colour switch offers for a period: all three for 30 days, only the count otherwise. */
export function metricOptionsFor(period: HeatMapPeriod): typeof METRIC_OPTIONS {
  return period === "30d" ? METRIC_OPTIONS : METRIC_OPTIONS.filter((m) => m.value === "count");
}

/** The slot of the floor that Figma shows selected first: the first one that has a detail card. */
export function defaultSlotId(floor: Floor, data: HeatMapData | null): string | null {
  if (!data) return null;
  return floor.slots.find((s) => s.id in data.panels)?.id ?? null;
}

/** Heat level 1–6: the legend range cut into six equal steps. */
export function heatLevel(value: number, range: { min: number; max: number }): number {
  if (range.max <= range.min) return 1;
  const step = Math.floor(((value - range.min) / (range.max - range.min)) * 6) + 1;
  return Math.min(6, Math.max(1, step));
}

export function slotValue(data: HeatMapData, slotId: string, metric: HeatMetric): number | undefined {
  return data.slots[slotId]?.[metric];
}

const num = (n: number) => n.toLocaleString("th-TH");

/** "185 ครั้ง" · "465 ชม." · "64.5%" */
export function formatMetric(metric: HeatMetric, value: number): string {
  if (metric === "rate") return `${value}%`;
  return `${num(value)} ${metric === "count" ? "ครั้ง" : "ชม."}`;
}

/** "3 ชม. 05 น." · "59 นาที" */
export function formatStay(minutes: number): string {
  if (minutes < 60) return `${minutes} นาที`;
  return `${Math.floor(minutes / 60)} ชม. ${String(minutes % 60).padStart(2, "0")} น.`;
}

export type SlotStats = {
  count: number | null;
  hours: number | null;
  /** `exact` = Figma prints one decimal. */
  rate: { pct: number; exact: boolean } | null;
  avgStayMin: number | null;
};

/** What the detail card and the hover tooltip print for one slot. Fields the period does not carry are null. */
export function getSlotStats(period: HeatMapPeriod, slotId: string): SlotStats {
  const data = getHeatMap(period);
  const slot = data?.slots[slotId];
  const panel = data?.panels[slotId];
  const rate = panel
    ? { pct: panel.ratePct, exact: true }
    : period === "30d"
      ? getSlotRate(slotId)
      : null;
  return {
    count: slot?.count ?? panel?.count ?? null,
    hours: panel?.hours ?? slot?.hours ?? null,
    rate,
    avgStayMin: getAverageStayMinutes(period, slotId),
  };
}

export function formatRate(rate: { pct: number; exact: boolean }): string {
  return `${rate.exact ? rate.pct.toFixed(1) : rate.pct}%`;
}

/** "ชั้น B1 · 30 วัน" scope text shared by the export toast, the audit entry and the sheet. */
export function scopeText(floorName: string, period: HeatMapPeriod): string {
  const days = PERIOD_OPTIONS.find((p) => p.value === period)?.days ?? 0;
  return `ชั้น ${floorName} · ${days} วัน`;
}
