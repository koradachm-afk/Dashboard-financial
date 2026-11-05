"use server";
// Every export here is a client-callable Server Action: async functions and types only.
// Each action re-checks the caller first, then the input; nothing changes on any failure.
import { type AuditInfo, auditFor } from "@/db/auth/audit-info";
import { getCurrentUser } from "@/db/auth/auth";
import { clearFailures } from "@/db/auth/login-attempts";
import { passwordRulesMet } from "@/db/auth/password-rules";
import { forgetPassword, recordInitialPassword } from "@/db/auth/password-store";
import { ACCESS_RANK, accessFor, PAGE_KEYS } from "@/db/user/access";
import { addUser, removeUser, replaceUser } from "@/db/user/user-store";
import { getUserById, getUsers, type Access, type PageKey, type Role, type User, type UserRow } from "@/db/user/users";
import { isValidEmail, isValidUsername } from "@/db/user/validation";

export type CreateUserResult =
  | { ok: true; user: UserRow; audit: AuditInfo }
  | { ok: false; reason: "forbidden" | "invalid" | "duplicate-username" | "duplicate-email" };

export type UpdateUserResult =
  | { ok: true; user: UserRow; audit: AuditInfo; changed: "role" | "other" | "none" }
  | { ok: false; reason: "forbidden" | "invalid" | "not-found" | "self-role" | "duplicate-email" };

export type DeleteUserResult =
  | { ok: true; user: UserRow; audit: AuditInfo }
  | { ok: false; reason: "forbidden" | "not-found" | "self" };

// The longest valid email; over-long input is rejected, not cut.
const MAX_FIELD = 254;

const isField = (value: unknown): value is string => typeof value === "string" && value.length <= MAX_FIELD;
const isRole = (value: unknown): value is Role => value === "superadmin" || value === "admin";

/**
 * The signed-in user if they may manage users (users "edit", i.e. Superadmin), else null.
 * Not `requirePage`: its redirect would throw inside an action; a direct call gets "forbidden".
 */
async function userManager(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && accessFor(user, "users") === "edit" ? user : null;
}

/** A fresh copy of every PageKey with a valid Access, or null if any is missing, extra or unknown. */
function parsePermissions(value: unknown): Record<PageKey, Access> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const given = value as Record<string, unknown>;
  if (Object.keys(given).length !== PAGE_KEYS.length) return null;
  const permissions = {} as Record<PageKey, Access>;
  for (const page of PAGE_KEYS) {
    const access = Object.hasOwn(given, page) ? given[page] : undefined;
    if (typeof access !== "string" || !Object.hasOwn(ACCESS_RANK, access)) return null;
    permissions[page] = access as Access;
  }
  return permissions;
}

const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Another user (not `exceptId`) already has this email, case-insensitively. */
const emailTaken = (email: string, exceptId?: string) =>
  getUsers().some((u) => u.id !== exceptId && sameText(u.email, email));

const toRow = ({ id, username, email, role, createdAt, permissions }: User): UserRow => ({
  id,
  username,
  email,
  role,
  createdAt,
  permissions,
});

const pad = (n: number) => String(n).padStart(2, "0");
/** Now as "YYYY-MM-DD HH:mm" (server local time), the seed's createdAt format. */
function now(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Adds a user with no page access who must set their own password (the initial one works until then).
 * `invite` is accepted for the audit only; no email is sent.
 */
export async function createUser(input: {
  username: string;
  email: string;
  password: string;
  role: Role;
  invite: boolean;
}): Promise<CreateUserResult> {
  const caller = await userManager();
  if (!caller) return { ok: false, reason: "forbidden" };

  // A Server Action is a public endpoint: never trust the input's shape.
  const { username, email, password, role, invite }: Partial<typeof input> = input ?? {};
  if (
    !isField(username) ||
    !isField(email) ||
    !isField(password) ||
    !isRole(role) ||
    typeof invite !== "boolean" ||
    !isValidUsername(username) ||
    !isValidEmail(email) ||
    !passwordRulesMet(password, password)
  ) {
    return { ok: false, reason: "invalid" };
  }

  // Read the request before checking and changing anything: no await between the checks and the write.
  const audit = await auditFor(caller, caller.username);
  if (getUsers().some((u) => sameText(u.username, username))) return { ok: false, reason: "duplicate-username" };
  if (emailTaken(email)) return { ok: false, reason: "duplicate-email" };

  const user: User = {
    // Never reused: the mock session cookie holds the id, so a deleted user's cookie must not open
    // a later account with the same username.
    id: `u-${globalThis.crypto.randomUUID()}`,
    username,
    name: username,
    email,
    role,
    mustSetPassword: true,
    theme: "light",
    createdAt: now(),
    permissions: Object.fromEntries(PAGE_KEYS.map((p) => [p, "none"])) as Record<PageKey, Access>,
  };
  addUser(user);
  recordInitialPassword(user.id, password);
  return { ok: true, user: toRow(user), audit };
}

/**
 * Saves the drawer: email, role and every page's access (a Superadmin's are kept as given).
 * You cannot change your own role. `changed` tells the client which audit entry to write;
 * "none" stores nothing.
 */
export async function updateUser(input: {
  id: string;
  email: string;
  role: Role;
  permissions: Record<PageKey, Access>;
}): Promise<UpdateUserResult> {
  const caller = await userManager();
  if (!caller) return { ok: false, reason: "forbidden" };

  // A Server Action is a public endpoint: never trust the input's shape.
  const { id, email, role }: Partial<typeof input> = input ?? {};
  const permissions = parsePermissions(input?.permissions);
  if (!isField(id) || !isField(email) || !isRole(role) || !permissions || !isValidEmail(email)) {
    return { ok: false, reason: "invalid" };
  }

  // Read the request before checking and changing anything: no await between the checks and the write.
  const audit = await auditFor(caller, caller.username);
  const target = getUserById(id);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.id === caller.id && role !== target.role) return { ok: false, reason: "self-role" };
  if (emailTaken(email, target.id)) return { ok: false, reason: "duplicate-email" };

  const changed =
    role !== target.role
      ? "role"
      : email !== target.email || PAGE_KEYS.some((p) => permissions[p] !== target.permissions[p])
        ? "other"
        : "none";
  if (changed === "none") return { ok: true, user: toRow(target), audit, changed };

  const user: User = { ...target, email, role, permissions };
  replaceUser(user);
  return { ok: true, user: toRow(user), audit, changed };
}

/**
 * Deletes a user for good, with their in-memory password and failed-login count. Their session
 * ends on the next request. You cannot delete yourself. A malformed id is "not-found".
 */
export async function deleteUser(input: { id: string }): Promise<DeleteUserResult> {
  const caller = await userManager();
  if (!caller) return { ok: false, reason: "forbidden" };

  // A Server Action is a public endpoint: never trust the input's shape.
  const id = input?.id;
  if (!isField(id)) return { ok: false, reason: "not-found" };

  // Read the request before checking and changing anything: no await between the checks and the write.
  const audit = await auditFor(caller, caller.username);
  const target = getUserById(id);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.id === caller.id) return { ok: false, reason: "self" };

  removeUser(target.id);
  forgetPassword(target.id);
  clearFailures(target.username);
  return { ok: true, user: toRow(target), audit };
}
