"use client";

import { Info, Loader2, Lock, ShieldCheck, User as UserIcon, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useId, useState, useTransition } from "react";

import { NAV } from "@/components/admin-nav";
import { Avatar } from "@/components/tailgrids/core/avatar";
import { Button } from "@/components/tailgrids/core/button";
import { FormAlert } from "@/components/tailgrids/core/form-alert";
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
import { audit } from "@/db/audit/audit";
import { updateUser } from "@/db/user/user-actions";
import type { Access, PageKey, Role, UserRow } from "@/db/user/users";
import { isValidEmail } from "@/db/user/validation";
import { cn } from "@/utils/cn";

import { ACCESS_PAGES } from "./access-chips";
import { RoleChangeDialog } from "./role-change-dialog";

/** Every page key at "ไม่มีสิทธิ์": the starting permissions for a user that does not exist yet (07.6 → 07.4). */
export const NO_ACCESS: Readonly<Record<PageKey, Access>> = Object.freeze(
  Object.fromEntries(NAV.flatMap((g) => g.items).flatMap((i) => i.pages.map((p) => [p, "none"]))) as Record<
    PageKey,
    Access
  >,
);

const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const EMAIL_TAKEN = "Email นี้ถูกใช้แล้ว";

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
 * "บันทึก" saves on the server, writes the audit entry and reports the toast title via `onDone`.
 * On the signed-in user's own row the Role control is locked (the server refuses it too).
 */
export function EditUserDrawer({
  user,
  currentUserId,
  onClose,
  onDone,
}: {
  user: UserRow | null;
  currentUserId: string;
  onClose: () => void;
  onDone: (toastTitle: string) => void;
}) {
  // Keep the last user so the content stays put while the drawer slides out.
  const [shown, setShown] = useState(user);
  if (user && user !== shown) setShown(user);

  return (
    <Sheet isOpen={user !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetOverlay>
        <SheetContent showCloseButton={false} className="gap-0 p-0 sm:max-w-130">
          {/* Keyed so switching users remounts with fresh state (Review Focus 5). */}
          {shown && <EditUserForm
              key={shown.id}
              user={shown}
              isSelf={shown.id === currentUserId}
              onClose={onClose}
              onDone={onDone}
            />}
        </SheetContent>
      </SheetOverlay>
    </Sheet>
  );
}

function EditUserForm({
  user,
  isSelf,
  onClose,
  onDone,
}: {
  user: UserRow;
  isSelf: boolean;
  onClose: () => void;
  onDone: (toastTitle: string) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [emailTaken, setEmailTaken] = useState(false);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [permissions, setPermissions] = useState(user.permissions);
  const [confirming, setConfirming] = useState(false);
  const id = useId();

  const emailOk = isValidEmail(email);
  const emailError = !emailOk || emailTaken;
  const locked = role === "superadmin";

  const changeRole = (next: Role) => {
    if (next === "superadmin" && role === "admin") setConfirming(true);
    else setRole(next);
  };
  const setLevel = (page: PageKey, access: Access) => setPermissions((p) => ({ ...p, [page]: access }));
  const setAll = (access: Access) =>
    setPermissions((p) => ({ ...p, ...Object.fromEntries(MATRIX_PAGES.map((page) => [page, access])) }));

  const save = () => {
    if (pending || !emailOk) return;
    setFailed(false);
    setEmailTaken(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof updateUser>>;
      try {
        r = await updateUser({ id: user.id, email: email.trim(), role, permissions });
      } catch {
        setFailed(true);
        return;
      }
      if (!r.ok) {
        if (r.reason === "duplicate-email") setEmailTaken(true);
        else setFailed(true);
        return;
      }
      const { username, email: savedEmail } = r.user;
      if (r.changed !== "none") {
        audit({
          ...r.audit,
          action: "แก้ไข",
          page: "User & Permissions",
          detail: r.changed === "role" ? `เปลี่ยน Role ของ ${username}` : `แก้ไขผู้ใช้ ${username}`,
          target: `${username} · ${savedEmail}`,
          result: "สำเร็จ",
        });
      }
      onClose();
      router.refresh();
      if (r.changed !== "none") onDone(`บันทึกการเปลี่ยนแปลงของ ${username} แล้ว`);
    });
  };

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailTaken(false);
                }}
                error={emailError}
                aria-describedby={emailTaken ? `${id}-email-help ${id}-email-taken` : `${id}-email-help`}
              />
              {emailTaken && (
                <p id={`${id}-email-taken`} className="text-caption text-danger">
                  {EMAIL_TAKEN}
                </p>
              )}
              <p id={`${id}-email-help`} className={HELPER}>
                ใช้รับอีเมลแจ้งเตือนและรีเซ็ตรหัสผ่าน
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className={SECTION_TITLE}>Role</h3>
          <SegmentedControl
            aria-label="Role"
            size="md"
            options={ROLES}
            value={role}
            onChange={changeRole}
            isDisabled={isSelf}
          />
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

        {failed && <FormAlert id={`${id}-error`}>{ERROR_MESSAGE}</FormAlert>}
      </SheetBody>

      <SheetFooter className="flex-row items-center gap-2 border-t border-line px-6 py-4">
        <p className="mr-auto flex items-center gap-2 text-label text-fg-3">
          <Info size={14} aria-hidden className="shrink-0" />
          บันทึกการเปลี่ยนแปลงลง Audit Logs
        </p>
        <Button variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button disabled={!emailOk || pending} onClick={save}>
          {pending && <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden />}
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
