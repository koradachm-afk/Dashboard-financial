import { BANKS } from "@/db/banks/banks";
import { getSessions } from "@/db/sessions/sessions";
import data from "./payments.json";

export type Payment = {
  /** Payment reference, e.g. "PP171343" */
  ref: string;
  /** A session id from sessions.json */
  sessionId: string;
  /** Baht; equals the fee of the session */
  amount: number;
  method: "qr" | "bank";
  /** A bank id from banks.json when method is "bank", otherwise null */
  bank: string | null;
  /** "YYYY-MM-DD HH:MM" */
  paidAt: string;
};

const rec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isText = (v: unknown): v is string => typeof v === "string" && v !== "";
const isTime = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v);

function isPayment(v: unknown): v is Payment {
  if (!rec(v) || !isText(v.ref) || !isText(v.sessionId) || !isTime(v.paidAt)) return false;
  if (typeof v.amount !== "number" || !Number.isInteger(v.amount) || v.amount <= 0) return false;
  const session = getSessions().find((s) => s.id === v.sessionId);
  if (!session || session.fee !== v.amount) return false;
  if (v.method === "qr") return v.bank === null;
  return v.method === "bank" && BANKS.some((b) => b.id === v.bank);
}

export function isPaymentList(value: unknown): value is readonly Payment[] {
  return (
    Array.isArray(value) &&
    value.every(isPayment) &&
    new Set(value.map((p: Payment) => p.ref)).size === value.length
  );
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Validates the seed and returns it deep-frozen. Throws naming the file when it is invalid. */
export function loadPayments(input: unknown): readonly Payment[] {
  if (!isPaymentList(input)) throw new Error("payments.json is invalid");
  return deepFreeze(structuredClone(input));
}

const PAYMENTS: readonly Payment[] = loadPayments(data);

export function getPayments(): readonly Payment[] {
  return PAYMENTS;
}

export function paymentForSession(sessionId: string): Payment | undefined {
  return PAYMENTS.find((p) => p.sessionId === sessionId);
}
