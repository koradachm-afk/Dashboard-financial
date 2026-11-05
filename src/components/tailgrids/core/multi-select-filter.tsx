"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  Button,
  CheckboxGroup,
  Dialog,
  DialogTrigger,
  Popover,
} from "react-aria-components";
import { cn } from "@/utils/cn";
import { Checkbox } from "./checkbox";

export type MultiSelectFilterOption = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

export type MultiSelectFilterProps = {
  /** Field name; also names the popover and the checkbox group. */
  label: string;
  icon?: LucideIcon;
  /** Text after "label: " on the trigger, computed by the caller. */
  summary: string;
  options: MultiSelectFilterOption[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  /** Muted line at the top of the popover. */
  hint?: string;
  clearLabel: string;
  /** Muted text on the right of the footer. */
  clearHint?: string;
  /** Applied to the trigger (set its width here). */
  className?: string;
};

export function MultiSelectFilter({
  label,
  icon: Icon,
  summary,
  options,
  selected,
  onChange,
  hint,
  clearLabel,
  clearHint,
  className,
}: MultiSelectFilterProps) {
  return (
    <DialogTrigger>
      <Button
        className={cn(
          "flex h-9 cursor-default items-center gap-2 rounded-md border border-line bg-surface pr-2.5 pl-3 text-control text-fg outline-none aria-expanded:border-focus aria-expanded:ring-1 aria-expanded:ring-focus data-focus-visible:border-focus data-focus-visible:ring-1 data-focus-visible:ring-focus",
          className,
        )}
      >
        {Icon && <Icon size={16} className="shrink-0 text-fg-2" aria-hidden />}
        <span className="min-w-0 flex-1 truncate text-left">
          {label}: {summary}
        </span>
        <ChevronDown size={16} className="shrink-0 text-fg-2" aria-hidden />
      </Button>
      <Popover
        placement="bottom start"
        className="w-75 overflow-clip rounded-pop border border-line bg-surface shadow-pop outline-none"
      >
        <Dialog
          aria-label={label}
          className="flex flex-col gap-0.5 px-2 pt-2.5 pb-2 outline-none"
        >
          {hint && <p className="px-2 pb-1.5 text-caption text-fg-3">{hint}</p>}
          <CheckboxGroup
            aria-label={label}
            value={[...selected]}
            onChange={onChange}
            className="flex flex-col gap-0.5"
          >
            {options.map(({ id, label: optionLabel, icon: OptionIcon }) => (
              <Checkbox
                key={id}
                value={id}
                className="h-9 gap-2.5 rounded-md px-2 data-hovered:bg-subtle data-selected:bg-primary-soft data-selected:font-semibold data-selected:text-primary"
              >
                {OptionIcon && (
                  <OptionIcon
                    size={16}
                    className="shrink-0 text-fg-2 group-data-selected:text-primary"
                    aria-hidden
                  />
                )}
                <span className="truncate">{optionLabel}</span>
              </Checkbox>
            ))}
          </CheckboxGroup>
          <div className="h-px bg-map-grid" />
          <div className="flex items-center gap-2 px-2 pt-2">
            <Button
              onPress={() => onChange([])}
              className="cursor-default rounded-xs text-label font-semibold text-primary outline-none data-focus-visible:ring-2 data-focus-visible:ring-focus data-hovered:text-primary-hover"
            >
              {clearLabel}
            </Button>
            {clearHint && (
              <span className="ml-auto text-caption text-fg-3">{clearHint}</span>
            )}
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
