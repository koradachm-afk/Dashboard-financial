// Server-only: reads the request headers. Never import from client code.
// Not a "use server" file, so this helper is not a public Server Action; the action files import it.
import { headers } from "next/headers";
import type { User } from "@/db/user/users";
import { describeUserAgent } from "@/utils/user-agent";

/** Who did it and from where, for the client to write into the audit log. */
export type AuditInfo = {
  actor: string;
  role: "Superadmin" | "Admin" | null;
  target: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
};

const ROLE_LABEL = { superadmin: "Superadmin", admin: "Admin" } as const;

/** Audit info for `user` from the current request; without a user, the typed `identifier` is the actor. */
export async function auditFor(user: User | undefined, identifier: string): Promise<AuditInfo> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const { browser, os, label } = describeUserAgent(h.get("user-agent") ?? "");
  const actor = user ? user.username : identifier;
  const role = user ? ROLE_LABEL[user.role] : null;
  return { actor, role, target: `บัญชี ${actor}`, ip, device: label, browser, os };
}
