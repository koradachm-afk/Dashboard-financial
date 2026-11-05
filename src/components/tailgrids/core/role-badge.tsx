import { cn } from "@/utils/cn";

const ROLES = {
  superadmin: { label: "Superadmin", tone: "bg-primary-soft text-primary" },
  admin: { label: "Admin", tone: "bg-page text-fg-2" },
} as const;

export function RoleBadge({
  role,
  className,
}: {
  role: keyof typeof ROLES;
  className?: string;
}) {
  const { label, tone } = ROLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full pl-2 pr-2.5 py-0.75 text-label font-semibold",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
