"use client";

import { ArrowRight, ArrowUpDown, DoorOpen, LogIn, LogOut } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

import type { Floor, LayoutObject } from "@/db/floors/floors";
import type { HeatMapData, HeatMapPeriod, HeatMetric } from "@/db/reports/reports";
import { useSlotTypes } from "@/db/slot-types/slot-types-store";
import { cn } from "@/utils/cn";

import { formatMetric, formatRate, formatStay, getSlotStats, heatLevel, slotValue } from "./heat-map-model";
import { slotTypeOf } from "./slot-type-chip";

/** 16 px = 1 m, the scale of the Figma frames. */
const U = 16;

// Written out in full so Tailwind sees every class.
const FILL = ["fill-heat-1", "fill-heat-2", "fill-heat-3", "fill-heat-4", "fill-heat-5", "fill-heat-6"] as const;
export const SWATCH = ["bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4", "bg-heat-5", "bg-heat-6"] as const;
const INK_LOW = "fill-heat-ink-low";
const INK_HIGH = "fill-heat-ink-high";

const px = (m: number) => m * U;
const centre = (o: LayoutObject) => ({ x: px(o.x + o.width / 2), y: px(o.y + o.length / 2) });

function Gate({ object, kind }: { object: LayoutObject; kind: "in" | "out" }) {
  const Icon = kind === "in" ? LogIn : LogOut;
  const tone = kind === "in" ? "text-primary" : "text-warning";
  const stroke = kind === "in" ? "stroke-primary" : "stroke-warning";
  const ink = kind === "in" ? "fill-primary" : "fill-warning";
  const h = px(object.length);
  return (
    <g>
      <rect
        x={px(object.x)}
        y={px(object.y)}
        width={px(object.width)}
        height={h}
        rx={h / 2}
        strokeWidth={1.5}
        className={cn("fill-surface", stroke)}
      />
      <Icon x={px(object.x) + 12} y={px(object.y) + (h - 16) / 2} size={16} aria-hidden className={tone} />
      <text
        x={px(object.x) + 34}
        y={px(object.y) + h / 2}
        dominantBaseline="central"
        className={cn("text-body font-semibold", ink)}
      >
        {kind === "in" ? "ทางเข้า" : "ทางออก"}
      </text>
    </g>
  );
}

function Transit({ object, label }: { object: LayoutObject; label: string }) {
  const x = px(object.x);
  const y = px(object.y);
  const w = px(object.width);
  const h = px(object.length);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={2} className="fill-surface stroke-map-wall" />
      <ArrowUpDown x={x + w / 2 - 10} y={y + 10} size={20} aria-hidden className="text-fg" />
      <text x={x + w / 2} y={y + h - 11} textAnchor="middle" className="fill-fg-2 text-caption font-medium">
        {label}
      </text>
    </g>
  );
}

type Hover = { id: string; x: number; y: number; below: boolean };

