"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { cn } from "@/utils/cn";

export type HeatSelectOption = { id: string; label: string };

const ITEM = "h-9 gap-2.5 rounded-md px-2.5 text-body font-medium text-fg";

/** Single-select filter of the heat map toolbar: a Select-styled trigger (DESIGN-STYLE 8.1) that opens a menu. */
export function HeatSelect({
  "aria-label": ariaLabel,
  options,
  selected,
  onSelect,
  className,
}: {
  "aria-label": string;
  options: readonly HeatSelectOption[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const current = options.find((o) => o.id === selected) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${ariaLabel}: ${current?.label ?? ""}`}
        className={cn(
          "flex h-9 cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus data-focus-visible:border-focus data-focus-visible:ring-1 data-focus-visible:ring-focus",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{current?.label}</span>
        <ChevronDown size={16} className="shrink-0 text-fg-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent placement="bottom start" className="min-w-(--trigger-width) flex flex-col gap-0.5 p-1.5">
        {options.map(({ id, label }) => {
          const on = id === selected;
          return (
            <DropdownMenuItem
              key={id}
              id={id}
              textValue={label}
              onAction={() => onSelect(id)}
              className={cn(ITEM, on && "bg-primary-soft font-semibold text-primary focus:text-primary")}
            >
              <span className="truncate">{label}</span>
              {on && <Check size={16} aria-hidden className="ml-auto shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
