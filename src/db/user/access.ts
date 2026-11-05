// Client-safe: type-only import, so this module never pulls user.json into a bundle.
import type { Access, PageKey, User } from "./users";

/** The System Settings tabs: the sidebar shows the menu and the page guard lets you in if any one is granted. */
export const SETTINGS_PAGES: readonly PageKey[] = ["settings.branch", "settings.slot-types", "settings.fees"];

export function accessFor(user: Pick<User, "role" | "permissions">, page: PageKey): Access {
  return user.role === "superadmin" ? "edit" : user.permissions[page];
}
