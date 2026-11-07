import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";
import { formatBaht } from "@/utils/format";

export type BreakdownRow = {
  id: string;
  label: string;
  revenue: number;
  /** Fg-3 text after the amount, e.g. "48 ครั้ง". */
  note?: string;
  icon?: LucideIcon;
  /** A `text-type-*` class; slot-type colours belong to icons only (DESIGN-STYLE 2.5). */
  iconClassName?: string;
};

/** Rows of label · amount with a bar under each. Bars are relative to the largest row of the list (Figma 13). */
export function BreakdownList({ rows }: { rows: readonly BreakdownRow[] }) {
  const max = Math.max(...rows.map((r) => r.revenue), 0);
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map(({ id, label, revenue, note, icon: Icon, iconClassName }) => (
        <li key={id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} aria-hidden className={cn("shrink-0", iconClassName)} />}
            <span className="text-body text-fg">{label}</span>
            <span className="ml-auto flex items-baseline gap-2">
              <span className="text-body font-semibold text-fg tabular-nums">{formatBaht(revenue)}</span>
              {note && <span className="text-label text-fg-3 tabular-nums">{note}</span>}
            </span>
          </div>
          <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-primary" style={{ width: `${max > 0 ? (revenue / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
