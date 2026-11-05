import { ShieldCheck, User } from "lucide-react";
import { cn } from "@/utils/cn";

export const ROLE_LABEL = { superadmin: "Superadmin", admin: "Admin" } as const;

const ROLES = {
  superadmin: {
    label: ROLE_LABEL.superadmin,
    tone: "bg-primary-soft text-primary",
    icon: ShieldCheck,
  },
  admin: { label: ROLE_LABEL.admin, tone: "bg-page text-fg-2", icon: User },
} as const;

export function RoleBadge({
  role,
  className,
}: {
  role: keyof typeof ROLES;
  className?: string;
}) {
  const { label, tone, icon: Icon } = ROLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.75 text-label font-semibold",
        tone,
        className,
      )}
    >
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}
