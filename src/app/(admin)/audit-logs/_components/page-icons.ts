import { Activity, Flame, History, Lock, Map, Settings, ShieldCheck, User, Wallet, type LucideIcon } from "lucide-react";

// Menu order and icons follow Figma 08.9.
export const PAGES: readonly { id: string; icon: LucideIcon }[] = [
  { id: "การเข้าสู่ระบบ", icon: Lock },
  { id: "บัญชีของฉัน", icon: User },
  { id: "Parking Layout", icon: Map },
  { id: "Financial Overview", icon: Wallet },
  { id: "Activity Log", icon: Activity },
  { id: "Parking Heat Map", icon: Flame },
  { id: "User & Permissions", icon: ShieldCheck },
  { id: "System Settings", icon: Settings },
  { id: "Audit Logs", icon: History },
];

export const pageIcon = (name: string) => PAGES.find((p) => p.id === name)?.icon;
