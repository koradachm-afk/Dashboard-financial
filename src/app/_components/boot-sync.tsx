"use client";

import { useEffect } from "react";

import { getBootId } from "@/db/boot/boot-actions";
import { syncBootId } from "@/db/store";

/** Renders nothing. After a server restart, resets this browser's stores to seed on the next page load. */
export function BootSync() {
  useEffect(() => {
    // If the action fails (offline, etc.), do nothing.
    getBootId().then(syncBootId).catch(() => {});
  }, []);
  return null;
}
