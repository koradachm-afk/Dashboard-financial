"use server";
// Every export here is a client-callable Server Action: async functions and types only.
import { BOOT_ID } from "@/db/boot/boot";

/** The id of the running server process; it changes when the server restarts. */
export async function getBootId(): Promise<string> {
  return BOOT_ID;
}
