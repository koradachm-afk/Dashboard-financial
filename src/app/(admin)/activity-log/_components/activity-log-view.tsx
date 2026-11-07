"use client";

import { CalendarDate, parseDate } from "@internationalized/date";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Car,
  CircleCheck,
  Download,
  LoaderCircle,
  LogIn,
  LogOut,
  Search,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Dialog, Popover } from "react-aria-components";

import { Button } from "@/components/tailgrids/core/button";
import { DateRangePicker, type DateRange } from "@/components/tailgrids/core/date-range-picker";
import { Input } from "@/components/tailgrids/core/input";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { SegmentedControl } from "@/components/tailgrids/core/segmented-control";
import { Toast } from "@/components/tailgrids/core/toast";
import { audit } from "@/db/audit/audit";
import { exportActivityInfo } from "@/db/audit/audit-actions";
import { ACTIVITY_VEHICLE_TYPES } from "@/db/reports/reports";
import { getSessions, type Session } from "@/db/sessions/sessions";
import { cn } from "@/utils/cn";

import {
  DEFAULT_CRITERIA,
  PAGE_SIZE,
  REFERENCE_NOW,
  TYPE_ID,
  TYPE_META,
  filterSessions,
  formatInt,
  formatPeriod,
  formatPeriodWithTime,
  formatStay,
  getSummary,
  heatPeak,
  sortSessions,
  stayMinutes,
  toQuery,
  totalRows,
  type Criteria,
} from "./activity-stats";
import { downloadActivityXlsx, exportFileName, exportRows } from "./activity-export";
import { DateButton, Field, FieldSelect, type FieldOption } from "./field-select";
import { HeatGrid, HeatLegend } from "./heat-grid";
import { TypeChart, type ChartMode } from "./type-chart";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const FROM_TIMES: FieldOption[] = HOURS.map((h) => ({ id: `${pad(h)}:00`, label: `${pad(h)}:00` }));
const TO_TIMES: FieldOption[] = HOURS.map((h) => ({ id: `${pad(h)}:59`, label: `${pad(h)}:59` }));
const ALL_TYPES = "all";
const TYPE_OPTIONS: FieldOption[] = [
  { id: ALL_TYPES, label: "ทุกประเภท" },
  ...ACTIVITY_VEHICLE_TYPES.map((id) => ({ id, label: TYPE_META[id].label })),
];

const CHART_OPTIONS = [
  { value: "hour", label: "ตามชั่วโมง" },
  { value: "day", label: "ตามวัน" },
] as const;

const CARD = "rounded-xl border border-line bg-surface overflow-hidden";
const CARD_HEAD = "flex items-center gap-3 border-b border-line px-5 py-4";
const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4";

function Kpi({ icon: Icon, label, value, unit, sub }: { icon: LucideIcon; label: string; value: string; unit?: string; sub: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-4.5">
      <p className="flex items-center gap-2 text-body text-fg-2">
        <Icon size={16} aria-hidden className="shrink-0" />
        {label}
      </p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-kpi font-bold text-fg tabular-nums">{value}</span>
        {unit && <span className="text-body text-fg-2">{unit}</span>}
      </p>
      <p className="text-label text-fg-3 tabular-nums">{sub}</p>
    </div>
  );
}

/** Licence plate, small size: plate on top, province below (DESIGN-STYLE 8.3). */
function Plate({ plate, province }: { plate: string; province: string }) {
  return (
    <div className="flex w-24 flex-col items-center rounded-sm border-[1.5px] border-fg bg-surface px-2.5 pt-0.5 pb-0.75">
      <span className="text-body font-semibold text-fg">{plate}</span>
      <span className="max-w-full truncate text-nano font-medium text-fg-2">{province}</span>
    </div>
  );
}

function StatusBadge({ parked }: { parked: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.75 text-caption font-semibold",
        parked ? "bg-primary-soft text-primary" : "bg-subtle text-fg-2",
      )}
    >
      <span className={cn("size-1.5 rounded-full", parked ? "bg-primary" : "bg-fg-3")} aria-hidden="true" />
      {parked ? "จอดอยู่" : "ออกแล้ว"}
    </span>
  );
}

