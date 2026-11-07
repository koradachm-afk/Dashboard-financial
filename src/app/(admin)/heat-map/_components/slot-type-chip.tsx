import { Accessibility, Bike, Car, Crown, Truck, Zap, type LucideIcon } from "lucide-react";

import { getSlotTypes } from "@/db/slot-types/slot-types";
import { cn } from "@/utils/cn";

// Class names are written out in full so Tailwind can see them (a template string would be purged).
const ICONS: Record<string, LucideIcon> = {
  car: Car,
  zap: Zap,
  accessibility: Accessibility,
  crown: Crown,
  truck: Truck,
  bike: Bike,
};

const COLORS: Record<string, string> = {
  "type-general": "text-type-general",
  "type-ev": "text-type-ev",
  "type-accessible": "text-type-accessible",
  "type-vip": "text-type-vip",
  warning: "text-warning",
  success: "text-success",
};

export function slotTypeOf(id: string) {
  return getSlotTypes().find((t) => t.id === id);
}

/** Type chip: the type icon (in the type colour, icons only) + the type name. */
export function SlotTypeChip({ typeId, className }: { typeId: string; className?: string }) {
  const type = slotTypeOf(typeId);
  if (!type) return null;
  const Icon = ICONS[type.icon] ?? Car;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.75 text-label text-fg-2",
        className,
      )}
    >
      <Icon size={14} aria-hidden className={cn("shrink-0", COLORS[type.color] ?? "text-fg-2")} />
      {type.name}
    </span>
  );
}
