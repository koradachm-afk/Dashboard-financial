import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Accessible name of the nav landmark (copy comes from the caller). */
  label?: string;
  previousLabel: string;
  nextLabel: string;
  className?: string;
};

const MAX_FULL = 7;

/** Up to 7 pages: all of them. More: first, last, current ±1, gaps as "…". */
function pageItems(page: number, last: number): (number | "…")[] {
  if (last <= MAX_FULL) return Array.from({ length: last }, (_, i) => i + 1);
  const shown = [...new Set([1, page - 1, page, page + 1, last])]
    .filter((n) => n >= 1 && n <= last)
    .sort((a, b) => a - b);
  return shown.flatMap((n, i) =>
    i > 0 && n - shown[i - 1] > 1 ? ["…" as const, n] : [n],
  );
}

const itemClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-body transition-colors disabled:pointer-events-none";
const idleClass =
  "border border-line bg-surface text-fg font-medium hover:bg-subtle disabled:opacity-50";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
  className,
}: PaginationProps) {
  const last = Math.max(pageCount, 1);
  const single = pageCount <= 1;

  return (
    <nav aria-label={label} className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label={previousLabel}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(itemClass, idleClass, "text-fg-2")}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {pageItems(page, last).map((item, i) => {
        if (item === "…") {
          return (
            <span
              key={`gap-${i}`}
              data-ellipsis
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center text-body text-fg-3"
            >
              …
            </span>
          );
        }
        const current = item === page;
        return (
          <button
            key={item}
            type="button"
            aria-current={current ? "page" : undefined}
            disabled={single}
            onClick={() => {
              if (!current) onPageChange(item);
            }}
            className={cn(
              itemClass,
              current
                ? "bg-primary text-on-primary font-semibold"
                : idleClass,
            )}
          >
            {item}
          </button>
        );
      })}
      <button
        type="button"
        aria-label={nextLabel}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className={cn(itemClass, idleClass, "text-fg-2")}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
