"use client";

import { CalendarDate } from "@internationalized/date";
import { ArrowDown, Calendar, ChevronDown, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Dialog, Popover } from "react-aria-components";
import { CartesianGrid, Line, LabelList, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardHeader } from "@/components/tailgrids/core/card";
import {
  DateRangePicker,
  formatDateRange,
  formatRangeSummary,
  type DateRange,
} from "@/components/tailgrids/core/date-range-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/tailgrids/core/dropdown";
import { SegmentedControl } from "@/components/tailgrids/core/segmented-control";
import { ACTIVITY_VEHICLE_TYPES, getActivity, type ActivityVehicleType } from "@/db/reports/reports";
import { cn } from "@/utils/cn";
import { formatBaht, formatInt, formatMinutes, signed } from "@/utils/format";
import { shortDate } from "@/utils/thai-date";

import { AXIS_LINE, AXIS_TICK, GRID, bahtAxis, niceTicks } from "./chart-utils";
import { TYPE_COLOR, typeRevenue } from "./dashboard-data";

type Metric = "entries" | "stay" | "revenue";
const METRICS = [
  { value: "entries", label: "รถเข้า" },
  { value: "stay", label: "เวลาจอดเฉลี่ย" },
  { value: "revenue", label: "รายรับ" },
] as const;
const CHART_TITLE: Record<Metric, string> = { entries: "รถเข้า (คันต่อวัน)", stay: "เวลาจอดเฉลี่ย", revenue: "รายรับ" };
const MIN_TYPES = 2;
const MAX_TYPES = 4;
/** The range the seed has; the picker is capped at the latest day of the data. */
const DATA_END = new CalendarDate(2026, 11, 16);
const DEFAULT_RANGE: DateRange = { start: new CalendarDate(2026, 11, 10), end: DATA_END };

type Row = {
  id: ActivityVehicleType;
  label: string;
  entries: number;
  sharePct: number;
  stay: number;
  revenue?: number;
  perVehicle?: number;
};

const TH = "h-11 px-5 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-5 text-body text-fg tabular-nums";
const NO_DATA = <span className="text-fg-3">ไม่มีข้อมูล</span>;

const pct = (diff: number, base: number) => (base > 0 ? `(${signed(Math.round((diff / base) * 1000) / 10, (n) => `${n.toFixed(1)}%`)})` : "");
const diffMinutes = (d: number) => signed(d, (n) => (n < 60 ? `${n} น.` : formatMinutes(n)));

function EndLabel({ x, y, index, last, name, offset = 0 }: { x?: number | string; y?: number | string; index?: number; last: number; name: string; offset?: number }) {
  if (index !== last) return null;
  const yPosition = Number(y);
  const verticalOffset = yPosition < 22 || yPosition > 266 ? -offset : offset;
  return (
    <text x={Number(x) + 10} y={yPosition + verticalOffset} dominantBaseline="middle" fill="var(--pp-text-2)" fontSize={12}>
      {name}
    </text>
  );
}

type Datum = { label: string } & Partial<Record<ActivityVehicleType, number>>;

function CompareTooltip({ active, datum, rows, metric }: { active?: boolean; datum?: Datum; rows: readonly Row[]; metric: Metric }) {
  if (!active || !datum) return null;
  return (
    <div className="flex flex-col gap-1 rounded-pop border border-line bg-surface px-3 py-2 shadow-tooltip">
      <span className="text-caption text-fg-2">{datum.label}</span>
      {rows.map((r) => (
        <span key={r.id} className="flex items-center gap-2 text-label text-fg tabular-nums">
          <span aria-hidden className={cn("size-2 rounded-sm", TYPE_COLOR[r.id].fill)} />
          {r.label}
          <span className="ml-auto pl-3 font-semibold">
            {metric === "entries"
              ? `${formatInt(datum[r.id] ?? 0)} คัน`
              : metric === "stay"
                ? formatMinutes(datum[r.id] ?? 0)
                : formatBaht(datum[r.id] ?? 0)}
          </span>
        </span>
      ))}
    </div>
  );
}

