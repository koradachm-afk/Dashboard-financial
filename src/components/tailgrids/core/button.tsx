import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "bg-surface text-fg border border-line hover:bg-subtle",
        ghost: "text-fg-2 hover:bg-subtle hover:text-fg",
        danger:
          "bg-surface text-danger border border-danger hover:bg-danger-soft",
        "danger-solid": "bg-danger text-on-primary hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3 rounded-md text-body",
        md: "h-10 px-4 rounded-lg text-control",
        lg: "h-13 px-5 rounded-xl text-lead",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && (
        <Icon size={size === "lg" ? 20 : 16} className="shrink-0" aria-hidden />
      )}
      {children}
    </button>
  );
}
