import { requirePage } from "@/db/auth/auth";

import { FinancialOverviewView } from "./_components/financial-overview-view";
import { parseView } from "./_components/period";


// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;




type Query = { view?: string | string[]; period?: string | string[] };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const { view, period } = await searchParams;
  await requirePage("financial-overview");
  return <FinancialOverviewView initialView={parseView(first(view))} initialKey={first(period)} />;
}
