"use client";

import { ArrowDown, ArrowUp, Eye, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { MultiSelectFilter } from "@/components/tailgrids/core/multi-select-filter";
import { Toast } from "@/components/tailgrids/core/toast";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { RoleBadge } from "@/components/tailgrids/core/role-badge";
import { bestAccess } from "@/db/user/access";
import type { UserRow } from "@/db/user/users";
import { cn } from "@/utils/cn";

import { ACCESS_PAGES, AccessChips, AccessLegend } from "./access-chips";
import { AddUserModal } from "./add-user-modal";
import { DeleteUserDialog } from "./delete-user-dialog";
import { EditUserDrawer } from "./edit-user-drawer";

const PAGE_SIZE = 10;
const FILTER_LABEL = "สิทธิ์การเห็นหน้า";
const OPTIONS = ACCESS_PAGES.map(({ href, label, icon }) => ({ id: href, label, icon }));
const optionFor = (id: string) => ACCESS_PAGES.find((p) => p.href === id);

type Criteria = { query: string; pages: readonly string[] };
const EMPTY: Criteria = { query: "", pages: [] };

function matches(user: UserRow, { query, pages }: Criteria): boolean {
  const q = query.toLowerCase();
  if (q && !user.username.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) return false;
  // Any-of. bestAccess treats a Superadmin as "edit" everywhere, so they always pass.
  if (pages.length === 0) return true;
  return pages.some((id) => {
    const item = optionFor(id);
    return item !== undefined && bestAccess(user, item.pages) !== "none";
  });
}

function summary(pages: readonly string[]): string {
  if (pages.length === 0) return "ทุกหน้า";
  if (pages.length === 1) return optionFor(pages[0])?.label ?? "";
  return `${pages.length} หน้า`;
}

const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4";
const ICON_BUTTON =
  "grid size-8 place-items-center rounded-md text-fg-2 transition-colors hover:bg-subtle disabled:pointer-events-none disabled:text-fg-3";

export function UsersView({ users, currentUserId }: { users: readonly UserRow[]; currentUserId: string }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [draftPages, setDraftPages] = useState<readonly string[]>([]);
  const [applied, setApplied] = useState<Criteria>(EMPTY);
  const [sort, setSort] = useState<"descending" | "ascending">("descending");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState({ title: "", id: 0, open: false });
  // One toast for the page; the id restarts its countdown when a second success follows the first.
  const notify = (title: string) => setToast((t) => ({ title, id: t.id + 1, open: true }));

  const apply = (next: Criteria) => {
    setApplied(next);
    setPage(1); // Pagination does not clamp, so any change of the result set starts over.
  };
  const clear = () => {
    setDraftQuery("");
    setDraftPages([]);
    apply(EMPTY);
  };
  const removePage = (id: string) => {
    const pages = applied.pages.filter((p) => p !== id);
    setDraftPages(pages);
    apply({ ...applied, pages });
  };

  const rows = users
    .filter((u) => matches(u, applied))
    .sort((a, b) =>
      sort === "descending" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt),
    );
  const total = rows.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const SortIcon = sort === "descending" ? ArrowDown : ArrowUp;

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">User &amp; Permissions</h1>
          <p className="text-body text-fg-2">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงแต่ละหน้า · เฉพาะ Superadmin</p>
        </div>
        <Button icon={UserPlus} onClick={() => setAdding(true)} className="ml-auto">
          เพิ่มผู้ใช้
        </Button>
      </div>

      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ query: draftQuery.trim(), pages: draftPages });
          }}
          className="flex items-center gap-3 border-b border-line bg-subtle p-4"
        >
          <Input
            type="search"
            icon={Search}
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="ค้นหา username หรือ email"
            aria-label="ค้นหา username หรือ email"
            className="w-90"
          />
          <MultiSelectFilter
            label={FILTER_LABEL}
            icon={Eye}
            summary={summary(draftPages)}
            options={OPTIONS}
            selected={draftPages}
            onChange={setDraftPages}
            hint="แสดงผู้ใช้ที่มีสิทธิ์ แก้ไขได้ อย่างน้อย 1 หน้าที่เลือก"
            clearLabel="ล้างที่เลือก"
            clearHint="กด “ค้นหา” เพื่อกรอง"
            className="w-75"
          />
          <Button variant="ghost" onClick={clear} className="ml-auto">
            ล้างตัวกรอง
          </Button>
          <Button type="submit" icon={Search}>
            ค้นหา
          </Button>
        </form>

        {applied.pages.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <p className="text-body font-semibold text-fg">พบ {total} คน</p>
            <p className="text-body text-fg-2">จากเงื่อนไข</p>
            {applied.pages.map((id) => {
              const item = optionFor(id);
              if (!item) return null;
              const Icon = item.icon;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`นำ ${item.label} ออกจากตัวกรอง`}
                  onClick={() => removePage(id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-0.75 pr-2 pl-2.5 text-label font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  <Icon size={12} aria-hidden="true" />
                  {item.label}
                  <X size={12} aria-hidden="true" />
                </button>
              );
            })}
            <p className="text-label text-fg-3">· Superadmin เข้าถึงได้ทุกหน้า จึงแสดงด้วยเสมอ</p>
          </div>
        )}

        <div className="flex-1">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={cn(TH, "w-57.5")}>Username</th>
                <th scope="col" className={cn(TH, "w-62.5")}>Email</th>
                <th scope="col" className={cn(TH, "w-35")}>Role</th>
                <th scope="col" className={cn(TH, "w-67.5")}>สิทธิ์การเข้าถึง</th>
                <th scope="col" aria-sort={sort} className={cn(TH, "w-37.5")}>
                  <button
                    type="button"
                    onClick={() => setSort(sort === "descending" ? "ascending" : "descending")}
                    className="inline-flex items-center gap-1 rounded-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    สร้างเมื่อ
                    <SortIcon size={14} aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className={cn(TH, "w-24 text-right")}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const me = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-line">
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          username={u.username}
                          className={cn(
                            "size-8 text-label",
                            me ? "bg-primary text-on-primary" : "bg-primary-soft text-primary",
                          )}
                        />
                        <span className="min-w-0 truncate text-control font-medium text-fg">{u.username}</span>
                        {me && (
                          <span className="shrink-0 rounded-full bg-page px-1.5 py-px text-caption font-medium text-fg-2">
                            คุณ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={cn(TD, "truncate text-body text-fg-2")}>{u.email}</td>
                    <td className={TD}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className={TD}>
                      <AccessChips user={u} />
                    </td>
                    <td className={cn(TD, "whitespace-nowrap text-body text-fg tabular-nums")}>{u.createdAt}</td>
                    <td className={TD}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`แก้ไข ${u.username}`}
                          onClick={() => setEditing(u)}
                          className={ICON_BUTTON}
                        >
                          <Pencil size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`ลบ ${u.username}`}
                          disabled={me}
                          onClick={() => setDeleting(u)}
                          className={ICON_BUTTON}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {total === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center gap-2.5 py-18">
                      <span className="grid size-14 place-items-center rounded-full bg-page text-fg-3">
                        <Search size={24} aria-hidden="true" />
                      </span>
                      {applied.query && (
                        <p className="text-lead font-semibold text-fg">ไม่พบผู้ใช้ที่ตรงกับ “{applied.query}”</p>
                      )}
                      <p className="text-body text-fg-2">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูผู้ใช้ทั้งหมด</p>
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
          <AccessLegend />
          <p className="ml-auto text-body text-fg-2 tabular-nums">
            {total === 0
              ? "แสดง 0 จาก 0 คน"
              : `แสดง ${start + 1}–${start + visible.length} จาก ${total} คน`}
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

      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} onDone={notify} />
      <EditUserDrawer user={editing} currentUserId={currentUserId} onClose={() => setEditing(null)} onDone={notify} />
      <AddUserModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onCreate={(created) => {
          setAdding(false);
          notify(`เพิ่มผู้ใช้ ${created.username} แล้ว`);
          // Spec Q1: a new Admin goes straight on to permissions.
          if (created.role === "admin") setEditing(created);
        }}
      />
      <Toast
        open={toast.open}
        messageId={toast.id}
        title={toast.title}
        description="บันทึกลง Audit Logs เรียบร้อย"
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
