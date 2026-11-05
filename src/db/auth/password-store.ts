// In-memory password overrides (mock: per server process, lost on restart).
// Kept out of the "use server" actions file on purpose: every export there is a
// client-callable Server Action, so a setter exported from it would let anyone set a password.

import type { User } from "@/db/user/users";

// A user id present here has set a password, which also clears its must-set flag.
const passwords = new Map<string, string>();

/** The password set in memory for `userId`, if any. */
export function passwordOverride(userId: string): string | undefined {
  return passwords.get(userId);
}

/** False once a password was set in memory, else the seed flag. */
export function mustSetPasswordFor(user: Pick<User, "id" | "mustSetPassword">): boolean {
  return !passwords.has(user.id) && user.mustSetPassword;
}

/** Stores the new password and clears the must-set flag. */
export function recordPasswordSet(userId: string, password: string): void {
  passwords.set(userId, password);
}

/** Test-only: forget every override. */
export function __resetPasswordStore(): void {
  passwords.clear();
}
