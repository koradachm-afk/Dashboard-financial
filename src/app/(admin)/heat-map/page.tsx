import { requirePage } from "@/db/auth/auth";

import { HeatMapView } from "./_components/heat-map-view";
import { parseHeatQuery } from "./_components/heat-map-model";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  await requirePage("heat-map");
  return <HeatMapView initial={parseHeatQuery(params)} />;
}
