"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ACTIVITY_VEHICLE_TYPES, type ActivityVehicleType } from "@/db/reports/reports";
import { cn } from "@/utils/cn";

import { TYPE_META, axisTicks, formatInt, type Summary } from "./activity-stats";

export type ChartMode = "hour" | "day";

type Row = { label: string; tip: string } & Record<ActivityVehicleType, number>;

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;
const shortDate = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;

function rowsFor(summary: Summary, mode: ChartMode): Row[] {
  if (mode === "hour") {
    return summary.hourlyByType.map((h) => ({ ...h, label: `${pad(h.hour)}:00`, tip: `${pad(h.hour)}:00–${pad(h.hour)}:59` }));
  }
  return summary.dailyByType.map((d) => ({ ...d, label: shortDate(d.date), tip: shortDate(d.date) }));
}

type TipProps = { active?: boolean; payload?: readonly { payload?: unknown }[] };

function ChartTooltip({ active, payload }: TipProps) {
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  const total = ACTIVITY_VEHICLE_TYPES.reduce((sum, t) => sum + row[t], 0);
  return (
    <div className="flex min-w-40 flex-col gap-1.5 rounded-pop border border-line bg-surface px-3 py-2.5 shadow-tooltip">
      <p className="text-label font-semibold text-fg tabular-nums">{row.tip}</p>
      {ACTIVITY_VEHICLE_TYPES.map((t) => (
        <p key={t} className="flex items-center gap-2 text-label text-fg-2">
          <span className={cn("size-2 shrink-0 rounded-xs", TYPE_META[t].dot)} aria-hidden="true" />
          {TYPE_META[t].label}
          <span className="ml-auto font-medium text-fg tabular-nums">{formatInt(row[t])}</span>
        </p>
      ))}
      <p className="flex border-t border-line pt-1.5 text-label font-semibold text-fg">
        รวม
        <span className="ml-auto tabular-nums">{formatInt(total)} คัน</span>
      </p>
    </div>
  );
}

const TICK = { fill: "var(--pp-text-3)", fontSize: 11 } as const;

/** Stacked bars of entries per vehicle type, by hour (Figma 14) or by day (14.9). One axis, fixed series colours. */
export function TypeChart({ summary, mode }: { summary: Summary; mode: ChartMode }) {
  const rows = rowsFor(summary, mode);
  const max = Math.max(0, ...rows.map((r) => ACTIVITY_VEHICLE_TYPES.reduce((sum, t) => sum + r[t], 0)));
  const ticks = axisTicks(max);
  return (
    <div className="h-80 w-full" role="img" aria-label={`กราฟประเภทรถ${mode === "hour" ? "ตามช่วงชั่วโมง" : "ตามวัน"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--pp-border)" />
          <XAxis
            dataKey="label"
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--pp-border-strong)" }}
            interval={mode === "hour" ? 2 : 0}
            minTickGap={8}
          />
          <YAxis
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={36}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            allowDecimals={false}
          />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--pp-bg-subtle)" }} isAnimationActive={false} />
          {ACTIVITY_VEHICLE_TYPES.map((t, i) => (
            <Bar
              key={t}
              dataKey={t}
              name={TYPE_META[t].label}
              stackId="entries"
              fill={TYPE_META[t].fill}
              radius={i === ACTIVITY_VEHICLE_TYPES.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
