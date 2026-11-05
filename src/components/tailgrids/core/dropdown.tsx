import { cn } from "@/utils/cn";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import {
  Button,
  type ButtonProps,
  Header,
  Menu,
  MenuItem,
  type MenuItemProps,
  MenuSection,
  MenuSectionProps,
  MenuTrigger,
  type MenuTriggerProps,
  Popover,
  type PopoverProps,
  Separator,
  SubmenuTrigger
} from "react-aria-components";

export function DropdownMenu(props: MenuTriggerProps) {
  return <MenuTrigger {...props} />;
}

export function DropdownMenuTrigger({ className, ...props }: ButtonProps) {
  return <Button className={cn("outline-none", className)} {...props} />;
}

type DropdownContentProps = PopoverProps;

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownContentProps) {
  return (
    <Popover {...props}>
      <Menu
        className={cn(
          "outline-hidden rounded-pop border border-line bg-surface shadow-pop overflow-clip min-w-40",
          className
        )}
      >
        {children}
      </Menu>
    </Popover>
  );
}

type DropdownMenuItemProps = MenuItemProps;

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <MenuItem
      {...props}
      className={cn(
        "group text-fg-2 text-body focus:text-fg focus:bg-subtle flex w-full cursor-default items-center gap-3 rounded-md px-1.5 py-1 outline-hidden",
        className
      )}
    />
  );
}

export function DropdownMenuSection<T extends object>({
  className,
  ...props
}: MenuSectionProps<T>) {
  return <MenuSection {...props} className={cn("", className)} />;
}

export function DropdownMenuHeader({
  className,
  ...props
}: ComponentProps<typeof Header>) {
  return (
    <Header
      {...props}
      className={cn("px-3 py-2 text-control text-fg-3", className)}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<"hr">) {
  return (
    <Separator
      className={cn("bg-line h-px border-none", className)}
      {...props}
    />
  );
}

type DropdownMenuSubmenuProps = {
  /** The parent row; must be a DropdownMenuItem. */
  trigger: ReactElement;
  /** DropdownMenuItem options; each needs an `id`. */
  children: ReactNode;
  "aria-label"?: string;
  /** Optional non-interactive header row above the options. */
  header?: ReactNode;
  /** Id of the checked option (single selection). */
  selectedKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
};

export function DropdownMenuSubmenu({
  trigger,
  children,
  "aria-label": ariaLabel,
  header,
  selectedKey,
  onSelect,
  className
}: DropdownMenuSubmenuProps) {
  return (
    <SubmenuTrigger>
      {trigger}
      <Popover placement="end top">
        <Menu
          aria-label={ariaLabel}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={selectedKey ? [selectedKey] : []}
          onSelectionChange={(keys) => {
            const key = [...keys][0];
            if (key !== undefined) onSelect?.(String(key));
          }}
          className={cn(
            "outline-hidden rounded-pop border border-line bg-surface shadow-pop overflow-clip min-w-40 flex flex-col gap-0.5 p-1.5",
            className
          )}
        >
          {header ? (
            <Header className="text-caption font-medium text-fg-3 px-2.5 py-1">
              {header}
            </Header>
          ) : null}
          {children}
        </Menu>
      </Popover>
    </SubmenuTrigger>
  );
}
