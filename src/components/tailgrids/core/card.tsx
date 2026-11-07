import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Admin card (DESIGN-STYLE 8.3): border instead of a shadow, header and body share the 20px gutter. */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  /** Right-aligned content (a toggle, a link). */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center gap-3 border-b border-line px-5 py-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-title font-semibold text-fg">{title}</h2>
        {description && <p className="text-label text-fg-2">{description}</p>}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </header>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
