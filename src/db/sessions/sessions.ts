import data from "./sessions.json";
import { loadSessions } from "./session-schema";
import type { Session } from "./session-schema";

export {
  isSessionList,
  loadSessions,
  VEHICLE_TYPES,
} from "./session-schema";
export type { Session, VehicleType } from "./session-schema";

const SESSIONS: readonly Session[] = loadSessions(data);

export function getSessions(): readonly Session[] {
  return SESSIONS;
}

export function isParked(session: Session): boolean {
  return session.exitAt === null;
}
