"use client";

import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  CircleCheck,
  Download,
  Filter,
  History,
  LayoutDashboard,
  LoaderCircle,
  Lock,
  Search,
  X,
} from "lucide-react";
import { CalendarDate } from "@internationalized/date";
import { useEffect, useRef, useState } from "react";
import { Dialog, Popover } from "react-aria-components";

import { Avatar } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import {
  DateRangePicker,
  formatDateRange,
  type DateRange,
} from "@/components/tailgrids/core/date-range-picker";
import { Input } from "@/components/tailgrids/core/input";
import { Toast } from "@/components/tailgrids/core/toast";
import { MultiSelectFilter } from "@/components/tailgrids/core/multi-select-filter";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { AUDIT_ACTIONS, audit, useAuditLog, type AuditEntry } from "@/db/audit/audit";
import { exportAuditInfo } from "@/db/audit/audit-actions";
import { cn } from "@/utils/cn";

import { ActionBadge } from "./action-badge";
import { AuditDetailDrawer } from "./audit-detail-drawer";
import { downloadAuditXlsx, exportFileName, exportRows } from "./audit-export";
import { FilterSelect } from "./filter-select";
import { PAGES, pageIcon } from "./page-icons";

const PAGE_SIZE = 10;

type Preset = "today" | "7d" | "30d" | "month" | "custom";
const PRESETS: readonly { id: Preset; label: string }[] = [
  { id: "today", label: "วันนี้" },
  { id: "7d", label: "7 วันล่าสุด" },
  { id: "30d", label: "30 วันล่าสุด" },
  { id: "month", label: "เดือนนี้" },
];
const CUSTOM_LABEL = "กำหนดช่วงเอง";
const presetLabel = (id: Preset) => (id === "custom" ? CUSTOM_LABEL : (PRESETS.find((p) => p.id === id)?.label ?? ""));
// "ใน" + preset; Figma puts a space only before a digit ("ใน 7 วันล่าสุด", "ในวันนี้").
const inRange = (label: string) => (/^\d/.test(label) ? `ใน ${label}` : `ใน${label}`);

const ALL_PAGES = "all";
const PAGE_OPTIONS = [
  { id: ALL_PAGES, label: "ทุกหน้า", icon: LayoutDashboard },
  ...PAGES.map(({ id, icon }) => ({ id, label: id, icon })),
];

const ACTION_OPTIONS = AUDIT_ACTIONS.map((a) => ({ id: a, label: a, content: <ActionBadge action={a} /> }));

type Criteria = {
  query: string;
  preset: Preset;
  /** Used only while `preset` is "custom". */
  range: DateRange | null;
  page: string;
  actions: readonly string[];
};
const DEFAULTS: Criteria = { query: "", preset: "7d", range: null, page: ALL_PAGES, actions: [] };

const pad = (n: number) => String(n).padStart(2, "0");

/** Both ends are formatted like AuditEntry.time so strings compare in order. `to` is null for open-ended presets. */
type Bounds = { from: string; to: string | null };

