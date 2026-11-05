import { Circle, CircleCheck } from "lucide-react";

import { PASSWORD_RULES } from "@/db/auth/password-rules";
import { cn } from "@/utils/cn";

/** The live password rule checklist (Figma 09.2): /set-password and the account change-password card. */
export function PasswordRuleList({ password, confirm }: { password: string; confirm: string }) {
  return (
    // Each rule is a read-only checkbox: screen readers announce checked / not checked in their own words.
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
            className={cn("flex items-center gap-2 text-label", met ? "font-medium text-fg" : "text-fg-2")}
          >
            <Icon size={16} className={met ? "shrink-0 text-success" : "shrink-0 text-fg-3"} aria-hidden="true" />
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}
