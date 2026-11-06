import { LayoutDashboard } from "lucide-react";

import { NAV, type NavItem } from "@/components/admin-nav";
import { bestAccess } from "@/db/user/access";
import type { User } from "@/db/user/users";
import { cn } from "@/utils/cn";

/**
 * The pages an Admin can be granted, in menu order (Figma 07.1). User & Permissions is
 * Superadmin-only, so it is neither a chip nor a filter option. System Settings covers its tabs.
 */
export const ACCESS_PAGES: readonly NavItem[] = NAV.flatMap((g) => g.items).filter(
  (i) => i.href !== "/users",
);

const WORD = "แก้ไขได้";

// DESIGN-STYLE §8.2 Page Access Chip.
const CHIP = "grid size-6.5 shrink-0 place-items-center rounded-md";
const TONE = "border border-primary bg-primary-soft text-primary";

export function AccessChips({ user }: { user: Pick<User, "role" | "permissions"> }) {
  if (user.role === "superadmin") {
    return <span className="text-label font-medium text-primary">ทุกหน้า · สิทธิ์เต็ม</span>;
  }

  const granted = ACCESS_PAGES.flatMap((item) => {
    return bestAccess(user, item.pages) === "none" ? [] : [item];
  });

  if (granted.length === 0) {
    return (
      <span className="flex items-center gap-1.5 text-label font-medium text-warning">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />
        ยังไม่ได้ตั้งสิทธิ์
      </span>
    );
  }

  return (
    <div className="flex gap-1">
      {granted.map(({ href, label, icon: Icon }) => (
        <span key={href} role="img" aria-label={`${label} ${WORD}`} className={cn(CHIP, TONE)}>
          <Icon size={14} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

/** Footer key for the chip colours (Figma 07 footer). */
export function AccessLegend() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1.5 pr-2">
        <span aria-hidden="true" className={cn(CHIP, TONE)}>
          <LayoutDashboard size={14} />
        </span>
        <span className="text-label text-fg-2">{WORD}</span>
      </span>
    </div>
  );
}
