"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input, type InputProps } from "./input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailing">;

/** An `Input` for passwords with its own show/hide toggle. Starts hidden; each instance toggles on its own. */
export function PasswordInput({ disabled, ...props }: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  const EyeIcon = shown ? EyeOff : Eye;
  return (
    <Input
      {...props}
      disabled={disabled}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          disabled={disabled}
          aria-label={shown ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          onClick={() => setShown((v) => !v)}
          className="shrink-0 rounded-xs text-fg-3 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          <EyeIcon size={16} aria-hidden="true" />
        </button>
      }
    />
  );
}
