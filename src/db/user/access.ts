// Client-safe: type-only import, so this module never pulls user.json into a bundle.
import type { Access, PageKey, User } from "./users";

// A Record, so adding a PageKey without listing it here is a type error.
const PAGES: Record<PageKey, true> = {
  dashboard: true,
  "parking-layout": true,
  "financial-overview": true,
  "activity-log": true,
  "heat-map": true,
  users: true,
  "audit-logs": true,
  "settings.branch": true,
  "settings.slot-types": true,
  "settings.fees": true,
};

/** Every permission key, in the seed's order. */
export const PAGE_KEYS: readonly PageKey[] = Object.freeze(Object.keys(PAGES) as PageKey[]);

/** The System Settings tabs: the sidebar shows the menu and the page guard lets you in if any one is granted. */
export const SETTINGS_PAGES: readonly PageKey[] = ["settings.branch", "settings.slot-types", "settings.fees"];

export const ACCESS_RANK: Record<Access, number> = { none: 0, view: 1, edit: 2 };
const BY_RANK: readonly Access[] = ["none", "view", "edit"];

export function accessFor(user: Pick<User, "role" | "permissions">, page: PageKey): Access {
  return user.role === "superadmin" ? "edit" : user.permissions[page];
}

/** Best access across `pages`. Fails closed: an empty list or a missing / unknown value ranks as "none". */
export function bestAccess(user: Pick<User, "role" | "permissions">, pages: readonly PageKey[]): Access {
  return BY_RANK[Math.max(0, ...pages.map((p) => ACCESS_RANK[accessFor(user, p)] ?? 0))];
}
