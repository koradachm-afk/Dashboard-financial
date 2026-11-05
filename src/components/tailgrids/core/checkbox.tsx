"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as AriaCheckboxProps,
  composeRenderProps,
} from "react-aria-components";
import { cn } from "@/utils/cn";

export type CheckboxProps = Omit<AriaCheckboxProps, "children"> & {
  /** Label content, rendered after the box inside the clickable label. */
  children?: ReactNode;
};

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={composeRenderProps(className, (cls) =>
        cn(
          "group flex cursor-default items-center gap-2 text-body text-fg outline-none data-disabled:opacity-50",
          cls,
        ),
      )}
    >
      {({ isSelected }) => (
        <>
          <span
            aria-hidden
            className="flex size-4 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-line-strong bg-surface text-on-primary group-data-focus-visible:ring-2 group-data-focus-visible:ring-focus group-data-focus-visible:ring-offset-1 group-data-focus-visible:ring-offset-surface group-data-selected:border-primary group-data-selected:bg-primary"
          >
            {isSelected && <Check size={12} strokeWidth={2.5} />}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}
