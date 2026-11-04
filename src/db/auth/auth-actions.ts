"use server";
// Every export here is a client-callable Server Action: async functions and types only.
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/db/auth/auth";
import { clearFailures, lockedUntil, MAX_FAILURES, recordFailure } from "@/db/auth/login-attempts";
import { findUserByIdentifier, type User } from "@/db/user/users";
import { describeUserAgent } from "@/utils/user-agent";
// Mock demo passwords, plaintext by decision. Only this server module may import the file:
// anything a client component imports ships to the browser.
import credentials from "../user/credentials.json";

const CREDENTIALS: Readonly<Record<string, string>> = credentials;

function passwordMatches(user: User, password: string): boolean {
  return Object.hasOwn(CREDENTIALS, user.id) && CREDENTIALS[user.id] === password;
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
  (await cookies()).set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
  return { ok: true, redirectTo: user.mustSetPassword ? "/set-password" : "/dashboard", audit };
}

/** Ends the session. The caller writes the "ออกจากระบบ" audit entry. */
export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
