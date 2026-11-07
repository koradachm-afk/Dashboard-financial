import {
  getRowAverages,
  leastUsedSlots,
  mostUsedSlots,
  type HeatMapPeriod,
  type HeatMetric,
  type RankedSlot,
} from "@/db/reports/reports";
import { formatMetric } from "./heat-map-model";
import { SlotTypeChip } from "./slot-type-chip";

/** Bars never reach the end of the track: the longest one fills 92 % (as in the Figma frame). */
const BAR_MAX = 0.92;

function RankRow({ slot, metric, rank }: { slot: RankedSlot; metric: HeatMetric; rank?: number }) {
  return (
    <li className="flex h-11.5 items-center gap-3 border-b border-line last:border-b-0">
      {rank !== undefined && <span className="w-5 text-control font-medium text-fg-2 tabular-nums">{rank}</span>}
      <span className="w-12 text-control font-semibold text-fg">{slot.id}</span>
      <SlotTypeChip typeId={slot.type} />
      <span className="ml-auto text-control font-medium text-fg tabular-nums">{formatMetric(metric, slot.value)}</span>
    </li>
  );
}

const EMPTY = <p className="px-5 py-4 text-body text-fg-3">ไม่มีช่องจอดตามตัวกรองนี้</p>;

export function MostUsedCard({ period, metric, type }: { period: HeatMapPeriod; metric: HeatMetric; type: string | null }) {
  const list = mostUsedSlots(period, { metric, type: type ?? undefined });
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-title font-semibold text-fg">ใช้บ่อยที่สุด</h2>
      </div>
      {list.length === 0 ? (
        EMPTY
      ) : (
        <ol className="px-5 py-1.5">
          {list.map((s, i) => (
            <RankRow key={s.id} slot={s} metric={metric} rank={i + 1} />
          ))}
        </ol>
      )}
    </section>
  );
}

export function LeastUsedCard({ period, metric, type }: { period: HeatMapPeriod; metric: HeatMetric; type: string | null }) {
  const query = { metric, type: type ?? undefined };
  const list = leastUsedSlots(period, query);
  const rows = getRowAverages(period, query).filter((r) => r.slots > 0);
  const top = Math.max(0, ...rows.map((r) => r.mean));
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-col gap-1 border-b border-line px-5 py-4">
        <h2 className="text-title font-semibold text-fg">ใช้น้อยที่สุด</h2>
        <p className="text-label text-fg-2">รวมช่องที่ปิดใช้งานบางช่วง</p>
      </div>
      {list.length === 0 ? (
        EMPTY
      ) : (
        <>
          <ul className="px-5 py-1.5">
            {list.map((s) => (
              <RankRow key={s.id} slot={s} metric={metric} />
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-line px-5 py-4">
            <h3 className="text-body font-semibold text-fg">ค่าเฉลี่ยตามแถว</h3>
            <ul className="flex flex-col gap-3">
              {rows.map((r) => (
                <li key={r.row} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-body font-medium text-fg">แถว {r.row}</span>
                    <span className="text-label text-fg-3">{r.slots} ช่อง</span>
                    <span className="ml-auto text-body font-semibold text-fg tabular-nums">
                      {formatMetric(metric, metric === "rate" ? Math.round(r.mean * 10) / 10 : r.average)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-page">
                    {/* Width is data-driven, so it is the one inline style of this card. */}
                    <div className="h-full rounded-full bg-primary" style={{ width: `${top > 0 ? (r.mean / top) * BAR_MAX * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
