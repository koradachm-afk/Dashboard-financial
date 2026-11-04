import { requirePage } from "@/db/auth";

// The guard reads the session cookie, so this route renders per request (blocking) to give a real redirect.
export const instant = false;

export default async function Page() {
  await requirePage("dashboard");
  return <></>;
}
