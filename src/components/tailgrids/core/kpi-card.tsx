import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

export type KpiTrend = "up" | "down" | "flat";

const TREND_COLOR: Record<KpiTrend, string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-fg-3",
};

/** KPI card (DESIGN-STYLE 8.3). The sub line carries its own sign, so colour never stands alone. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  trend = "flat",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  trend?: KpiTrend;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-line bg-surface px-5 py-4.5", className)}>
      <p className="flex items-center gap-2 text-body text-fg-2">
        <Icon size={16} aria-hidden className="shrink-0" />
        {label}
      </p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-kpi font-bold text-fg tabular-nums">{value}</span>
        {unit && <span className="text-body text-fg-2">{unit}</span>}
      </p>
      {sub && <p className={cn("text-label tabular-nums", TREND_COLOR[trend])}>{sub}</p>}
    </div>
  );
}
