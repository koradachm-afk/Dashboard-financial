"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { useCustomerSessions } from "@/db/customer/customer-store";
import { isParked } from "@/db/sessions/sessions";
import { PayCheckoutView } from "./pay-checkout-view";

const subscribeToHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

type Props = {
  customerSessionId: string;
  vehicleId: string;
  searchQuery: string;
  step: string;
  method: string;
  bank: string;
  state: string;
  reference: string;
  paidAt: string;
};

export function PaySessionCheckoutView(props: Props) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydration,
    getServerHydration,
  );
  const sessions = useCustomerSessions();
  const session = sessions.find(
    (item) => item.id === props.vehicleId && isParked(item),
  );

  if (!session) {
    if (!hydrated) {
      return <div aria-busy="true" className="min-h-full flex-1 bg-page" />;
    }

    return (
      <main className="mx-auto flex min-h-full w-full max-w-[480px] flex-1 flex-col items-center justify-center gap-4 bg-page px-5 text-center">
        <h1 className="text-h2 font-bold text-fg">ไม่พบข้อมูลรถที่จอด</h1>
        <p className="text-lead text-fg-2">
          กรุณาค้นหาทะเบียนรถอีกครั้งจากเบราว์เซอร์ที่ใช้ทำรายการ
        </p>
        <Button size="lg" className="w-full" onClick={() => router.push("/pay")}>
          กลับไปค้นหาทะเบียน
        </Button>
      </main>
    );
  }

  return <PayCheckoutView {...props} session={session} />;
}
