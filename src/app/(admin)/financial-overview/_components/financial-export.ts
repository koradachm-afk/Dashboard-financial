import type { FinancialData } from "@/db/reports/reports";

import type { PaymentRow } from "./payment-rows";
import { periodKey, sliceLabel, type View } from "./period";

export const exportFileName = (data: FinancialData) => `financial-overview-${periodKey(data.period)}.xlsx`;

/** Builds a three-sheet workbook (summary · revenue chart · payments) and saves it. xlsx loads on first use. */
export async function downloadFinancialXlsx(view: View, data: FinancialData, payments: readonly PaymentRow[], fileName: string): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const { kpis } = data;
  const book = utils.book_new();

  const summary = [
    { รายการ: "ช่วงเวลา", ค่า: data.label },
    { รายการ: "รายรับรวม (บาท)", ค่า: kpis.revenue },
    { รายการ: "รายการชำระ", ค่า: kpis.payments },
    { รายการ: "ค่าจอดเฉลี่ยต่อครั้ง (บาท)", ค่า: kpis.avgFee },
    { รายการ: "ช่วงรายรับสูงสุด", ค่า: `${kpis.peak.label} · ${kpis.peak.revenue} บาท · ${kpis.peak.sharePct}%` },
    ...Object.entries(data.bySlotType).map(([id, revenue]) => ({ รายการ: `รายรับตามประเภทช่องจอด · ${id} (บาท)`, ค่า: revenue })),
    ...data.byDuration.map((d) => ({ รายการ: `รายรับตามระยะเวลาจอด · ${d.label} (บาท)`, ค่า: d.revenue })),
  ];
  utils.book_append_sheet(book, utils.json_to_sheet(summary), "สรุป");

  const series = data.series.points.map((p) => ({ ช่วง: sliceLabel(view, p.x), "รายรับ (บาท)": p.revenue }));
  utils.book_append_sheet(book, utils.json_to_sheet(series), "รายรับ");

  const rows = payments.map((p) => ({
    เวลาชำระ: p.paidAt,
    เลขอ้างอิง: p.ref,
    ทะเบียน: p.plate,
    จังหวัด: p.province,
    ช่องจอด: p.slot ?? "",
    ประเภทช่องจอด: p.slotType ?? "",
    เวลาเข้า: p.entryTime,
    เวลาออก: p.exitTime,
    ระยะเวลา: p.duration,
    ช่องทางชำระ: p.method,
    "ยอด (บาท)": p.amount,
  }));
  utils.book_append_sheet(book, utils.json_to_sheet(rows), "รายการชำระ");

  writeFile(book, fileName);
}
