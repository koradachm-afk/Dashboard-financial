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
  SidebarFooter
} from "@/components/tailgrids/core/sidebar";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Moon,
  SquareParking,
  Sun,
  User,
  type LucideIcon
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSubmenu,
  DropdownMenuTrigger
} from "@/components/tailgrids/core/dropdown";
import { ConfirmDialog } from "@/components/tailgrids/core/dialog";
import { Avatar } from "@/components/tailgrids/core/avatar";
import { ROLE_LABEL, RoleBadge } from "@/components/tailgrids/core/role-badge";
import { NAV } from "@/components/admin-nav";

import * as React from "react";
import { cn } from "@/utils/cn";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { useSettings } from "@/db/settings/settings";
import { audit } from "@/db/audit/audit";
import { logout } from "@/db/auth/auth-actions";
import { accessFor } from "@/db/user/access";
import { setThemeFor, usePrefs, type Theme } from "@/db/prefs/prefs";
import type { User as UserRecord } from "@/db/user/users";
import { usePathname } from "next/navigation";
import { reloadTo } from "@/utils/reload-to";
import { useTheme } from "next-themes";

/** Display fields only: the server passes these as props, so the user seed never reaches the client bundle. */
export type SidebarUser = Pick<UserRecord, "id" | "username" | "email" | "role" | "permissions" | "theme">;

const navItem =
  "flex h-10 items-center gap-3 rounded-lg px-3 text-control font-medium text-fg-2 transition-colors hover:bg-subtle";
const navItemActive = "bg-primary-soft font-semibold text-primary hover:bg-primary-soft";
const menuItem = "h-9 gap-2.5 rounded-md px-2.5 py-0 text-body";

// Figma 09.1: light / dark only, no "system".
const THEMES: readonly { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "สว่าง", icon: Sun },
  { id: "dark", label: "มืด", icon: Moon },
];

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

// Hiding is cosmetic: requirePage in each page.tsx is the real guard.
function visibleNav(user: SidebarUser) {
  return NAV.map(({ group, items }) => ({
    group,
    items: items.filter(({ pages }) => pages.some((p) => accessFor(user, p) !== "none")),
  })).filter(({ items }) => items.length > 0);
}

export default function Sidebarmenu({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  const { branchName } = useSettings();
  return (
    <Sidebar
      variant="sidebar"
      className="h-full select-none flex-col gap-6 border-r border-line bg-surface px-4 pb-4 pt-5"
    >
      <SidebarHeader className="flex w-full flex-row items-center gap-2.5 p-0 pl-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
          <SquareParking size={22} aria-hidden="true" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-h3 font-bold text-fg">{siteConfig.brandName}</span>
          <span className="text-caption font-medium text-fg-2">{branchName}</span>
        </div>
      </SidebarHeader>

      {user && (
        <>
          <SidebarContent className="px-0">
            {visibleNav(user).map(({ group, items }) => (
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
          <SidebarFooterSection user={user} />
        </>
      )}
    </Sidebar>
  );
}

function ThemeSubmenu({ user }: { user: SidebarUser }) {
  const { setTheme } = useTheme();
  // The account's stored-or-seed theme, not next-themes' resolvedTheme: the store's server
  // snapshot is the empty seed, so server and first client render agree.
  const theme = usePrefs()[user.id]?.theme ?? user.theme;
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const choose = (key: string) => {
    const next = key as Theme; // keys are the THEMES ids below
    // Prefs first: other tabs must see the new pref before the theme key, or they write the old one back.
    setThemeFor(user.id, next);
    setTheme(next);
  };

  return (
    <DropdownMenuSubmenu
      aria-label="ธีม"
      header="ธีม · บันทึกกับบัญชีของคุณ"
      selectedKey={theme}
      onSelect={choose}
      trigger={
        <DropdownMenuItem id="theme" textValue="ธีม" className={cn(menuItem, "font-medium text-fg")}>
          <current.icon size={16} aria-hidden="true" className="shrink-0 text-fg-2" />
          ธีม
          <span className="ml-auto text-label text-fg-3">{current.label}</span>
          <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-fg-3" />
        </DropdownMenuItem>
      }
    >
      {THEMES.map(({ id, label, icon: Icon }) => {
        const selected = id === theme;
        return (
          <DropdownMenuItem
            key={id}
            id={id}
            textValue={label}
            className={cn(
              menuItem,
              "font-medium text-fg",
              selected && "bg-primary-soft font-semibold text-primary focus:text-primary"
            )}
          >
            <Icon size={16} aria-hidden="true" className={cn("shrink-0", !selected && "text-fg-2")} />
            {label}
            {selected && <Check size={16} aria-hidden="true" className="ml-auto shrink-0" />}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuSubmenu>
  );
}

function SidebarFooterSection({ user }: { user: SidebarUser }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const confirmLogout = () =>
    startTransition(async () => {
      let info;
      try {
        info = await logout();
      } catch {
        return; // The session may still be alive: keep the dialog open so the user can retry.
      }
      if (info) {
        audit({
          action: "ออกจากระบบ",
          page: "การเข้าสู่ระบบ",
          detail: `ออกจากระบบ · ${info.browser} บน ${info.os}`,
          result: "ออกจากระบบด้วยตนเอง",
          actor: info.actor,
          role: info.role,
          target: info.target,
          ip: info.ip,
          device: info.device,
        });
      }
      // Full page load: a client navigation would keep this dialog and the old login form alive.
      reloadTo("/login");
    });

  return (
    <SidebarFooter>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-pop border border-line bg-page px-3 py-2.5 duration-200 aria-expanded:border-focus">
          <Avatar username={user.username} className="size-9 bg-primary-soft text-body text-primary" />
          <div className="grid text-left leading-tight">
            <span className="truncate text-control font-semibold text-fg">{user.username}</span>
            <span className="truncate text-label text-fg-2">{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="flex-1" />
          <ChevronsUpDown size={16} aria-hidden="true" className="text-fg-3" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-(--trigger-width) min-w-56 p-1.5" placement="top" offset={6}>
          <DropdownMenuHeader className="flex items-center gap-2.5 p-2">
            <Avatar username={user.username} className="size-9 bg-primary text-body text-on-primary" />
            <div className="flex min-w-0 flex-col items-start gap-0.75 text-left">
              <span className="max-w-full truncate text-control font-semibold text-fg">{user.username}</span>
              <span className="max-w-full truncate text-label text-fg-2">{user.email}</span>
              <RoleBadge role={user.role} />
            </div>
          </DropdownMenuHeader>

          <DropdownMenuSeparator className="my-0.5" />
          <DropdownMenuItem href="/account" className={cn(menuItem, "text-fg")}>
            <User size={16} aria-hidden="true" className="shrink-0 text-fg-2" />
            บัญชีของฉัน
          </DropdownMenuItem>
          <ThemeSubmenu user={user} />
          <DropdownMenuSeparator className="my-0.5" />
          <DropdownMenuItem
            onAction={() => setConfirmOpen(true)}
            className={cn(menuItem, "text-danger focus:text-danger")}
          >
            <LogOut size={16} aria-hidden="true" className="shrink-0" />
            ออกจากระบบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Outside the menu, so it stays mounted after the menu closes. */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={LogOut}
        title="ออกจากระบบ?"
        description="คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งานต่อ"
        cancelLabel="ยกเลิก"
        confirmLabel="ออกจากระบบ"
        confirmIcon={LogOut}
        confirmVariant="primary"
        pending={pending}
        onConfirm={confirmLogout}
      />
    </SidebarFooter>
  );
}
