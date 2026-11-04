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
  Layers2,
  Fire,
  RefreshCircle1Clockwise,
  BarChartSquare,
  PieChart1,
  ChevronBothDirection,
  Page,
  MusicList2,
  User2,
  Layout14
} from "@tailgrids/icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/tailgrids/core/dropdown";

import { useState } from "react";
import * as React from "react";
import { cn } from "@/utils/cn";
import Link from "next/link";

import { getUserById } from "@/db/users";
import { usePathname } from "next/navigation";

const user = getUserById("u-admin")!;

const navItem =
  "flex h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-control font-medium text-fg-2 transition-colors hover:bg-subtle";
const navItemActive = "pointer-events-none bg-primary-soft font-semibold text-primary hover:bg-primary-soft";

export default function SidebarVariantsPreview({children,}: {children: React.ReactNode;}) {
  const [variant] = useState<"sidebar" | "floating" | "inset">("sidebar");

  const [open, setOpen] = React.useState<boolean>(true);
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-dvh w-full">
      <div className="flex flex-1 w-full overflow-hidden border-b border-line bg-page">
        <SidebarProvider open={open} onOpenChange={setOpen} className="h-full">
          <Sidebar
            variant={variant}
            className="h-full select-none flex-col gap-6 border-r border-line bg-surface px-4 pb-4 pt-5"
          >
            <SidebarHeader className="flex w-full flex-row items-center gap-3 p-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-on-primary">
                <MusicList2 className="h-8 w-8" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-h3 font-bold leading-tight text-fg">
                  ParkPlan
                </span>
                <span className="text-caption font-medium text-fg-2">สาขาสยาม</span>
              </div>
            </SidebarHeader>

            <SidebarContent className="px-0">
              <SidebarGroup>
                <SidebarGroupLabel className="text-caption font-semibold text-fg-3">เมนูหลัก</SidebarGroupLabel>

                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link
                        href="/dashboard"
                        className={cn(navItem, pathname === "/dashboard" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <PieChart1 />
                          <span>Dashboard</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link
                        href="/parking-layout"
                        className={cn(navItem, pathname === "/parking-layout" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <Layers2 />
                          <span>Parking Layouts</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link
                        href="/financial-overview"
                        className={cn(navItem, pathname === "/financial-overview" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <BarChartSquare />
                          <span>Financial Overview</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link
                        href="/activity-log"
                        className={cn(navItem, pathname === "/activity-log" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <RefreshCircle1Clockwise />
                          <span>Activity Log</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link
                        href="/heat-map"
                        className={cn(navItem, pathname === "/heat-map" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <Fire />
                          <span>Parking Heat Map</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-caption font-semibold text-fg-3">จัดการระบบ</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link
                        href="/users"
                        className={cn(navItem, pathname === "/users" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <User2 />
                          <span>User & Permissions</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link
                        href="/settings"
                        className={cn(navItem, pathname === "/settings" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <Layout14 />
                          <span>System Setting</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <Link
                        href="/audit-logs"
                        className={cn(navItem, pathname === "/audit-logs" && navItemActive)}
                      >
                        <div className="flex items-center gap-3">
                          <Page />
                          <span>Audit Logs</span>
                        </div>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
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
            "w-full flex items-center rounded-md duration-200 bg-subtle focus-visible:bg-subtle aria-expanded:bg-subtle",
            open ? "p-2 justify-between" : "size-8 p-0 justify-center",
          )}
        >
          <div className={cn("flex items-center", open && "gap-2")}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <User2 className="size-4" />
            </div>

            {open && (
              <div className="grid flex-1 text-left text-control leading-tight">
                <span className="truncate font-semibold text-fg">
                  {user.name}
                </span>
                <span className="truncate text-label text-fg-2">
                  {user.email}
                </span>
              </div>
            )}
          </div>

          {open && (
            <ChevronBothDirection className="ml-auto size-4 text-fg-3" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-(--sidebar-width) min-w-56 p-1.5 border"
          placement="top"
          offset={6}
        >
          <DropdownMenuHeader className="flex items-center gap-2 p-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <User2 className="size-4" />
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
