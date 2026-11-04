import { Car, SquareParking } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getSettings } from "@/db/settings";
import { cn } from "@/utils/cn";

type SlotStatus = "available" | "occupied" | "unknown";

// Mirrors Figma 09.7 "Decoration — mini lot" (58:12901).
const ROWS: readonly (readonly [string, SlotStatus][])[] = [
  [
    ["A-01", "available"],
    ["A-02", "occupied"],
    ["A-03", "available"],
    ["A-04", "available"],
    ["A-05", "occupied"],
    ["A-06", "unknown"],
    ["A-07", "available"],
  ],
  [
    ["B-01", "occupied"],
    ["B-02", "available"],
    ["B-03", "occupied"],
    ["B-04", "available"],
    ["B-05", "available"],
    ["B-06", "occupied"],
    ["B-07", "available"],
  ],
];

// Full class strings so Tailwind can see them.
const SLOT_STYLES: Record<SlotStatus, { box: string; number: string; icon: string }> = {
  available: {
    box: "border-slot-available bg-slot-available-soft",
    number: "text-fg",
    icon: "text-slot-available",
  },
  occupied: {
    box: "border-slot-occupied bg-slot-occupied-soft",
    number: "text-fg",
    icon: "text-slot-occupied",
  },
  unknown: {
    box: "border-slot-unknown bg-slot-unknown-soft",
    number: "text-fg-2",
    icon: "text-fg-3",
  },
};

function Slot({ label, status }: { label: string; status: SlotStatus }) {
  const s = SLOT_STYLES[status];
  return (
    <div
      className={cn(
        "flex h-20 w-10 shrink-0 flex-col items-center justify-center gap-1.5 rounded-sm border-[1.5px]",
        s.box,
      )}
    >
      <span className={cn("text-micro font-semibold", s.number)}>{label}</span>
      <Car size={18} className={s.icon} aria-hidden="true" />
    </div>
  );
}

export function BrandPanel() {
  const { branchName } = getSettings();

  return (
    <aside className="hidden lg:flex w-155 shrink-0 flex-col gap-7 bg-primary text-on-primary pt-14 px-16 pb-12 overflow-clip">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-pop bg-surface">
          <SquareParking size={26} className="text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col">
          <span className="text-h2 font-bold">{siteConfig.brandName}</span>
          <span className="text-body font-medium opacity-80">{branchName}</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3.5">
        <h2 className="text-kiosk-lg font-bold">ระบบจัดการที่จอดรถ</h2>
        {/* Line break as in Figma 09.7: the browser's Thai word breaking would leave "เดียว" alone. */}
        <p className="text-lead opacity-85 max-w-110">
          วางผังที่จอด ติดตามสถานะช่องจอด{" "}
          <br />
          และดูภาพรวมการใช้งานได้ในที่เดียว
        </p>
      </div>

      <div
        aria-hidden="true"
        className="flex flex-col items-center rounded-modal bg-primary-hover p-5"
      >
        {ROWS.map((row, i) => (
          <div key={i} className={i === 0 ? "flex mb-7" : "flex"}>
            {row.map(([label, status]) => (
              <Slot key={label} label={label} status={status} />
            ))}
          </div>
        ))}
      </div>

      <div className="h-12 w-2.5 shrink-0" />

      <p className="text-label opacity-70">
        © 2026 {siteConfig.brandName} · Parking Management
      </p>
    </aside>
  );
}
