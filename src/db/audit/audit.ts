import { useSyncExternalStore } from "react";

import { createStore } from "../store";
import seed from "./audit-logs.json";

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

export type AuditChange = { field: string; before: string; after: string };
export type AuditExtra = { label: string; value: string };

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
  /** Drawer heading; callers fall back to `detail`. */
  title?: string;
  /** Before/after rows shown in the detail drawer. */
  changes?: readonly AuditChange[];
  /** Extra meta rows shown after the result row. */
  extras?: readonly AuditExtra[];
};

const STRING_FIELDS = ["id", "time", "ip", "actor", "page", "detail", "target", "device", "result"] as const;

const isStringRecord = (keys: readonly string[]) => (v: unknown) =>
  typeof v === "object" && v !== null && keys.every((k) => typeof (v as Record<string, unknown>)[k] === "string");
const isChange = isStringRecord(["field", "before", "after"]);
const isExtra = isStringRecord(["label", "value"]);

function isAuditEntry(value: unknown): value is AuditEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    STRING_FIELDS.every((k) => typeof e[k] === "string") &&
    (e.role === null || e.role === "Superadmin" || e.role === "Admin") &&
    AUDIT_ACTIONS.includes(e.action as AuditAction) &&
    (e.title === undefined || typeof e.title === "string") &&
    (e.changes === undefined || (Array.isArray(e.changes) && e.changes.every(isChange))) &&
    (e.extras === undefined || (Array.isArray(e.extras) && e.extras.every(isExtra)))
  );
}

export function isAuditLog(value: unknown): value is readonly AuditEntry[] {
  return Array.isArray(value) && value.every(isAuditEntry);
}

/** Checks the JSON seed, since a JSON import is only loosely typed. Throws so bad seed data fails at load. */
export function loadAuditSeed(data: unknown): readonly AuditEntry[] {
  if (!isAuditLog(data)) throw new Error("src/db/audit/audit-logs.json is not a valid audit log");
  return Object.freeze(data.map((entry) => Object.freeze({ ...entry })));
}

/** The 20 audit entries shown in the Figma Audit Logs frames (08, 08.19, 08.2, 08.20–08.38), newest first. */
export const AUDIT_SEED = loadAuditSeed(seed);

const store = createStore<readonly AuditEntry[]>({
  domain: "audit",
  seed: [],
  validate: isAuditLog,
});

// Stored entries come first, then the Figma seed. Memoised per stored snapshot so
// useSyncExternalStore sees the same array until the stored entries change.
let lastStored: readonly AuditEntry[] | undefined;
let lastCombined: readonly AuditEntry[] = AUDIT_SEED;

function combined(): readonly AuditEntry[] {
  const stored = store.get();
  if (stored !== lastStored) {
    lastStored = stored;
    lastCombined = stored.length === 0 ? AUDIT_SEED : Object.freeze([...stored, ...AUDIT_SEED]);
  }
  return lastCombined;
}

export function getAuditLog(): readonly AuditEntry[] {
  return combined();
}

export function useAuditLog(): readonly AuditEntry[] {
  return useSyncExternalStore(store.subscribe, combined, () => AUDIT_SEED);
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
