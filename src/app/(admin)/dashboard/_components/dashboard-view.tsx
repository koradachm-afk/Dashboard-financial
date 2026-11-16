"use client";

import { CalendarDate } from "@internationalized/date";
import { Calendar, Clock, LogIn, Map as MapIcon, SquareParking, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Dialog, Popover } from "react-aria-components";

import { buttonVariants } from "@/components/tailgrids/core/button";
import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import { DateRangePicker, formatDateRange, type DateRange } from "@/components/tailgrids/core/date-range-picker";
import { KpiCard, KpiDelta } from "@/components/tailgrids/core/kpi-card";
import { SegmentedControl } from "@/components/tailgrids/core/segmented-control";
import { getDashboard, getRecentActivityCount, type DashboardRange, type DashboardRangeId } from "@/db/reports/reports";
import { formatBaht, formatInt, formatMinutes } from "@/utils/format";
import { datesEndingOn, shortDate } from "@/utils/thai-date";

import { AlertsCard } from "./alerts-card";
import { CompareCard } from "./compare-card";
import { recentActivity, slotAlerts, slotCounts } from "./dashboard-data";
import { InOutChart, InOutLegend } from "./in-out-chart";
import { RecentActivityCard } from "./recent-activity-card";
import { Revenue14DaysCard } from "./revenue-14d-card";
import { SlotStatusCard } from "./slot-status-card";

export type RangeId = DashboardRangeId | "custom";

/** Current end date for this dashboard snapshot. */
const TODAY = new CalendarDate(2026, 11, 16);
const TODAY_ISO = TODAY.toString();

const RANGE_OPTIONS = [
  { value: "today", label: "วันนี้" },
  { value: "yesterday", label: "เมื่อวาน" },
  { value: "7d", label: "7 วัน" },
  { value: "30d", label: "30 วัน" },
  { value: "custom", label: "กำหนดเอง", icon: Calendar },
] as const;

const KPI_LABEL: Record<DashboardRangeId, { revenue: string; entries: string; stay: string }> = {
  today: { revenue: "รายรับวันนี้", entries: "รถเข้าวันนี้", stay: "เวลาจอดเฉลี่ยวันนี้" },
  yesterday: { revenue: "รายรับเมื่อวาน", entries: "รถเข้าเมื่อวาน", stay: "เวลาจอดเฉลี่ยเมื่อวาน" },
  "7d": { revenue: "รายรับ 7 วัน", entries: "รถเข้า 7 วัน", stay: "เวลาจอดเฉลี่ย 7 วัน" },
  "30d": { revenue: "รายรับ 30 วัน", entries: "รถเข้า 30 วัน", stay: "เวลาจอดเฉลี่ย 30 วัน" },
};

const CUSTOM_LABEL = { revenue: "รายรับ", entries: "รถเข้า", stay: "เวลาจอดเฉลี่ย" };

const DAYS_OF: Record<"7d" | "30d", number> = { "7d": 7, "30d": 30 };

function RangeKpi({
  icon,
  label,
  value,
  unit,
  kpi,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  unit?: string;
  kpi?: DashboardRange["kpis"]["revenue"];
}) {
  // No data for the range (custom): the value is written as words in fg-3, never "-".
  return value === null || !kpi ? (
    <KpiCard icon={icon} label={label} value="ไม่มีข้อมูล" valueClassName="text-title font-semibold text-fg-3" />
  ) : (
    <KpiCard icon={icon} label={label} value={value} unit={unit} sub={<KpiDelta {...kpi.comparison} />} />
  );
}

