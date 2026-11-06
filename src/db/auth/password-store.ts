// In-memory password overrides (mock: per server process, lost on restart).
// Kept out of the "use server" actions file on purpose: every export there is a
// client-callable Server Action, so a setter exported from it would let anyone set a password.

import type { User } from "@/db/user/users";

// The current in-memory password per user id (set by the user, or the initial one from creation).
const passwords = new Map<string, string>();
// User ids that completed set-password / change-password: their must-set flag is cleared.
// Kept apart from `passwords` because an initial password must not clear the flag.
const passwordSetDone = new Set<string>();

/** The password set in memory for `userId`, if any. */
export function passwordOverride(userId: string): string | undefined {
  return passwords.get(userId);
}

/** False once the user set a password in memory, else the stored flag. */
export function mustSetPasswordFor(user: Pick<User, "id" | "mustSetPassword">): boolean {
  return !passwordSetDone.has(user.id) && user.mustSetPassword;
}

/** Stores the new password and clears the must-set flag. */
export function recordPasswordSet(userId: string, password: string): void {
  passwords.set(userId, password);
  passwordSetDone.add(userId);
}

/** Stores the password a new user was created with. The must-set flag stays until they set their own. */
export function recordInitialPassword(userId: string, password: string): void {
  passwords.set(userId, password);
  passwordSetDone.delete(userId);
}

/** Drops everything stored for `userId` (on delete), so a later user with the same id starts clean. */
export function forgetPassword(userId: string): void {
  passwords.delete(userId);
  passwordSetDone.delete(userId);
}

/** Test-only: forget every override. */
export function __resetPasswordStore(): void {
  passwords.clear();
  passwordSetDone.clear();
}
