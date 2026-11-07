import { getBanks } from "@/db/banks/banks";
import { getPayments } from "@/db/payments/payments";
import type { FinancialPeriod } from "@/db/reports/reports";
import { getSessions } from "@/db/sessions/sessions";

import { periodKey } from "./period";

export type PaymentRow = {
  ref: string;
  paidAt: string;
  plate: string;
  province: string;
  vehicleType: string | null;
  slot: string | null;
  /** "QR PromptPay" or "Mobile Banking · <bank>". */
  method: string;
  amount: number;
};

/** The payments inside a period (paidAt is "YYYY-MM-DD HH:MM", so the period key is a prefix), newest first. */
export function paymentRows(period: FinancialPeriod): PaymentRow[] {
  const key = periodKey(period);
  const sessions = new Map(getSessions().map((s) => [s.id, s]));
  const banks = new Map(getBanks().map((b) => [b.id, b.name]));
  return getPayments()
    .filter((p) => p.paidAt.startsWith(key))
    .flatMap((p) => {
      const s = sessions.get(p.sessionId);
      if (!s) return [];
      const method = p.method === "qr" ? "QR PromptPay" : `Mobile Banking · ${banks.get(p.bank ?? "") ?? p.bank}`;
      return [{ ref: p.ref, paidAt: p.paidAt, plate: s.plate, province: s.province, vehicleType: s.vehicleType, slot: s.slot, method, amount: p.amount }];
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}
