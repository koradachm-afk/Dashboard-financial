"use client";

import { CircleCheck, X, type LucideIcon } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

import { cn } from "@/utils/cn";

export type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  duration?: number;
  /** Change it while open to show the same message again: restarts the countdown and re-inserts the text. */
  messageId?: number | string;
  /** Defaults to the success check. */
  icon?: LucideIcon;
  /** Colour class of the icon; defaults to `text-success`. */
  iconClassName?: string;
  /** "top-right" sits 20 px from the top and right edges, up to 316 px wide (DESIGN-STYLE 10.1). */
  placement?: "top-center" | "top-right";
  /** Accessible name of the close button; defaults to "ปิด". */
  closeLabel?: string;
};

export function Toast({
  open,
  title,
  description,
  onClose,
  duration = 5000,
  messageId,
  icon: Icon = CircleCheck,
  iconClassName = "text-success",
  placement = "top-center",
  closeLabel = "ปิด",
}: ToastProps) {
  // A new onClose each parent render must not restart the countdown.
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  }, [open, title, duration, messageId]);

  // The live region stays mounted (empty when closed): some screen readers only
  // announce content that changes inside a region already in the DOM.
  return (
    <div
      className={cn(
        "pointer-events-none fixed top-5 z-50",
        placement === "top-right" ? "right-5" : "inset-x-0 flex justify-center px-4",
      )}
    >
      <div role="status">
        {open && (
          <div
            key={messageId}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-pop border border-line bg-surface py-3 pr-2.5 pl-3.5 shadow-pop",
              placement === "top-right" && "max-w-79",
            )}
          >
            <Icon size={22} className={cn("shrink-0", iconClassName)} aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-control font-semibold text-fg">{title}</p>
              {description && (
                <p className="text-label text-fg-2">{description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-md text-fg-3 transition-colors hover:bg-subtle hover:text-fg"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
