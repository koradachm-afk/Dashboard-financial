"use client";

import { Info, Lock, ShieldCheck, User as UserIcon, X, type LucideIcon } from "lucide-react";
import { Fragment, useId, useState } from "react";

import { NAV } from "@/components/admin-nav";
import { Avatar } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { SegmentedControl, type SegmentedControlOption } from "@/components/tailgrids/core/segmented-control";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
} from "@/components/tailgrids/core/sheet";
import type { Access, PageKey, Role } from "@/db/user/users";
import { isValidEmail } from "@/db/user/validation";
import { cn } from "@/utils/cn";

import { ACCESS_PAGES } from "./access-chips";
import { RoleChangeDialog } from "./role-change-dialog";
import type { UserRow } from "./users-view";

/** Every page key at "ไม่มีสิทธิ์": the starting permissions for a user that does not exist yet (07.6 → 07.4). */
export const NO_ACCESS: Readonly<Record<PageKey, Access>> = Object.freeze(
  Object.fromEntries(NAV.flatMap((g) => g.items).flatMap((i) => i.pages.map((p) => [p, "none"]))) as Record<
    PageKey,
    Access
  >,
);

// Figma 07.4 has no label for the close X; "ปิด" was approved in chat, same as the toast and dialogs.
const CLOSE_LABEL = "ปิด";

const TAB_LABEL: Partial<Record<PageKey, string>> = {
  "settings.branch": "ข้อมูลสาขา",
  "settings.slot-types": "ประเภทช่องจอด",
  "settings.fees": "ค่าจอดและการชำระเงิน",
};

/** The pages the matrix sets: the menu pages minus User & Permissions, with System Settings as its tabs. */
const MATRIX_PAGES: readonly PageKey[] = ACCESS_PAGES.flatMap((i) => i.pages);

const ROLES: SegmentedControlOption<Role>[] = [
  { value: "admin", label: "Admin", icon: UserIcon },
  { value: "superadmin", label: "Superadmin", icon: ShieldCheck },
];

const LEVELS: SegmentedControlOption<Access>[] = [
  { value: "none", label: "ไม่มีสิทธิ์" },
  { value: "view", label: "ดูได้" },
  { value: "edit", label: "แก้ไขได้", tone: "primary" },
];

const SECTION_TITLE = "text-control font-semibold text-fg";
const FIELD_LABEL = "flex gap-0.5 text-body font-medium text-fg";
const HELPER = "text-caption text-fg-3";
const SHORTCUT =
  "rounded-xs text-label font-semibold text-primary outline-none transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none";
const rowLabel = (muted: boolean) => cn("text-body font-medium", muted ? "text-fg-2" : "text-fg");

/**
 * 07.4 edit drawer. Open while `user` is set; each open starts from that user's data.
 * UI only: "บันทึก" closes without changing anything.
 */
