"use client";

import { useMemo } from "react";

import { getCustomerSessions } from "./customer";
import { useSessions } from "@/db/sessions/sessions-store";
import type { Session } from "@/db/sessions/session-schema";

function getVisitKey(session: Session) {
  return `${session.plate}\0${session.province}\0${session.entryAt}\0${session.entryGate}`;
}

export function useCustomerSessions() {
  const sessions = useSessions();
  return useMemo(() => {
    const byId = new Map(
      getCustomerSessions().map((session) => [getVisitKey(session), session]),
    );
    sessions.forEach((session) => byId.set(getVisitKey(session), session));
    return [...byId.values()];
  }, [sessions]);
}
