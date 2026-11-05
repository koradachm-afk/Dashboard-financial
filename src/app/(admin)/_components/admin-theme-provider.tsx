"use client";

import { ThemeProvider } from "next-themes";

/** Admin-only theming: next-themes owns `<html data-theme>` and its one browser storage key. */
export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
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
