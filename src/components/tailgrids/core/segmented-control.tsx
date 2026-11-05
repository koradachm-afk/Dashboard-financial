"use client";

import type { LucideIcon } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { cn } from "@/utils/cn";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** "primary" fills the option with the primary colour when selected. */
  tone?: "primary";
};

export type SegmentedControlProps<T extends string> = {
  "aria-label": string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  isDisabled?: boolean;
  /** md: full-width options with icons (Role). sm: compact text (Access Level Picker). */
  size?: "sm" | "md";
  /** Applied to the group (the track). */
  className?: string;
};

// Track sits on surface (drawer / modal), so it uses bg-page (DESIGN-STYLE 2.5 rule 5).
const track = {
  sm: "inline-flex",
  md: "flex w-full",
};

const item = {
  sm: "px-3 py-1.5 text-label",
  md: "flex-1 justify-center gap-2 px-3.5 py-2 text-body",
};

export function SegmentedControl<T extends string>({
  "aria-label": ariaLabel,
  options,
  value,
  onChange,
  isDisabled,
  size = "sm",
  className,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      orientation="horizontal"
      value={value}
      onChange={(v) => onChange(v as T)}
      isDisabled={isDisabled}
      className={cn(
        "items-center gap-0.5 rounded-lg bg-page p-0.75",
        track[size],
        isDisabled && "opacity-50",
        className,
      )}
    >
      {options.map(({ value: optionValue, label, icon: Icon, tone }) => (
        <Radio
          key={optionValue}
          value={optionValue}
          className={({ isSelected }) =>
            cn(
              "flex cursor-default items-center rounded-md font-medium whitespace-nowrap text-fg-2 outline-none data-disabled:cursor-not-allowed data-focus-visible:ring-2 data-focus-visible:ring-focus",
              item[size],
              isSelected &&
                (tone === "primary"
                  ? "bg-primary font-semibold text-on-primary"
                  : "bg-surface font-semibold text-fg shadow-sm"),
            )
          }
        >
          {({ isSelected }) => (
            <>
              {Icon && (
                <Icon
                  size={16}
                  aria-hidden
                  className={cn(
                    "shrink-0",
                    isSelected && tone !== "primary" && "text-primary",
                  )}
                />
              )}
              {label}
            </>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
}
