"use server";
// Every export here is a client-callable Server Action: async functions and types only.
import { auditFor, type AuditInfo } from "@/db/auth/audit-info";
import { getCurrentUser } from "@/db/auth/auth";
import { accessFor } from "@/db/user/access";

/**
 * Audit info for an Audit Logs export, or null unless the caller is signed in and can open Audit Logs (access "edit").
 * The client exports nothing on null, and writes the "ส่งออก" entry from this info on success.
 * Not `requirePage`: its redirect would throw inside an action.
 */
export async function exportAuditInfo(): Promise<AuditInfo | null> {
  const user = await getCurrentUser();
  if (!user || accessFor(user, "audit-logs") !== "edit") return null;
  return auditFor(user, user.username);
}
