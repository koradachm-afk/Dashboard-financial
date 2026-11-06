// Password rules shown on /set-password (Figma 09.9 "Password rules").
// Pure and client-safe: the form imports it for live checks and the server action re-checks with it.

export type PasswordRule = {
  id: "length" | "case" | "digit" | "special" | "match";
  label: string;
  test: (password: string, confirm: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = Object.freeze([
  { id: "length", label: "อย่างน้อย 8 ตัวอักษร", test: (p) => p.length >= 8 },
  { id: "case", label: "มีตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก", test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: "digit", label: "มีตัวเลขอย่างน้อย 1 ตัว", test: (p) => /\d/.test(p) },
  { id: "special", label: "มีอักขระพิเศษ เช่น ! @ #", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "match", label: "รหัสผ่านทั้งสองช่องตรงกัน", test: (p, c) => c !== "" && p === c },
]);

export function passwordRulesMet(password: string, confirm: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password, confirm));
}
