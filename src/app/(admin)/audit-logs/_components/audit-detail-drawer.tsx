"use client";

import { Copy, Lock, X } from "lucide-react";
import { createElement, useState, type ReactNode } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { RoleBadge } from "@/components/tailgrids/core/role-badge";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";
import type { AuditEntry } from "@/db/audit/audit";
import { cn } from "@/utils/cn";

import { ActionBadge } from "./action-badge";
import { pageIcon } from "./page-icons";

// Figma 08.2 has no label for the close X; "ปิด" matches the edit user drawer.
const CLOSE_LABEL = "ปิด";

const CHIP = "inline-flex items-center rounded-md px-2 py-0.75 text-label font-medium";
const TH = "h-9 px-3 text-left text-label font-semibold text-fg-2";
const TD = "h-11 px-3 text-body text-fg";

/**
 * 08.2 event detail drawer. Open while `entry` is set.
 * "คัดลอกลิงก์" reports the entry through `onCopyLink`; the caller builds the URL and shows the toast.
 */
export function AuditDetailDrawer({
  entry,
  onClose,
  onCopyLink,
}: {
  entry: AuditEntry | null;
  onClose: () => void;
  onCopyLink: (entry: AuditEntry) => void;
}) {
  // Keep the last entry so the content stays put while the drawer slides out.
  const [shown, setShown] = useState(entry);
  if (entry && entry !== shown) setShown(entry);

  return (
    <Sheet isOpen={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetOverlay>
        <SheetContent showCloseButton={false} className="w-130 max-w-full gap-0 p-0 sm:max-w-130">
          {shown && <Detail entry={shown} onClose={onClose} onCopyLink={onCopyLink} />}
        </SheetContent>
      </SheetOverlay>
    </Sheet>
  );
}

function Detail({
  entry,
  onClose,
  onCopyLink,
}: {
  entry: AuditEntry;
  onClose: () => void;
  onCopyLink: (entry: AuditEntry) => void;
}) {
  const icon = pageIcon(entry.page);
  const changes = entry.changes ?? [];

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 border-b border-line pt-5 pr-4 pb-5 pl-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <SheetTitle className="text-lead leading-normal font-bold">รายละเอียดเหตุการณ์</SheetTitle>
          <p className="text-label text-fg-3">{entry.id}</p>
        </div>
        <SheetClose
          aria-label={CLOSE_LABEL}
          className="grid size-8 shrink-0 place-items-center rounded-md text-fg-2 transition-colors hover:bg-subtle data-focus-visible:ring-2 data-focus-visible:ring-focus"
        >
          <X size={18} aria-hidden />
        </SheetClose>
      </SheetHeader>

      <SheetBody className="mx-0 flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <ActionBadge action={entry.action} />
          <span className="inline-flex items-center gap-1.5 rounded-md bg-page px-2 py-0.75 text-label font-medium text-fg-2">
            {icon && createElement(icon, { size: 14, "aria-hidden": true, className: "shrink-0" })}
            {entry.page}
          </span>
        </div>

        <p className="text-lead font-bold text-fg">{entry.title ?? entry.detail}</p>

        <dl className="overflow-hidden rounded-xl border border-line">
          <MetaRow label="เวลา">{entry.time}</MetaRow>
          <MetaRow label="ผู้กระทำ">
            <span className="flex flex-wrap items-center gap-2">
              {entry.actor}
              {entry.role && <RoleBadge role={entry.role === "Superadmin" ? "superadmin" : "admin"} />}
            </span>
          </MetaRow>
          <MetaRow label="เป้าหมาย">{entry.target}</MetaRow>
          <MetaRow label="IP address">{entry.ip}</MetaRow>
          <MetaRow label="อุปกรณ์">{entry.device}</MetaRow>
          {entry.result !== "" && <MetaRow label="ผลลัพธ์">{entry.result}</MetaRow>}
          {(entry.extras ?? []).map((x) => (
            <MetaRow key={x.label} label={x.label}>
              {x.value}
            </MetaRow>
          ))}
        </dl>

        {changes.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-control font-semibold text-fg">การเปลี่ยนแปลง</h3>
              <p className="text-label text-fg-3">{changes.length} รายการ</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle">
                    <th scope="col" className={TH}>รายการ</th>
                    <th scope="col" className={TH}>ก่อน</th>
                    <th scope="col" className={TH}>หลัง</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <tr key={c.field} className="border-b border-line last:border-b-0">
                      <td className={TD}>{c.field}</td>
                      <td className={TD}>
                        <span className={cn(CHIP, "bg-page text-fg-2 line-through")}>
                          {c.before}
                        </span>
                      </td>
                      <td className={TD}>
                        <span className={cn(CHIP, "bg-success-soft text-success")}>{c.after}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="flex items-center gap-1.5 rounded-lg bg-subtle px-3.5 py-2.5 text-label text-fg-3">
          <Lock size={14} aria-hidden className="shrink-0" />
          log นี้สร้างอัตโนมัติ แก้ไขหรือลบไม่ได้
        </p>
      </SheetBody>

      <SheetFooter className="flex-row items-center justify-between gap-2 sm:justify-between border-t border-line px-6 py-4">
        <Button variant="secondary" icon={Copy} onClick={() => onCopyLink(entry)}>
          คัดลอกลิงก์
        </Button>
        <Button onClick={onClose}>ปิด</Button>
      </SheetFooter>
    </>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-10.5 items-center border-b border-line last:border-b-0">
      <dt className="w-30.5 shrink-0 px-3 text-body text-fg-2">{label}</dt>
      <dd className="min-w-0 flex-1 px-3 py-2 text-body text-fg">{children}</dd>
    </div>
  );
}
