import type { Session } from "@/db/sessions/sessions";

import { formatStay, stayMinutes } from "./activity-stats";

/** Column headers of the exported sheet, in order. */
export const EXPORT_HEADERS = [
  "เวลาเข้า",
  "เวลาออก",
  "ทะเบียน",
  "จังหวัด",
  "ประเภทรถ",
  "ช่องจอด",
  "ระยะเวลา",
  "ค่าจอด (บาท)",
  "สถานะ",
] as const;

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string | number>;

// Values that have not happened yet are written as words, never "-" (AGENTS §3).
export function exportRows(rows: readonly Session[]): ExportRow[] {
  return rows.map((s) => ({
    เวลาเข้า: s.entryAt,
    เวลาออก: s.exitAt ?? "ยังไม่ออก",
    ทะเบียน: s.plate,
    จังหวัด: s.province,
    ประเภทรถ: s.vehicleType ?? "",
    ช่องจอด: s.slot ?? "",
    ระยะเวลา: formatStay(stayMinutes(s)),
    "ค่าจอด (บาท)": s.fee ?? "ยังไม่ชำระ",
    สถานะ: s.exitAt === null ? "จอดอยู่" : "ออกแล้ว",
  }));
}

/** `from` / `to` are "YYYY-MM-DD" (inclusive). */
export function exportFileName(from: string, to: string): string {
  if (from === to) return `activity-log-${from}.xlsx`;
  if (from.slice(0, 7) === to.slice(0, 7)) return `activity-log-${from}_${to.slice(8)}.xlsx`;
  return `activity-log-${from}_${to}.xlsx`;
}

const MAX_WIDTH = 40;

/** Builds a one-sheet workbook and saves it. xlsx is loaded on first use, so it stays out of the page bundle. */
export async function downloadActivityXlsx(rows: readonly ExportRow[], fileName: string): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const sheet = utils.json_to_sheet([...rows], { header: [...EXPORT_HEADERS] });
  sheet["!cols"] = EXPORT_HEADERS.map((h) => ({
    wch: Math.min(MAX_WIDTH, Math.max(h.length, ...rows.map((r) => String(r[h]).length)) + 2),
  }));
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Activity Log");
  writeFile(book, fileName);
}
