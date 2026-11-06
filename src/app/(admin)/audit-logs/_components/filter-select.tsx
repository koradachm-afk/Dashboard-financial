"use client";

import { Check, ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { cn } from "@/utils/cn";

export type FilterSelectOption = { id: string; label: string; icon?: LucideIcon };

const ITEM = "h-9 gap-2.5 rounded-md px-2.5 text-body font-medium text-fg";

/** A single-select filter: a select-styled trigger that opens a menu (Figma 08.4 / 08.9). */
export function FilterSelect({
  icon: Icon,
  text,
  header,
  options,
  selected,
  onSelect,
  customOption,
  className,
}: {
  icon: LucideIcon;
  /** Trigger text, computed by the caller. */
  text: string;
  /** Muted heading at the top of the menu. */
  header: string;
  options: readonly FilterSelectOption[];
  selected: string;
  onSelect: (id: string) => void;
  /** A last item after a separator (the custom-range entry). It does not select an option: `onAction` runs and the caller shows its own UI. */
  customOption?: { id: string; label: string; icon: LucideIcon; onAction: () => void };
  className?: string;
}) {
  const CustomIcon = customOption?.icon;
  const customOn = customOption !== undefined && customOption.id === selected;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus data-focus-visible:border-focus data-focus-visible:ring-1 data-focus-visible:ring-focus",
          className,
        )}
      >
        <Icon size={16} className="shrink-0 text-fg-2" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{text}</span>
        <ChevronDown size={16} className="shrink-0 text-fg-2" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent placement="bottom start" className="min-w-(--trigger-width) p-1.5">
        <DropdownMenuHeader className="px-2.5 py-1 text-caption font-medium text-fg-3">{header}</DropdownMenuHeader>
        {options.map(({ id, label, icon: OptionIcon }) => {
          const on = id === selected;
          return (
            <DropdownMenuItem
              key={id}
              id={id}
              textValue={label}
              onAction={() => onSelect(id)}
              className={cn(ITEM, on && "bg-primary-soft font-semibold text-primary focus:text-primary")}
            >
              {OptionIcon && <OptionIcon size={16} aria-hidden className={cn("shrink-0", !on && "text-fg-2")} />}
              <span className="truncate">{label}</span>
              {on && <Check size={16} aria-hidden className="ml-auto shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        {customOption && CustomIcon && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              id={customOption.id}
              textValue={customOption.label}
              onAction={customOption.onAction}
              className={cn(ITEM, customOn ? "bg-primary-soft font-semibold text-primary focus:text-primary" : "text-fg-2")}
            >
              <CustomIcon size={16} aria-hidden className="shrink-0" />
              <span className="truncate">{customOption.label}</span>
              {customOn ? (
                <Check size={16} aria-hidden className="ml-auto shrink-0" />
              ) : (
                <ChevronRight size={14} aria-hidden className="ml-auto shrink-0 text-fg-3" />
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
