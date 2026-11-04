// In-memory failed-login counter (mock: per server process, lost on restart).
// Kept out of the "use server" actions file on purpose: every export there is a
// client-callable Server Action, so a reset exported from it would be a lock bypass.

export const MAX_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; lockedUntil: number }>();

/** The lock expiry for `key` if it is still locked at `now`, else null. Drops an expired lock. */
export function lockedUntil(key: string, now: number): number | null {
  const entry = attempts.get(key);
  if (!entry) return null;
  if (entry.lockedUntil > now) return entry.lockedUntil;
  if (entry.count === 0) attempts.delete(key);
  return null;
}

/** Counts one failure. The MAX_FAILURES-th failure locks the key and resets its count. */
export function recordFailure(key: string, now: number): { attempt: number; lockedUntil: number | null } {
  const attempt = (attempts.get(key)?.count ?? 0) + 1;
  if (attempt >= MAX_FAILURES) {
    const until = now + LOCK_MS;
    attempts.set(key, { count: 0, lockedUntil: until });
    return { attempt, lockedUntil: until };
  }
  attempts.set(key, { count: attempt, lockedUntil: 0 });
  return { attempt, lockedUntil: null };
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}

/** Test-only: forget every counter. */
export function __resetLoginAttempts(): void {
  attempts.clear();
}

/** Test-only: the keys currently tracked. */
export function __attemptKeys(): string[] {
  return [...attempts.keys()];
}
