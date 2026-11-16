import { FINANCIAL_PERIODS, type FinancialPeriod } from "@/db/reports/reports";
import { THAI_MONTHS } from "@/utils/thai-date";

export const VIEWS = ["day", "month", "year"] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_LABEL: Record<View, string> = { day: "รายวัน", month: "รายเดือน", year: "รายปี" };

/** Key of a period as it appears in the URL (`?period=`): 2026-11-16 · 2026-11 · 2026. */
export function periodKey(p: FinancialPeriod): string {
  return p.kind === "day" ? p.date : p.kind === "month" ? p.month : String(p.year);
}

/** The periods Figma has frames for in one view, newest first. */
export const periodsOf = (view: View): readonly FinancialPeriod[] => FINANCIAL_PERIODS.filter((p) => p.kind === view);

const KEY_LENGTH: Record<View, number> = { day: 10, month: 7, year: 4 };

export const isView = (v: unknown): v is View => (VIEWS as readonly unknown[]).includes(v);

/**
 * The period to show for a view and a URL key. An unknown key falls back to the period of that view that
 * contains the key (day 2026-11-16 → month 2026-11 → year 2026), then to the newest one.
 */
export function resolvePeriod(view: View, key: string | undefined): FinancialPeriod {
  const list = periodsOf(view);
  const exact = list.find((p) => periodKey(p) === key);
  if (exact) return exact;
  const stem = key?.slice(0, KEY_LENGTH[view]);
  return (stem ? list.find((p) => periodKey(p).startsWith(stem)) : undefined) ?? list[0];
}

export function parseView(v: string | undefined): View {
  return isView(v) ? v : "day";
}

const pad = (n: number) => String(n).padStart(2, "0");

export { THAI_MONTHS };

/** Axis / tooltip label of one chart slice: 16:00 · 7 · ต.ค. */
export function sliceLabel(view: View, x: number): string {
  if (view === "day") return `${pad(x)}:00`;
  if (view === "month") return String(x);
  return THAI_MONTHS[x - 1] ?? String(x);
}

export const CHART_TITLE: Record<View, string> = {
  day: "รายรับรายชั่วโมง",
  month: "รายรับรายวัน",
  year: "รายรับรายเดือน",
};

/** A day that is not over yet (the chart stops before hour 24). Other views: none. */
export function untilLabel(view: View, period: FinancialPeriod, points: readonly { x: number }[]): string | null {
  if (view !== "day" || period.kind !== "day" || points.length === 0 || points.length >= 24) return null;
  const [, month, day] = period.date.split("-").map(Number);
  return `ถึง ${day} ${THAI_MONTHS[month - 1]} ${pad(points[points.length - 1].x + 1)}:00`;
}
