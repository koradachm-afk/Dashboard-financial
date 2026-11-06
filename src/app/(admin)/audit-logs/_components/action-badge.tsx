import type { AuditAction } from "@/db/audit/audit";
import { cn } from "@/utils/cn";

// Tones per DESIGN-STYLE 8.2 (Action Badge) and Figma 08 / 08.7.
const TONE: Record<AuditAction, string> = {
  สร้าง: "bg-success-soft text-success",
  แก้ไข: "bg-primary-soft text-primary",
  ลบ: "bg-slot-occupied-soft text-slot-occupied",
  เข้าสู่ระบบ: "bg-page text-fg-2",
  ออกจากระบบ: "bg-page text-fg-2",
  ล้มเหลว: "bg-warning-soft text-warning",
  ส่งออก: "border border-line bg-subtle text-fg",
};

export function ActionBadge({ action }: { action: AuditAction }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md py-0.75 pr-2.5 pl-2 text-label font-semibold whitespace-nowrap",
        TONE[action],
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {action}
    </span>
  );
}
