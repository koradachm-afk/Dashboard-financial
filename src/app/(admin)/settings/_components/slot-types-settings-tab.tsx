"use client";

import {
  Accessibility,
  Bike,
  CarFront,
  Crown,
  Info,
  Pencil,
  Plus,
  SquareParking,
  Trash2,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { createElement, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/tailgrids/core/dialog";
import { Button } from "@/components/tailgrids/core/button";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { Input } from "@/components/tailgrids/core/input";
import { audit } from "@/db/audit/audit";
import { getFloors } from "@/db/floors/floors";
import {
  addSlotType,
  deleteSlotType,
  updateSlotType,
  useSlotTypes,
} from "@/db/slot-types/slot-types-store";
import type { SlotType } from "@/db/slot-types/slot-types";
import { cn } from "@/utils/cn";

const ICONS: readonly { id: string; icon: LucideIcon; label: string }[] = [
  { id: "car", icon: CarFront, label: "รถยนต์ทั่วไป" },
  { id: "zap", icon: Zap, label: "EV" },
  { id: "accessibility", icon: Accessibility, label: "ผู้พิการ" },
  { id: "crown", icon: Crown, label: "VIP" },
  { id: "truck", icon: Truck, label: "รถตู้ / รถใหญ่" },
  { id: "bike", icon: Bike, label: "มอเตอร์ไซค์" },
  { id: "parking", icon: SquareParking, label: "ที่จอดรถ" },
];

const COLORS = [
  { id: "type-general", label: "เทา", dot: "bg-type-general", text: "text-type-general" },
  { id: "type-ev", label: "ฟ้า", dot: "bg-type-ev", text: "text-type-ev" },
  { id: "type-accessible", label: "ม่วง", dot: "bg-type-accessible", text: "text-type-accessible" },
  { id: "type-vip", label: "ส้ม", dot: "bg-type-vip", text: "text-type-vip" },
  { id: "success", label: "เขียว", dot: "bg-success", text: "text-success" },
  { id: "danger", label: "แดง", dot: "bg-danger", text: "text-danger" },
  { id: "warning", label: "น้ำตาลส้ม", dot: "bg-warning", text: "text-warning" },
  { id: "primary", label: "น้ำเงิน", dot: "bg-primary", text: "text-primary" },
] as const;

type SlotTypeDraft = {
  name: string;
  icon: string;
  color: string;
  width: string;
  length: string;
  isDefault: boolean;
};

const EMPTY_DRAFT: SlotTypeDraft = {
  name: "",
  icon: "car",
  color: "type-general",
  width: "2.5",
  length: "5.0",
  isDefault: false,
};

function getIcon(id: string): LucideIcon {
  return ICONS.find((item) => item.id === id)?.icon ?? SquareParking;
}

function getUsageCounts(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  getFloors().forEach((building) =>
    building.floors.forEach((floor) =>
      floor.slots.forEach((slot) =>
        counts.set(slot.type, (counts.get(slot.type) ?? 0) + 1),
      ),
    ),
  );
  return counts;
}

function typeToDraft(slotType: SlotType): SlotTypeDraft {
  return {
    name: slotType.name,
    icon: slotType.icon,
    color: slotType.color,
    width: String(slotType.width),
    length: String(slotType.length),
    isDefault: slotType.isDefault,
  };
}

function SlotTypeForm({
  draft,
  onChange,
  error,
}: {
  draft: SlotTypeDraft;
  onChange: (draft: SlotTypeDraft) => void;
  error: string;
}) {
  const color = COLORS.find((item) => item.id === draft.color) ?? COLORS[0];
  return (
    <div className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-body font-medium text-fg">
        ชื่อประเภท <span className="text-danger">*</span>
        <Input
          aria-label="ชื่อประเภท"
          value={draft.name}
          maxLength={32}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="เช่น รถบรรทุก"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-body font-medium text-fg">ไอคอน <span className="text-danger">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(({ id, icon: OptionIcon, label }) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={draft.icon === id}
              onClick={() => onChange({ ...draft, icon: id })}
              className={cn(
                "grid size-9 place-items-center rounded-lg border",
                draft.icon === id ? "border-primary bg-primary-soft text-primary" : "border-line text-fg-2",
              )}
            >
              <OptionIcon size={18} aria-hidden />
            </button>
          ))}
        </div>
        <p className="text-nano text-fg-3">เลือกจากไอคอน lucide</p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-body font-medium text-fg">สีไอคอน <span className="text-danger">*</span></legend>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={`สี${item.label}`}
              aria-pressed={draft.color === item.id}
              onClick={() => onChange({ ...draft, color: item.id })}
              className={cn(
                "grid size-7 place-items-center rounded-full",
                draft.color === item.id && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
              )}
            >
              <span className={cn("size-5 rounded-full", item.dot)} />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-body font-medium text-fg">
        ขนาดตั้งต้น (กว้าง × ยาว) <span className="text-danger">*</span>
        <div className="flex min-w-0 items-center gap-2">
          <Input
            aria-label="ความกว้างตั้งต้น"
            type="number"
            min="0.1"
            step="0.1"
            value={draft.width}
            onChange={(event) => onChange({ ...draft, width: event.target.value })}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-fg-3">×</span>
          <Input
            aria-label="ความยาวตั้งต้น"
            type="number"
            min="0.1"
            step="0.1"
            value={draft.length}
            onChange={(event) => onChange({ ...draft, length: event.target.value })}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 whitespace-nowrap text-label text-fg-3">เมตร</span>
        </div>
        <span className="text-label font-normal text-fg-3">ใช้กับช่องที่สร้างใหม่ ขนาดเปลี่ยนแปลงภายหลังได้</span>
      </label>

      <div className="flex flex-col gap-1.5">
        <Checkbox
          isSelected={draft.isDefault}
          onChange={(isDefault) => onChange({ ...draft, isDefault })}
        >
          ล็อกประเภทนี้ ไม่ให้ลบ
        </Checkbox>
        <p className="pl-6 text-label text-fg-3">
          ตั้งค่าได้ตามแต่ละสาขา · ประเภทที่มีช่องจอดใช้อยู่ยังลบไม่ได้
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-primary-soft px-3 py-2.5 text-label text-fg-2">
        <Info size={16} className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          ตัวอย่างบนผัง
          <span className="ml-2 inline-flex items-center gap-1 rounded border border-success bg-success-soft px-2 py-1">
            {createElement(getIcon(draft.icon), { size: 14, className: color.text, "aria-hidden": true })}
            <span className="text-fg">{draft.name || "ประเภทรถ"}</span>
          </span>
        </span>
        <span className="text-label tabular-nums text-fg-3">{draft.width || "0"} × {draft.length || "0"} ม.</span>
      </div>
      {error && <p role="alert" className="text-label text-danger">{error}</p>}
    </div>
  );
}

