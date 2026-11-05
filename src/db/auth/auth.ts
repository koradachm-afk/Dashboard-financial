// Server-only session helpers for page.tsx guards. Never import from client code.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { mustSetPasswordFor } from "@/db/auth/password-store";
import { accessFor, getUserById, type Access, type PageKey, type User } from "@/db/user/users";

export const SESSION_COOKIE = "autoparking_session";
/** Set by the forgot-password flow. Mock: the cookie holds the user id. */
export const RESET_COOKIE = "autoparking_reset";

const RANK: Record<Access, number> = { none: 0, view: 1, edit: 2 };

/** The signed-in user from the session cookie, or null. Mock: the cookie holds the user id. */
export async function getCurrentUser(): Promise<User | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return (id && getUserById(id)) || null;
}

/**
 * Who may set a password now: a valid reset cookie → "reset"; else a signed-in user who must
 * still set one → "invite"; else null. A reset cookie with an unknown id is ignored.
 */
export async function getPasswordSetter(): Promise<{ user: User; source: "reset" | "invite" } | null> {
  const resetId = (await cookies()).get(RESET_COOKIE)?.value;
  const resetUser = resetId && getUserById(resetId);
  if (resetUser) return { user: resetUser, source: "reset" };
  const user = await getCurrentUser();
  return user && mustSetPasswordFor(user) ? { user, source: "invite" } : null;
}

/** Guard for a server page: no session → /login; access below `need` → /403. */
export async function requirePage(page: PageKey, need: "view" | "edit" = "view"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Fail closed: a missing or unknown access value ranks as "none".
  if ((RANK[accessFor(user, page)] ?? 0) < RANK[need]) redirect("/403");
  return user;
}
