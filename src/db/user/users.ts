import { listUsers } from "./user-store";

export type Role = "superadmin" | "admin";
export type Access = "none" | "edit";
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

/** What the User & Permissions page shows of a user (and what the user actions return). */
export type UserRow = Pick<User, "id" | "username" | "email" | "role" | "createdAt" | "permissions">;

// Reads go through the in-memory store (user-store.ts), so changes made at runtime are seen
// everywhere: login, session, page guards and the sidebar. Values are frozen.

/** The effective user list: the seed plus runtime changes. */
export function getUsers(): readonly User[] {
  return listUsers();
}

export function findUserByIdentifier(identifier: string): User | undefined {
  const needle = identifier.trim().toLowerCase();
  if (needle === "") return undefined;
  return listUsers().find((u) => u.username.toLowerCase() === needle || u.email.toLowerCase() === needle);
}

export function getUserById(id: string): User | undefined {
  return listUsers().find((u) => u.id === id);
}

export { accessFor } from "./access";
