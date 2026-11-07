import { Accessibility, Car, Crown, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import type { FinancialSlotType } from "@/db/reports/reports";
import { getFreeByType } from "@/db/reports/reports";
import { cn } from "@/utils/cn";

import type { SlotCounts } from "./dashboard-data";
import { LiveBadge } from "./live-badge";

// Slot-type colours belong to icons only (DESIGN-STYLE 2.5), and Tailwind needs the full class names.
const TYPE_ICON: Record<FinancialSlotType, { icon: LucideIcon; className: string }> = {
  car: { icon: Car, className: "text-type-general" },
  ev: { icon: Zap, className: "text-type-ev" },
  accessible: { icon: Accessibility, className: "text-type-accessible" },
  vip: { icon: Crown, className: "text-type-vip" },
};

const TILES = [
  { key: "free", label: "ว่าง", tile: "bg-slot-available-soft", dot: "text-slot-available" },
  { key: "occupied", label: "ไม่ว่าง", tile: "bg-slot-occupied-soft", dot: "text-slot-occupied" },
  { key: "disabled", label: "ปิดใช้งาน", tile: "bg-slot-disabled-soft", dot: "text-slot-disabled" },
  { key: "unknown", label: "ไม่ทราบสถานะ", tile: "bg-slot-unknown-soft", dot: "text-slot-unknown" },
] as const;

export function SlotStatusCard({ counts }: { counts: SlotCounts }) {
  return (
    <Card>
      <CardHeader
        title="ช่องจอดตอนนี้"
        action={
          <span className="flex items-center gap-3">
            <LiveBadge />
            <Link href="/parking-layout" className="text-label font-medium text-fg-2 hover:text-fg">
              ดูผัง
            </Link>
          </span>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-2">
          {TILES.map((t) => (
            <li key={t.key} className={cn("flex flex-col gap-1 rounded-lg px-3 py-2.5", t.tile)}>
              <span className="flex items-center gap-1.5 text-label text-fg-2">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full bg-current", t.dot)} />
                {t.label}
              </span>
              <span className="text-h2 font-bold text-fg tabular-nums">{counts[t.key]}</span>
            </li>
          ))}
        </ul>
        <h3 className="text-body font-semibold text-fg">ว่างแยกตามประเภท</h3>
        <ul className="flex flex-col gap-3.5">
          {getFreeByType().map(({ id, label, free, total }) => {
            const { icon: Icon, className } = TYPE_ICON[id];
            return (
              <li key={id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} aria-hidden className={cn("shrink-0", className)} />
                  <span className="text-body text-fg">{label}</span>
                  <span className="ml-auto text-body tabular-nums">
                    <span className="font-semibold text-fg">{free}</span>
                    <span className="text-fg-3"> / {total}</span>
                  </span>
                </div>
                <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-page">
                  <div className="h-full rounded-full bg-success" style={{ width: `${total > 0 ? (free / total) * 100 : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
