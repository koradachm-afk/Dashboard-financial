// Field checks for the user forms (07.4 / 07.6). Pure and client-safe.

const USERNAME = /^[a-z0-9._]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** a–z, 0–9, "." and "_" only. No trimming: a stray space is an error, not silently dropped. */
export const isValidUsername = (value: string) => USERNAME.test(value);

export const isValidEmail = (value: string) => EMAIL.test(value);