export function DashboardView({ initialRange, initialCustom }: { initialRange: RangeId; initialCustom: DateRange | null }) {
  const [range, setRange] = useState<RangeId>(initialRange);
  const [custom, setCustom] = useState<DateRange | null>(initialCustom);
  const [pickerOpen, setPickerOpen] = useState(false);
  const segmentsRef = useRef<HTMLDivElement>(null);

  // The range lives in the URL (?range=7d, ?range=custom&from=…&to=…) so a refresh or a shared link keeps it.
  const go = (next: RangeId, nextCustom: DateRange | null = custom) => {
    setRange(next);
    const params = new URLSearchParams({ range: next });
    if (next === "custom" && nextCustom) {
      params.set("from", nextCustom.start.toString());
      params.set("to", nextCustom.end.toString());
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const preset = range === "custom" ? null : getDashboard(range);
  const counts = slotCounts();
  const alerts = slotAlerts();
  const rows = recentActivity();
  const usable = counts.free + counts.occupied;
  const usedPct = usable > 0 ? Math.round((counts.occupied / usable) * 100) : 0;
  const labels = range === "custom" ? CUSTOM_LABEL : KPI_LABEL[range];

  const inOut = preset?.inOut;
  const chartLabels = !inOut
    ? []
    : inOut.unit === "hour"
      ? Array.from({ length: inOut.compare.values.length }, (_, i) => `${String(i).padStart(2, "0")}:00`)
      : datesEndingOn(TODAY_ISO, DAYS_OF[range as "7d" | "30d"]).map(shortDate);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Dashboard</h1>
          <p className="text-body text-fg-2">ภาพรวมสาขาสยาม · ข้อมูลล่าสุด 16 พ.ย. 2026 22:00</p>
        </div>
        <div
          ref={segmentsRef}
          className="ml-auto"
          // Radio does not fire onChange when "กำหนดเอง" is already selected, so a click on it re-opens the calendar here.
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("label")?.textContent?.trim() === "กำหนดเอง") setPickerOpen(true);
          }}
        >
          <SegmentedControl
            aria-label="ช่วงเวลา"
            options={[...RANGE_OPTIONS]}
            // "กำหนดเอง" stays selected for as long as the calendar is open (README 6.6).
            value={pickerOpen ? "custom" : range}
            onChange={(v) => (v === "custom" ? setPickerOpen(true) : go(v))}
            className="bg-subtle"
          />
        </div>
        <Popover
          triggerRef={segmentsRef}
          isOpen={pickerOpen}
          onOpenChange={setPickerOpen}
          placement="bottom end"
          className="rounded-pop border border-line bg-surface shadow-pop outline-none"
        >
          <Dialog aria-label="ช่วงวันที่" className="outline-none">
            <DateRangePicker
              value={custom}
              today={TODAY}
              onApply={(r) => {
                setCustom(r);
                setPickerOpen(false);
                go("custom", r);
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
        <Link href="/parking-layout" className={buttonVariants({ variant: "secondary" })}>
          <MapIcon size={16} aria-hidden className="shrink-0" />
          เปิดผังที่จอด
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={SquareParking}
          label="ช่องว่างตอนนี้"
          value={formatInt(counts.free)}
          unit={`/ ${formatInt(counts.total)} ช่อง`}
          sub={<span className="text-fg">{`ใช้งานอยู่ ${usedPct}% · ปิดใช้งาน ${counts.disabled} · ไม่ทราบสถานะ ${counts.unknown}`}</span>}
        >
          <div role="img" aria-label={`ใช้งานอยู่ ${usedPct}%`} className="h-1.5 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-slot-occupied" style={{ width: `${usedPct}%` }} />
          </div>
        </KpiCard>
        <RangeKpi icon={Wallet} label={labels.revenue} value={preset ? formatBaht(preset.kpis.revenue.value) : null} kpi={preset?.kpis.revenue} />
        <RangeKpi icon={LogIn} label={labels.entries} value={preset ? formatInt(preset.kpis.entries.value) : null} unit="คัน" kpi={preset?.kpis.entries} />
        <RangeKpi icon={Clock} label={labels.stay} value={preset ? formatMinutes(preset.kpis.avgStayMin.value) : null} kpi={preset?.kpis.avgStayMin} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader
            title={inOut?.title ?? "รถเข้า–ออก"}
            description={inOut?.subtitle ?? (custom ? formatDateRange(custom.start, custom.end) : undefined)}
            action={inOut && <InOutLegend compareLabel={inOut.compare.label} />}
          />
          <CardBody>
            {inOut ? (
              <InOutChart
                labels={chartLabels}
                entries={inOut.entries}
                exits={inOut.exits}
                compare={inOut.compare.values}
                compareLabel={inOut.compare.label}
                xInterval={inOut.unit === "hour" ? 2 : range === "30d" ? 4 : 0}
                ariaLabel={`${inOut.title} ${inOut.subtitle}`}
              />
            ) : (
              <div className="flex h-80 flex-col items-center justify-center gap-1">
                <p className="text-lead font-semibold text-fg">ไม่มีข้อมูลในช่วงที่เลือก</p>
                <p className="text-body text-fg-2">ตัวอย่างนี้มีข้อมูลเฉพาะวันนี้ เมื่อวาน 7 วัน และ 30 วัน</p>
              </div>
            )}
          </CardBody>
        </Card>
        <SlotStatusCard counts={counts} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Revenue14DaysCard endDate={TODAY_ISO} />
        <AlertsCard alerts={alerts} />
      </div>

      <CompareCard />

      <RecentActivityCard rows={rows} total={getRecentActivityCount()} description="วันนี้ · 16 พ.ย. 2026 · 190 รายการ" />
    </div>
  );
}
