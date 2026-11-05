"use client";

import { Loader, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { FormAlert } from "@/components/tailgrids/core/form-alert";
import { Input, type InputProps } from "@/components/tailgrids/core/input";
import { PasswordRuleList } from "@/components/tailgrids/core/password-rule-list";
import { Toast } from "@/components/tailgrids/core/toast";
import { audit } from "@/db/audit/audit";
import { changePassword } from "@/db/auth/auth-actions";
import { passwordRulesMet } from "@/db/auth/password-rules";

const ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const WRONG_CURRENT = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
const MESSAGE_ID = "change-password-message";
const CURRENT_ERROR_ID = "change-password-current-error";

/** Joins the ids that apply into one aria-describedby value. */
function describedBy(...ids: (string | false)[]): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}

function PasswordField({
  id,
  label,
  errorText,
  ...props
}: Omit<InputProps, "id" | "type"> & { id: string; label: string; errorText?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-0.5 text-body font-medium">
        <label htmlFor={id} className="text-fg">
          {label}
        </label>
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      </div>
      <Input id={id} type="password" icon={Lock} required aria-required="true" {...props} />
      {errorText && (
        <p id={CURRENT_ERROR_ID} className="text-label text-danger">
          {errorText}
        </p>
      )}
    </div>
  );
}

// Mirrors Figma 09.2 / 09.3 (unmet rules, dimmed button), 09.4 (cleared form + toast), 09.19 (wrong current password).
export function ChangePasswordCard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [wrongCurrent, setWrongCurrent] = useState(false);
  const [failed, setFailed] = useState(false);
  // A new key per success remounts the toast, so a second success restarts its countdown.
  const [toastKey, setToastKey] = useState<number | null>(null);
  const ready = current !== "" && passwordRulesMet(password, confirm);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !ready) return;
    setFailed(false);
    setWrongCurrent(false);
    start(async () => {
      let r: Awaited<ReturnType<typeof changePassword>>;
      try {
        r = await changePassword({ current, password, confirm });
      } catch {
        setFailed(true);
        return;
      }
      if (r.ok) {
        audit({ ...r.audit, action: "แก้ไข", page: "บัญชีของฉัน", detail: "เปลี่ยนรหัสผ่าน", result: "สำเร็จ" });
        setCurrent("");
        setPassword("");
        setConfirm("");
        setToastKey((k) => (k ?? 0) + 1);
      } else if (r.reason === "expired") {
        router.replace("/login");
      } else if (r.reason === "wrong-current") {
        setWrongCurrent(true);
      } else {
        // The rules above already block this; the server re-checked and disagreed.
        setFailed(true);
      }
    });
  }

  return (
    <section
      aria-labelledby="change-password-title"
      className="overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-center border-b border-line px-6 py-4">
        <h2 id="change-password-title" className="text-title font-semibold text-fg">
          เปลี่ยนรหัสผ่าน
        </h2>
      </div>

      <form className="flex flex-col gap-4 px-6 pt-5 pb-6" onSubmit={onSubmit} noValidate>
        <PasswordField
          id="change-password-current"
          name="current"
          label="รหัสผ่านปัจจุบัน"
          placeholder="กรอกรหัสผ่านปัจจุบัน"
          autoComplete="current-password"
          value={current}
          error={wrongCurrent}
          errorText={wrongCurrent ? WRONG_CURRENT : undefined}
          aria-describedby={describedBy(wrongCurrent && CURRENT_ERROR_ID, failed && MESSAGE_ID)}
          onChange={(e) => {
            setCurrent(e.target.value);
            setWrongCurrent(false);
          }}
        />
        <PasswordField
          id="change-password-new"
          name="password"
          label="รหัสผ่านใหม่"
          placeholder="กรอกรหัสผ่านใหม่"
          autoComplete="new-password"
          value={password}
          aria-describedby={describedBy(failed && MESSAGE_ID)}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          id="change-password-confirm"
          name="confirm"
          label="ยืนยันรหัสผ่านใหม่"
          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
          autoComplete="new-password"
          value={confirm}
          aria-describedby={describedBy(failed && MESSAGE_ID)}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <PasswordRuleList password={password} confirm={confirm} />

        {failed && <FormAlert id={MESSAGE_ID}>{ERROR_MESSAGE}</FormAlert>}

        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={pending || !ready}>
            {pending && <Loader size={16} className="animate-spin" aria-hidden="true" />}
            เปลี่ยนรหัสผ่าน
          </Button>
        </div>
      </form>

      {toastKey !== null && (
        <Toast
          key={toastKey}
          open
          title="เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"
          description="ใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป"
          onClose={() => setToastKey(null)}
        />
      )}
    </section>
  );
}
