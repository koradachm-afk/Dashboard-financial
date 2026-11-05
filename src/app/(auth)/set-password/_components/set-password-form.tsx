"use client";

import { Circle, CircleCheck, Loader, Lock, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { audit } from "@/db/audit/audit";
import { setPassword } from "@/db/auth/auth-actions";
import { PASSWORD_RULES, passwordRulesMet } from "@/db/auth/password-rules";

const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const MESSAGE_ID = "set-password-message";

// Mirrors Figma 09.9 (58:13189, all rules met) and 09.17 (492:51331, unmet rules + disabled button).
export function SetPasswordForm({ username }: { username: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [failed, setFailed] = useState(false);
  const ready = passwordRulesMet(password, confirm);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !ready) return;
    setFailed(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof setPassword>>;
      try {
        r = await setPassword({ password, confirm });
      } catch {
        setFailed(true);
        return;
      }
      if (r.ok) {
        audit({
          ...r.audit,
          action: "แก้ไข",
          page: "การเข้าสู่ระบบ",
          detail: r.source === "invite" ? "ตั้งรหัสผ่านครั้งแรกผ่านลิงก์เชิญ" : "ตั้งรหัสผ่านใหม่ผ่านลิงก์ลืมรหัสผ่าน",
          result: "สำเร็จ",
        });
        router.push("/dashboard");
      } else if (r.reason === "expired") {
        router.replace("/login");
      } else {
        // The rules above already block this; the server re-checked and disagreed.
        setFailed(true);
      }
    });
  }

  const describedBy = failed ? MESSAGE_ID : undefined;

  return (
    <form className="flex w-100 flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-kpi font-bold text-fg">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-control text-fg-2">
          สำหรับบัญชี {username} · ใช้ทั้งจากอีเมลเชิญและลืมรหัสผ่าน
          <br />
          ลิงก์นี้หมดอายุใน 24 ชั่วโมง
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="set-password-new" className="text-body font-medium text-fg">
          รหัสผ่านใหม่
        </label>
        <Input
          id="set-password-new"
          name="password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          className="h-11"
          value={password}
          aria-describedby={describedBy}
          onChange={(e) => setPasswordValue(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="set-password-confirm" className="text-body font-medium text-fg">
          ยืนยันรหัสผ่านใหม่
        </label>
        <Input
          id="set-password-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          className="h-11"
          value={confirm}
          aria-describedby={describedBy}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {/* Each rule is a read-only checkbox: screen readers announce checked / not checked in their own words. */}
      <div className="flex flex-col gap-2 rounded-lg bg-subtle px-3.5 py-3">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password, confirm);
          const Icon = met ? CircleCheck : Circle;
          return (
            <div
              key={rule.id}
              role="checkbox"
              aria-checked={met}
              aria-readonly="true"
              data-met={met}
              className="flex items-center gap-2 text-label font-medium text-fg"
            >
              <Icon size={16} className={met ? "shrink-0 text-success" : "shrink-0 text-fg-3"} aria-hidden="true" />
              {rule.label}
            </div>
          );
        })}
      </div>

      {failed && (
        <div
          id={MESSAGE_ID}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2.5 text-body text-danger"
        >
          <TriangleAlert size={16} className="shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">{ERROR_MESSAGE}</p>
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={pending || !ready}>
        {pending && <Loader size={16} className="animate-spin" aria-hidden="true" />}
        ตั้งรหัสผ่านและเข้าสู่ระบบ
      </Button>
    </form>
  );
}
