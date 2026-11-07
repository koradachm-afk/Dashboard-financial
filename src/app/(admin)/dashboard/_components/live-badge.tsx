/** "ข้อมูลสด": the card reads the current state, not a range. */
export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft py-1 pr-2.5 pl-2 text-label font-semibold whitespace-nowrap text-success">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      ข้อมูลสด
    </span>
  );
}
