// Client-safe: type-only import, so this module never pulls user.json into a bundle.
import type { Access, PageKey, User } from "./users";

export function accessFor(user: Pick<User, "role" | "permissions">, page: PageKey): Access {
  return user.role === "superadmin" ? "edit" : user.permissions[page];
}
