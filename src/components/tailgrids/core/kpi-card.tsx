import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/**
 * Comparison line "−23.3% เทียบวันก่อนหน้า": the leading percentage takes the trend colour (the sign is in the
 * text, so colour never stands alone) and the rest stays fg-3. No `pct` (no previous period) = all fg-3.
 */
export function KpiDelta({ pct, text }: { pct?: number; text: string }) {
  if (pct === undefined || pct === 0) return <>{text}</>;
  const cut = text.indexOf(" ");
  const head = cut === -1 ? text : text.slice(0, cut);
  const rest = cut === -1 ? "" : text.slice(cut);
  return (
    <>
      <span className={pct > 0 ? "text-success" : "text-danger"}>{head}</span>
      {rest}
    </>
  );
}

/** KPI card (DESIGN-STYLE 8.3). */
export function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  /** Under the value, fg-3. Wrap a colour-coded part in a span (see KpiDelta). */
  sub?: ReactNode;
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
      {sub && <p className="text-label text-fg-3 tabular-nums">{sub}</p>}
    </div>
  );
}
