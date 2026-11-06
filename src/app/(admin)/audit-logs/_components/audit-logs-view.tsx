"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Download,
  Filter,
  Flame,
  History,
  LayoutDashboard,
  Lock,
  Map,
  Search,
  Settings,
  ShieldCheck,
  User,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { MultiSelectFilter } from "@/components/tailgrids/core/multi-select-filter";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { AUDIT_ACTIONS, useAuditLog, type AuditEntry } from "@/db/audit/audit";
import { cn } from "@/utils/cn";

import { ActionBadge } from "./action-badge";
import { FilterSelect } from "./filter-select";

const PAGE_SIZE = 10;

type Preset = "today" | "7d" | "30d" | "month";
const PRESETS: readonly { id: Preset; label: string }[] = [
  { id: "today", label: "วันนี้" },
  { id: "7d", label: "7 วันล่าสุด" },
  { id: "30d", label: "30 วันล่าสุด" },
  { id: "month", label: "เดือนนี้" },
];
const presetLabel = (id: Preset) => PRESETS.find((p) => p.id === id)?.label ?? "";
// "ใน" + preset; Figma puts a space only before a digit ("ใน 7 วันล่าสุด", "ในวันนี้").
const inRange = (label: string) => (/^\d/.test(label) ? `ใน ${label}` : `ใน${label}`);

const ALL_PAGES = "all";
// Menu order and icons follow Figma 08.9.
const PAGES: readonly { id: string; icon: LucideIcon }[] = [
  { id: "การเข้าสู่ระบบ", icon: Lock },
  { id: "บัญชีของฉัน", icon: User },
  { id: "Parking Layout", icon: Map },
  { id: "Financial Overview", icon: Wallet },
  { id: "Activity Log", icon: Activity },
  { id: "Parking Heat Map", icon: Flame },
  { id: "User & Permissions", icon: ShieldCheck },
  { id: "System Settings", icon: Settings },
  { id: "Audit Logs", icon: History },
];
const PAGE_OPTIONS = [
  { id: ALL_PAGES, label: "ทุกหน้า", icon: LayoutDashboard },
  ...PAGES.map(({ id, icon }) => ({ id, label: id, icon })),
];
const pageIcon = (name: string) => PAGES.find((p) => p.id === name)?.icon;

const ACTION_OPTIONS = AUDIT_ACTIONS.map((a) => ({ id: a, label: a, content: <ActionBadge action={a} /> }));

type Criteria = { query: string; preset: Preset; page: string; actions: readonly string[] };
const DEFAULTS: Criteria = { query: "", preset: "7d", page: ALL_PAGES, actions: [] };

const pad = (n: number) => String(n).padStart(2, "0");

/** The first instant of the preset, formatted like AuditEntry.time so strings compare in order. */
function since(preset: Preset, now: Date): string {
  const back = { today: 0, "7d": 6, "30d": 29, month: 0 }[preset];
  const d =
    preset === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`;
}

function matches(e: AuditEntry, c: Criteria, from: string): boolean {
  if (e.time < from) return false;
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

const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4";

export function AuditLogsView({ canExport, now }: { canExport: boolean; now?: Date }) {
  const entries = useAuditLog();
  const clock = () => now ?? new Date();

  const [draft, setDraft] = useState<Criteria>(DEFAULTS);
  const [applied, setApplied] = useState<Criteria>(DEFAULTS);
  // The clock is read when filters apply, not on every render, so a result does not shift under the user.
  const [from, setFrom] = useState(() => since(DEFAULTS.preset, clock()));
  const [sort, setSort] = useState<"descending" | "ascending">("descending");
  const [page, setPage] = useState(1);

  const apply = (next: Criteria) => {
    setApplied(next);
    setFrom(since(next.preset, clock()));
    setPage(1); // Pagination does not clamp, so any change of the result set starts over.
  };
  const clear = () => {
    setDraft(DEFAULTS);
    apply(DEFAULTS);
  };
  const removeAction = (action: string) => {
    const actions = applied.actions.filter((a) => a !== action);
    setDraft((d) => ({ ...d, actions }));
    apply({ ...applied, actions });
  };

  const rows = entries
    .filter((e) => matches(e, applied, from))
    .sort((a, b) => (sort === "descending" ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time)));
  const total = rows.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const SortIcon = sort === "descending" ? ArrowDown : ArrowUp;
  const range = presetLabel(applied.preset);

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Audit Logs</h1>
          <p className="text-body text-fg-2">ประวัติการเปลี่ยนแปลงทั้งหมดในระบบ · บันทึกอัตโนมัติ แก้ไขหรือลบไม่ได้</p>
        </div>
        {canExport ? (
          // No handler yet: Export Excel is wired in a later branch.
          <Button variant="secondary" icon={Download} className="ml-auto">
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
          <FilterSelect
            icon={Calendar}
            text={presetLabel(draft.preset)}
            header="ช่วงวันที่"
            options={PRESETS}
            selected={draft.preset}
            onSelect={(id) => setDraft({ ...draft, preset: id as Preset })}
            disabledOption={{ label: "กำหนดช่วงเอง…", icon: Calendar }}
            className="w-45"
          />
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
            <p className="text-body text-fg-2">{inRange(range)}</p>
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
                  <tr key={e.id} className="border-b border-line">
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
                      {/* The detail drawer comes in ui/audit-logs-detail; no click handler yet. */}
                      <ChevronRight size={18} aria-hidden="true" className="ml-auto text-fg-2" />
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
                      <p className="text-lead font-semibold text-fg">ไม่พบเหตุการณ์{inRange(range)}</p>
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
    </div>
  );
}
