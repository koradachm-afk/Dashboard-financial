import { NAV, type NavItem } from "@/components/admin-nav";
import { bestAccess } from "@/db/user/access";
import type { Access, Role, User } from "@/db/user/users";
import { cn } from "@/utils/cn";

export type AccountPermissions = Pick<User, "role" | "permissions">;

// Figma 09.2 order (differs from the sidebar's).
const ORDER = [
  "/dashboard",
  "/parking-layout",
  "/financial-overview",
  "/activity-log",
  "/heat-map",
  "/audit-logs",
  "/users",
  "/settings",
];
const ITEMS: readonly NavItem[] = ORDER.map((href) => {
  const item = NAV.flatMap((g) => g.items).find((i) => i.href === href);
  if (!item) throw new Error(`No nav item for ${href}`);
  return item;
});

// User & Permissions belongs to Superadmin only (README §1), so an Admin never sees the row (09.3).
const SUPERADMIN_ONLY = "/users";

const HEADER_NOTE: Record<Role, string> = {
  superadmin: "Superadmin · สิทธิ์เต็มทุกหน้า",
  admin: "กำหนดโดย Superadmin",
};

const BADGE: Record<Access, { label: string; className: string }> = {
  edit: { label: "แก้ไขได้", className: "bg-primary-soft text-primary" },
  view: { label: "ดูได้", className: "bg-page text-fg-2" },
  none: { label: "ไม่มีสิทธิ์", className: "border border-line text-fg-3" },
};

export function PermissionsCard({ user }: { user: AccountPermissions }) {
  const items = user.role === "superadmin" ? ITEMS : ITEMS.filter((i) => i.href !== SUPERADMIN_ONLY);

  return (
    <section
      aria-labelledby="account-permissions-title"
      className="overflow-hidden rounded-xl border border-line bg-surface"
    >
      <div className="flex items-center gap-2 border-b border-line px-6 py-4">
        <h2 id="account-permissions-title" className="text-title font-semibold text-fg">
          สิทธิ์ของฉัน
        </h2>
        <p className="ml-auto text-label text-fg-3">{HEADER_NOTE[user.role]}</p>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-2.5 px-6 pt-5 pb-6">
        {items.map(({ label, href, icon: Icon, pages }) => {
          const access = bestAccess(user, pages);
          const none = access === "none";
          return (
            <li key={href} className="flex h-11 items-center gap-2.5 rounded-lg border border-line px-3">
              <Icon size={16} aria-hidden="true" className={cn("shrink-0", none ? "text-fg-3" : "text-fg-2")} />
              <span className={cn("truncate text-body font-medium", none ? "text-fg-2" : "text-fg")}>{label}</span>
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-md px-2 py-0.75 text-label font-medium",
                  BADGE[access].className,
                )}
              >
                {BADGE[access].label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
