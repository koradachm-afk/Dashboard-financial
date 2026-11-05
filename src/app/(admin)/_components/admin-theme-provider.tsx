"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

/** Admin-only theming: next-themes owns `<html data-theme>` and its one browser storage key. */
export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  // next-themes never cleans up, so drop the admin theme from <html> when leaving admin pages.
  useEffect(
    () => () => {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.style.colorScheme = "";
    },
    []
  );

  return (
    <ThemeProvider
      attribute="data-theme"
      themes={["light", "dark"]}
      enableSystem={false}
      defaultTheme="light"
      storageKey="autoparking:v1:theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
