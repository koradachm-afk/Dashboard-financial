const STEPS = [1, 2, 2.5, 3, 4, 5, 6, 8];

/** Axis ticks 0…max in `count` equal steps with a round step (24 → 0·6·12·18·24, 15,500 → 0·4,000…16,000). */
export function niceTicks(max: number, count = 4): number[] {
  let step = 1;
  search: for (let exp = 0; exp < 9; exp++) {
    for (const m of STEPS) {
      step = m * 10 ** exp;
      if (step * count >= max) break search;
    }
  }
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

/** ฿4k · ฿1.5k · ฿500 — axis labels. */
export const bahtAxis = (v: number) => (v >= 1000 ? `฿${v / 1000}k` : `฿${v}`);

// SVG props, so the token goes in as a CSS variable (DESIGN-STYLE 11).
export const AXIS_TICK = { fill: "var(--pp-text-3)", fontSize: 11 };
export const GRID = "var(--pp-border)";
export const AXIS_LINE = { stroke: "var(--pp-border-strong)" };
