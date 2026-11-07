import { CalendarDate, parseDate } from "@internationalized/date";

import { requirePage } from "@/db/auth/auth";

import { DashboardView, type RangeId } from "./_components/dashboard-view";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

type Query = { range?: string | string[]; from?: string | string[]; to?: string | string[] };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const RANGES: readonly RangeId[] = ["today", "yesterday", "7d", "30d", "custom"];

function date(v: string | undefined): CalendarDate | null {
  try {
    return v ? parseDate(v) : null; // Throws for 2026-02-30.
  } catch {
    return null;
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  await requirePage("dashboard");
  const asked = first(query.range);
  const start = date(first(query.from));
  const end = date(first(query.to));
  // A custom range needs both dates, in order; anything else falls back to today.
  const custom = start && end && end.compare(start) >= 0 ? { start, end } : null;
  const range: RangeId = RANGES.includes(asked as RangeId) && (asked !== "custom" || custom) ? (asked as RangeId) : "today";
  return <DashboardView initialRange={range} initialCustom={custom} />;
}
