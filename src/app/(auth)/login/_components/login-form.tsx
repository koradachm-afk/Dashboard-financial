"use client";

import { Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";

// Mirrors Figma 09.7 login form (58:13006) and 09.12 (password shown).
export function LoginForm() {
  const [shown, setShown] = useState(false);
  const EyeIcon = shown ? EyeOff : Eye;

  return (
    <form
      className="flex w-100 flex-col gap-5"
      onSubmit={(e) => e.preventDefault()}
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
        />
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
      </div>

      <Button type="submit" className="h-11 w-full">
        เข้าสู่ระบบ
      </Button>

      <p className="text-center text-body text-fg-2">
        ยังไม่มีบัญชี? ติดต่อ Superadmin ของสาขา
      </p>
    </form>
  );
}
