// Random id of this server process, created once when the module loads (mock: changes on every restart).
// Kept out of the "use server" actions file on purpose, and only boot-actions.ts imports it, so it
// never reaches a client bundle. Browsers compare it through getBootId() and syncBootId() in store.ts.

export const BOOT_ID: string = crypto.randomUUID();
