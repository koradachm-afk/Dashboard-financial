"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const TICKS = ["00", "06", "12", "18", "23"];

function HourTip({ active, payload }: { active?: boolean; payload?: readonly { payload?: { hour: string; count: number } }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-pop border border-line bg-surface px-3 py-2 text-label text-fg shadow-tooltip tabular-nums">
      <span className="text-fg-2">{row.hour}:00</span> · <span className="font-semibold">{row.count} ครั้ง</span>
    </div>
  );
}

/** Visits that started in each hour 00–23. Single axis, series colour chart-1 (DESIGN-STYLE 11). */
export function StartHoursChart({ counts }: { counts: readonly number[] }) {
  const data = counts.map((count, i) => ({ hour: HOURS[i], count }));
  return (
    <div role="img" aria-label="จำนวนครั้งที่เริ่มจอดในแต่ละชั่วโมง" className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={3}>
          <XAxis
            dataKey="hour"
            ticks={TICKS}
            interval={0}
            tickLine={false}
            axisLine={{ stroke: "var(--pp-border-strong)" }}
            tick={{ fill: "var(--pp-text-3)", fontSize: 11 }}
          />
          <Tooltip content={<HourTip />} cursor={false} isAnimationActive={false} />
          <Bar dataKey="count" fill="var(--pp-chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
