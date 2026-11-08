import { Suspense } from "react";
import { io } from "next/cache";

import { KioskGateView } from "../_components/kiosk-gate-view";

export default function Page(props: PageProps<"/kiosk/exit">) {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 bg-page" />}>
      <KioskPageContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function KioskPageContent({
  searchParams,
}: Pick<PageProps<"/kiosk/exit">, "searchParams">) {
  const query = await searchParams;
  const state = Array.isArray(query.state) ? query.state[0] ?? "" : query.state ?? "";
  const demo = Array.isArray(query.demo) ? query.demo[0] : query.demo;
  await io();

  return (
    <KioskGateView
      mode="exit"
      initialState={state}
      initialTime={new Date().toISOString()}
      demo={demo === "1"}
    />
  );
}
