// No "use client": server components (the account page) read this data too.
import {
  Activity,
  Flame,
  History,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { bestAccess, SETTINGS_PAGES } from "@/db/user/access";
import type { PageKey, User } from "@/db/user/users";

// An item shows when the user can reach any of its pages (README §6.2).
export type NavItem = { label: string; href: string; icon: LucideIcon; pages: readonly PageKey[] };

export const NAV: readonly { group: string; items: readonly NavItem[] }[] = [
  {
    group: "เมนูหลัก",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, pages: ["dashboard"] },
      { label: "Parking Layout", href: "/parking-layout", icon: Map, pages: ["parking-layout"] },
      { label: "Financial Overview", href: "/financial-overview", icon: Wallet, pages: ["financial-overview"] },
      { label: "Activity Log", href: "/activity-log", icon: Activity, pages: ["activity-log"] },
      { label: "Parking Heat Map", href: "/heat-map", icon: Flame, pages: ["heat-map"] },
    ],
  },
  {
    group: "จัดการระบบ",
    items: [
      { label: "User & Permissions", href: "/users", icon: ShieldCheck, pages: ["users"] },
      {
        label: "System Settings",
        href: "/settings",
        icon: Settings,
        pages: SETTINGS_PAGES,
      },
      { label: "Audit Logs", href: "/audit-logs", icon: History, pages: ["audit-logs"] },
    ],
  },
];

/** Where "back to home" goes: the first nav page the user can open, /account if none, /login if signed out. */
export function homePathFor(user: Pick<User, "role" | "permissions"> | null): string {
  if (!user) return "/login";
  const first = NAV.flatMap((g) => g.items).find((i) => bestAccess(user, i.pages) !== "none");
  return first?.href ?? "/account";
}
