"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { getThemeFor, usePrefs } from "@/db/prefs/prefs";
import type { SidebarUser } from "@/components/sidebarmenu";

/**
 * Applies the signed-in account's theme over whatever next-themes last stored in this browser,
 * so a new login never inherits the previous account's theme. Renders nothing.
 */
export default function ThemeSync({ user }: { user: Pick<SidebarUser, "id" | "theme"> | null }) {
  const { setTheme } = useTheme();
  const id = user?.id;
  const seed = user?.theme;
  // Subscribing keeps the prefs cache fresh when another tab changes the theme.
  const prefs = usePrefs();

  useEffect(() => {
    if (id && seed) setTheme(getThemeFor(id, seed));
  }, [id, seed, setTheme, prefs]);

  return null;
}
