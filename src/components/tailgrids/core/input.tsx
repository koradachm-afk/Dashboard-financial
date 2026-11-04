import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

const inputVariants = cva(
  "flex items-center bg-surface border border-line text-fg focus-within:border-focus focus-within:ring-1 focus-within:ring-focus has-[:disabled]:opacity-50",
  {
    variants: {
      size: {
        md: "h-9 px-3 gap-2 rounded-md text-control",
        lg: "h-14 px-4 gap-2.5 rounded-xl text-h3 font-normal",
      },
      error: {
        true: "border-danger ring-1 ring-danger",
        false: "",
      },
    },
    defaultVariants: { size: "md", error: false },
  },
);

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: "md" | "lg";
  error?: boolean;
  icon?: LucideIcon;
  trailing?: React.ReactNode;
};

export function Input({
  size = "md",
  error = false,
  icon: Icon,
  trailing,
  className,
  ref,
  ...props
}: InputProps) {
  return (
    <div className={cn(inputVariants({ size, error }), className)}>
      {Icon && (
        <Icon
          size={size === "lg" ? 20 : 16}
          className="shrink-0 text-fg-3"
          aria-hidden
        />
      )}
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3"
        {...props}
      />
      {trailing}
    </div>
  );
}
