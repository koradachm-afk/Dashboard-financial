"use client";

import { CircleCheck, Download, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { SegmentedControl } from "@/components/tailgrids/core/segmented-control";
import { Toast } from "@/components/tailgrids/core/toast";
import { audit } from "@/db/audit/audit";
import { exportHeatMapInfo } from "@/db/audit/audit-actions";
import { countSlotsByType, getFloors } from "@/db/floors/floors";
import { getHeatMap } from "@/db/reports/reports";
import { getSlotTypes } from "@/db/slot-types/slot-types";
import { cn } from "@/utils/cn";

import { SWATCH, HeatMapCanvas } from "./heat-map-canvas";
import { downloadHeatMapXlsx, exportFileName, exportRows } from "./heat-map-export";
import {
  ALL_TYPES,
  buildingOf,
  defaultSlotId,
  effectiveMetric,
  floorOf,
  formatMetric,
  metricOptionsFor,
  PERIOD_OPTIONS,
  scopeText,
  type HeatState,
} from "./heat-map-model";
import { HeatSelect } from "./heat-select";
import { LeastUsedCard, MostUsedCard } from "./ranking-cards";
import { SlotDetailCard } from "./slot-detail-card";

/** Filters live in the URL so a refresh keeps them and the link can be shared (AGENTS.md rule 4). */
function writeUrl(s: HeatState) {
  const params = new URLSearchParams({ building: s.buildingId, floor: s.floorName, period: s.period, metric: s.metric });
  if (s.type) params.set("type", s.type);
  if (s.slot) params.set("slot", s.slot);
  window.history.replaceState(null, "", `?${params}`);
}

export function HeatMapView({ initial }: { initial: HeatState }) {
  const [state, setState] = useState(initial);
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const [toast, setToast] = useState({ open: false, done: false, description: "" });

  const change = (patch: Partial<HeatState>) => {
    const next = { ...state, ...patch };
    setState(next);
    writeUrl(next);
  };

  const buildings = getFloors();
  const building = buildingOf(state.buildingId);
  const floors = [...building.floors].sort((a, b) => a.order - b.order);
  const floor = floorOf(building, state.floorName);
  const data = floor.slots.length > 0 ? getHeatMap(state.period) : null;
  const metric = effectiveMetric(state.period, state.metric);
  const slotId = floor.slots.some((s) => s.id === state.slot) ? state.slot : defaultSlotId(floor, data);

  const onFloor = countSlotsByType(floor);
  const typeOptions = [
    { id: ALL_TYPES, label: "ทุกประเภทช่อง" },
    ...getSlotTypes()
      .filter((t) => onFloor[t.id])
      .map((t) => ({ id: t.id, label: t.name })),
  ];
  const slotCount = floor.slots.filter((s) => state.type === null || s.type === state.type).length;
  const range = data ? (data.legend[metric] ?? data.legend.count) : null;

  const exportExcel = async () => {
    if (exportingRef.current || !data || slotCount === 0) return;
    exportingRef.current = true;
    setExporting(true);
    const scope = scopeText(floor.name, state.period);
    const fileName = exportFileName(floor.name, state.period);
    setToast({ open: true, done: false, description: `${slotCount} ช่องจอด · ${scope}` });
    try {
      const info = await exportHeatMapInfo();
      if (!info) {
        setToast((t) => ({ ...t, open: false }));
        return;
      }
      await downloadHeatMapXlsx(exportRows(floor, state.period, state.type), fileName);
      audit({
        actor: info.actor,
        role: info.role,
        ip: info.ip,
        device: info.device,
        action: "ส่งออก",
        page: "Parking Heat Map",
        detail: `ส่งออก Excel · ${scope} (${slotCount} ช่องจอด)`,
        title: "ส่งออก Heat Map เป็น Excel",
        target: `${building.name} · ${scope}`,
        extras: [
          { label: "จำนวน", value: `${slotCount} ช่องจอด` },
          { label: "ไฟล์", value: fileName },
        ],
        result: "",
      });
      setToast({ open: true, done: true, description: fileName });
    } catch {
      setToast((t) => ({ ...t, open: false }));
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-bold text-fg">Parking Heat Map</h1>
          <p className="text-body text-fg-2">ช่องไหนถูกใช้บ่อยแค่ไหน คำนวณจากประวัติการจอดจริง</p>
        </div>
        {/* aria-disabled while busy (not `disabled`) so a keyboard user keeps focus; exportExcel ignores the click. */}
        <Button
          variant="secondary"
          icon={exporting ? undefined : Download}
          disabled={!data}
          aria-busy={exporting}
          aria-disabled={exporting || undefined}
          onClick={exportExcel}
          className="ml-auto"
        >
          {exporting && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden />}
          Export Excel
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <HeatSelect
            aria-label="อาคาร"
            className="w-32"
            options={buildings.map((b) => ({ id: b.id, label: b.name }))}
            selected={building.id}
            onSelect={(id) => {
              const next = buildingOf(id);
              change({ buildingId: next.id, floorName: floorOf(next, undefined).name, type: null, slot: null });
            }}
          />
          <HeatSelect
            aria-label="ชั้น"
            className="w-27"
            options={floors.map((f) => ({ id: f.name, label: `ชั้น ${f.name}` }))}
            selected={floor.name}
            onSelect={(name) => change({ floorName: name, type: null, slot: null })}
          />
          <SegmentedControl
            aria-label="ช่วงเวลา"
            options={PERIOD_OPTIONS.map(({ value, label }) => ({ value, label }))}
            value={state.period}
            onChange={(period) => change({ period })}
          />
          <SegmentedControl
            aria-label="ค่าที่ใช้ระบายสี"
            options={metricOptionsFor(state.period).map(({ value, label }) => ({ value, label }))}
            value={metric}
            onChange={(next) => change({ metric: next })}
          />
          <HeatSelect
            aria-label="ประเภทช่อง"
            className="w-42"
            options={typeOptions}
            selected={state.type ?? ALL_TYPES}
            onSelect={(id) => change({ type: id === ALL_TYPES ? null : id })}
          />
        </div>

        <div className="flex flex-col gap-6 border-t border-line bg-canvas px-5 pt-5 pb-10">
          {data && range ? (
            <>
              <div className="flex items-center gap-3">
                <p className="text-body font-semibold text-fg-2">{data.header}</p>
                <div className="ml-auto flex items-center gap-2 text-label text-fg-3 tabular-nums">
                  <span>{formatMetric(metric, range.min)}</span>
                  <span className="flex gap-0.5" aria-hidden>
                    {SWATCH.map((c) => (
                      <span key={c} className={cn("h-3 w-5 rounded-xs", c)} />
                    ))}
                  </span>
                  <span>{formatMetric(metric, range.max)}</span>
                </div>
              </div>
              <HeatMapCanvas
                floor={floor}
                period={state.period}
                data={data}
                metric={metric}
                type={state.type}
                selectedId={slotId}
                onSelect={(id) => change({ slot: id })}
              />
            </>
          ) : (
            <p className="py-16 text-center text-body text-fg-3">ชั้นนี้ยังไม่มีช่องจอด</p>
          )}
        </div>
      </section>

      {data && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SlotDetailCard floor={floor} period={state.period} metric={metric} type={state.type} slotId={slotId} />
          <MostUsedCard period={state.period} metric={metric} type={state.type} />
          <LeastUsedCard period={state.period} metric={metric} type={state.type} />
        </div>
      )}

      <Toast
        open={toast.open}
        placement="top-right"
        icon={toast.done ? CircleCheck : Download}
        iconClassName={toast.done ? "text-success" : "text-primary"}
        title={toast.done ? "สร้างไฟล์ Excel แล้ว" : "กำลังสร้างไฟล์ Excel"}
        description={toast.description}
        duration={exporting ? 60000 : undefined}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
