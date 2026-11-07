"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import { getDailyRevenue } from "@/db/reports/reports";
import { formatBaht } from "@/utils/format";
import { shortDate } from "@/utils/thai-date";

import { AXIS_LINE, AXIS_TICK, GRID, bahtAxis, niceTicks } from "./chart-utils";

type Datum = { label: string; revenue: number };

function Tip({ active, datum }: { active?: boolean; datum?: Datum }) {
  if (!active || !datum) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-pop border border-line bg-surface px-3 py-2 shadow-tooltip">
      <span className="text-caption text-fg-2">{datum.label}</span>
      <span className="text-body font-semibold text-fg tabular-nums">{formatBaht(datum.revenue)}</span>
    </div>
  );
}

/** "รายรับ 14 วันล่าสุด": revenue per day, read from the daily series of Financial Overview. */
export function Revenue14DaysCard({ endDate }: { endDate: string }) {
  const days = getDailyRevenue(endDate, 14);
  const data: Datum[] = (days ?? []).map((d) => ({ label: shortDate(d.date), revenue: d.revenue }));
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.revenue)));
  return (
    <Card className="col-span-2">
      <CardHeader
        title="รายรับ 14 วันล่าสุด"
        description={`รวม ${formatBaht(total)} · วันนี้ถึง 22:00`}
        action={
          <Link href="/financial-overview" className="text-label font-medium text-fg-2 hover:text-fg">
            Financial Overview
          </Link>
        }
      />
      <CardBody>
        {days === null ? (
          <p className="py-16 text-center text-body text-fg-2">ไม่มีข้อมูลรายรับของช่วงนี้</p>
        ) : (
          <div role="img" aria-label={`รายรับ 14 วันล่าสุด รวม ${formatBaht(total)}`} className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval={0} />
                <YAxis width={48} tickLine={false} axisLine={false} tick={AXIS_TICK} ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickFormatter={bahtAxis} />
                <Tooltip
                  cursor={{ fill: "var(--pp-bg-subtle)" }}
                  content={(props) => <Tip active={props.active} datum={props.payload?.[0]?.payload as Datum | undefined} />}
                />
                <Bar dataKey="revenue" fill="var(--pp-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
