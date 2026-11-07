/** ฿10,080 — pass `decimals: 2` for the payment pages (฿60.00). */
export function formatBaht(amount: number, decimals = 0): string {
  return `฿${amount.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** 1,234 */
export function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Share of a total as "14.5%" (one decimal). 0 when the total is 0. */
export function formatShare(part: number, total: number): string {
  return `${total > 0 ? ((part / total) * 100).toFixed(1) : "0.0"}%`;
}

/** 59 → "59 นาที" · 142 → "2 ชม. 22 น." */
export function formatMinutes(minutes: number): string {
  return minutes < 60 ? `${minutes} นาที` : `${Math.floor(minutes / 60)} ชม. ${String(minutes % 60).padStart(2, "0")} น.`;
}

/** Sign first, for differences: 128 → "+128", -3 → "-3". */
export function signed(n: number, format: (abs: number) => string = formatInt): string {
  return n > 0 ? `+${format(n)}` : n < 0 ? `-${format(-n)}` : format(0);
}
