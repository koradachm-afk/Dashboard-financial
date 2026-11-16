"use client";

import { ArrowDown, Receipt } from "lucide-react";
import { useState } from "react";

import { Card, CardHeader } from "@/components/tailgrids/core/card";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { Plate } from "@/components/tailgrids/core/plate";
import { cn } from "@/utils/cn";
import { formatBaht } from "@/utils/format";

import type { PaymentRow } from "./payment-rows";

const PAGE_SIZE = 10;
const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4 text-body text-fg";

/**
 * `total` is the payment count Figma prints ("แสดง 1–10 จาก 161"); the pages come from the rows the seed has,
 * which are fewer (Figma 13 shows 3 pages for 161 payments).
 */
export function PaymentsTable({ rows, total, note }: { rows: readonly PaymentRow[]; total: number; note: string }) {
  // `note` (the period) keys the page: a new period starts on page 1 without an effect.
  const [state, setState] = useState({ key: note, page: 1 });
  const page = state.key === note ? state.page : 1;
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <Card>
      <CardHeader title="รายการชำระเงิน" action={<span className="text-label text-fg-3 tabular-nums">{note}</span>} />
      {/* The parking-space column is omitted; entry and exit times are shown separately. */}
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" aria-sort="descending" className={cn(TH, "w-37.5 text-primary")}>
              <span className="inline-flex items-center gap-1.5">
                เวลาชำระ
                <ArrowDown size={14} aria-hidden />
              </span>
            </th>
            <th scope="col" className={cn(TH, "w-25")}>เลขอ้างอิง</th>
            <th scope="col" className={cn(TH, "w-32")}>ทะเบียน</th>
            <th scope="col" className={cn(TH, "w-22.5")}>เวลาเข้า</th>
            <th scope="col" className={cn(TH, "w-22.5")}>เวลาออก</th>
            <th scope="col" className={cn(TH, "w-27.5")}>ระยะเวลา</th>
            <th scope="col" className={cn(TH, "w-32.5")}>ช่องทางชำระ</th>
            <th scope="col" className={cn(TH, "text-right")}>ยอด</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.ref} className="border-b border-line">
              <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{r.paidAt}</td>
              <td className={cn(TD, "text-fg-2 tabular-nums")}>{r.ref}</td>
              <td className={TD}>
                <Plate plate={r.plate} province={r.province} />
              </td>
              <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{r.entryTime}</td>
              <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{r.exitTime}</td>
              <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{r.duration}</td>
              <td className={TD}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft py-0.75 pr-2.5 pl-2 text-label font-semibold whitespace-nowrap text-success">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
                  {r.method}
                </span>
              </td>
              <td className={cn(TD, "text-right font-semibold tabular-nums")}>{formatBaht(r.amount)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="flex flex-col items-center gap-2.5 py-18">
                  <span className="grid size-14 place-items-center rounded-full bg-page text-fg-3">
                    <Receipt size={24} aria-hidden />
                  </span>
                  <p className="text-lead font-semibold text-fg">ไม่มีรายการชำระในช่วงนี้</p>
                  <p className="text-body text-fg-2">ลองเลือกช่วงเวลาอื่น</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <footer className="flex items-center gap-3 px-5 py-3">
        <p className="text-label text-fg-3">ค่าจอดคิดตามชั่วโมง ปัดเศษขึ้น (ตัวอย่าง)</p>
        <p className="ml-auto text-body text-fg-2 tabular-nums">
          {rows.length === 0 ? "แสดง 0 จาก 0" : `แสดง ${start + 1}–${start + visible.length} จาก ${total}`}
        </p>
        {rows.length > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={(p) => setState({ key: note, page: p })}
            label="การแบ่งหน้า"
            previousLabel="หน้าก่อนหน้า"
            nextLabel="หน้าถัดไป"
          />
        )}
      </footer>
    </Card>
  );
}
