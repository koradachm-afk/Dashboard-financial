import { getBanks } from "@/db/banks/banks";
import { getFloors } from "@/db/floors/floors";
import { getPayments } from "@/db/payments/payments";
import type { FinancialPeriod } from "@/db/reports/reports";
import { getSessions } from "@/db/sessions/sessions";
import type { SlotType } from "@/db/slot-types/slot-types";

import { periodKey } from "./period";

export type PaymentRow = {
  ref: string;
  paidAt: string;
  plate: string;
  province: string;
  slot: string | null;
  /** Name of the slot's type ("EV"), null when the slot is not on any floor plan. */
  slotType: string | null;
  /** "20:41" · "21:56" */
  entryTime: string;
  exitTime: string;
  /** "59 นาที" · "1 ชม. 06 น." */
  duration: string;
  /** "PromptPay QR" or "Mobile Banking · <bank>". */
  method: string;
  amount: number;
};

const pad = (n: number) => String(n).padStart(2, "0");
const time = (stamp: string) => stamp.slice(11, 16);

/** Parked time between two "YYYY-MM-DD HH:MM" stamps: under an hour in minutes, otherwise hours and minutes. */
export function formatDuration(entryAt: string, exitAt: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(exitAt.replace(" ", "T") + "Z") - Date.parse(entryAt.replace(" ", "T") + "Z")) / 60000));
  return minutes < 60 ? `${minutes} นาที` : `${Math.floor(minutes / 60)} ชม. ${pad(minutes % 60)} น.`;
}

/** The payments inside a period (paidAt is "YYYY-MM-DD HH:MM", so the period key is a prefix), newest first. */
export function paymentRows(
  period: FinancialPeriod,
  slotTypeList: readonly SlotType[],
): PaymentRow[] {
  const key = periodKey(period);
  const sessions = new Map(getSessions().map((s) => [s.id, s]));
  const banks = new Map(getBanks().map((b) => [b.id, b.name]));
  const typeNames = new Map(slotTypeList.map((t) => [t.id, t.name]));
  const slotTypes = new Map(
    getFloors().flatMap((b) => b.floors.flatMap((f) => f.slots.map((s) => [`${f.id}/${s.id}`, typeNames.get(s.type) ?? null] as const))),
  );
  return getPayments()
    .filter((p) => p.paidAt.startsWith(key))
    .flatMap((p) => {
      const s = sessions.get(p.sessionId);
      if (!s || !s.exitAt) return [];
      const method = p.method === "qr" ? "PromptPay QR" : `Mobile Banking · ${banks.get(p.bank ?? "") ?? p.bank}`;
      return [
        {
          ref: p.ref,
          paidAt: p.paidAt,
          plate: s.plate,
          province: s.province,
          slot: s.slot,
          slotType: s.slot ? (slotTypes.get(`${s.floor}/${s.slot}`) ?? null) : null,
          entryTime: time(s.entryAt),
          exitTime: time(s.exitAt),
          duration: formatDuration(s.entryAt, s.exitAt),
          method,
          amount: p.amount,
        },
      ];
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}
