import data from "./customer-sessions.json";
import { loadSessions, type Session } from "@/db/sessions/session-schema";

const CUSTOMER_SESSIONS: readonly Session[] = loadSessions(
  data,
  "customer-sessions.json",
);

export function getCustomerSessions(): readonly Session[] {
  return CUSTOMER_SESSIONS;
}
