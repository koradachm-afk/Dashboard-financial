import type { LucideIcon } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import { formatBaht, formatShare } from "@/utils/format";

export type BreakdownRow = {
  id: string;
  label: string;
  revenue: number;
  /** Shown under the label, e.g. "48 รายการ". */
  note?: string;
  icon?: LucideIcon;
  /** A `text-type-*` class; slot-type colours belong to icons only (DESIGN-STYLE 2.5). */
  iconClassName?: string;
};

/** A card of horizontal share bars: each row shows the baht and its share of the card's total. */
export function BreakdownCard({ title, description, rows }: { title: string; description?: string; rows: readonly BreakdownRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <ul className="flex flex-col gap-4">
          {rows.map(({ id, label, revenue, note, icon: Icon, iconClassName }) => (
            <li key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {Icon && <Icon size={16} aria-hidden className={cn("shrink-0", iconClassName)} />}
                <span className="text-body font-medium text-fg">{label}</span>
                {note && <span className="text-label text-fg-3 tabular-nums">{note}</span>}
                <span className="ml-auto text-body font-semibold text-fg tabular-nums">{formatBaht(revenue)}</span>
                <span className="w-12 text-right text-label text-fg-2 tabular-nums">{formatShare(revenue, total)}</span>
              </div>
              <div aria-hidden className="h-2 overflow-hidden rounded-full bg-page">
                <div className="h-full rounded-full bg-primary" style={{ width: formatShare(revenue, total) }} />
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
