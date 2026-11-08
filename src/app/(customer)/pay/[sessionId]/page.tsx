import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PaySessionCheckoutView } from "../_components/pay-session-checkout-view";
import { getCustomerSessions } from "@/db/customer/customer";
import { getSessions, isParked } from "@/db/sessions/sessions";

const SESSION_ID_PATTERN =
  /^sess_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PARKING_SESSION_ID_PATTERN = SESSION_ID_PATTERN;

export default function CheckoutPage(props: PageProps<"/pay/[sessionId]">) {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 bg-page" />}>
      <CheckoutPageContent
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  );
}

async function CheckoutPageContent({
  params,
  searchParams,
}: Pick<PageProps<"/pay/[sessionId]">, "params" | "searchParams">) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const vehicleId = Array.isArray(query.vehicle)
    ? query.vehicle[0]
    : query.vehicle;
  const seededSession = [...getCustomerSessions(), ...getSessions()].find(
    (session) => session.id === vehicleId,
  );

  if (!SESSION_ID_PATTERN.test(sessionId) || !vehicleId) notFound();
  if (seededSession && !isParked(seededSession)) notFound();
  if (
    !seededSession &&
    !PARKING_SESSION_ID_PATTERN.test(vehicleId)
  ) {
    notFound();
  }

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  return (
    <PaySessionCheckoutView
      key={`${sessionId}:${first(query.step)}:${first(query.method)}:${first(query.state)}:${first(query.ref)}:${first(query.paidAt)}`}
      customerSessionId={sessionId}
      vehicleId={vehicleId}
      searchQuery={first(query.q) || seededSession?.plate || ""}
      step={first(query.step)}
      method={first(query.method)}
      bank={first(query.bank)}
      state={first(query.state)}
      reference={first(query.ref)}
      paidAt={first(query.paidAt)}
    />
  );
}
