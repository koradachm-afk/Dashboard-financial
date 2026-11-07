import { requirePage } from "@/db/auth/auth";

import { ActivityLogView } from "./_components/activity-log-view";
import { parseCriteria, parsePage } from "./_components/activity-stats";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  await requirePage("activity-log");
  const criteria = parseCriteria(params);
  // Keyed by the filters (not the page number) so the form starts from the applied values after a search.
  return <ActivityLogView key={JSON.stringify(criteria)} criteria={criteria} page={parsePage(params)} />;
}
