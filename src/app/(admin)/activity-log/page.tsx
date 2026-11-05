import { requirePage } from "@/db/auth/auth";

// The guard reads the session cookie, so the route blocks on that read and renders per request.
// redirect() is delivered inside the stream (a client-side navigation on an HTTP 200);
// an HTTP 307 before any bytes would need a proxy.ts check.
export const instant = false;

export default async function Page() {
  await requirePage("activity-log");
  return <>

  </>
  ;
}