const exitText = (s: Session) =>
  s.exitAt === null ? null : s.exitAt.slice(0, 10) === s.entryAt.slice(0, 10) ? s.exitAt.slice(11) : s.exitAt;

export function ActivityLogView({ criteria, page }: { criteria: Criteria; page: number }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Criteria>(criteria);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [mode, setMode] = useState<ChartMode>("hour");
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const [exportToast, setExportToast] = useState({ open: false, done: false, description: "" });

  const filtered = filterSessions(getSessions(), criteria);
  const summary = getSummary(filtered, criteria);
  const total = totalRows(filtered, criteria, summary);
  const rows = sortSessions(filtered, order);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const peak = heatPeak(summary.heatGrid);
  const SortIcon = order === "desc" ? ArrowDown : ArrowUp;
  const periodText = formatPeriodWithTime(criteria);

  const go = (c: Criteria, p = 1) => router.push(`/activity-log${toQuery(c, p)}`, { scroll: false });
  const search = () => {
    // Times are whole-hour options, so a reversed pair is swapped rather than left to match nothing.
    const [fromTime, toTime] =
      draft.fromTime.slice(0, 2) > draft.toTime.slice(0, 2) ? [`${draft.toTime.slice(0, 2)}:00`, `${draft.fromTime.slice(0, 2)}:59`] : [draft.fromTime, draft.toTime];
    go({ ...draft, fromTime, toTime, q: draft.q.trim() });
  };
  const clear = () => {
    setDraft(DEFAULT_CRITERIA);
    go(DEFAULT_CRITERIA);
  };

  const range: DateRange = { start: parseDate(draft.from), end: parseDate(draft.to) };
  const applyRange = (r: DateRange) => {
    setDraft({ ...draft, from: r.start.toString(), to: r.end.toString() });
    setPickerOpen(false);
  };

  const exportExcel = async () => {
    if (exportingRef.current || rows.length === 0) return;
    exportingRef.current = true;
    setExporting(true);
    const snapshot = rows;
    const count = formatInt(snapshot.length);
    const fileName = exportFileName(criteria.from, criteria.to);
    const scope = formatPeriod(criteria.from, criteria.to);
    setExportToast({ open: true, done: false, description: `${count} รายการ · ${scope}` });
    try {
      const info = await exportActivityInfo();
      if (!info) {
        setExportToast((t) => ({ ...t, open: false }));
        return;
      }
      await downloadActivityXlsx(exportRows(snapshot), fileName);
      audit({
        actor: info.actor,
        role: info.role,
        ip: info.ip,
        device: info.device,
        action: "ส่งออก",
        page: "Activity Log",
        detail: `ส่งออก Excel · ${scope} (${count} รายการ)`,
        title: "ส่งออก Activity Log เป็น Excel",
        target: `Activity Log · ${scope}`,
        extras: [
          { label: "จำนวน", value: `${count} รายการ` },
          { label: "ไฟล์", value: fileName },
        ],
        result: "",
      });
      setExportToast({ open: true, done: true, description: fileName });
    } catch {
      setExportToast((t) => ({ ...t, open: false }));
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };

  const { kpis } = summary;
  const reference = parseDate(REFERENCE_NOW.slice(0, 10));
  const today = new CalendarDate(reference.year, reference.month, reference.day);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Activity Log</h1>
          <p className="text-body text-fg-2">รายการรถเข้า–ออกทุกคัน ช่วงเวลาหนาแน่น และประเภทรถที่เข้าใช้งาน</p>
        </div>
        {/* aria-disabled while busy (not `disabled`) so a keyboard user keeps focus; exportExcel ignores the click. */}
        <Button
          variant="secondary"
          icon={exporting ? undefined : Download}
          disabled={rows.length === 0}
          aria-busy={exporting}
          aria-disabled={exporting || undefined}
          onClick={exportExcel}
          className="ml-auto"
        >
          {exporting && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden />}
          Export Excel
        </Button>
      </div>

      <section className={CARD}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="flex items-end gap-3 px-5 py-4"
        >
          <div ref={dateRef} className="flex gap-3">
            <Field label="ตั้งแต่วันที่" className="w-44">
              <DateButton icon={Calendar} value={draft.from} onPress={() => setPickerOpen(true)} aria-label={`ตั้งแต่วันที่ ${draft.from}`} aria-haspopup="dialog" aria-expanded={pickerOpen} />
            </Field>
            <Field label="ถึงวันที่" className="w-44">
              <DateButton icon={Calendar} value={draft.to} onPress={() => setPickerOpen(true)} aria-label={`ถึงวันที่ ${draft.to}`} aria-haspopup="dialog" aria-expanded={pickerOpen} />
            </Field>
          </div>
          <Popover
            triggerRef={dateRef}
            isOpen={pickerOpen}
            onOpenChange={setPickerOpen}
            placement="bottom start"
            className="rounded-pop border border-line bg-surface shadow-pop outline-none"
          >
            <Dialog aria-label="ช่วงวันที่" className="outline-none">
              <DateRangePicker
                value={range}
                today={today}
                onApply={applyRange}
                onCancel={() => setPickerOpen(false)}
                label="ช่วงวันที่"
                startLabel="วันเริ่ม"
                endLabel="วันสิ้นสุด"
                previousLabel="เดือนก่อนหน้า"
                nextLabel="เดือนถัดไป"
                cancelLabel="ยกเลิก"
                applyLabel="ใช้ช่วงวันที่"
                startHint="คลิกวันเริ่ม แล้วคลิกวันสิ้นสุด"
                endHint={(s) => `เริ่ม ${s} · คลิกวันสิ้นสุด`}
              />
            </Dialog>
          </Popover>
          <FieldSelect label="ตั้งแต่เวลา" options={FROM_TIMES} value={draft.fromTime} onChange={(id) => setDraft({ ...draft, fromTime: id })} className="w-28" />
          <FieldSelect label="ถึงเวลา" options={TO_TIMES} value={draft.toTime} onChange={(id) => setDraft({ ...draft, toTime: id })} className="w-28" />
          <FieldSelect
            label="ประเภทรถ"
            options={TYPE_OPTIONS}
            value={draft.type}
            onChange={(id) => setDraft({ ...draft, type: id as Criteria["type"] })}
            className="w-40"
          />
          <Field label="ทะเบียน" className="w-44">
            <Input
              type="search"
              icon={Search}
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              placeholder="เช่น กข 1234"
              aria-label="ทะเบียน"
            />
          </Field>
          <Button variant="ghost" onClick={clear} className="ml-auto">
            ล้างตัวกรอง
          </Button>
          <Button type="submit" icon={Search}>
            ค้นหา
          </Button>
        </form>
        <div className="flex items-baseline gap-3 border-t border-line px-5 py-3 text-body">
          <span className="font-semibold text-fg tabular-nums">{formatInt(total)} รายการ</span>
          <span className="text-fg-2 tabular-nums">{periodText}</span>
          <span className="text-label text-fg-3">ค่าตั้งต้น: 7 วันล่าสุด</span>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4">
        <Kpi icon={LogIn} label="รถเข้า" value={formatInt(kpis.entries)} unit="คัน" sub={`เฉลี่ย ${formatInt(kpis.entriesPerDay)} คัน/วัน`} />
        <Kpi icon={LogOut} label="รถออก" value={formatInt(kpis.exits)} unit="คัน" sub="ในช่วงเวลาที่เลือก" />
        <Kpi icon={Car} label="จอดอยู่ตอนนี้" value={formatInt(kpis.parkedNow)} unit="คัน" sub="ยังไม่ออกจากที่จอด" />
        <Kpi icon={Timer} label="เวลาจอดเฉลี่ย" value={formatStay(kpis.avgStayMin)} sub={`จาก ${formatInt(kpis.avgStayBasis)} คันที่ออกแล้ว`} />
      </div>

      <section className={CARD}>
        <div className={CARD_HEAD}>
          <div className="flex flex-col gap-1">
            <h2 className="text-title font-semibold text-fg">ช่วงเวลาหนาแน่น</h2>
            <p className="text-label text-fg-2 tabular-nums">
              {peak.value > 0 && `หนาแน่นที่สุด ${peak.day} ${pad(peak.hour)}:00–${pad(peak.hour)}:59 เฉลี่ย ${peak.value.toFixed(1)} คัน/ชม. · `}
              ค่าในช่อง = จำนวนรถเข้าเฉลี่ยต่อชั่วโมง
            </p>
          </div>
          <HeatLegend />
        </div>
        <div className="px-5 py-4">
          <HeatGrid grid={summary.heatGrid} />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-4">
        <section className={cn(CARD, "col-span-2")}>
          <div className={CARD_HEAD}>
            <div className="flex flex-col gap-2.5">
              <h2 className="text-title font-semibold text-fg">ประเภทรถตามช่วงเวลา</h2>
              <ul className="flex items-center gap-4 text-body text-fg-2">
                {ACTIVITY_VEHICLE_TYPES.map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className={cn("size-2.5 rounded-xs", TYPE_META[t].dot)} aria-hidden="true" />
                    {TYPE_META[t].label}
                  </li>
                ))}
              </ul>
            </div>
            <SegmentedControl aria-label="มุมมองกราฟ" options={[...CHART_OPTIONS]} value={mode} onChange={setMode} className="ml-auto" />
          </div>
          <div className="px-5 py-4">
            <TypeChart summary={summary} mode={mode} />
          </div>
        </section>

        <section className={CARD}>
          <div className="flex flex-col gap-1 border-b border-line px-5 py-4">
            <h2 className="text-title font-semibold text-fg">สรุปตามประเภท</h2>
            <p className="text-label text-fg-2">จัดประเภทอัตโนมัติจากกล้องทางเข้า</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={cn(TH, "pr-0")}>ประเภท</th>
                <th scope="col" className={cn(TH, "px-2 text-right")}>คัน</th>
                <th scope="col" className={cn(TH, "px-2 text-right")}>สัดส่วน</th>
                <th scope="col" className={cn(TH, "text-right")}>จอดเฉลี่ย</th>
              </tr>
            </thead>
            <tbody>
              {summary.types.map((t) => (
                <tr key={t.id} className="border-b border-line">
                  <td className="h-11 py-2 pl-4 text-body text-fg">
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2.5 shrink-0 rounded-xs", TYPE_META[t.id].dot)} aria-hidden="true" />
                      {t.label}
                    </span>
                  </td>
                  <td className="px-2 text-right text-body text-fg tabular-nums">{formatInt(t.vehicles)}</td>
                  <td className="px-2 text-right text-body text-fg tabular-nums">{t.sharePct.toFixed(1)}%</td>
                  <td className="pr-4 text-right text-body whitespace-nowrap text-fg-2 tabular-nums">{formatStay(t.avgStayMin)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-subtle">
                <th scope="row" className="h-12 py-2 pl-4 text-left text-body font-semibold text-fg">รวม</th>
                <td className="px-2 text-right text-body font-semibold text-fg tabular-nums">{formatInt(summary.total.vehicles)}</td>
                <td className="px-2 text-right text-body font-semibold text-fg tabular-nums">{summary.total.sharePct}%</td>
                <td className="pr-4 text-right text-body font-semibold whitespace-nowrap text-fg tabular-nums">{formatStay(summary.total.avgStayMin)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>

      <section className={CARD}>
        <div className={CARD_HEAD}>
          <h2 className="text-title font-semibold text-fg">รายการเข้า–ออก</h2>
          <p className="ml-auto text-label text-fg-3">{order === "desc" ? "เรียงจากเข้าล่าสุด" : "เรียงจากเข้าเก่าสุด"}</p>
        </div>
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" aria-sort={order === "desc" ? "descending" : "ascending"} className={cn(TH, "w-40")}>
                <button
                  type="button"
                  onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
                  className="inline-flex items-center gap-1 rounded-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  เวลาเข้า
                  <SortIcon size={14} aria-hidden="true" />
                </button>
              </th>
              <th scope="col" className={cn(TH, "w-32")}>เวลาออก</th>
              <th scope="col" className={cn(TH, "w-44")}>ทะเบียน</th>
              <th scope="col" className={cn(TH, "w-36")}>ประเภทรถ</th>
              <th scope="col" className={cn(TH, "w-28")}>ช่องจอด</th>
              <th scope="col" className={TH}>ระยะเวลา</th>
              <th scope="col" className={cn(TH, "w-32 text-right")}>ค่าจอด</th>
              <th scope="col" className={cn(TH, "w-32")}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const out = exitText(s);
              return (
                <tr key={s.id} className="border-b border-line">
                  <td className={cn(TD, "text-body whitespace-nowrap text-fg tabular-nums")}>{s.entryAt}</td>
                  <td className={cn(TD, "text-body tabular-nums", out ? "text-fg" : "text-fg-3")}>{out ?? "—"}</td>
                  <td className={TD}>
                    <Plate plate={s.plate} province={s.province} />
                  </td>
                  <td className={TD}>
                    {s.vehicleType && (
                      <span className="flex items-center gap-2 text-body text-fg">
                        <span className={cn("size-2.5 shrink-0 rounded-xs", TYPE_META[TYPE_ID[s.vehicleType]].dot)} aria-hidden="true" />
                        {s.vehicleType}
                      </span>
                    )}
                  </td>
                  <td className={cn(TD, "text-body text-fg tabular-nums")}>{s.slot}</td>
                  <td className={cn(TD, "text-body text-fg tabular-nums")}>{formatStay(stayMinutes(s))}</td>
                  <td className={cn(TD, "text-right tabular-nums")}>
                    {s.fee === null ? (
                      <span className="text-label text-fg-3">ยังไม่ชำระ</span>
                    ) : (
                      <span className="text-body font-semibold text-fg">฿{formatInt(s.fee)}</span>
                    )}
                  </td>
                  <td className={TD}>
                    <StatusBadge parked={s.exitAt === null} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center gap-2.5 py-18">
                    <span className="grid size-14 place-items-center rounded-full bg-page text-fg-3">
                      <Search size={24} aria-hidden="true" />
                    </span>
                    <p className="text-lead font-semibold text-fg">ไม่พบรายการที่ตรงกับตัวกรอง</p>
                    <p className="text-body text-fg-2">ลองเปลี่ยนช่วงวันที่ เวลา หรือทะเบียน แล้วค้นหาอีกครั้ง</p>
                    <Button variant="secondary" size="sm" onClick={clear}>
                      ล้างตัวกรอง
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <footer className="flex items-center gap-3 px-5 py-3">
          <p className="text-label text-fg-3 tabular-nums">
            {rows.length === 0 ? "แสดง 0 จาก 0" : `แสดง ${start + 1}–${start + visible.length} จาก ${formatInt(total)}`}
          </p>
          {rows.length > 0 && (
            <Pagination
              page={current}
              pageCount={pageCount}
              onPageChange={(p) => go(criteria, p)}
              label="การแบ่งหน้า"
              previousLabel="หน้าก่อนหน้า"
              nextLabel="หน้าถัดไป"
              className="ml-auto"
            />
          )}
        </footer>
      </section>

      <Toast
        open={exportToast.open}
        placement="top-right"
        icon={exportToast.done ? CircleCheck : Download}
        iconClassName={exportToast.done ? "text-success" : "text-primary"}
        title={exportToast.done ? "สร้างไฟล์ Excel แล้ว" : "กำลังสร้างไฟล์ Excel"}
        description={exportToast.description}
        duration={exporting ? 60000 : undefined}
        onClose={() => setExportToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
