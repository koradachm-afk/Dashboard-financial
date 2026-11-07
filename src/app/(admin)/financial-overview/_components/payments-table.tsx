"use client";

import { Receipt } from "lucide-react";
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

export function PaymentsTable({ rows, periodLabel }: { rows: readonly PaymentRow[]; periodLabel: string }) {
  // `periodLabel` keys the page: a new period starts on page 1 without an effect.
  const [state, setState] = useState({ key: periodLabel, page: 1 });
  const page = state.key === periodLabel ? state.page : 1;
  const total = rows.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <Card>
      <CardHeader title="รายการชำระ" description={periodLabel} />
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={cn(TH, "w-44")}>เวลาชำระ</th>
            <th scope="col" className={cn(TH, "w-36")}>เลขอ้างอิง</th>
            <th scope="col" className={cn(TH, "w-40")}>ทะเบียน</th>
            <th scope="col" className={TH}>ประเภทรถ</th>
            <th scope="col" className={cn(TH, "w-28")}>ช่องจอด</th>
            <th scope="col" className={cn(TH, "w-52")}>วิธีชำระ</th>
            <th scope="col" className={cn(TH, "w-32 text-right")}>ยอดชำระ</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.ref} className="border-b border-line">
              <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{r.paidAt}</td>
              <td className={cn(TD, "tabular-nums")}>{r.ref}</td>
              <td className={TD}>
                <Plate plate={r.plate} province={r.province} />
              </td>
              <td className={cn(TD, "truncate", r.vehicleType === null && "text-fg-3")}>{r.vehicleType ?? "ไม่ระบุ"}</td>
              <td className={cn(TD, "tabular-nums", r.slot === null && "text-fg-3")}>{r.slot ?? "ไม่ทราบช่อง"}</td>
              <td className={cn(TD, "truncate")}>{r.method}</td>
              <td className={cn(TD, "text-right font-semibold tabular-nums")}>{formatBaht(r.amount)}</td>
            </tr>
          ))}
          {total === 0 && (
            <tr>
              <td colSpan={7}>
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
      <footer className="flex items-center gap-3 border-t border-line px-4 py-3">
        <p className="text-body text-fg-2 tabular-nums">
          {total === 0 ? "แสดง 0 จาก 0" : `แสดง ${start + 1}–${start + visible.length} จาก ${total}`}
        </p>
        {total > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={(p) => setState({ key: periodLabel, page: p })}
            label="การแบ่งหน้า"
            previousLabel="หน้าก่อนหน้า"
            nextLabel="หน้าถัดไป"
            className="ml-auto"
          />
        )}
      </footer>
    </Card>
  );
}
