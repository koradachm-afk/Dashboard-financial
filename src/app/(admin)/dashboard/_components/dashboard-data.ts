import { getFloors, type SlotStatus } from "@/db/floors/floors";
import { getVehicleComparison, type ActivityVehicleType } from "@/db/reports/reports";
import { getSessions } from "@/db/sessions/sessions";

export type SlotCounts = Record<SlotStatus, number> & { total: number };

/** Slot counts over every floor (Dashboard "ช่องว่างตอนนี้" / "ช่องจอดตอนนี้"). */
export function slotCounts(): SlotCounts {
  const out: SlotCounts = { free: 0, occupied: 0, disabled: 0, unknown: 0, total: 0 };
  for (const b of getFloors())
    for (const f of b.floors)
      for (const s of f.slots) {
        out[s.status] += 1;
        out.total += 1;
      }
  return out;
}

export type SlotAlert = { status: "unknown" | "disabled"; ids: string[]; reasons: string[] };

/** "แจ้งเตือน": the slots that are unknown or disabled, with the note each carries. */
export function slotAlerts(): SlotAlert[] {
  const slots = getFloors().flatMap((b) => b.floors.flatMap((f) => f.slots));
  return (["unknown", "disabled"] as const).flatMap((status) => {
    const hit = slots.filter((s) => s.status === status);
    if (hit.length === 0) return [];
    return [
      {
        status,
        ids: hit.map((s) => s.id).sort(),
        reasons: [...new Set(hit.map((s) => s.note).filter((n): n is string => !!n))],
      },
    ];
  });
}

export type ActivityRow = {
  id: string;
  entryTime: string;
  /** null = still parked. */
  exitTime: string | null;
  plate: string;
  province: string;
  vehicleType: string | null;
  slot: string | null;
  /** null = not paid yet. */
  fee: number | null;
};

/** One row per parking session, the most recent movement (exit, else entry) first. */
export function recentActivity(): ActivityRow[] {
  return [...getSessions()]
    .sort((a, b) => (b.exitAt ?? b.entryAt).localeCompare(a.exitAt ?? a.entryAt))
    .map((s) => ({
      id: s.id,
      entryTime: s.entryAt.slice(11, 16),
      exitTime: s.exitAt ? s.exitAt.slice(11, 16) : null,
      plate: s.plate,
      province: s.province,
      vehicleType: s.vehicleType,
      slot: s.slot,
      fee: s.fee,
    }));
}

/** Revenue per type exists for Sedan and SUV only (the Figma comparison card). */
export function typeRevenue(): Partial<Record<ActivityVehicleType, { revenue: number; perVehicle: number }>> {
  const out: Partial<Record<ActivityVehicleType, { revenue: number; perVehicle: number }>> = {};
  for (const t of getVehicleComparison().types) out[t.id] = { revenue: t.revenue, perVehicle: t.perVehicle };
  return out;
}

/** Chart colour of a vehicle type; the colour follows the type, not its rank (DESIGN-STYLE 11). */
export const TYPE_COLOR: Record<ActivityVehicleType, { stroke: string; fill: string }> = {
  sedan: { stroke: "var(--pp-chart-1)", fill: "bg-chart-1" },
  suv: { stroke: "var(--pp-chart-2)", fill: "bg-chart-2" },
  pickup: { stroke: "var(--pp-chart-3)", fill: "bg-chart-3" },
  hatchback: { stroke: "var(--pp-chart-4)", fill: "bg-chart-4" },
  van: { stroke: "var(--pp-chart-5)", fill: "bg-chart-5" },
  ev: { stroke: "var(--pp-chart-6)", fill: "bg-chart-6" },
};
