import data from "./user.json";

export type Role = "superadmin" | "admin";
export type Access = "none" | "view" | "edit";
export type PageKey =
  | "dashboard"
  | "parking-layout"
  | "financial-overview"
  | "activity-log"
  | "heat-map"
  | "users"
  | "audit-logs"
  | "settings.branch"
  | "settings.slot-types"
  | "settings.fees";

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  mustSetPassword: boolean;
  theme: "light" | "dark";
  createdAt: string; // "2026-10-17 01:58"
  permissions: Record<PageKey, Access>;
};

// The only importer of user.json. Frozen so callers cannot mutate the seed.
// Client code imports this module, so user.json must never hold passwords (see user/credentials.json).
const USERS: readonly User[] = Object.freeze(
  (data as User[]).map((u) =>
    Object.freeze({ ...u, permissions: Object.freeze({ ...u.permissions }) }),
  ),
);

export function getUsers(): readonly User[] {
  return USERS;
}

export function findUserByIdentifier(identifier: string): User | undefined {
  const needle = identifier.trim().toLowerCase();
  if (needle === "") return undefined;
  return USERS.find((u) => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle);
}

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function accessFor(user: User, page: PageKey): Access {
  return user.role === "superadmin" ? "edit" : user.permissions[page];
}
