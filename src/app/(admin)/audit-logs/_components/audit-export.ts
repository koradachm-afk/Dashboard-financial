import type { AuditChange, AuditEntry } from "@/db/audit/audit";

/** Column headers of the exported sheet, in order. */
export const EXPORT_HEADERS = [
  "เลขอ้างอิง",
  "เวลา",
  "IP",
  "ผู้กระทำ",
  "Role",
  "การกระทำ",
  "หน้า",
  "รายละเอียด",
  "เป้าหมาย",
  "อุปกรณ์",
  "ผลลัพธ์",
  "การเปลี่ยนแปลง",
] as const;

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string>;

/** "field: before → after" per change, joined with "; "; empty when there are none. */
export function changesText(changes: readonly AuditChange[] | undefined): string {
  return (changes ?? []).map((c) => `${c.field}: ${c.before} → ${c.after}`).join("; ");
}

export function exportRows(entries: readonly AuditEntry[]): ExportRow[] {
  return entries.map((e) => ({
    เลขอ้างอิง: e.id,
    เวลา: e.time,
    IP: e.ip,
    ผู้กระทำ: e.actor,
    Role: e.role ?? "",
    การกระทำ: e.action,
    หน้า: e.page,
    รายละเอียด: e.detail,
    เป้าหมาย: e.target,
    อุปกรณ์: e.device,
    ผลลัพธ์: e.result,
    การเปลี่ยนแปลง: changesText(e.changes),
  }));
}

/** `from` / `to` are "YYYY-MM-DD", the applied date range (inclusive). */
export function exportFileName(from: string, to: string): string {
  if (from === to) return `audit-logs-${from}.xlsx`;
  if (from.slice(0, 7) === to.slice(0, 7)) return `audit-logs-${from}_${to.slice(8)}.xlsx`;
  return `audit-logs-${from}_${to}.xlsx`;
}

const MAX_WIDTH = 60;

/** Builds a one-sheet workbook and saves it. xlsx is loaded on first use, so it stays out of the page bundle. */
export async function downloadAuditXlsx(rows: readonly ExportRow[], fileName: string): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const sheet = utils.json_to_sheet([...rows], { header: [...EXPORT_HEADERS] });
  sheet["!cols"] = EXPORT_HEADERS.map((h) => ({
    wch: Math.min(MAX_WIDTH, Math.max(h.length, ...rows.map((r) => r[h].length)) + 2),
  }));
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Audit Logs");
  writeFile(book, fileName);
}
