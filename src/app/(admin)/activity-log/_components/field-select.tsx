"use client";

import { Check, ChevronDown, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { cn } from "@/utils/cn";

/** Select look of the filter bar (DESIGN-STYLE 8.1 Select): used by the select and by the date buttons so they match. */
export const FIELD_CLASS =
  "flex h-9 w-full cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg outline-none aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus data-focus-visible:border-focus data-focus-visible:ring-1 data-focus-visible:ring-focus focus-visible:border-focus focus-visible:ring-1 focus-visible:ring-focus";

const ITEM = "h-9 gap-2.5 rounded-md px-2.5 text-body font-medium text-fg";

export type FieldOption = { id: string; label: string };

/** A labelled filter field: small label above, then whatever control is passed in. */
export function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-label text-fg-2">{label}</span>
      {children}
    </div>
  );
}

/** Opens a calendar instead of a list (the two date fields share one popover). */
export function DateButton({
  icon: Icon,
  value,
  onPress,
  ...rest
}: {
  icon: LucideIcon;
  value: string;
  onPress: () => void;
} & Pick<React.ComponentProps<"button">, "aria-label" | "aria-expanded" | "aria-haspopup">) {
  return (
    <button type="button" onClick={onPress} className={FIELD_CLASS} {...rest}>
      <Icon size={16} className="shrink-0 text-fg-2" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left tabular-nums">{value}</span>
      <ChevronDown size={16} className="shrink-0 text-fg-2" aria-hidden />
    </button>
  );
}

/** Single-select field with a dropdown menu. */
export function FieldSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly FieldOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const current = options.find((o) => o.id === value);
  return (
    <Field label={label} className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`${label}: ${current?.label ?? ""}`} className={FIELD_CLASS}>
          <span className="min-w-0 flex-1 truncate text-left tabular-nums">{current?.label}</span>
          <ChevronDown size={16} className="shrink-0 text-fg-2" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent placement="bottom start" className="max-h-72 min-w-(--trigger-width) overflow-y-auto p-1.5">
          {options.map(({ id, label: text }) => {
            const on = id === value;
            return (
              <DropdownMenuItem
                key={id}
                id={id}
                textValue={text}
                onAction={() => onChange(id)}
                className={cn(ITEM, on && "bg-primary-soft font-semibold text-primary focus:text-primary")}
              >
                <span className="truncate tabular-nums">{text}</span>
                {on && <Check size={16} aria-hidden className="ml-auto shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </Field>
  );
}
