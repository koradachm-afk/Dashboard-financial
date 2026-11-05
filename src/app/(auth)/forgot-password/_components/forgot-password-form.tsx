"use client";

import { ChevronLeft, Loader, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { FormAlert } from "@/components/tailgrids/core/form-alert";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { requestPasswordReset } from "@/db/auth/auth-actions";

const EMAIL_REQUIRED = "กรุณากรอก email";
const NOT_FOUND = "ไม่พบบัญชีที่ใช้ email นี้";
const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const EMAIL_ERROR_ID = "forgot-email-error";
const MESSAGE_ID = "forgot-form-message";

// Mirrors Figma 09.16 (492:51025, empty submit) and 09.18 (492:51178, unknown email).
// The 09.8 "link sent" state is not built: the mock goes straight to /set-password.
export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [failed, setFailed] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) {
      setError(EMAIL_REQUIRED);
      return;
    }
    setError(undefined);
    setFailed(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof requestPasswordReset>>;
      try {
        r = await requestPasswordReset({ email });
      } catch {
        setFailed(true);
        return;
      }
      if (r.ok) router.push("/set-password");
      else setError(NOT_FOUND);
    });
  }

  return (
    <form className="flex w-100 flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-kpi font-bold text-fg">ลืมรหัสผ่าน</h1>
        <p className="text-control text-fg-2">
          กรอก email ที่ใช้กับบัญชี ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-body font-medium text-fg">
          Email
        </label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          icon={Mail}
          className="h-11"
          error={!!error}
          aria-describedby={[error && EMAIL_ERROR_ID, failed && MESSAGE_ID].filter(Boolean).join(" ") || undefined}
          onChange={() => setError(undefined)}
        />
        {error && (
          <p id={EMAIL_ERROR_ID} className="text-label text-danger">
            {error}
          </p>
        )}
      </div>

      {failed && (
        <FormAlert id={MESSAGE_ID}>{ERROR_MESSAGE}</FormAlert>
      )}

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader size={16} className="animate-spin" aria-hidden="true" />}
        ส่งลิงก์ตั้งรหัสผ่าน
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-body font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </form>
  );
}