export function HeatMapCanvas({
  floor,
  period,
  data,
  metric,
  type,
  selectedId,
  onSelect,
}: {
  floor: Floor;
  period: HeatMapPeriod;
  data: HeatMapData;
  metric: HeatMetric;
  /** Slot-type id the map is narrowed to, or null. Other slots are dimmed. */
  type: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const slotTypes = useSlotTypes();
  const [hover, setHover] = useState<Hover | null>(null);
  const range = data.legend[metric] ?? data.legend.count;
  const W = px(floor.width);
  const H = px(floor.length);
  const selected = floor.slots.find((s) => s.id === selectedId);
  const hovered = hover ? floor.slots.find((s) => s.id === hover.id) : undefined;
  const stats = hover ? getSlotStats(period, hover.id) : null;

  const objects = (kind: LayoutObject["kind"]) => floor.objects.filter((o) => o.kind === kind);
  const keyDown = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-192">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={`ผังที่จอด ชั้น ${floor.name}`}>
        <rect width={W} height={H} className="fill-map-floor" />
        {objects("lane").map((o) => (
          <rect key={o.id} x={px(o.x)} y={px(o.y)} width={px(o.width)} height={px(o.length)} className="fill-map-lane" />
        ))}
        <line x1={0} x2={W} y1={0} y2={0} strokeWidth={4} className="stroke-map-wall" />
        <line x1={0} x2={W} y1={H} y2={H} strokeWidth={4} className="stroke-map-wall" />

        {objects("arrow").map((o) => {
          const c = centre(o);
          return (
            <g key={o.id} transform={`rotate(${o.rotation ?? 0} ${c.x} ${c.y})`} aria-hidden>
              <ArrowRight x={c.x - 12} y={c.y - 12} size={24} className="text-fg-3" />
            </g>
          );
        })}
        {objects("pillar").map((o) => (
          <rect key={o.id} x={px(o.x)} y={px(o.y)} width={px(o.width)} height={px(o.length)} rx={2} className="fill-map-pillar" />
        ))}

        {floor.slots.map((s) => {
          const value = slotValue(data, s.id, metric);
          const level = value === undefined ? 1 : heatLevel(value, range);
          const x = px(s.x);
          const y = px(s.y);
          const w = px(s.width);
          const h = px(s.length);
          const dimmed = type !== null && s.type !== type;
          const label = value === undefined ? s.id : `${s.id} ${formatMetric(metric, value)}`;
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={s.id === selectedId}
              transform={s.rotation ? `rotate(${s.rotation} ${x + w / 2} ${y + h / 2})` : undefined}
              onClick={() => onSelect(s.id)}
              onKeyDown={keyDown(s.id)}
              onMouseEnter={() => setHover({ id: s.id, x: (s.x + s.width / 2) / floor.width, y: s.y / floor.length, below: s.y < 11 })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ id: s.id, x: (s.x + s.width / 2) / floor.width, y: s.y / floor.length, below: s.y < 11 })}
              onBlur={() => setHover(null)}
              className={cn("group cursor-pointer outline-none", dimmed && "opacity-30")}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={4}
                strokeWidth={1}
                className={cn(FILL[level - 1], "stroke-map-floor group-focus-visible:stroke-primary group-focus-visible:stroke-2")}
              />
              <text
                x={x + w / 2}
                y={y + h / 2 - 8}
                textAnchor="middle"
                className={cn("text-micro font-semibold", level <= 3 ? INK_LOW : INK_HIGH)}
              >
                {s.id}
              </text>
              <text
                x={x + w / 2}
                y={y + h / 2 + 10}
                textAnchor="middle"
                className={cn("text-micro tabular-nums", level <= 3 ? INK_LOW : INK_HIGH)}
              >
                {value === undefined ? "" : metric === "rate" ? `${value}%` : value}
              </text>
            </g>
          );
        })}

        {selected && (
          <rect
            x={px(selected.x)}
            y={px(selected.y)}
            width={px(selected.width)}
            height={px(selected.length)}
            rx={4}
            strokeWidth={2.5}
            pointerEvents="none"
            className="fill-none stroke-primary"
          />
        )}

        {objects("gate-in").map((o) => (
          <Gate key={o.id} object={o} kind="in" />
        ))}
        {objects("gate-out").map((o) => (
          <Gate key={o.id} object={o} kind="out" />
        ))}
        {objects("elevator").map((o) => (
          <Transit key={o.id} object={o} label="ลิฟต์" />
        ))}
        {objects("stairs").map((o) => (
          <Transit key={o.id} object={o} label="บันได" />
        ))}
        {objects("door").map((o) => (
          <g key={o.id} aria-hidden>
            <rect x={px(o.x)} y={px(o.y)} width={px(o.width)} height={px(o.length)} rx={6} strokeWidth={1.5} className="fill-surface stroke-map-wall" />
            <DoorOpen x={px(o.x) + (px(o.width) - 16) / 2} y={px(o.y) + (px(o.length) - 16) / 2} size={16} className="text-fg" />
          </g>
        ))}
      </svg>

      {hover && hovered && stats && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-40 flex w-max -translate-x-1/2 flex-col gap-1 rounded-pop border border-line bg-surface px-3 py-2.5 shadow-tooltip",
            hover.below ? "mt-2" : "-translate-y-full -mt-2",
          )}
          // Position only: the tooltip follows the hovered slot on the 48 × 32 m floor.
          style={{ left: `${hover.x * 100}%`, top: `${hover.below ? ((hovered.y + hovered.length) / floor.length) * 100 : hover.y * 100}%` }}
        >
          <p className="text-body font-semibold text-fg">
            {hovered.id}
            <span className="ml-2 font-normal text-fg-2">{slotTypeOf(hovered.type, slotTypes)?.name}</span>
          </p>
          <dl className="flex flex-col gap-0.5 text-label tabular-nums">
            {stats.count !== null && <Row label="จำนวนครั้ง" value={`${stats.count.toLocaleString("th-TH")} ครั้ง`} />}
            {stats.hours !== null && <Row label="ชั่วโมงจอดรวม" value={`${stats.hours.toLocaleString("th-TH")} ชม.`} />}
            {stats.rate && <Row label="อัตราการใช้" value={formatRate(stats.rate)} />}
            {stats.avgStayMin !== null && <Row label="จอดเฉลี่ย" value={`${formatStay(stats.avgStayMin)} ต่อครั้ง`} />}
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="text-fg-2">{label}</dt>
      <dd className="font-medium text-fg">{value}</dd>
    </div>
  );
}