export function EditUserDrawer({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  // Keep the last user so the content stays put while the drawer slides out.
  const [shown, setShown] = useState(user);
  if (user && user !== shown) setShown(user);

  return (
    <Sheet isOpen={user !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetOverlay>
        <SheetContent showCloseButton={false} className="gap-0 p-0 sm:max-w-130">
          {/* Keyed so switching users remounts with fresh state (Review Focus 5). */}
          {shown && <EditUserForm key={shown.id} user={shown} onClose={onClose} />}
        </SheetContent>
      </SheetOverlay>
    </Sheet>
  );
}

function EditUserForm({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [permissions, setPermissions] = useState(user.permissions);
  const [confirming, setConfirming] = useState(false);
  const id = useId();

  const emailOk = isValidEmail(email);
  const locked = role === "superadmin";

  const changeRole = (next: Role) => {
    if (next === "superadmin" && role === "admin") setConfirming(true);
    else setRole(next);
  };
  const setLevel = (page: PageKey, access: Access) => setPermissions((p) => ({ ...p, [page]: access }));
  const setAll = (access: Access) =>
    setPermissions((p) => ({ ...p, ...Object.fromEntries(MATRIX_PAGES.map((page) => [page, access])) }));

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 border-b border-line pt-5 pr-4 pb-5 pl-6">
        <Avatar username={user.username} className="size-10 bg-primary-soft text-control text-primary" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <SheetTitle className="truncate text-lead leading-normal">แก้ไขผู้ใช้ · {user.username}</SheetTitle>
          <SheetDescription className="text-label text-fg-3">สร้างเมื่อ {user.createdAt}</SheetDescription>
        </div>
        <SheetClose
          aria-label={CLOSE_LABEL}
          className="grid size-8 shrink-0 place-items-center rounded-md text-fg-2 transition-colors hover:bg-subtle data-focus-visible:ring-2 data-focus-visible:ring-focus"
        >
          <X size={18} aria-hidden />
        </SheetClose>
      </SheetHeader>

      <SheetBody className="mx-0 flex flex-col gap-5.5 px-6 py-5">
        <section className="flex flex-col gap-2.5">
          <h3 className={SECTION_TITLE}>ข้อมูลบัญชี</h3>
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor={`${id}-username`} className={FIELD_LABEL}>
                Username
              </label>
              <Input
                id={`${id}-username`}
                value={user.username}
                readOnly
                icon={Lock}
                aria-describedby={`${id}-username-help`}
                className="bg-page text-fg-2"
              />
              <p id={`${id}-username-help`} className={HELPER}>
                แก้ไขไม่ได้
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor={`${id}-email`} className={FIELD_LABEL}>
                Email
                <span aria-hidden className="text-danger">
                  *
                </span>
              </label>
              <Input
                id={`${id}-email`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!emailOk}
                aria-describedby={`${id}-email-help`}
              />
              <p id={`${id}-email-help`} className={HELPER}>
                ใช้รับอีเมลแจ้งเตือนและรีเซ็ตรหัสผ่าน
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={SECTION_TITLE}>Role</h3>
          <SegmentedControl aria-label="Role" size="md" options={ROLES} value={role} onChange={changeRole} />
          <p className={HELPER}>Superadmin เข้าถึงทุกหน้าและจัดการผู้ใช้ได้ (มีการยืนยันก่อนเปลี่ยน)</p>
        </section>

        {/* A Superadmin has full access, so the list stays visible but dimmed and inert (Spec Q2). */}
        <section aria-labelledby={`${id}-access`} className={cn("flex flex-col gap-2.5", locked && "opacity-50")}>
          <div className="flex items-center gap-2">
            <h3 id={`${id}-access`} className={cn(SECTION_TITLE, "mr-auto")}>
              สิทธิ์การเข้าถึงแต่ละหน้า
            </h3>
            <button type="button" disabled={locked} onClick={() => setAll("view")} className={SHORTCUT}>
              ดูได้ทุกหน้า
            </button>
            <span aria-hidden className="text-label text-fg-3">
              ·
            </span>
            <button type="button" disabled={locked} onClick={() => setAll("none")} className={SHORTCUT}>
              ล้างทั้งหมด
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            {ACCESS_PAGES.map(({ href, label, icon, pages }) =>
              pages.length === 1 ? (
                <AccessRow
                  key={href}
                  icon={icon}
                  label={label}
                  value={permissions[pages[0]]}
                  onChange={(a) => setLevel(pages[0], a)}
                  isDisabled={locked}
                />
              ) : (
                <Fragment key={href}>
                  <GroupRow icon={icon} label={label} muted={pages.every((p) => permissions[p] === "none")} />
                  {pages.map((page) => (
                    <AccessRow
                      key={page}
                      label={TAB_LABEL[page] ?? page}
                      value={permissions[page]}
                      onChange={(a) => setLevel(page, a)}
                      isDisabled={locked}
                    />
                  ))}
                </Fragment>
              ),
            )}
          </div>
        </section>
      </SheetBody>

      <SheetFooter className="flex-row items-center gap-2 border-t border-line px-6 py-4">
        <p className="mr-auto flex items-center gap-2 text-label text-fg-3">
          <Info size={14} aria-hidden className="shrink-0" />
          บันทึกการเปลี่ยนแปลงลง Audit Logs
        </p>
        <Button variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button disabled={!emailOk} onClick={onClose}>
          บันทึก
        </Button>
      </SheetFooter>

      <RoleChangeDialog
        username={user.username}
        isOpen={confirming}
        onConfirm={() => {
          setRole("superadmin");
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

/** One matrix row. Without an icon it is a System Settings tab row (indented, subtle background). */
function AccessRow({
  icon: Icon,
  label,
  value,
  onChange,
  isDisabled,
}: {
  icon?: LucideIcon;
  label: string;
  value: Access;
  onChange: (access: Access) => void;
  isDisabled: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-11.5 items-center gap-2.5 pr-2",
        Icon ? "border-b border-line pl-3 last:border-b-0" : "bg-subtle pl-9.5",
      )}
    >
      {Icon && <Icon size={16} aria-hidden className="shrink-0 text-fg-2" />}
      <span className={rowLabel(value === "none")}>{label}</span>
      <SegmentedControl
        aria-label={label}
        options={LEVELS}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        // The section already dims to 50%; keep the picker from dimming twice.
        className={cn("ml-auto shrink-0", isDisabled && "opacity-100")}
      />
    </div>
  );
}

/** System Settings heading row: no picker, its tabs are set one by one below it. */
function GroupRow({ icon: Icon, label, muted }: { icon: LucideIcon; label: string; muted: boolean }) {
  return (
    <div className="flex h-9.5 items-center gap-2.5 pr-2 pl-3">
      <Icon size={16} aria-hidden className="shrink-0 text-fg-2" />
      <span className={rowLabel(muted)}>{label}</span>
      <span className="ml-auto text-label text-fg-3">ตั้งสิทธิ์แยกตามแท็บ</span>
    </div>
  );
}
