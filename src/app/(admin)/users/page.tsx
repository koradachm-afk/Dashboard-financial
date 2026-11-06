import { requirePage } from "@/db/auth/auth";
import { getUsers, type UserRow } from "@/db/user/users";

import { UsersView } from "./_components/users-view";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

export default async function Page() {
  const me = await requirePage("users");
  // Pick display fields explicitly so nothing else on a user record reaches the client bundle.
  const users: UserRow[] = getUsers().map(({ id, username, email, role, createdAt, permissions }) => ({
    id,
    username,
    email,
    role,
    createdAt,
    permissions,
  }));
  return <UsersView users={users} currentUserId={me.id} />;
}
