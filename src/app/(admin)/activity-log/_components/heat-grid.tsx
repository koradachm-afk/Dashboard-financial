import { cn } from "@/utils/cn";

import { heatPeak, type Summary } from "./activity-stats";

// Heat 1–6 (Figma Heat Cell levels 0–5). Ink is dark on levels 1–3 and light on 4–6 (DESIGN-STYLE 8.5).
const LEVELS = [
  "bg-heat-1 text-heat-ink-low",
  "bg-heat-2 text-heat-ink-low",
  "bg-heat-3 text-heat-ink-low",
  "bg-heat-4 text-heat-ink-high",
  "bg-heat-5 text-heat-ink-high",
  "bg-heat-6 text-heat-ink-high",
] as const;

const level = (value: number, peak: number) => (peak <= 0 ? 0 : Math.min(LEVELS.length - 1, Math.floor((value * LEVELS.length) / peak)));

const pad = (n: number) => String(n).padStart(2, "0");

export function HeatLegend() {
  return (
    <div className="ml-auto flex items-center gap-1.5 text-caption text-fg-3" aria-hidden="true">
      น้อย
      {LEVELS.map((l) => (
        <span key={l} className={cn("h-3 w-5 rounded-xs", l)} />
      ))}
      มาก
    </div>
  );
}

/** Weekday × hour table of average entries per hour (Figma 14 "ช่วงเวลาหนาแน่น"). */
export function HeatGrid({ grid }: { grid: Summary["heatGrid"] }) {
  const peak = heatPeak(grid).value;
  return (
    <div role="table" aria-label="จำนวนรถเข้าเฉลี่ยต่อชั่วโมง แยกตามวันและชั่วโมง" className="flex flex-col gap-1">
      <div role="row" className="flex items-end gap-1">
        <span className="w-8 shrink-0" />
        <div className="grid flex-1 grid-cols-24 gap-1">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} role="columnheader" className="col-span-2 text-caption text-fg-3 tabular-nums">
              {pad(i * 2)}
            </span>
          ))}
        </div>
      </div>
      {grid.days.map((day, d) => (
        <div key={day} role="row" className="flex items-center gap-1">
          <span role="rowheader" className="w-8 shrink-0 text-label text-fg-2">
            {day}
          </span>
          <div className="grid flex-1 grid-cols-24 gap-1">
            {grid.values[d].map((value, hour) => (
              <span
                key={hour}
                role="cell"
                title={`${day} ${pad(hour)}:00–${pad(hour)}:59 · เฉลี่ย ${value} คัน`}
                className={cn(
                  "grid h-7 place-items-center rounded-sm text-caption font-medium tabular-nums",
                  LEVELS[level(value, peak)],
                )}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
