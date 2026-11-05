import { type LucideIcon, TriangleAlert } from "lucide-react";

/** The red message box under a form (auth pages, account change-password card). */
export function FormAlert({
  id,
  icon: Icon = TriangleAlert,
  children,
}: {
  id: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2.5 text-body text-danger"
    >
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{children}</p>
    </div>
  );
}
