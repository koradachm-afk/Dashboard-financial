import type { Floor } from "@/db/floors/floors";
import type { HeatMapPeriod } from "@/db/reports/reports";
import type { SlotType } from "@/db/slot-types/slot-types";

import { getSlotStats } from "./heat-map-model";
import { slotTypeOf } from "./slot-type-chip";

/** Column headers of the exported sheet, in order. */
export const EXPORT_HEADERS = [
  "ช่องจอด",
  "ประเภทช่อง",
  "จำนวนครั้ง",
  "ชั่วโมงจอดรวม",
  "อัตราการใช้ (%)",
  "จอดเฉลี่ย (นาที)",
] as const;

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string | number>;

/** One row per slot of the floor that matches the type filter. A figure the period does not carry stays empty. */
export function exportRows(
  floor: Floor,
  period: HeatMapPeriod,
  type: string | null,
  slotTypes: readonly SlotType[],
): ExportRow[] {
  return floor.slots
    .filter((s) => type === null || s.type === type)
    .map((s) => {
      const stats = getSlotStats(period, s.id);
      return {
        ช่องจอด: s.id,
        ประเภทช่อง: slotTypeOf(s.type, slotTypes)?.name ?? s.type,
        จำนวนครั้ง: stats.count ?? "",
        ชั่วโมงจอดรวม: stats.hours ?? "",
        "อัตราการใช้ (%)": stats.rate?.pct ?? "",
        "จอดเฉลี่ย (นาที)": stats.avgStayMin ?? "",
      };
    });
}

/** "heat-map-B1-30d.xlsx" */
export function exportFileName(floorName: string, period: HeatMapPeriod): string {
  return `heat-map-${floorName}-${period}.xlsx`;
}

/** Builds a one-sheet workbook and saves it. xlsx is loaded on first use, so it stays out of the page bundle. */
export async function downloadHeatMapXlsx(rows: readonly ExportRow[], fileName: string): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const sheet = utils.json_to_sheet([...rows], { header: [...EXPORT_HEADERS] });
  sheet["!cols"] = EXPORT_HEADERS.map((h) => ({
    wch: Math.max(h.length, ...rows.map((r) => String(r[h]).length)) + 2,
  }));
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Heat Map");
  writeFile(book, fileName);
}
