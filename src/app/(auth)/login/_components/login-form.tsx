"use client";

import { Eye, EyeOff, Loader, Lock, TriangleAlert, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/tailgrids/core/form-alert";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { audit } from "@/db/audit/audit";
import { type AuditInfo, login } from "@/db/auth/auth-actions";

const MAX_ATTEMPTS = 5;
const USERNAME_REQUIRED = "กรุณากรอก Username หรือ Email";
const PASSWORD_REQUIRED = "กรุณากรอกรหัสผ่าน";
const INVALID_MESSAGE = "Username/Email หรือรหัสผ่านไม่ถูกต้อง";
const LOCKED_MESSAGE =
  "บัญชีถูกล็อกชั่วคราวเพราะใส่รหัสผ่านผิด 5 ครั้ง · ลองใหม่ใน 15 นาที หรือติดต่อ Superadmin ของสาขา";
const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const MESSAGE_ID = "login-form-message";

type Notice = { kind: "invalid"; attemptsLeft: number } | { kind: "locked" } | { kind: "error" } | null;

function writeFailure(info: AuditInfo, attempt: number) {
  audit({
    ...info,
    action: "ล้มเหลว",
    page: "การเข้าสู่ระบบ",
    detail: "เข้าสู่ระบบไม่สำเร็จ (รหัสผ่านไม่ถูกต้อง)",
    result: `รหัสผ่านไม่ถูกต้อง · ครั้งที่ ${attempt} จาก ${MAX_ATTEMPTS}`,
  });
}

// Mirrors Figma 09.7 login form (58:13006) and 09.12 (password shown).
export function LoginForm() {
  const [shown, setShown] = useState(false);
  const EyeIcon = shown ? EyeOff : Eye;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const locked = notice?.kind === "locked";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || locked) return;
    const data = new FormData(e.currentTarget);
    const identifier = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const next = {
      username: identifier ? undefined : USERNAME_REQUIRED,
      password: password ? undefined : PASSWORD_REQUIRED,
    };
    setErrors(next);
    if (next.username || next.password) return;
    setNotice(null);
    start(async () => {
      let r: Awaited<ReturnType<typeof login>>;
      try {
        r = await login({ identifier, password });
      } catch {
        // Network or server failure: nothing was checked, so no audit entry and no lock.
        setNotice({ kind: "error" });
        return;
      }
      if (r.ok) {
        audit({
          ...r.audit,
          action: "เข้าสู่ระบบ",
          page: "การเข้าสู่ระบบ",
          detail: `เข้าสู่ระบบสำเร็จ · ${r.audit.browser} บน ${r.audit.os}`,
          result: "สำเร็จ",
        });
        router.push(r.redirectTo);
      } else if (r.reason === "invalid") {
        writeFailure(r.audit, r.attempt);
        setNotice({ kind: "invalid", attemptsLeft: r.attemptsLeft });
      } else {
        if (r.audit) writeFailure(r.audit, MAX_ATTEMPTS);
        setNotice({ kind: "locked" });
      }
    });
  }

  const clear = (field: "username" | "password") => () =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  return (
    <form
      className="flex w-100 flex-col gap-5"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-kpi font-bold text-fg">เข้าสู่ระบบ</h1>
        <p className="text-control text-fg-2">
          ยินดีต้อนรับกลับ กรุณาเข้าสู่ระบบเพื่อใช้งานระบบจัดการที่จอดรถ
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-username" className="text-body font-medium text-fg">
          Username หรือ Email
        </label>
        <Input
          id="login-username"
          name="username"
          autoComplete="username"
          icon={User}
          className="h-11"
          error={!!errors.username}
          aria-describedby={errors.username ? "login-username-error" : undefined}
          onChange={clear("username")}
        />
        {errors.username && (
          <p id="login-username-error" className="text-label text-danger">
            {errors.username}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center">
          <label htmlFor="login-password" className="text-body font-medium text-fg">
            รหัสผ่าน
          </label>
          <Link
            href="/forgot-password"
            className="ml-auto text-body font-semibold text-primary"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
        <Input
          id="login-password"
          name="password"
          autoComplete="current-password"
          type={shown ? "text" : "password"}
          icon={Lock}
          className="h-11"
          error={!!errors.password || notice?.kind === "invalid"}
          aria-describedby={
            [errors.password && "login-password-error", notice && MESSAGE_ID].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={clear("password")}
          trailing={
            <button
              type="button"
              aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              onClick={() => setShown((v) => !v)}
              className="shrink-0 text-fg-3 hover:text-fg-2"
            >
              <EyeIcon size={16} aria-hidden="true" />
            </button>
          }
        />
        {errors.password && (
          <p id="login-password-error" className="text-label text-danger">
            {errors.password}
          </p>
        )}
      </div>

      {notice && (
        <FormAlert id={MESSAGE_ID} icon={locked ? Lock : TriangleAlert}>
          {notice.kind === "invalid"
            ? `${INVALID_MESSAGE} · เหลืออีก ${notice.attemptsLeft} ครั้ง`
            : notice.kind === "error"
              ? ERROR_MESSAGE
              : LOCKED_MESSAGE}
        </FormAlert>
      )}

      <Button type="submit" className="h-11 w-full" disabled={pending || locked}>
        {pending && <Loader size={16} className="animate-spin" aria-hidden="true" />}
        เข้าสู่ระบบ
      </Button>

      <p className="text-center text-body text-fg-2">
        ยังไม่มีบัญชี? ติดต่อ Superadmin ของสาขา
      </p>
    </form>
  );
}
