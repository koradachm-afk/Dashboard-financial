import { requirePage } from "@/db/auth/auth";

import { AuditLogsView } from "./_components/audit-logs-view";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id } = await searchParams;
  await requirePage("audit-logs");
  return <AuditLogsView initialId={Array.isArray(id) ? id[0] : id} />;
}
