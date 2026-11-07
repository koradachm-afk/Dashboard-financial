import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PayCheckout } from "../_components/pay-checkout";
import { getCustomerSessions } from "@/db/customer/customer";
import { isParked } from "@/db/sessions/sessions";

const SESSION_ID_PATTERN =
  /^sess_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const session = getCustomerSessions().find(
    (item) => item.id === vehicleId && isParked(item),
  );

  if (!SESSION_ID_PATTERN.test(sessionId) || !session) notFound();

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  return (
    <PayCheckout
      key={`${sessionId}:${first(query.step)}:${first(query.method)}:${first(query.state)}:${first(query.ref)}:${first(query.paidAt)}`}
      customerSessionId={sessionId}
      session={session}
      searchQuery={first(query.q) || session.plate}
      step={first(query.step)}
      method={first(query.method)}
      bank={first(query.bank)}
      state={first(query.state)}
      reference={first(query.ref)}
      paidAt={first(query.paidAt)}
    />
  );
}
