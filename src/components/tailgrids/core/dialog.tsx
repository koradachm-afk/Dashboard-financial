"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { cn } from "@/utils/cn";
import { Button } from "./button";

export type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  iconTone?: "neutral" | "warning";
  title: string;
  description: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmIcon?: LucideIcon;
  confirmVariant?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  icon: Icon,
  iconTone = "neutral",
  title,
  description,
  cancelLabel = "ยกเลิก",
  confirmLabel,
  confirmIcon,
  confirmVariant = "primary",
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={!pending}
      isKeyboardDismissDisabled={pending}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
    >
      <Modal className="w-105 max-w-full overflow-hidden rounded-xl bg-surface shadow-modal outline-none">
        <Dialog className="outline-none">
          <div className="flex items-start gap-4 p-6">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                iconTone === "warning"
                  ? "bg-warning-soft text-warning"
                  : "bg-page text-fg-2",
              )}
            >
              <Icon size={20} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Heading
                slot="title"
                className="text-lead font-semibold text-fg"
              >
                {title}
              </Heading>
              <div className="text-body text-fg-2">{description}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-line bg-subtle px-6 py-3.5">
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
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
