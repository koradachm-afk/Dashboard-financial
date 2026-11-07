"use client";

import {
  Accessibility,
  Calendar,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Coins,
  Crown,
  Download,
  LoaderCircle,
  Receipt,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { KpiCard, KpiDelta } from "@/components/tailgrids/core/kpi-card";
import { SegmentedControl } from "@/components/tailgrids/core/segmented-control";
import { Toast } from "@/components/tailgrids/core/toast";
import { audit } from "@/db/audit/audit";
import { exportFinancialInfo } from "@/db/audit/audit-actions";
import {
  FINANCIAL_SLOT_TYPES,
  getFinancial,
  type FinancialPeriod,
  type FinancialSlotType,
} from "@/db/reports/reports";
import { getSlotTypes } from "@/db/slot-types/slot-types";
import { cn } from "@/utils/cn";
import { formatBaht, formatInt } from "@/utils/format";

import { BreakdownList, type BreakdownRow } from "./breakdown-card";
import { downloadFinancialXlsx, exportFileName } from "./financial-export";
import { paymentRows } from "./payment-rows";
import { PaymentsTable } from "./payments-table";
import {
  CHART_TITLE,
  periodKey,
  periodsOf,
  resolvePeriod,
  untilLabel,
  VIEW_LABEL,
  VIEWS,
  type View,
} from "./period";
import { RevenueChart } from "./revenue-chart";

// Slot-type colours belong to icons only (DESIGN-STYLE 2.5), and Tailwind needs the full class names.
const TYPE_ICON: Record<FinancialSlotType, { icon: LucideIcon; className: string }> = {
  car: { icon: Car, className: "text-type-general" },
  ev: { icon: Zap, className: "text-type-ev" },
  accessible: { icon: Accessibility, className: "text-type-accessible" },
  vip: { icon: Crown, className: "text-type-vip" },
};

const VIEW_OPTIONS = VIEWS.map((value) => ({ value, label: VIEW_LABEL[value] }));
const PICKER_HEADER: Record<View, string> = { day: "เลือกวัน", month: "เลือกเดือน", year: "เลือกปี" };

const PICKER_LABEL = (key: string) => key;

const ICON_BUTTON = "size-8 px-0";

export function FinancialOverviewView({ initialView, initialKey }: { initialView: View; initialKey?: string }) {
  const [state, setState] = useState<{ view: View; period: FinancialPeriod }>(() => ({
    view: initialView,
    period: resolvePeriod(initialView, initialKey),
  }));
  const { view, period } = state;
  const data = getFinancial(period);
  const payments = paymentRows(period);

  const [exportToast, setExportToast] = useState({ open: false, done: false, description: "" });
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);

  // The view and period live in the URL (?view=month&period=2026-10) so a refresh or a shared link keeps them.
  const go = (nextView: View, next: FinancialPeriod) => {
    setState({ view: nextView, period: next });
    const params = new URLSearchParams({ view: nextView, period: periodKey(next) });
    window.history.replaceState(null, "", `?${params.toString()}`);
  };
  const changeView = (nextView: View) => go(nextView, resolvePeriod(nextView, periodKey(period)));

  const list = periodsOf(view);
  const index = list.findIndex((p) => periodKey(p) === periodKey(period));
  const older = list[index + 1];
  const newer = index > 0 ? list[index - 1] : undefined;

  if (!data) return null;
  const { kpis } = data;

  const slotNames = new Map(getSlotTypes().map((t) => [t.id, t.name]));
  const slotRows: BreakdownRow[] = FINANCIAL_SLOT_TYPES.map((id) => ({
    id,
    label: slotNames.get(id) ?? id,
    revenue: data.bySlotType[id],
    icon: TYPE_ICON[id].icon,
    iconClassName: TYPE_ICON[id].className,
  }));
  const durationRows: BreakdownRow[] = data.byDuration.map((d) => ({
    id: d.id,
    label: d.label,
    revenue: d.revenue,
    note: `${formatInt(d.count)} ครั้ง`,
  }));

  const exportExcel = async () => {
    if (exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    const count = formatInt(payments.length);
    const fileName = exportFileName(data);
    setExportToast({ open: true, done: false, description: `${count} รายการชำระ · ${data.label}` });
    try {
      const info = await exportFinancialInfo();
      if (!info) {
        setExportToast((t) => ({ ...t, open: false }));
        return;
      }
      await downloadFinancialXlsx(view, data, payments, fileName);
      audit({
        actor: info.actor,
        role: info.role,
        ip: info.ip,
        device: info.device,
        action: "ส่งออก",
        page: "Financial Overview",
        detail: `ส่งออก Excel · ${data.label} (${count} รายการชำระ)`,
        title: "ส่งออก Financial Overview เป็น Excel",
        target: `Financial Overview · ${data.label}`,
        extras: [
          { label: "จำนวน", value: `${count} รายการชำระ` },
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

  const until = untilLabel(view, period, data.series.points);
  const dateNote = `${formatInt(kpis.payments)} รายการ · ${data.label}`;

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Financial Overview</h1>
          <p className="text-body text-fg-2">รายรับค่าจอดทั้งหมดจากการชำระผ่าน PromptPay QR · ราคา 20 บาท/ชม.</p>
        </div>
        {/* aria-disabled while busy (not `disabled`) so a keyboard user keeps focus; exportExcel ignores the click. */}
        <Button
          variant="secondary"
          icon={exporting ? undefined : Download}
          aria-busy={exporting}
          aria-disabled={exporting || undefined}
          onClick={exportExcel}
          className="ml-auto"
        >
          {exporting && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden />}
          Export Excel
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-5 py-3">
        <SegmentedControl aria-label="มุมมอง" options={VIEW_OPTIONS} value={view} onChange={changeView} />
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          aria-label="ช่วงก่อนหน้า"
          disabled={!older}
          onClick={() => older && go(view, older)}
          className={ICON_BUTTON}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${PICKER_HEADER[view]} · ${data.label}`}
            className="flex h-9 min-w-54 cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg tabular-nums aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus data-focus-visible:border-focus data-focus-visible:ring-1 data-focus-visible:ring-focus"
          >
            <Calendar size={16} className="shrink-0 text-fg" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">{PICKER_LABEL(periodKey(period))}</span>
            <ChevronDown size={16} className="shrink-0 text-fg-2" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent placement="bottom start" className="min-w-(--trigger-width) p-1.5">
            <DropdownMenuHeader className="px-2.5 py-1 text-caption font-medium text-fg-3">{PICKER_HEADER[view]}</DropdownMenuHeader>
            {list.map((p) => {
              const key = periodKey(p);
              const on = key === periodKey(period);
              return (
                <DropdownMenuItem
                  key={key}
                  id={key}
                  textValue={key}
                  onAction={() => go(view, p)}
                  className={cn(
                    "h-9 gap-2.5 rounded-md px-2.5 text-body font-medium text-fg tabular-nums",
                    on && "bg-primary-soft font-semibold text-primary focus:text-primary",
                  )}
                >
                  <span className="truncate">{PICKER_LABEL(key)}</span>
                  {on && <Check size={16} aria-hidden className="ml-auto shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronRight}
          aria-label="ช่วงถัดไป"
          disabled={!newer}
          onClick={() => newer && go(view, newer)}
          className={ICON_BUTTON}
        />
        <span className="ml-auto text-lead font-semibold text-fg">{data.label}</span>
        {until && (
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-label font-medium text-primary tabular-nums">{until}</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={Wallet}
          label="รายรับรวม"
          value={formatBaht(kpis.revenue)}
          sub={<KpiDelta {...kpis.comparison.revenue} />}
        />
        <KpiCard
          icon={Receipt}
          label="รายการชำระ"
          value={formatInt(kpis.payments)}
          sub={<KpiDelta {...kpis.comparison.payments} />}
        />
        <KpiCard
          icon={Coins}
          label="ค่าจอดเฉลี่ยต่อครั้ง"
          value={formatBaht(kpis.avgFee)}
          sub={<KpiDelta {...kpis.comparison.avgFee} />}
        />
        <KpiCard
          icon={TrendingUp}
          label="ช่วงรายรับสูงสุด"
          value={kpis.peak.label}
          sub={`${formatBaht(kpis.peak.revenue)} · ${kpis.peak.sharePct.toFixed(1)}% ของรายรับ`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader title={CHART_TITLE[view]} description={`สูงสุด ${kpis.peak.label} · ${formatBaht(kpis.peak.revenue)}`} />
          <CardBody>
            <RevenueChart view={view} points={data.series.points} ariaLabel={`${CHART_TITLE[view]} ${data.label}`} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="แยกตามประเภทช่องจอด" />
          <CardBody className="flex flex-col gap-4">
            <BreakdownList rows={slotRows} />
            <hr className="border-line" />
            <h3 className="text-body font-semibold text-fg">ตามระยะเวลาจอด</h3>
            <BreakdownList rows={durationRows} />
          </CardBody>
        </Card>
      </div>

      <PaymentsTable rows={payments} total={kpis.payments} note={dateNote} />

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
