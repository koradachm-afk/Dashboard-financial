import { cn } from "@/utils/cn";

/** Licence plate, size sm (96×40, tables). Always surface + fg border so it reads as a plate in both themes. */
export function Plate({ plate, province, className }: { plate: string; province: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-24 flex-col items-center justify-center rounded-sm border-[1.5px] border-fg bg-surface px-2.5 pt-0.5 pb-0.75",
        className,
      )}
    >
      <span className="text-body font-semibold whitespace-nowrap text-fg">{plate}</span>
      <span className="max-w-full truncate text-nano font-medium text-fg-2">{province}</span>
    </span>
  );
}
