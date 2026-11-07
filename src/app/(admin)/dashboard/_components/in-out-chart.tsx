"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/utils/cn";
import { formatInt } from "@/utils/format";

import { AXIS_LINE, AXIS_TICK, GRID, niceTicks } from "./chart-utils";

type Datum = { label: string; entries?: number; exits?: number; compare?: number };

const SERIES = [
  { key: "entries", name: "เข้า", stroke: "var(--pp-chart-1)", dot: "bg-chart-1" },
  { key: "exits", name: "ออก", stroke: "var(--pp-chart-2)", dot: "bg-chart-2" },
] as const;

export function InOutLegend({ compareLabel }: { compareLabel: string }) {
  return (
    <ul className="flex items-center gap-4 text-label text-fg-2">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2.5 rounded-sm", s.dot)} />
          {s.name}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="w-3.5 border-t-2 border-dashed border-fg-3" />
        {compareLabel}
      </li>
    </ul>
  );
}

function InOutTooltip({ active, datum, compareLabel }: { active?: boolean; datum?: Datum; compareLabel: string }) {
  if (!active || !datum) return null;
  const rows = [
    { name: "เข้า", value: datum.entries, dot: "bg-chart-1" },
    { name: "ออก", value: datum.exits, dot: "bg-chart-2" },
    { name: compareLabel, value: datum.compare, dot: "bg-fg-3" },
  ].filter((r) => r.value !== undefined);
  return (
    <div className="flex flex-col gap-1 rounded-pop border border-line bg-surface px-3 py-2 shadow-tooltip">
      <span className="text-caption text-fg-2">{datum.label}</span>
      {rows.map((r) => (
        <span key={r.name} className="flex items-center gap-2 text-label text-fg tabular-nums">
          <span aria-hidden className={cn("size-2 rounded-sm", r.dot)} />
          {r.name}
          <span className="ml-auto pl-3 font-semibold">{formatInt(r.value ?? 0)} คัน</span>
        </span>
      ))}
    </div>
  );
}

/** Vehicles in / out per hour or per day, against a dashed comparison line. One axis, three lines. */
export function InOutChart({
  labels,
  entries,
  exits,
  compare,
  compareLabel,
  xInterval,
  ariaLabel,
}: {
  labels: readonly string[];
  entries: readonly number[];
  exits: readonly number[];
  compare: readonly number[];
  compareLabel: string;
  /** Recharts tick interval: 2 = every third label. */
  xInterval: number;
  ariaLabel: string;
}) {
  const data: Datum[] = labels.map((label, i) => ({ label, entries: entries[i], exits: exits[i], compare: compare[i] }));
  const max = Math.max(0, ...entries, ...exits, ...compare);
  const ticks = niceTicks(max);
  return (
    <div role="img" aria-label={ariaLabel} className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval={xInterval} />
          <YAxis width={36} tickLine={false} axisLine={false} tick={AXIS_TICK} ticks={ticks} domain={[0, ticks[ticks.length - 1]]} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "var(--pp-border-strong)" }}
            content={(props) => (
              <InOutTooltip active={props.active} datum={props.payload?.[0]?.payload as Datum | undefined} compareLabel={compareLabel} />
            )}
          />
          <Line dataKey="compare" type="linear" stroke="var(--pp-text-3)" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} isAnimationActive={false} />
          {SERIES.map((s) => (
            <Line key={s.key} dataKey={s.key} type="linear" stroke={s.stroke} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
