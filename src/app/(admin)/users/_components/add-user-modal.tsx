"use client";

import { Eye, EyeOff, Info, Loader2, Lock, Mail, RotateCw, ShieldCheck, User as UserIcon, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { Button } from "@/components/tailgrids/core/button";
import { FormAlert } from "@/components/tailgrids/core/form-alert";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { Input } from "@/components/tailgrids/core/input";
import { SegmentedControl, type SegmentedControlOption } from "@/components/tailgrids/core/segmented-control";
import { audit } from "@/db/audit/audit";
import { passwordRulesMet } from "@/db/auth/password-rules";
import { createUser } from "@/db/user/user-actions";
import type { Role, UserRow } from "@/db/user/users";
import { isValidEmail, isValidUsername } from "@/db/user/validation";
import { cn } from "@/utils/cn";
import { generatePassword } from "@/utils/generate-password";


const ROLES: SegmentedControlOption<Role>[] = [
  { value: "admin", label: "Admin", icon: UserIcon },
  { value: "superadmin", label: "Superadmin", icon: ShieldCheck },
];

const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const USERNAME_TAKEN = "Username นี้ถูกใช้แล้ว";
const EMAIL_TAKEN = "Email นี้ถูกใช้แล้ว";

const FIELD_LABEL = "flex gap-0.5 text-body font-medium text-fg";
const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-md text-fg-2 outline-none transition-colors hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-focus";

function Required() {
  return (
    <span aria-hidden className="text-danger">
      *
    </span>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Runs after the server created the user: the parent closes the modal, shows the toast and may open the drawer. */
  onCreate: (user: UserRow) => void;
};

/**
 * 07.6 add user modal. "สร้างผู้ใช้" creates the user on the server, writes the audit entry, then hands the stored user to `onCreate`.
 * The form unmounts on close, so every open starts empty.
 */
export function AddUserModal({ isOpen, onClose, onCreate }: Props) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      // A stray click outside must not throw away a half-typed form; X, ยกเลิก and Escape close it.
      isDismissable={false}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
    >
      <Modal className="max-h-full w-140 max-w-full overflow-y-auto rounded-modal bg-surface shadow-modal outline-none">
        <Dialog className="outline-none">
          <AddUserForm onClose={onClose} onCreate={onCreate} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function AddUserForm({ onClose, onCreate }: Omit<Props, "isOpen">) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [invite, setInvite] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [failed, setFailed] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [shown, setShown] = useState(false);
  const [touched, setTouched] = useState({ username: false, email: false, password: false });
  const id = useId();

  const ok = {
    username: isValidUsername(username),
    email: isValidEmail(email),
    password: passwordRulesMet(password, password),
  };
  const valid = ok.username && ok.email && ok.password;
  // A typed value is checked live; an empty field only turns red once the user has left it.
  const error = (field: keyof typeof ok, value: string) => !ok[field] && (value !== "" || touched[field]);
  const touch = (field: keyof typeof ok) => () => setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  const usernameError = error("username", username) || usernameTaken;
  // Figma 07.6 puts the show/hide button beside the field (next to "สร้างอัตโนมัติ"), not inside it.
  const EyeIcon = shown ? EyeOff : Eye;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid || pending) return;
    setFailed(false);
    setUsernameTaken(false);
    setEmailTaken(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof createUser>>;
      try {
        r = await createUser({ username, email: email.trim(), password, role, invite });
      } catch {
        setFailed(true);
        return;
      }
      if (!r.ok) {
        if (r.reason === "duplicate-username") setUsernameTaken(true);
        else if (r.reason === "duplicate-email") setEmailTaken(true);
        else setFailed(true);
        return;
      }
      const created = r.user;
      audit({
        ...r.audit,
        action: "สร้าง",
        page: "User & Permissions",
        detail: `เพิ่มผู้ใช้ ${created.username}`,
        target: `${created.username} · ${created.email}`,
        result: "สำเร็จ",
      });
      router.refresh();
      onCreate(created);
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4.5 px-6 pt-6 pb-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <UserPlus size={22} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Heading slot="title" className="text-h3 font-semibold text-fg">
            เพิ่มผู้ใช้
          </Heading>
          <p className="text-body text-fg-2">สร้างบัญชีใหม่ แล้วส่งอีเมลเชิญให้ตั้งรหัสผ่านเอง</p>
        </div>
        <button type="button" aria-label="ปิด" onClick={onClose} className={cn(ICON_BUTTON, "ml-auto")}>
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`${id}-username`} className={FIELD_LABEL}>
            Username
            <Required />
          </label>
          <Input
            id={`${id}-username`}
            required
            autoComplete="off"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameTaken(false);
            }}
            onBlur={touch("username")}
            error={usernameError}
            aria-describedby={usernameTaken ? `${id}-username-help ${id}-username-taken` : `${id}-username-help`}
          />
          <p id={`${id}-username-help`} className={cn("text-caption", usernameError ? "text-danger" : "text-fg-3")}>
            a–z, 0–9, จุด และ _ · แก้ไขภายหลังไม่ได้
          </p>
          {usernameTaken && (
            <p id={`${id}-username-taken`} className="text-caption text-danger">
              {USERNAME_TAKEN}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`${id}-email`} className={FIELD_LABEL}>
            Email
            <Required />
          </label>
          <Input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailTaken(false);
            }}
            onBlur={touch("email")}
            error={error("email", email) || emailTaken}
            aria-describedby={emailTaken ? `${id}-email-help ${id}-email-taken` : `${id}-email-help`}
          />
          <p id={`${id}-email-help`} className="text-caption text-fg-3">
            ใช้ส่งคำเชิญและรีเซ็ตรหัสผ่าน
          </p>
          {emailTaken && (
            <p id={`${id}-email-taken`} className="text-caption text-danger">
              {EMAIL_TAKEN}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-password`} className={FIELD_LABEL}>
          รหัสผ่านเริ่มต้น
          <Required />
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={`${id}-password`}
            type={shown ? "text" : "password"}
            required
            autoComplete="new-password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={touch("password")}
            error={error("password", password)}
            aria-describedby={`${id}-password-help`}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() => setShown((v) => !v)}
            className={ICON_BUTTON}
          >
            <EyeIcon size={18} aria-hidden />
          </button>
          <Button variant="secondary" icon={RotateCw} onClick={() => setPassword(generatePassword())}>
            สร้างอัตโนมัติ
          </Button>
        </div>
        <p id={`${id}-password-help`} className="text-caption text-fg-3">
          อย่างน้อย 8 ตัวอักษร · ผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span aria-hidden className={FIELD_LABEL}>
          Role
          <Required />
        </span>
        <SegmentedControl aria-label="Role" size="md" options={ROLES} value={role} onChange={setRole} />
      </div>

      {/* The invite flag is stored with the user; no email is sent. */}
      <Checkbox isSelected={invite} onChange={setInvite} className="gap-2.5 font-medium">
        <Mail size={16} aria-hidden className="shrink-0 text-fg-2" />
        ส่งอีเมลเชิญให้ผู้ใช้ตั้งรหัสผ่านใหม่
      </Checkbox>

      <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-label text-fg">
        <Info size={16} aria-hidden className="shrink-0 text-primary" />
        เมื่อสร้าง Admin แล้ว ระบบจะเปิดหน้าตั้งค่าสิทธิ์ให้ต่อทันที
      </p>

      {failed && <FormAlert id={`${id}-error`}>{ERROR_MESSAGE}</FormAlert>}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" icon={pending ? undefined : UserPlus} disabled={!valid || pending}>
          {pending && <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden />}
          สร้างผู้ใช้
        </Button>
      </div>
    </form>
  );
}
