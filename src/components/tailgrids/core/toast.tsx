"use client";

import { CircleCheck, X } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

export type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  duration?: number;
  /** Change it while open to show the same message again: restarts the countdown and re-inserts the text. */
  messageId?: number | string;
};

export function Toast({
  open,
  title,
  description,
  onClose,
  duration = 5000,
  messageId,
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
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <div role="status">
        {open && (
          <div
            key={messageId}
            className="pointer-events-auto flex items-center gap-3 rounded-pop border border-line bg-surface py-3 pr-2.5 pl-3.5 shadow-pop"
          >
            <CircleCheck size={22} className="shrink-0 text-success" aria-hidden />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-control font-semibold text-fg">{title}</p>
              {description && (
                <p className="text-label text-fg-2">{description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="ปิด"
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