/** "เปรียบเทียบตามประเภทรถ": 2–4 vehicle types over a date range, as a chart and a summary table. */
export function CompareCard() {
  const [types, setTypes] = useState<ActivityVehicleType[]>(["sedan", "suv"]);
  const [metric, setMetric] = useState<Metric>("entries");
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);

  const activity = getActivity(range.start.toString(), range.end.toString());
  const revenue = typeRevenue();
  const rows: Row[] = activity
    ? types.flatMap((id) => {
        const t = activity.types.find((x) => x.id === id);
        return t ? [{ id, label: t.label, entries: t.vehicles, sharePct: t.sharePct, stay: t.avgStayMin, ...revenue[id] }] : [];
      })
    : [];
  // Sorted by the metric on show, largest first; a type without revenue goes last.
  const sorted = [...rows].sort((a, b) =>
    metric === "entries" ? b.entries - a.entries : metric === "stay" ? b.stay - a.stay : (b.revenue ?? -1) - (a.revenue ?? -1),
  );
  const [first, second] = sorted;
  const addable = ACTIVITY_VEHICLE_TYPES.filter((id) => !types.includes(id));
  const typeLabel = (id: ActivityVehicleType) => getActivity()?.types.find((t) => t.id === id)?.label ?? id;

  const daily: Datum[] = (activity?.dailyByType ?? []).map((d) => ({ label: shortDate(d.date), ...d }));
  let totalRate = 0;
  let rateCount = 0;
  for (const rate of Object.values(revenue)) {
    if (rate) {
      totalRate += rate.perVehicle;
      rateCount += 1;
    }
  }
  const averageRate = rateCount > 0 ? totalRate / rateCount : 0;
  const chartData: Datum[] = daily.map((day) => {
    const point: Datum = { label: day.label };
    for (const id of types) {
      const row = rows.find((item) => item.id === id);
      const entries = day[id] ?? 0;
      if (metric === "entries") point[id] = entries;
      if (metric === "stay") point[id] = row?.stay ?? 0;
      if (metric === "revenue") point[id] = Math.round(entries * (revenue[id]?.perVehicle ?? averageRate));
    }
    return point;
  });
  const max = Math.max(0, ...chartData.flatMap((d) => types.map((id) => d[id] ?? 0)));
  const ticks = niceTicks(max);
  const lastPoint = chartData[chartData.length - 1];
  const endValues = types
    .map((id) => ({ id, value: lastPoint?.[id] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const closeValueGap = (ticks[ticks.length - 1] * 18) / 256;
  const labelOffsets = new Map<ActivityVehicleType, number>();
  for (let start = 0; start < endValues.length;) {
    let end = start + 1;
    while (end < endValues.length && endValues[end - 1].value - endValues[end].value <= closeValueGap) end += 1;
    const count = end - start;
    if (count > 1) {
      for (let i = start; i < end; i += 1) {
        labelOffsets.set(endValues[i].id, (i - start - (count - 1) / 2) * 18);
      }
    }
    start = end;
  }
  const rangeText = formatDateRange(range.start, range.end);

  const sortedHead = (key: Metric, text: string) => (
    <th scope="col" aria-sort={metric === key ? "descending" : undefined} className={cn(TH, metric === key && "text-primary")}>
      <span className="inline-flex items-center gap-1.5">
        {text}
        {metric === key && <ArrowDown size={14} aria-hidden />}
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader
        title="เปรียบเทียบตามประเภทรถ"
        description="เลือกประเภทรถ 2–4 ประเภทและช่วงวันที่ เพื่อดูรถเข้า เวลาจอด และรายรับเทียบกัน"
        action={<SegmentedControl aria-label="ตัวชี้วัด" options={[...METRICS]} value={metric} onChange={setMetric} />}
      />

      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <span className="text-label text-fg-3">ประเภทรถ</span>
        <ul className="flex items-center gap-2">
          {types.map((id) => (
            <li key={id} className="flex h-8 items-center gap-2 rounded-full border border-line bg-surface pr-1.5 pl-3 text-body text-fg">
              <span aria-hidden className={cn("size-2.5 rounded-sm", TYPE_COLOR[id].fill)} />
              {typeLabel(id)}
              <button
                type="button"
                aria-label={`เอา ${typeLabel(id)} ออก`}
                disabled={types.length <= MIN_TYPES}
                onClick={() => setTypes(types.filter((t) => t !== id))}
                className="grid size-5 place-items-center rounded-full text-fg-3 hover:text-fg disabled:pointer-events-none disabled:opacity-50"
              >
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        {types.length < MAX_TYPES ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 cursor-default items-center gap-1.5 rounded-md px-2.5 text-body font-medium text-fg-2 data-focus-visible:ring-2 data-focus-visible:ring-focus">
              <Plus size={16} aria-hidden />
              เพิ่มประเภท
            </DropdownMenuTrigger>
            <DropdownMenuContent placement="bottom start" className="min-w-48 p-1.5">
              {addable.map((id) => (
                <DropdownMenuItem
                  key={id}
                  id={id}
                  textValue={typeLabel(id)}
                  onAction={() => setTypes([...types, id])}
                  className="h-9 gap-2.5 rounded-md px-2.5 text-body font-medium text-fg"
                >
                  <span aria-hidden className={cn("size-2.5 rounded-sm", TYPE_COLOR[id].fill)} />
                  {typeLabel(id)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="px-2.5 text-label text-fg-3">เลือกครบ {MAX_TYPES} ประเภทแล้ว</span>
        )}

        <span className="ml-auto text-label text-fg-3">ช่วงวันที่</span>
        <button
          ref={rangeRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
          className="flex h-9 min-w-72 cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg tabular-nums outline-none aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus focus-visible:border-focus focus-visible:ring-1 focus-visible:ring-focus"
        >
          <Calendar size={16} aria-hidden className="shrink-0" />
          <span className="flex-1 truncate text-left">{formatRangeSummary(range.start, range.end)}</span>
          <ChevronDown size={16} aria-hidden className="shrink-0 text-fg-2" />
        </button>
        <Popover
          triggerRef={rangeRef}
          isOpen={pickerOpen}
          onOpenChange={setPickerOpen}
          placement="bottom end"
          className="rounded-pop border border-line bg-surface shadow-pop outline-none"
        >
          <Dialog aria-label="ช่วงวันที่" className="outline-none">
            <DateRangePicker
              value={range}
              today={DATA_END}
              onApply={(r) => {
                setRange(r);
                setPickerOpen(false);
              }}
              onCancel={() => setPickerOpen(false)}
              label="ช่วงวันที่"
              startLabel="วันเริ่ม"
              endLabel="วันสิ้นสุด"
              previousLabel="เดือนก่อนหน้า"
              nextLabel="เดือนถัดไป"
              cancelLabel="ยกเลิก"
              applyLabel="ใช้ช่วงวันที่"
              startHint="คลิกวันเริ่ม แล้วคลิกวันสิ้นสุด"
              endHint={(start) => `เริ่ม ${start} · คลิกวันสิ้นสุด`}
            />
          </Dialog>
        </Popover>
      </div>

      {!activity ? (
        <div className="flex flex-col items-center gap-1 py-18">
          <p className="text-lead font-semibold text-fg">ไม่มีข้อมูลในช่วงที่เลือก</p>
          <p className="text-body text-fg-2">ตัวอย่างนี้มีข้อมูลเฉพาะ {formatDateRange(DEFAULT_RANGE.start, DEFAULT_RANGE.end)}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-5 py-4">
            <div className="flex items-center">
              <h3 className="text-body font-semibold text-fg">{CHART_TITLE[metric]}</h3>
              <span className="ml-auto text-label text-fg-3 tabular-nums">
                {rangeText} · รายวัน{metric === "entries" ? "" : " · ค่าประมาณ"}
              </span>
            </div>
            <div role="img" aria-label={`${CHART_TITLE[metric]} ${rangeText}`} className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 64, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} />
                  <YAxis
                    width={metric === "revenue" ? 56 : 44}
                    tickLine={false}
                    axisLine={false}
                    tick={AXIS_TICK}
                    tickFormatter={(value: number) =>
                      metric === "revenue" ? bahtAxis(value) : metric === "stay" ? `${formatInt(value)} น.` : formatInt(value)
                    }
                    ticks={ticks}
                    domain={[0, ticks[ticks.length - 1]]}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--pp-border-strong)" }}
                    content={(props) => (
                      <CompareTooltip
                        active={props.active}
                        datum={props.payload?.[0]?.payload as Datum | undefined}
                        rows={rows}
                        metric={metric}
                      />
                    )}
                  />
                  {types.map((id) => (
                    <Line
                      key={id}
                      dataKey={id}
                      type="linear"
                      stroke={TYPE_COLOR[id].stroke}
                      strokeWidth={2}
                      dot={{ r: 3, fill: TYPE_COLOR[id].stroke, stroke: TYPE_COLOR[id].stroke }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey={id}
                        content={(props) => (
                          <EndLabel
                            x={props.x}
                            y={props.y}
                            index={props.index}
                            last={daily.length - 1}
                            name={typeLabel(id)}
                            offset={labelOffsets.get(id) ?? 0}
                          />
                        )}
                      />
                    </Line>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-y border-line">
                <th scope="col" className={cn(TH, "w-56")}>ประเภทรถ</th>
                {sortedHead("entries", "รถเข้า")}
                <th scope="col" className={TH}>สัดส่วนจากรถทั้งหมด</th>
                {sortedHead("stay", "เวลาจอดเฉลี่ย")}
                {sortedHead("revenue", "รายรับ")}
                <th scope="col" className={TH}>รายรับเฉลี่ยต่อคัน</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-b border-line">
                  <td className={cn(TD, "font-medium")}>
                    <span className="inline-flex items-center gap-2.5">
                      <span aria-hidden className={cn("size-2.5 rounded-sm", TYPE_COLOR[r.id].fill)} />
                      {r.label}
                    </span>
                  </td>
                  <td className={cn(TD, metric === "entries" && "font-semibold")}>{formatInt(r.entries)} คัน</td>
                  <td className={TD}>{r.sharePct.toFixed(1)}%</td>
                  <td className={cn(TD, metric === "stay" && "font-semibold")}>{formatMinutes(r.stay)}</td>
                  <td className={cn(TD, metric === "revenue" && "font-semibold")}>{r.revenue === undefined ? NO_DATA : formatBaht(r.revenue)}</td>
                  <td className={TD}>{r.perVehicle === undefined ? NO_DATA : formatBaht(r.perVehicle)}</td>
                </tr>
              ))}
            </tbody>
            {first && second && sorted.length === 2 && (
              <tfoot>
                <tr className="bg-subtle">
                  <td className={cn(TD, "font-semibold")}>
                    ส่วนต่าง{" "}
                    <span className="text-label font-normal text-fg-3">
                      {first.label} เทียบ {second.label}
                    </span>
                  </td>
                  <td className={cn(TD, "font-semibold")}>
                    {signed(first.entries - second.entries)} คัน <span className="font-normal text-fg-3">{pct(first.entries - second.entries, second.entries)}</span>
                  </td>
                  <td className={cn(TD, "font-semibold")}>{signed(Math.round((first.sharePct - second.sharePct) * 10) / 10, (n) => n.toFixed(1))} จุด</td>
                  <td className={cn(TD, "font-semibold")}>
                    {diffMinutes(first.stay - second.stay)} <span className="font-normal text-fg-3">{pct(first.stay - second.stay, second.stay)}</span>
                  </td>
                  <td className={cn(TD, "font-semibold")}>
                    {first.revenue === undefined || second.revenue === undefined ? (
                      NO_DATA
                    ) : (
                      <>
                        {signed(first.revenue - second.revenue, formatBaht)}{" "}
                        <span className="font-normal text-fg-3">{pct(first.revenue - second.revenue, second.revenue)}</span>
                      </>
                    )}
                  </td>
                  <td className={cn(TD, "font-semibold")}>
                    {first.perVehicle === undefined || second.perVehicle === undefined ? (
                      NO_DATA
                    ) : (
                      <>
                        {signed(first.perVehicle - second.perVehicle, formatBaht)}{" "}
                        <span className="font-normal text-fg-3">{pct(first.perVehicle - second.perVehicle, second.perVehicle)}</span>
                      </>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </>
      )}
    </Card>
  );
}
