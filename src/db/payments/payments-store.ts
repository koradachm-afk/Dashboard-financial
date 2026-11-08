"use client";

import { useSyncExternalStore } from "react";

import { audit } from "@/db/audit/audit";
import { createStore } from "@/db/store";
import {
  ensureCustomerSession,
  getStoredSessions,
  updateSession,
} from "@/db/sessions/sessions-store";
import { newSessionId } from "@/utils/id";
import data from "./payments.json";
import { isPaymentList, loadPayments, type Payment } from "./payments";

const SEED = loadPayments(data);
const store = createStore<readonly Payment[]>({
  domain: "payments",
  seed: SEED,
  validate: (value): value is readonly Payment[] =>
    isPaymentList(value, getStoredSessions()),
});

export function usePayments(): readonly Payment[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export function recordMockPayment(input: {
  sessionId: string;
  amount: number;
  method?: "qr" | "bank";
  bank?: string | null;
  reference?: string;
  paidAt?: Date;
}): Payment {
  const method = input.method ?? "qr";
  const bank = method === "bank" ? input.bank ?? null : null;
  const ref = input.reference ?? `PP-${newSessionId().replaceAll("-", "").slice(-12)}`;
  const existing = store.get().find((payment) => payment.ref === ref);
  if (existing) return existing;

  ensureCustomerSession(input.sessionId);
  updateSession(input.sessionId, { fee: input.amount });
  const paidAt = input.paidAt ?? new Date();
  const payment: Payment = Object.freeze({
    ref,
    sessionId: input.sessionId,
    amount: input.amount,
    method,
    bank,
    paidAt: `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}-${String(paidAt.getDate()).padStart(2, "0")} ${String(paidAt.getHours()).padStart(2, "0")}:${String(paidAt.getMinutes()).padStart(2, "0")}`,
  });
  const next = [payment, ...store.get()];
  if (!isPaymentList(next, getStoredSessions())) {
    throw new Error("Cannot save an invalid payment");
  }
  store.set(next);
  audit({
    ip: "127.0.0.1",
    actor: "ลูกค้า",
    role: null,
    action: "สร้าง",
    page: "Customer Web",
    detail: `ชำระค่าจอด ${payment.amount} บาท`,
    target: input.sessionId,
    device: "Customer Web",
    result: "สำเร็จ",
    title: "ชำระค่าจอด",
    extras: [{ label: "ช่องทาง", value: method === "qr" ? "QR PromptPay" : "Mobile Banking" }],
  });
  return payment;
}
