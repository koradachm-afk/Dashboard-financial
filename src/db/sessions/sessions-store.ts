"use client";

import { useSyncExternalStore } from "react";

import { createStore } from "@/db/store";
import { newSessionId } from "@/utils/id";
import { getCustomerSessions } from "@/db/customer/customer";
import data from "./sessions.json";
import { isSessionList, loadSessions } from "./session-schema";
import type { Session } from "./session-schema";

const SEED = loadSessions(data);
const store = createStore<readonly Session[]>({
  domain: "sessions",
  seed: SEED,
  validate: isSessionList,
});

export function getStoredSessions(): readonly Session[] {
  return store.get();
}

export function ensureCustomerSession(sessionId: string): Session {
  const existing = store.get().find((session) => session.id === sessionId);
  if (existing) return existing;

  const seededSession = getCustomerSessions().find(
    (session) => session.id === sessionId,
  );
  if (!seededSession) {
    throw new Error(`Parking session ${sessionId} does not exist`);
  }

  const next = [...store.get(), seededSession];
  if (!isSessionList(next)) throw new Error("Cannot save an invalid parking session");
  store.set(next);
  return seededSession;
}

export function useSessions(): readonly Session[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export function createSession(input: Omit<Session, "id">): Session {
  const session: Session = Object.freeze({ ...input, id: newSessionId() });
  const next = [...store.get(), session];
  if (!isSessionList(next)) throw new Error("Cannot create an invalid parking session");
  store.set(next);
  return session;
}

export function updateSession(
  sessionId: string,
  changes: Partial<Omit<Session, "id">>,
): Session {
  const sessions = store.get();
  const index = sessions.findIndex((session) => session.id === sessionId);
  if (index < 0) throw new Error(`Parking session ${sessionId} does not exist`);

  const updated = Object.freeze({ ...sessions[index], ...changes });
  const next = sessions.map((session, currentIndex) =>
    currentIndex === index ? updated : session,
  );
  if (!isSessionList(next)) throw new Error("Cannot save an invalid parking session");
  store.set(next);
  return updated;
}
