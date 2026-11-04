import { useSyncExternalStore } from "react";

import { createStore } from "./store";

export const AUDIT_ACTIONS = [
  "สร้าง",
  "แก้ไข",
  "ลบ",
  "เข้าสู่ระบบ",
  "ออกจากระบบ",
  "ล้มเหลว",
  "ส่งออก",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEntry = {
  id: string;
  time: string;
  ip: string;
  actor: string;
  role: "Superadmin" | "Admin" | null;
  action: AuditAction;
  page: string;
  detail: string;
  target: string;
  device: string;
  result: string;
};

const STRING_FIELDS = ["id", "time", "ip", "actor", "page", "detail", "target", "device", "result"] as const;

function isAuditEntry(value: unknown): value is AuditEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    STRING_FIELDS.every((k) => typeof e[k] === "string") &&
    (e.role === null || e.role === "Superadmin" || e.role === "Admin") &&
    AUDIT_ACTIONS.includes(e.action as AuditAction)
  );
}

export function isAuditLog(value: unknown): value is readonly AuditEntry[] {
  return Array.isArray(value) && value.every(isAuditEntry);
}

const store = createStore<readonly AuditEntry[]>({
  domain: "audit",
  seed: [],
  validate: isAuditLog,
});

export function getAuditLog(): readonly AuditEntry[] {
  return store.get();
}

export function useAuditLog(): readonly AuditEntry[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

function formatTime(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function newId(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return `#AL-${pad(n % 100000, 5)}`;
}

/** Prepend an entry to the audit log. Call only from event handlers. */
export function audit(entry: Omit<AuditEntry, "id" | "time">, now: Date = new Date()): AuditEntry {
  const full: AuditEntry = Object.freeze({ ...entry, id: newId(), time: formatTime(now) });
  store.set([full, ...store.get()]);
  return full;
}
