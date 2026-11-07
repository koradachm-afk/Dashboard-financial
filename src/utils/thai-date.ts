export const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

/** "2026-10-04" → "4 ต.ค." */
export function shortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} ${THAI_MONTHS[month - 1]}`;
}

/** The `days` dates ending on `endDate` (YYYY-MM-DD), oldest first. */
export function datesEndingOn(endDate: string, days: number): string[] {
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