export function SlotTypesSettingsTab({
  actor,
  role,
  onSaved,
}: {
  actor: string;
  role: "Superadmin" | "Admin";
  onSaved: (message: string) => void;
}) {
  const types = useSlotTypes();
  const usageCounts = useMemo(() => getUsageCounts(), []);
  const [editing, setEditing] = useState<SlotType | null>(null);
  const [draft, setDraft] = useState<SlotTypeDraft>(EMPTY_DRAFT);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SlotType | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function openAdd() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setError("");
    setFormOpen(true);
  }

  function openEdit(slotType: SlotType) {
    setEditing(slotType);
    setDraft(typeToDraft(slotType));
    setError("");
    setFormOpen(true);
  }

  function saveType() {
    const name = draft.name.trim();
    const width = Number(draft.width);
    const length = Number(draft.length);
    if (!name || !Number.isFinite(width) || width <= 0 || !Number.isFinite(length) || length <= 0) {
      setError("กรุณากรอกชื่อประเภทและขนาดตั้งต้นให้ถูกต้อง");
      return;
    }

    const values = {
      name,
      icon: draft.icon,
      color: draft.color,
      width,
      length,
      isDefault: draft.isDefault,
    };
    const duplicate = types.some(
      (item) => item.id !== editing?.id && item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (duplicate) {
      setError("มีชื่อประเภทนี้แล้ว กรุณาใช้ชื่ออื่น");
      return;
    }

    if (editing) {
      updateSlotType(editing.id, values);
      audit({
        ip: "127.0.0.1",
        actor,
        role,
        action: "แก้ไข",
        page: "System Settings",
        detail: `แก้ไขประเภทช่องจอด ${editing.name}`,
        target: `System Settings · ประเภทช่องจอด · ${editing.id}`,
        device: "Admin Web",
        result: "สำเร็จ",
        title: "แก้ไขประเภทช่องจอด",
        changes: [
          ...(editing.name !== name ? [{ field: "ชื่อประเภท", before: editing.name, after: name }] : []),
          ...(editing.icon !== draft.icon ? [{ field: "ไอคอน", before: editing.icon, after: draft.icon }] : []),
          ...(editing.color !== draft.color ? [{ field: "สี", before: editing.color, after: draft.color }] : []),
          ...(editing.width !== width ? [{ field: "ความกว้าง", before: `${editing.width} ม.`, after: `${width} ม.` }] : []),
          ...(editing.length !== length ? [{ field: "ความยาว", before: `${editing.length} ม.`, after: `${length} ม.` }] : []),
          ...(editing.isDefault !== draft.isDefault
            ? [{
                field: "ล็อกไม่ให้ลบ",
                before: editing.isDefault ? "เปิด" : "ปิด",
                after: draft.isDefault ? "เปิด" : "ปิด",
              }]
            : []),
        ],
      });
      onSaved("บันทึกการแก้ไขประเภทช่องจอดแล้ว");
    } else {
      const created = addSlotType(values);
      audit({
        ip: "127.0.0.1",
        actor,
        role,
        action: "สร้าง",
        page: "System Settings",
        detail: `เพิ่มประเภทช่องจอด ${created.name}`,
        target: `System Settings · ประเภทช่องจอด · ${created.id}`,
        device: "Admin Web",
        result: "สำเร็จ",
        title: "เพิ่มประเภทช่องจอดแล้ว",
      });
      onSaved("เพิ่มประเภทช่องจอดแล้ว");
    }

    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    deleteSlotType(removed.id);
    audit({
      ip: "127.0.0.1",
      actor,
      role,
      action: "ลบ",
      page: "System Settings",
      detail: `ลบประเภทช่องจอด ${removed.name}`,
      target: `System Settings · ประเภทช่องจอด · ${removed.id}`,
      device: "Admin Web",
      result: "สำเร็จ",
      title: "ลบประเภทช่องจอดแล้ว",
    });
    setDeleteTarget(null);
    onSaved("ลบประเภทช่องจอดแล้ว");
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-h3 font-semibold text-fg">ประเภทช่องจอด</h2>
            <p className="mt-1 text-label text-fg-3">ใช้เลือกความกว้างช่องจอดในหน้า Parking Layout</p>
          </div>
          <Button size="sm" icon={Plus} onClick={openAdd}>เพิ่มประเภท</Button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 border-collapse text-left">
            <thead>
              <tr className="bg-subtle text-label font-medium text-fg-3">
                <th scope="col" className="px-5 py-3">ประเภท</th>
                <th scope="col" className="px-5 py-3">ขนาดตั้งต้น</th>
                <th scope="col" className="px-5 py-3">ช่องที่ใช้อยู่</th>
                <th scope="col" className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {types.map((slotType) => {
                const color = COLORS.find((item) => item.id === slotType.color) ?? COLORS[0];
                const usage = usageCounts.get(slotType.id) ?? 0;
                const cannotDelete = slotType.isDefault || usage > 0;
                const deleteReason = [
                  slotType.isDefault ? "ปิดตัวเลือกล็อกการลบก่อน" : "",
                  usage > 0 ? `ยังมีช่องจอดใช้งาน ${usage} ช่อง` : "",
                ].filter(Boolean).join(" · ");
                return (
                  <tr key={slotType.id} className="border-t border-line text-body text-fg">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-lg bg-subtle">
                          {createElement(getIcon(slotType.icon), { size: 18, className: color.text, "aria-hidden": true })}
                        </span>
                        <span className="font-medium">{slotType.name}</span>
                        {slotType.isDefault && (
                          <span className="rounded-full bg-subtle px-2 py-0.5 text-label text-fg-3">ล็อกไม่ให้ลบ</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{slotType.width.toFixed(1)} × {slotType.length.toFixed(1)} ม.</td>
                    <td className="px-5 py-3">
                      {usage > 0 ? (
                        <>
                          <span>{usage} ช่อง</span>
                          <span className="mt-1 block text-label text-fg-3">ต้องเปลี่ยนประเภทช่องเหล่านี้ก่อนลบ</span>
                        </>
                      ) : (
                        <span className="text-fg-3">ยังไม่มีช่องที่ใช้</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          aria-label={`แก้ไข ${slotType.name}`}
                          onClick={() => openEdit(slotType)}
                          className="size-8 p-0"
                        />
                        <span title={cannotDelete ? deleteReason : undefined}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            aria-label={`ลบ ${slotType.name}`}
                            disabled={cannotDelete}
                            onClick={() => setDeleteTarget(slotType)}
                            className={cn("size-8 p-0", cannotDelete && "cursor-not-allowed text-fg-3")}
                          />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className="flex items-start gap-2 border-t border-line bg-subtle px-5 py-3 text-label text-fg-3">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          ตั้งค่าล็อกการลบได้ในหน้าจัดการประเภท · ประเภทที่มีช่องจอดใช้อยู่ลบไม่ได้
        </footer>
      </section>

      <ConfirmDialog
        isOpen={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditing(null);
            setError("");
          }
        }}
        icon={SquareParking}
        title={editing ? "แก้ไขประเภทช่องจอด" : "เพิ่มประเภทช่องจอด"}
        description={editing
          ? `${editing.name} · ใช้อยู่ ${usageCounts.get(editing.id) ?? 0} ช่อง`
          : "ประเภทใหม่ยังไม่มีช่องที่ใช้อยู่"}
        confirmLabel={editing ? "บันทึก" : "เพิ่มประเภท"}
        onConfirm={saveType}
        showCloseButton
        className="w-140 max-h-dvh overflow-y-auto"
      >
        <SlotTypeForm draft={draft} onChange={setDraft} error={error} />
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon={Trash2}
        iconTone="danger"
        title={`ลบประเภท ${deleteTarget?.name ?? ""}?`}
        description="ประเภทนี้จะถูกลบถาวรและไม่สามารถเลือกสร้างช่องจอดได้อีก"
        confirmLabel="ลบประเภท"
        confirmVariant="danger-solid"
        onConfirm={confirmDelete}
        showCloseButton
      />
    </>
  );
}
