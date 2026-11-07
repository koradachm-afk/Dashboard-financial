"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatBaht } from "@/utils/format";

import { sliceLabel, type View } from "./period";

type Point = { x: number; revenue: number };
type Datum = { label: string; revenue: number };

// Single axis, one series (DESIGN-STYLE 11): colour chart-1, bars rounded 4px on top, faint grid, stronger axis.
const AXIS_TICK = { fill: "var(--pp-text-3)", fontSize: 11 };

function ChartTooltip({ active, datum }: { active?: boolean; datum?: Datum }) {
  if (!active || !datum) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-pop border border-line bg-surface px-3 py-2 shadow-tooltip">
      <span className="text-caption text-fg-2">{datum.label}</span>
      <span className="text-body font-semibold text-fg tabular-nums">{formatBaht(datum.revenue)}</span>
    </div>
  );
}

export function RevenueChart({ view, points, ariaLabel }: { view: View; points: readonly Point[]; ariaLabel: string }) {
  const data: Datum[] = points.map((p) => ({ label: sliceLabel(view, p.x), revenue: p.revenue }));
  return (
    <div role="img" aria-label={ariaLabel} className="h-70 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--pp-border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--pp-border-strong)" }} tick={AXIS_TICK} interval="preserveStartEnd" />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(v: number) => formatBaht(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--pp-bg-subtle)" }}
            content={(props) => (
              <ChartTooltip active={props.active} datum={props.payload?.[0]?.payload as Datum | undefined} />
            )}
          />
          <Bar dataKey="revenue" fill="var(--pp-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