function bounds(c: Criteria, now: Date): Bounds {
  if (c.preset === "custom" && c.range) {
    return { from: `${c.range.start} 00:00:00`, to: `${c.range.end} 23:59:59` };
  }
  const back = { today: 0, "7d": 6, "30d": 29, month: 0, custom: 6 }[c.preset];
  const d =
    c.preset === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  return { from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`, to: null };
}

function matches(e: AuditEntry, c: Criteria, b: Bounds): boolean {
  if (e.time < b.from || (b.to !== null && e.time > b.to)) return false;
  if (c.page !== ALL_PAGES && e.page !== c.page) return false;
  if (c.actions.length > 0 && !c.actions.includes(e.action)) return false;
  const q = c.query.toLowerCase();
  return !q || e.detail.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q);
}

// Zero selected = every action; one = its name; more = a count.
const actionSummary = (actions: readonly string[]) =>
  actions.length === 0 ? "ทั้งหมด" : actions.length === 1 ? actions[0] : `${actions.length} แบบ`;

const isDefault = (c: Criteria) =>
  c.query === "" && c.preset === DEFAULTS.preset && c.page === ALL_PAGES && c.actions.length === 0;

const bare = (id: string) => id.replace(/^#/, "");

const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4";

export function AuditLogsView({
  canExport,
  now,
  initialId,
}: {
  canExport: boolean;
  now?: Date;
  /** From `?id=`: opens that entry's drawer, even when the filters hide its row. */
  initialId?: string;
}) {
  const entries = useAuditLog();
  const clock = () => now ?? new Date();

  const [draft, setDraft] = useState<Criteria>(DEFAULTS);
  const [applied, setApplied] = useState<Criteria>(DEFAULTS);
  // The clock is read when filters apply, not on every render, so a result does not shift under the user.
  const [span, setSpan] = useState(() => bounds(DEFAULTS, clock()));
  const [sort, setSort] = useState<"descending" | "ascending">("descending");
  const [page, setPage] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  // The open entry is kept as an id and looked up in the full log on every render, so a stored entry that
  // arrives after hydration still opens for ?id=. Closing clears the id, so it never reopens.
  const [openId, setOpenId] = useState<string | null>(() => (initialId ? bare(initialId) : null));
  const chevrons = useRef(new Map<string, HTMLButtonElement>());
  const restoreId = useRef<string | null>(null);
  const [toast, setToast] = useState({ title: "", id: 0, open: false });
  const [exportToast, setExportToast] = useState({ open: false, done: false, description: "" });
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const opened = openId === null ? null : (entries.find((e) => bare(e.id) === openId) ?? null);

  const closeDetail = () => {
    restoreId.current = openId;
    setOpenId(null);
  };
  // Focus goes back to the row's chevron once the drawer has released it; a ?id= entry with no visible row is skipped.
  useEffect(() => {
    if (openId !== null || restoreId.current === null) return;
    const btn = chevrons.current.get(restoreId.current);
    restoreId.current = null;
    if (!btn) return;
    const t = setTimeout(() => btn.focus(), 0);
    return () => clearTimeout(t);
  }, [openId]);
  const copyLink = (e: AuditEntry) => {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/audit-logs?id=${bare(e.id)}`)
      .then(() => setToast((t) => ({ title: "คัดลอกลิงก์แล้ว", id: t.id + 1, open: true })))
      .catch(() => {});
  };

  const apply = (next: Criteria) => {
    setApplied(next);
    setSpan(bounds(next, clock()));
    setPage(1); // Pagination does not clamp, so any change of the result set starts over.
  };
  const clear = () => {
    setDraft(DEFAULTS);
    apply(DEFAULTS);
  };
  const removeDate = () => {
    setDraft((d) => ({ ...d, preset: DEFAULTS.preset }));
    apply({ ...applied, preset: DEFAULTS.preset });
  };
  const applyRange = (range: DateRange) => {
    const next: Criteria = { ...draft, query: draft.query.trim(), preset: "custom", range };
    setDraft(next);
    apply(next);
    setPickerOpen(false);
  };
  const removePage = () => {
    setDraft((d) => ({ ...d, page: ALL_PAGES }));
    apply({ ...applied, page: ALL_PAGES });
  };
  const removeAction = (action: string) => {
    const actions = applied.actions.filter((a) => a !== action);
    setDraft((d) => ({ ...d, actions }));
    apply({ ...applied, actions });
  };

  const rows = entries
    .filter((e) => matches(e, applied, span))
    .sort((a, b) => (sort === "descending" ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time)));
  const total = rows.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const SortIcon = sort === "descending" ? ArrowDown : ArrowUp;
  const customRange = applied.preset === "custom" && applied.range ? formatDateRange(applied.range.start, applied.range.end) : null;
  // Chip and menu name of the applied date range, and the result-bar wording (Spec Q3, Figma 08.1 / 08.6).
  const rangeName = customRange ?? presetLabel(applied.preset);
  const dateText =
    customRange !== null
      ? `วันที่ ${customRange}`
      : applied.preset === "today"
        ? `วันที่ ${span.from.slice(0, 10)}`
        : inRange(rangeName);
  const hasCondition = applied.page !== ALL_PAGES || applied.actions.length > 0;
  const today = clock();

  // Spec Q5: the steps run in this order, and the busy guard stops a second run before the first ends.
  const exportExcel = async () => {
    if (exportingRef.current || total === 0) return;
    exportingRef.current = true;
    setExporting(true);
    const snapshot = rows;
    const count = total.toLocaleString("th-TH");
    const from = span.from.slice(0, 10);
    const to = span.to?.slice(0, 10) ?? `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const fileName = exportFileName(from, to);
    setExportToast({ open: true, done: false, description: `${count} รายการ · ${rangeName}` });
    try {
      const info = await exportAuditInfo();
      if (!info) {
        setExportToast((t) => ({ ...t, open: false }));
        return;
      }
      await downloadAuditXlsx(exportRows(snapshot), fileName);
      audit({
        actor: info.actor,
        role: info.role,
        ip: info.ip,
        device: info.device,
        action: "ส่งออก",
        page: "Audit Logs",
        detail: `ส่งออก Excel · ${rangeName} (${count} รายการ)`,
        title: "ส่งออก Audit Logs เป็น Excel",
        target: `Audit Logs · ${rangeName}`,
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

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Audit Logs</h1>
          <p className="text-body text-fg-2">ประวัติการเปลี่ยนแปลงทั้งหมดในระบบ · บันทึกอัตโนมัติ แก้ไขหรือลบไม่ได้</p>
        </div>
        {canExport ? (
          // aria-disabled while busy (not `disabled`) so a keyboard user keeps focus; exportExcel ignores the click.
          <Button
            variant="secondary"
            icon={exporting ? undefined : Download}
            disabled={total === 0}
            aria-busy={exporting}
            aria-disabled={exporting || undefined}
            onClick={exportExcel}
            className="ml-auto"
          >
            {exporting && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden />}
            Export Excel
          </Button>
        ) : (
          <p className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 text-label text-fg-2">
            <Lock size={14} aria-hidden="true" className="shrink-0" />
            สิทธิ์ดูอย่างเดียว · Export ต้องมีสิทธิ์แก้ไข
          </p>
        )}
      </div>

      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ ...draft, query: draft.query.trim() });
          }}
          className="flex items-center gap-3 border-b border-line bg-subtle p-4"
        >
          <Input
            type="search"
            icon={Search}
            value={draft.query}
            onChange={(e) => setDraft({ ...draft, query: e.target.value })}
            placeholder="ค้นหารายละเอียด หรือ username"
            aria-label="ค้นหารายละเอียด หรือ username"
            className="w-65"
          />
          <div ref={dateRef} className="w-45">
            <FilterSelect
              icon={Calendar}
              text={presetLabel(draft.preset)}
              header="ช่วงวันที่"
              options={PRESETS.filter((p) => p.id !== "custom")}
              selected={draft.preset}
              onSelect={(id) => setDraft({ ...draft, preset: id as Preset })}
              customOption={{ id: "custom", label: "กำหนดช่วงเอง…", icon: Calendar, onAction: () => setPickerOpen(true) }}
              className="w-full"
            />
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
                value={draft.range}
                today={new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())}
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
                endHint={(start) => `เริ่ม ${start} · คลิกวันสิ้นสุด`}
              />
            </Dialog>
          </Popover>
          <FilterSelect
            icon={LayoutDashboard}
            text={`หน้า: ${PAGE_OPTIONS.find((p) => p.id === draft.page)?.label ?? ""}`}
            header="หน้า"
            options={PAGE_OPTIONS}
            selected={draft.page}
            onSelect={(id) => setDraft({ ...draft, page: id })}
            className="w-47.5"
          />
          <MultiSelectFilter
            label="การกระทำ"
            icon={Filter}
            summary={actionSummary(draft.actions)}
            options={ACTION_OPTIONS}
            selected={draft.actions}
            onChange={(actions) => setDraft({ ...draft, actions })}
            hint="การกระทำ (เลือกได้หลายแบบ)"
            clearLabel="ล้างที่เลือก"
            applyLabel="ใช้ตัวกรอง"
            onApply={() => apply({ ...draft, query: draft.query.trim() })}
            className="w-47.5"
          />
          <Button variant="ghost" onClick={clear} className="ml-auto">
            ล้างตัวกรอง
          </Button>
          <Button type="submit" icon={Search}>
            ค้นหา
          </Button>
        </form>

        {!isDefault(applied) && (
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <p className="text-body font-semibold text-fg">พบ {total} รายการ</p>
            <p className="text-body text-fg-2">
              {dateText}
              {hasCondition && " จากเงื่อนไข"}
            </p>
            {applied.preset !== DEFAULTS.preset && (
              <button
                type="button"
                aria-label={`นำ ${rangeName} ออกจากตัวกรอง`}
                onClick={removeDate}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-0.75 pr-2 pl-2.5 text-label font-medium text-primary transition-colors hover:text-primary-hover"
              >
                <Calendar size={12} aria-hidden="true" />
                {rangeName}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {applied.page !== ALL_PAGES && (
              <button
                type="button"
                aria-label={`นำ ${applied.page} ออกจากตัวกรอง`}
                onClick={removePage}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-0.75 pr-2 pl-2.5 text-label font-medium text-primary transition-colors hover:text-primary-hover"
              >
                {(() => {
                  const Icon = pageIcon(applied.page);
                  return Icon ? <Icon size={12} aria-hidden="true" /> : null;
                })()}
                {applied.page}
                <X size={12} aria-hidden="true" />
              </button>
            )}
            {applied.actions.map((action) => (
              <button
                key={action}
                type="button"
                aria-label={`นำ ${action} ออกจากตัวกรอง`}
                onClick={() => removeAction(action)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-0.75 pr-2 pl-2.5 text-label font-medium text-primary transition-colors hover:text-primary-hover"
              >
                <Filter size={12} aria-hidden="true" />
                {action}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        <div className="flex-1">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" aria-sort={sort} className={cn(TH, "w-44")}>
                  <button
                    type="button"
                    onClick={() => setSort(sort === "descending" ? "ascending" : "descending")}
                    className="inline-flex items-center gap-1 rounded-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    เวลา
                    <SortIcon size={14} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className={cn(TH, "w-49")}>ผู้กระทำ</th>
                <th scope="col" className={cn(TH, "w-32")}>การกระทำ</th>
                <th scope="col" className={cn(TH, "w-46")}>หน้า</th>
                <th scope="col" className={TH}>รายละเอียด</th>
                <th scope="col" className={cn(TH, "w-16")}>
                  <span className="sr-only">ดูรายละเอียด</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const PageIcon = pageIcon(e.page);
                return (
                  <tr
                    key={e.id}
                    onClick={() => setOpenId(bare(e.id))}
                    className={cn(
                      "cursor-pointer border-b border-line transition-colors",
                      opened?.id === e.id && "bg-primary-soft",
                    )}
                  >
                    <td className={TD}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-body whitespace-nowrap text-fg tabular-nums">{e.time}</span>
                        <span className="text-caption text-fg-3 tabular-nums">IP {e.ip}</span>
                      </div>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          username={e.actor}
                          className={cn(
                            "size-7 text-caption",
                            e.role === "Superadmin" ? "bg-primary text-on-primary" : "bg-primary-soft text-primary",
                          )}
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-body font-medium text-fg">{e.actor}</span>
                          {e.role && <span className="text-caption text-fg-3">{e.role}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <ActionBadge action={e.action} />
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-2">
                        {PageIcon && <PageIcon size={16} aria-hidden="true" className="shrink-0 text-fg-2" />}
                        <span className="truncate text-body text-fg">{e.page}</span>
                      </div>
                    </td>
                    <td className={cn(TD, "truncate text-body text-fg")}>{e.detail}</td>
                    <td className={TD}>
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) chevrons.current.set(bare(e.id), el);
                          else chevrons.current.delete(bare(e.id));
                        }}
                        aria-label={`ดูรายละเอียด ${e.id}`}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setOpenId(bare(e.id));
                        }}
                        className="ml-auto flex rounded-xs text-fg-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {total === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-2.5 py-18">
                      <span className="grid size-14 place-items-center rounded-full bg-page text-fg-3">
                        <History size={24} aria-hidden="true" />
                      </span>
                      <p className="text-lead font-semibold text-fg">{customRange ? `ไม่พบเหตุการณ์ในช่วง ${customRange}` : `ไม่พบเหตุการณ์${inRange(rangeName)}`}</p>
                      <p className="text-body text-fg-2">ลองเปลี่ยนช่วงวันที่ หรือล้างตัวกรองเพื่อดูเหตุการณ์ทั้งหมด</p>
                      <Button variant="secondary" size="sm" onClick={clear}>
                        ล้างตัวกรอง
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center gap-3 border-t border-line px-4 py-3">
          <p className="flex items-center gap-1.5 text-label text-fg-3">
            <History size={14} aria-hidden="true" className="shrink-0" />
            เก็บประวัติทุกเหตุการณ์ · log แก้ไขหรือลบไม่ได้
          </p>
          <p className="ml-auto text-body text-fg-2 tabular-nums">
            {total === 0 ? "แสดง 0 จาก 0 รายการ" : `แสดง ${start + 1}–${start + visible.length} จาก ${total} รายการ`}
          </p>
          {total > 0 && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
              label="การแบ่งหน้า"
              previousLabel="หน้าก่อนหน้า"
              nextLabel="หน้าถัดไป"
            />
          )}
        </footer>
      </section>
      <AuditDetailDrawer entry={opened} onClose={closeDetail} onCopyLink={copyLink} />
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
      <Toast
        open={toast.open}
        messageId={toast.id}
        title={toast.title}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
