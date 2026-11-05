// Random initial password for "สร้างอัตโนมัติ" (07.6). Web Crypto only: Math.random is never acceptable here.

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SPECIAL = "!@#$%&*?";
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

/** Uniform integer in [0, n), rejecting the tail of the uint32 range so no value is favoured. */
function randomIndex(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  do globalThis.crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

const pick = (chars: string) => chars[randomIndex(chars.length)];

/** One of each class (so every `PASSWORD_RULES` rule passes), the rest from all classes, then shuffled. */
export function generatePassword(length = 12): string {
  if (!Number.isInteger(length) || length < 10) {
    throw new RangeError("generatePassword: length must be an integer of at least 10");
  }
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SPECIAL)];
  while (chars.length < length) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
