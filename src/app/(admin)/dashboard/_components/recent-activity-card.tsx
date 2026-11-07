"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Card, CardHeader } from "@/components/tailgrids/core/card";
import { Pagination } from "@/components/tailgrids/core/pagination";
import { Plate } from "@/components/tailgrids/core/plate";
import { cn } from "@/utils/cn";
import { formatBaht, formatInt } from "@/utils/format";

import type { ActivityRow } from "./dashboard-data";

const PAGE_SIZE = 10;
const TH = "h-11 px-4 text-left text-label font-semibold text-fg-2";
const TD = "h-14 px-4 text-body text-fg";

function EventBadge({ out }: { out: boolean }) {
  const Icon = out ? LogOut : LogIn;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md py-0.75 pr-2.5 pl-2 text-label font-semibold whitespace-nowrap",
        out ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
      )}
    >
      <Icon size={14} aria-hidden />
      {out ? "ออก" : "เข้า"}
    </span>
  );
}

/**
 * `total` is the count Figma prints ("แสดง 1–10 จาก 190"); the pages come from the sessions the seed has,
 * which are fewer.
 */
export function RecentActivityCard({ rows, total, description }: { rows: readonly ActivityRow[]; total: number; description: string }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);

  return (
    <Card>
      <CardHeader
        title="ความเคลื่อนไหวล่าสุด"
        description={description}
        action={
          <Link href="/activity-log" className="text-label font-medium text-fg-2 hover:text-fg">
            Activity Log
          </Link>
        }
      />
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={cn(TH, "w-22.5")}>เวลาเข้า</th>
            <th scope="col" className={cn(TH, "w-22.5")}>เวลาออก</th>
            <th scope="col" className={cn(TH, "w-30")}>เหตุการณ์</th>
            <th scope="col" className={cn(TH, "w-35")}>ทะเบียน</th>
            <th scope="col" className={cn(TH, "w-42.5")}>ประเภทรถ</th>
            <th scope="col" className={cn(TH, "w-27.5")}>ช่องจอด</th>
            <th scope="col" className={cn(TH, "text-right")}>ค่าจอด</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id} className="border-b border-line">
              <td className={cn(TD, "tabular-nums")}>{r.entryTime}</td>
              <td className={cn(TD, "tabular-nums", r.exitTime === null && "text-fg-3")}>{r.exitTime ?? "ยังไม่ออก"}</td>
              <td className={TD}>
                <EventBadge out={r.exitTime !== null} />
              </td>
              <td className={TD}>
                <Plate plate={r.plate} province={r.province} />
              </td>
              <td className={cn(TD, "truncate", r.vehicleType === null && "text-fg-3")}>{r.vehicleType ?? "ไม่ระบุ"}</td>
              <td className={cn(TD, "tabular-nums", r.slot === null && "text-fg-3")}>{r.slot ?? "ไม่ทราบช่อง"}</td>
              <td className={cn(TD, "text-right tabular-nums", r.fee === null ? "text-label text-fg-3" : "font-semibold")}>
                {r.fee === null ? "ยังไม่ชำระ" : formatBaht(r.fee)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="flex items-center gap-3 px-5 py-3">
        <p className="text-label text-fg-2 tabular-nums">
          แสดง {start + 1}–{start + visible.length} จาก {formatInt(total)}
        </p>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          label="การแบ่งหน้า"
          previousLabel="หน้าก่อนหน้า"
          nextLabel="หน้าถัดไป"
          className="ml-auto"
        />
      </footer>
    </Card>
  );
}
