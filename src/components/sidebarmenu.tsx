"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter
} from "@/components/tailgrids/core/sidebar";
import {
  Activity,
  ChevronsUpDown,
  Flame,
  History,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  SquareParking,
  User,
  Wallet,
  type LucideIcon
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/tailgrids/core/dropdown";

import * as React from "react";
import { cn } from "@/utils/cn";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { useSettings } from "@/db/settings/settings";
import { getUserById } from "@/db/user/users";
import { usePathname } from "next/navigation";

const user = getUserById("u-superadmin")!;

const ROLE_LABEL = { superadmin: "Superadmin", admin: "Admin" } as const;

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: readonly { group: string; items: readonly NavItem[] }[] = [
  {
    group: "เมนูหลัก",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Parking Layout", href: "/parking-layout", icon: Map },
      { label: "Financial Overview", href: "/financial-overview", icon: Wallet },
      { label: "Activity Log", href: "/activity-log", icon: Activity },
      { label: "Parking Heat Map", href: "/heat-map", icon: Flame },
    ],
  },
  {
    group: "จัดการระบบ",
    items: [
      { label: "User & Permissions", href: "/users", icon: ShieldCheck },
      { label: "System Settings", href: "/settings", icon: Settings },
      { label: "Audit Logs", href: "/audit-logs", icon: History },
    ],
  },
];

const navItem =
  "flex h-10 items-center gap-3 rounded-lg px-3 text-control font-medium text-fg-2 transition-colors hover:bg-subtle";
const navItemActive = "bg-primary-soft font-semibold text-primary hover:bg-primary-soft";

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

export default function SidebarVariantsPreview({children,}: {children: React.ReactNode;}) {
  const [open, setOpen] = React.useState<boolean>(true);
  const pathname = usePathname();
  const { branchName } = useSettings();
  return (
    <div className="flex flex-col h-dvh w-full">
      <div className="flex flex-1 w-full overflow-hidden border-b border-line bg-page">
        <SidebarProvider open={open} onOpenChange={setOpen} className="h-full">
          <Sidebar
            variant="sidebar"
            className="h-full select-none flex-col gap-6 border-r border-line bg-surface px-4 pb-4 pt-5"
          >
            <SidebarHeader className="flex w-full flex-row items-center gap-2.5 p-0 pl-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
                <SquareParking size={22} aria-hidden="true" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-h3 font-bold text-fg">
                  {siteConfig.brandName}
                </span>
                <span className="text-caption font-medium text-fg-2">{branchName}</span>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-0">
              {NAV.map(({ group, items }) => (
                <SidebarGroup key={group}>
                  <SidebarGroupLabel className="pb-1 pl-3 text-caption font-semibold text-fg-3">{group}</SidebarGroupLabel>

                  <SidebarGroupContent>
                    <SidebarMenu className="gap-1">
                      {items.map(({ label, href, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                          <SidebarMenuItem key={href}>
                            <Link
                              href={href}
                              aria-current={active ? "page" : undefined}
                              className={cn(navItem, active && navItemActive)}
                            >
                              <Icon size={20} aria-hidden="true" />
                              <span>{label}</span>
                            </Link>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
            <SidebarFooterSection open={open} />
          </Sidebar>

          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-page">
              <div className="h-full w-full">{children}</div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}

function SidebarFooterSection({ open }: { open: boolean }) {
  return (
    <SidebarFooter>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center rounded-pop border border-line bg-page duration-200 aria-expanded:border-focus",
            open ? "gap-2.5 px-3 py-2.5" : "size-9 justify-center p-0",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-body font-semibold text-primary">
            {user.username.slice(0, 2).toUpperCase()}
          </div>

          {open && (
            <>
              <div className="grid text-left leading-tight">
                <span className="truncate text-control font-semibold text-fg">
                  {user.username}
                </span>
                <span className="truncate text-label text-fg-2">
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <div className="flex-1" />
              <ChevronsUpDown size={16} aria-hidden="true" className="text-fg-3" />
            </>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-(--sidebar-width) min-w-56 p-1.5 border"
          placement="top"
          offset={6}
        >
          <DropdownMenuHeader className="flex items-center gap-2 p-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-control leading-tight">
              <span className="truncate font-semibold text-fg">{user.name}</span>
              <span className="truncate text-label text-fg-2">
                {user.email}
              </span>
            </div>
          </DropdownMenuHeader>

          <DropdownMenuSeparator className="my-0.5" />
          <DropdownMenuItem
            href="/account"
            className="text-fg-2 data-[hovered]:bg-subtle data-[hovered]:text-fg"
          >
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            href="/login"
            className="text-fg-2 data-[hovered]:bg-subtle data-[hovered]:text-fg"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}
