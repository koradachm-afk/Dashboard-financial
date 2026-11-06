// In-memory user list (mock: per server process, lost on restart). It starts from user.json,
// and the seed file itself is never edited at runtime.
// Kept out of the "use server" actions file on purpose: every export there is a
// client-callable Server Action, so a setter exported from it would let anyone add or remove users.
// Read users through users.ts (getUsers / getUserById / findUserByIdentifier), not this module.

import type { User } from "./users";
// The only importer of user.json. Client code may import users.ts, so user.json must never hold
// passwords (see user/credentials.json).
import data from "./user.json";

// Stored values are frozen copies, so neither the caller nor a reader can mutate the store.
function freezeUser(user: User): User {
  return Object.freeze({ ...user, permissions: Object.freeze({ ...user.permissions }) });
}

const SEED: readonly User[] = Object.freeze((data as User[]).map(freezeUser));

let users: readonly User[] = SEED;

/** Every user: seed order, then created users in creation order. Removed users are left out. */
export function listUsers(): readonly User[] {
  return users;
}

/** Appends a new user. Throws if the id is already taken. */
export function addUser(user: User): void {
  if (users.some((u) => u.id === user.id)) throw new Error(`User ${user.id} already exists`);
  users = Object.freeze([...users, freezeUser(user)]);
}

/** Replaces the user with the same id, keeping its place. Throws if no such user exists. */
export function replaceUser(user: User): void {
  const index = users.findIndex((u) => u.id === user.id);
  if (index === -1) throw new Error(`User ${user.id} does not exist`);
  users = Object.freeze(users.with(index, freezeUser(user)));
}

/** Removes the user with `id`. An unknown id is ignored. */
export function removeUser(id: string): void {
  users = Object.freeze(users.filter((u) => u.id !== id));
}

/** Test-only: back to the seed. */
export function __resetUserStore(): void {
  users = SEED;
}
