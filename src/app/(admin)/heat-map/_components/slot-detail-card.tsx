import type { Floor } from "@/db/floors/floors";
import { getHeatMap, getSlotRank, type HeatMapPeriod, type HeatMetric } from "@/db/reports/reports";
import { cn } from "@/utils/cn";

import { formatRate, formatStay, getSlotStats } from "./heat-map-model";
import { SlotTypeChip } from "./slot-type-chip";
import { StartHoursChart } from "./start-hours-chart";

const STATUS = {
  free: { text: "ว่าง", pill: "bg-slot-available-soft text-slot-available", dot: "bg-slot-available" },
  occupied: { text: "ไม่ว่าง", pill: "bg-slot-occupied-soft text-slot-occupied", dot: "bg-slot-occupied" },
  disabled: { text: "ปิดใช้งาน", pill: "bg-slot-disabled-soft text-slot-disabled", dot: "bg-slot-disabled" },
  unknown: { text: "ไม่ทราบสถานะ", pill: "bg-slot-unknown-soft text-fg-2", dot: "bg-slot-unknown" },
} as const;

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-subtle px-3.5 py-3">
      <dt className="text-label text-fg-2">{label}</dt>
      {value === null ? (
        <dd className="text-body text-fg-3">ไม่มีข้อมูล</dd>
      ) : (
        <dd className="text-h2 font-bold text-fg tabular-nums">{value}</dd>
      )}
    </div>
  );
}

export function SlotDetailCard({
  floor,
  period,
  metric,
  type,
  slotId,
}: {
  floor: Floor;
  period: HeatMapPeriod;
  metric: HeatMetric;
  type: string | null;
  slotId: string | null;
}) {
  const slot = floor.slots.find((s) => s.id === slotId);
  if (!slot) {
    return (
      <section className="flex flex-col rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-title font-semibold text-fg">รายละเอียดช่องจอด</h2>
        </div>
        <p className="px-5 py-4 text-body text-fg-3">เลือกช่องจอดบนผังเพื่อดูรายละเอียด</p>
      </section>
    );
  }
  const stats = getSlotStats(period, slot.id);
  const rank = getSlotRank(period, slot.id, { metric, type: type ?? undefined });
  const panel = getHeatMap(period)?.panels[slot.id];
  const status = STATUS[slot.status];

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <h2 className="text-title font-semibold text-fg">ช่อง {slot.id}</h2>
        <div className="ml-auto flex items-center gap-2">
          <SlotTypeChip typeId={slot.type} />
          {rank && (
            <span className="rounded-full bg-primary-soft px-2.5 py-0.75 text-label font-semibold text-primary tabular-nums">
              อันดับ {rank.rank} / {rank.of}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        <dl className="flex gap-3">
          <Stat label="จำนวนครั้ง" value={stats.count === null ? null : stats.count.toLocaleString("th-TH")} />
          <Stat label="ชั่วโมงรวม" value={stats.hours === null ? null : stats.hours.toLocaleString("th-TH")} />
          <Stat label="อัตราการใช้" value={stats.rate ? formatRate(stats.rate) : null} />
        </dl>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-fg-2">
          {stats.avgStayMin === null ? "ยังไม่มีเวลาจอดเฉลี่ย" : `จอดเฉลี่ย ${formatStay(stats.avgStayMin)} ต่อครั้ง`}
          <span aria-hidden>·</span>
          สถานะตอนนี้
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.75 text-label font-medium", status.pill)}>
            <span aria-hidden className={cn("size-2 rounded-full", status.dot)} />
            {status.text}
          </span>
        </p>
        <div className="flex flex-col gap-3">
          <h3 className="text-body font-semibold text-fg">ช่วงเวลาที่เริ่มจอด</h3>
          {panel ? (
            <StartHoursChart counts={panel.startHours} />
          ) : (
            <p className="text-body text-fg-3">ยังไม่มีข้อมูลช่วงเวลาที่เริ่มจอดของช่องนี้</p>
          )}
        </div>
      </div>
    </section>
  );
}
