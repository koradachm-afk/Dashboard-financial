import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Shared by the 403 and 404 pages (Figma 07.9 / 07.10). Server-safe: presentational only.
export function ErrorCard({
  icon: Icon,
  code,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  code: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="flex w-130 max-w-full flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-10">
      <div className="flex size-18 items-center justify-center rounded-full bg-slot-disabled-soft">
        <Icon size={32} className="text-fg-2" aria-hidden />
      </div>
      <p className="text-body font-semibold text-fg-3">{code}</p>
      <h1 className="text-h2 font-bold text-fg">{title}</h1>
      <p className="max-w-105 text-center text-control text-fg-2">{description}</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">{actions}</div>
    </div>
  );
}
