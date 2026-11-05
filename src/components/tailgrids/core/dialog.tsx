"use client";

import { Loader2, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { cn } from "@/utils/cn";
import { Button } from "./button";

export type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  iconTone?: "neutral" | "warning" | "danger";
  title: string;
  description: ReactNode;
  /** Extra content under the description ("row": inside the text column; "stacked": full width). */
  children?: ReactNode;
  /** Shown on the footer's left, before the buttons. */
  footerNote?: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmIcon?: LucideIcon;
  confirmVariant?: "primary" | "danger" | "danger-solid";
  pending?: boolean;
  onConfirm: () => void;
  /** X icon button at the top right (07.7). */
  showCloseButton?: boolean;
  /** "row": icon beside the title, grey footer bar. "stacked": icon tile above the title, buttons inside the panel (07.5). */
  layout?: "row" | "stacked";
  /** Extra panel classes, e.g. a width (`w-112`). */
  className?: string;
};

const TONES = {
  neutral: "bg-page text-fg-2",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  icon: Icon,
  iconTone = "neutral",
  title,
  description,
  children,
  footerNote,
  cancelLabel = "ยกเลิก",
  confirmLabel,
  confirmIcon,
  confirmVariant = "primary",
  pending = false,
  onConfirm,
  showCloseButton = false,
  layout = "row",
  className,
}: ConfirmDialogProps) {
  const stacked = layout === "stacked";

  const closeButton = showCloseButton && (
    <button
      type="button"
      aria-label="ปิด"
      disabled={pending}
      onClick={() => onOpenChange(false)}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-subtle hover:text-fg disabled:pointer-events-none disabled:opacity-50"
    >
      <X size={18} aria-hidden />
    </button>
  );

  const heading = (
    <Heading
      slot="title"
      className={cn(stacked ? "text-h3" : "text-lead", "font-semibold text-fg")}
    >
      {title}
    </Heading>
  );
  const descriptionBlock = <div className="text-body text-fg-2">{description}</div>;

  const buttons = (
    <>
      {footerNote && <div className="mr-auto self-center">{footerNote}</div>}
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => onOpenChange(false)}
      >
        {cancelLabel}
      </Button>
      <Button
        variant={confirmVariant}
        icon={pending ? undefined : confirmIcon}
        disabled={pending}
        onClick={onConfirm}
      >
        {pending && (
          <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden />
        )}
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!pending}
      isKeyboardDismissDisabled={pending}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
    >
      <Modal
        className={cn(
          stacked ? "w-110" : "w-105",
          "max-w-full overflow-hidden",
          stacked ? "rounded-modal" : "rounded-xl",
          "bg-surface shadow-modal outline-none",
          className,
        )}
      >
        <Dialog className="outline-none">
          {stacked ? (
            <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full",
                    TONES[iconTone],
                  )}
                >
                  <Icon size={22} aria-hidden />
                </span>
                {closeButton}
              </div>
              <div className="flex flex-col gap-1.5">
                {heading}
                {descriptionBlock}
              </div>
              {children}
              <div className="flex justify-end gap-2 pt-1">{buttons}</div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "flex items-start gap-4",
                  showCloseButton ? "py-6 pr-4 pl-6" : "p-6",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    TONES[iconTone],
                  )}
                >
                  <Icon size={20} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {heading}
                  {descriptionBlock}
                  {children}
                </div>
                {closeButton}
              </div>
              <div className="flex justify-end gap-2 border-t border-line bg-subtle px-6 py-3.5">
                {buttons}
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
