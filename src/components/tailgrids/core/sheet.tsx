"use client";

import { cn } from "@/utils/cn";
import { Close } from "@tailgrids/icons";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
  DialogTrigger as AriaDialogTrigger,
  type DialogTriggerProps as AriaDialogTriggerProps,
  Heading,
  type HeadingProps,
  Modal,
  ModalOverlay,
  type ModalOverlayProps
} from "react-aria-components";

// Sheet (root)

export interface SheetProps extends AriaDialogTriggerProps {}

export function Sheet(props: SheetProps) {
  return <AriaDialogTrigger {...props} />;
}

// Sheet Trigger

export interface SheetTriggerProps extends AriaButtonProps {}

export function SheetTrigger({ className, ...props }: SheetTriggerProps) {
  return <AriaButton className={cn("outline-none", className)} {...props} />;
}

// Sheet Overlay

export interface SheetOverlayProps extends ModalOverlayProps {
  className?: string;
  isDismissable?: boolean;
}

export function SheetOverlay({
  className,
  isDismissable = true,
  ...props
}: SheetOverlayProps) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      className={cn(
        "fixed inset-0 z-50 bg-overlay",
        "transition-opacity duration-300",
        "data-entering:opacity-0",
        "data-exiting:opacity-0",
        className
      )}
      {...props}
    />
  );
}

// Sheet Content

const sheetVariants = cva(
  "fixed z-50 outline-none transition-transform duration-300 ease-in-out data-entering:translate-x-0 data-entering:translate-y-0",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full data-entering:translate-x-full data-exiting:translate-x-full",
        left: "inset-y-0 left-0 h-full data-entering:-translate-x-full data-exiting:-translate-x-full",
        top: "inset-x-0 top-0 data-entering:-translate-y-full data-exiting:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 data-entering:translate-y-full data-exiting:translate-y-full"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);

const sheetDialogVariants = cva(
  "relative flex flex-col gap-4 bg-surface p-6 shadow-drawer outline-none",
  {
    variants: {
      side: {
        right:
          "h-full w-full min-w-xs sm:max-w-sm pr-4 border-l border-line",
        left: "h-full w-full min-w-xs sm:max-w-sm border-r border-line",
        top: "w-full border-b border-line",
        bottom: "w-full border-t border-line"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);

export interface SheetContentProps
  extends AriaDialogProps, VariantProps<typeof sheetVariants> {
  modalProps?: ComponentProps<typeof Modal>;
  showCloseButton?: boolean;
  className?: string;
}

export function SheetContent({
  children,
  className,
  side = "right",
  modalProps,
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  const { className: modalClassName, ...restModalProps } = modalProps || {};

  return (
    <Modal
      className={cn(sheetVariants({ side }), modalClassName)}
      {...restModalProps}
    >
      <AriaDialog
        className={cn(sheetDialogVariants({ side }), className)}
        {...props}
      >
        {({ close }) => (
          <>
            {typeof children === "function" ? children({ close }) : children}
            {showCloseButton && (
              <AriaButton
                onPress={close}
                aria-label="Close"
                className={cn(
                  "absolute top-4 right-4 flex size-7 items-center justify-center rounded-md text-fg-2 opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-focus disabled:pointer-events-none [&>svg]:size-5",
                  side === "right" && "sm:right-0"
                )}
              >
                <Close />
                <span className="sr-only">Close</span>
              </AriaButton>
            )}
          </>
        )}
      </AriaDialog>
    </Modal>
  );
}

// Sheet Header

export interface SheetHeaderProps extends ComponentProps<"div"> {}

export function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

// Sheet Title

export interface SheetTitleProps extends HeadingProps {
  className?: string;
}

export function SheetTitle({ className, ...props }: SheetTitleProps) {
  return (
    <Heading
      slot="title"
      className={cn(
        "text-h3 font-semibold leading-none text-fg",
        className
      )}
      {...props}
    />
  );
}

// Sheet Description

export interface SheetDescriptionProps extends ComponentProps<"p"> {}

export function SheetDescription({
  className,
  ...props
}: SheetDescriptionProps) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-control text-fg-2", className)}
      {...props}
    />
  );
}

// Sheet Body

export interface SheetBodyProps extends ComponentProps<"div"> {}

export function SheetBody({ className, ...props }: SheetBodyProps) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto px-1 -mx-1 text-control text-fg-2", className)}
      {...props}
    />
  );
}

// Sheet Footer

export interface SheetFooterProps extends ComponentProps<"div"> {
  showCloseButton?: boolean;
}

export function SheetFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {showCloseButton && (
        <SheetClose className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-control font-medium text-fg outline-none transition hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus">
          Close
        </SheetClose>
      )}
      {children}
    </div>
  );
}

// Sheet Close

export interface SheetCloseProps extends AriaButtonProps {}

export function SheetClose({ className, ...props }: SheetCloseProps) {
  return (
    <AriaButton
      slot="close"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}
