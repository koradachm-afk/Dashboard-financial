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
