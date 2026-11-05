"use server";
// Every export here is a client-callable Server Action: async functions and types only.
import { cookies, headers } from "next/headers";
import { getCurrentUser, getPasswordSetter, RESET_COOKIE, SESSION_COOKIE } from "@/db/auth/auth";
import { clearFailures, lockedUntil, MAX_FAILURES, recordFailure } from "@/db/auth/login-attempts";
import { passwordRulesMet } from "@/db/auth/password-rules";
import { mustSetPasswordFor, passwordOverride, recordPasswordSet } from "@/db/auth/password-store";
import { findUserByIdentifier, type User } from "@/db/user/users";
import { describeUserAgent } from "@/utils/user-agent";
// Mock demo passwords, plaintext by decision. Only this server module may import the file:
// anything a client component imports ships to the browser.
import credentials from "../user/credentials.json";

const CREDENTIALS: Readonly<Record<string, string>> = credentials;

// A password set in memory replaces the stored credential.
function passwordMatches(user: User, password: string): boolean {
  const stored = Object.hasOwn(CREDENTIALS, user.id) ? CREDENTIALS[user.id] : undefined;
  const expected = passwordOverride(user.id) ?? stored;
  return expected !== undefined && expected === password;
}

export type AuditInfo = {
  actor: string;
  role: "Superadmin" | "Admin" | null;
  target: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
};

export type LoginResult =
  | { ok: true; redirectTo: "/dashboard" | "/set-password"; audit: AuditInfo }
  | { ok: false; reason: "invalid"; attemptsLeft: number; attempt: number; audit: AuditInfo }
  | { ok: false; reason: "locked"; lockedUntil: number; audit: AuditInfo | null };

const MAX_IDENTIFIER = 254;

const ROLE_LABEL ={ superadmin: "Superadmin", admin: "Admin" } as const;

// Not exported: every export of this file is a public Server Action.
async function startSession(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
}

async function auditFor(user: User | undefined, identifier: string): Promise<AuditInfo> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const { browser, os, label } = describeUserAgent(h.get("user-agent") ?? "");
  const actor = user ? user.username : identifier;
  const role = user ? ROLE_LABEL[user.role] : null;
  return { actor, role, target: `บัญชี ${actor}`, ip, device: label, browser, os };
}

export async function login(input: { identifier: string; password: string }): Promise<LoginResult> {
  // A Server Action is a public endpoint: never trust the input's shape.
  // Capped at the longest valid email, so a huge input cannot bloat the counter map or the audit log.
  const identifier = typeof input?.identifier === "string" ? input.identifier.trim().slice(0, MAX_IDENTIFIER) : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const user = findUserByIdentifier(identifier);
  // Username and email of one user share a counter; unknown identifiers are counted the same way.
  const key = user ? user.username : identifier.toLowerCase();

  // Every await happens before the lock check: check → compare → record must run without a
  // yield, or concurrent requests that passed the check could overwrite a fresh lock.
  const audit = await auditFor(user, identifier);
  const now = Date.now();

  const locked = lockedUntil(key, now);
  if (locked !== null) return { ok: false, reason: "locked", lockedUntil: locked, audit: null };

  if (!user || !passwordMatches(user, password)) {
    const failure = recordFailure(key, now);
    if (failure.lockedUntil !== null) {
      return { ok: false, reason: "locked", lockedUntil: failure.lockedUntil, audit };
    }
    const attempt = failure.attempt;
    return { ok: false, reason: "invalid", attempt, attemptsLeft: MAX_FAILURES - attempt, audit };
  }

  clearFailures(key);
  await startSession(user.id);
  // A reset abandoned on this browser would otherwise win over this user's invite on /set-password.
  (await cookies()).delete(RESET_COOKIE);
  return { ok: true, redirectTo: mustSetPasswordFor(user) ? "/set-password" : "/dashboard", audit };
}

/** Matches the email only (not the username), trimmed and case-insensitive; a match sets the reset cookie. */
export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ ok: true } | { ok: false; reason: "not-found" }> {
  // A Server Action is a public endpoint: never trust the input's shape.
  const email = typeof input?.email === "string" ? input.email.trim().slice(0, MAX_IDENTIFIER) : "";
  const user = findUserByIdentifier(email);
  if (!user || user.email.toLowerCase() !== email.toLowerCase()) return { ok: false, reason: "not-found" };

  (await cookies()).set(RESET_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
  });
  return { ok: true };
}

/**
 * Sets the password of whoever the request's cookies allow (reset cookie, else an invited session;
 * never the client's word), unlocks the account and signs in. No such user → "expired";
 * malformed input or a password that breaks a rule → "invalid", with nothing changed.
 */
export async function setPassword(input: {
  password: string;
  confirm: string;
}): Promise<{ ok: true; source: "reset" | "invite"; audit: AuditInfo } | { ok: false; reason: "expired" | "invalid" }> {
  const setter = await getPasswordSetter();
  if (!setter) return { ok: false, reason: "expired" };

  // A Server Action is a public endpoint: never trust the input's shape. Over-long is rejected, not cut.
  const password = input?.password;
  const confirm = input?.confirm;
  if (typeof password !== "string" || typeof confirm !== "string" || password.length > MAX_IDENTIFIER) {
    return { ok: false, reason: "invalid" };
  }
  if (!passwordRulesMet(password, confirm)) return { ok: false, reason: "invalid" };

  const { user, source } = setter;
  // Every request read happens before any change, so a failed read cannot leave half a reset.
  const audit = await auditFor(user, user.username);
  const jar = await cookies();

  recordPasswordSet(user.id, password);
  clearFailures(user.username);
  jar.delete(RESET_COOKIE);
  await startSession(user.id);
  return { ok: true, source, audit };
}

/**
 * Changes the password of the signed-in user (resolved from the session cookie, never the
 * client's word). No session → "expired"; malformed or over-long input, or a new password that
 * breaks a rule → "invalid"; a wrong current password → "wrong-current", not counted as a failed
 * login. Nothing changes on failure; the session cookie is never touched.
 */
export async function changePassword(input: {
  current: string;
  password: string;
  confirm: string;
}): Promise<{ ok: true; audit: AuditInfo } | { ok: false; reason: "expired" | "wrong-current" | "invalid" }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "expired" };

  // A Server Action is a public endpoint: never trust the input's shape. Over-long is rejected, not cut.
  const fields = [input?.current, input?.password, input?.confirm];
  if (!fields.every((f): f is string => typeof f === "string" && f.length <= MAX_IDENTIFIER)) {
    return { ok: false, reason: "invalid" };
  }
  const [current, password, confirm] = fields;
  if (!passwordMatches(user, current)) return { ok: false, reason: "wrong-current" };
  if (!passwordRulesMet(password, confirm)) return { ok: false, reason: "invalid" };

  // Read the request before changing anything, so a failed read stores nothing.
  const audit = await auditFor(user, user.username);
  recordPasswordSet(user.id, password);
  return { ok: true, audit };
}

/** Ends the session and returns the audit info of who left (null without a valid session). The caller writes the "ออกจากระบบ" entry. */
export async function logout(): Promise<AuditInfo | null> {
  // Read the user before the cookie is deleted.
  const user = await getCurrentUser();
  const info = user ? await auditFor(user, user.username) : null;
  (await cookies()).delete(SESSION_COOKIE);
  return info;
}
