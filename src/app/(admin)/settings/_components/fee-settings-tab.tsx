"use client";

import {
  CheckCircle2,
  CarFront,
  Clock3,
  Gift,
  RotateCw,
  Wallet,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { audit } from "@/db/audit/audit";
import {
  calculateParkingCharge,
  isSettings,
  setSettings,
  useSettings,
} from "@/db/settings/settings";
import { useSlotTypes } from "@/db/slot-types/slot-types-store";
import { cn } from "@/utils/cn";

type FeeDraft = {
  pricePerHour: string;
  freeParkingHours: string;
  exitGraceMinutes: string;
  recalcOvertime: boolean;
  typeRates: Record<string, string>;
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function addMinutes(value: string, minutes: number): string {
  const [hour, minute] = value.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function FeeSettingsTab({
  actor,
  role,
  onSaved,
}: {
  actor: string;
  role: "Superadmin" | "Admin";
  onSaved: () => void;
}) {
  const settings = useSettings();
  const slotTypes = useSlotTypes();
  const [draft, setDraft] = useState<FeeDraft | null>(null);
  const [error, setError] = useState("");

  const initialTypeRates = Object.fromEntries(
    slotTypes.map(({ id }) => [
      id,
      settings.pricePerHourBySlotType[id] === undefined
        ? ""
        : String(settings.pricePerHourBySlotType[id]),
    ]),
  );
  const typeRates = draft?.typeRates ?? initialTypeRates;
  const pricePerHour = draft?.pricePerHour ?? String(settings.pricePerHour);
  const freeParkingHours = draft?.freeParkingHours ?? String(settings.freeParkingHours);
  const exitGraceMinutes = draft?.exitGraceMinutes ?? String(settings.exitGraceMinutes);
  const recalcOvertime = draft?.recalcOvertime ?? settings.recalcOvertime;

  function updateDraft<Key extends keyof FeeDraft>(key: Key, value: FeeDraft[Key]) {
    setDraft((current) => ({
      pricePerHour: current?.pricePerHour ?? String(settings.pricePerHour),
      freeParkingHours: current?.freeParkingHours ?? String(settings.freeParkingHours),
      exitGraceMinutes: current?.exitGraceMinutes ?? String(settings.exitGraceMinutes),
      recalcOvertime: current?.recalcOvertime ?? settings.recalcOvertime,
      typeRates: current?.typeRates ?? initialTypeRates,
      ...current,
      [key]: value,
    }));
  }

  function updateTypeRate(id: string, value: string) {
    setDraft((current) => ({
      pricePerHour: current?.pricePerHour ?? String(settings.pricePerHour),
      freeParkingHours: current?.freeParkingHours ?? String(settings.freeParkingHours),
      exitGraceMinutes: current?.exitGraceMinutes ?? String(settings.exitGraceMinutes),
      recalcOvertime: current?.recalcOvertime ?? settings.recalcOvertime,
      typeRates: { ...(current?.typeRates ?? initialTypeRates), [id]: value },
    }));
  }

  const price = Number(pricePerHour);
  const freeHours = Number(freeParkingHours);
  const graceMinutes = Number(exitGraceMinutes);
  const changed =
    pricePerHour !== String(settings.pricePerHour) ||
    freeParkingHours !== String(settings.freeParkingHours) ||
    exitGraceMinutes !== String(settings.exitGraceMinutes) ||
    recalcOvertime !== settings.recalcOvertime ||
    slotTypes.some(
      ({ id }) =>
        (typeRates[id] ?? "") !==
        (settings.pricePerHourBySlotType[id] === undefined
          ? ""
          : String(settings.pricePerHourBySlotType[id])),
    );
  const example = calculateParkingCharge(180, price, freeHours);
  const validPrice =
    Number.isFinite(price) &&
    price > 0 &&
    Math.abs(Math.round(price * 100) - price * 100) < 1e-9;
  const validFreeHours = Number.isSafeInteger(freeHours) && freeHours >= 0;
  const validGrace = Number.isSafeInteger(graceMinutes) && graceMinutes > 0;
  const validTypeRates = slotTypes.every(({ id }) => {
    const value = typeRates[id] ?? "";
    if (value === "") return true;
    const rate = Number(value);
    return (
      Number.isFinite(rate) &&
      rate > 0 &&
      Math.abs(Math.round(rate * 100) - rate * 100) < 1e-9
    );
  });

  function cancel() {
    setDraft(null);
    setError("");
  }

  function save() {
    if (!validPrice || !validFreeHours || !validGrace || !validTypeRates) {
      setError("ตรวจสอบข้อมูลอีกครั้ง: ราคาและอัตราแยกตามประเภทต้องมากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม · ชั่วโมงฟรีต้องเป็นจำนวนเต็มตั้งแต่ 0 · เวลาออกต้องเป็นจำนวนนาทีมากกว่า 0");
      return;
    }

    const activeTypeIds = new Set(slotTypes.map(({ id }) => id));
    const pricePerHourBySlotType = Object.fromEntries(
      Object.entries(settings.pricePerHourBySlotType).filter(([id]) =>
        activeTypeIds.has(id),
      ),
    );
    slotTypes.forEach(({ id }) => {
      const value = typeRates[id] ?? "";
      if (value === "") {
        delete pricePerHourBySlotType[id];
      } else {
        pricePerHourBySlotType[id] = Number(value);
      }
    });

    const next = {
      ...settings,
      pricePerHour: price,
      pricePerHourBySlotType,
      freeParkingHours: freeHours,
      exitGraceMinutes: graceMinutes,
      recalcOvertime,
    };
    if (!isSettings(next)) {
      setError("ข้อมูลค่าจอดไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    const changes = [
      ...(settings.pricePerHour !== price
        ? [{ field: "ราคาต่อชั่วโมง (ค่าตั้งต้น)", before: `${formatMoney(settings.pricePerHour)} บาท`, after: `${formatMoney(price)} บาท` }]
        : []),
      ...slotTypes.flatMap(({ id, name }) => {
        const before = settings.pricePerHourBySlotType[id];
        const after = pricePerHourBySlotType[id];
        return before === after
          ? []
          : [{
              field: `ราคาต่อชั่วโมง · ${name}`,
              before: before === undefined
                ? `ใช้ค่าตั้งต้น ${formatMoney(settings.pricePerHour)} บาท`
                : `${formatMoney(before)} บาท`,
              after: after === undefined
                ? `ใช้ค่าตั้งต้น ${formatMoney(price)} บาท`
                : `${formatMoney(after)} บาท`,
            }];
      }),
      ...(settings.freeParkingHours !== freeHours
        ? [{ field: "ชั่วโมงที่จอดฟรี", before: `${settings.freeParkingHours} ชั่วโมง`, after: `${freeHours} ชั่วโมง` }]
        : []),
      ...(settings.exitGraceMinutes !== graceMinutes
        ? [{ field: "เวลาออกหลังชำระ", before: `${settings.exitGraceMinutes} นาที`, after: `${graceMinutes} นาที` }]
        : []),
      ...(settings.recalcOvertime !== recalcOvertime
        ? [{ field: "คิดค่าจอดใหม่เมื่อออกเกินเวลา", before: settings.recalcOvertime ? "เปิด" : "ปิด", after: recalcOvertime ? "เปิด" : "ปิด" }]
        : []),
    ];

    setSettings(next);
    audit({
      ip: "127.0.0.1",
      actor,
      role,
      action: "แก้ไข",
      page: "System Settings",
      detail: "แก้ไขค่าจอดและการชำระเงิน",
      target: "System Settings · ค่าจอดและการชำระเงิน",
      device: "Admin Web",
      result: "สำเร็จ",
      title: "แก้ไขค่าจอดและการชำระเงิน",
      changes,
    });
    setDraft(null);
    setError("");
    onSaved();
  }

  const paidAt = "14:00";
  const graceDeadline = addMinutes(paidAt, graceMinutes);
  const lateAt = addMinutes(paidAt, graceMinutes + 1);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-h3 font-semibold text-fg">ค่าจอดและการชำระเงิน</h2>
          <p className="mt-1 text-label text-fg-3">
            ใช้กำหนดค่าจอดและสร้าง PromptPay QR ให้ผู้ใช้สแกนจ่าย
          </p>
        </header>

        <div className="divide-y divide-line px-5">
          <SettingRow icon={Wallet} title="ราคาต่อชั่วโมง (ค่าตั้งต้น)" required>
            <p className="text-label text-fg-3">
              ใช้กับทุกประเภทที่ไม่ได้กำหนดราคาแยก
            </p>
            <div className="flex items-center">
              <Input
                aria-label="ราคาต่อชั่วโมง"
                className="max-w-40 rounded-r-none"
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerHour}
                onChange={(event) => updateDraft("pricePerHour", event.target.value)}
                error={!validPrice}
              />
              <span className="flex h-9 items-center rounded-r-md border border-l-0 border-line bg-subtle px-3 text-control text-fg-2">
                บาท / ชั่วโมง
              </span>
            </div>
            <p className="text-label text-fg-3">ตั้งแต่จำนวนเต็มหรือทศนิยม 2 ตำแหน่ง · ต้องมากกว่า 0</p>
          </SettingRow>

          <SettingRow icon={CarFront} title="ค่าจอดแยกตามประเภทช่อง">
            <p className="text-label text-fg-3">
              เว้นว่างเพื่อใช้ราคาตั้งต้น · กำหนดได้เป็นรายประเภท
            </p>
            <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {slotTypes.map(({ id, name }) => {
                const value = typeRates[id] ?? "";
                const rate = Number(value);
                const valid =
                  value === "" ||
                  (Number.isFinite(rate) &&
                    rate > 0 &&
                    Math.abs(Math.round(rate * 100) - rate * 100) < 1e-9);
                return (
                  <div
                    key={id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(9rem,auto)] items-center gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-fg">{name}</p>
                      <p className="text-label text-fg-3">
                        ค่าตั้งต้น ฿{formatMoney(price)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Input
                        aria-label={`ราคาต่อชั่วโมง ${name}`}
                        className="w-24 rounded-r-none"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={value}
                        placeholder={String(price)}
                        onChange={(event) => updateTypeRate(id, event.target.value)}
                        error={!valid}
                      />
                      <span className="flex h-9 items-center rounded-r-md border border-l-0 border-line bg-subtle px-2 text-label text-fg-2">
                        บาท/ชม.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SettingRow>

          <SettingRow icon={Gift} title="จำนวนชั่วโมงที่จอดฟรี">
            <p className="text-label text-fg-3">
              ฟรีตามจำนวนชั่วโมงแรกของการจอดแต่ละครั้ง หลังจากนั้นคิดค่าจอดตามชั่วโมงที่เกิน
            </p>
            <div className="flex items-center">
              <Input
                aria-label="จำนวนชั่วโมงที่จอดฟรี"
                className="max-w-40 rounded-r-none"
                type="number"
                min="0"
                step="1"
                value={freeParkingHours}
                onChange={(event) => updateDraft("freeParkingHours", event.target.value)}
                error={!validFreeHours}
              />
              <span className="flex h-9 items-center rounded-r-md border border-l-0 border-line bg-subtle px-3 text-control text-fg-2">
                ชั่วโมง
              </span>
            </div>
            <p className="text-label text-fg-3">
              0 = ไม่มีชั่วโมงฟรี · เริ่มนับใหม่เมื่อรถเข้าจอดครั้งใหม่ ไม่เริ่มใหม่หลังชำระ
            </p>
          </SettingRow>

          <SettingRow icon={Clock3} title="เวลาออกจากที่จอดหลังชำระเงิน" required>
            <p className="text-label text-fg-3">
              หลังสแกนจ่าย QR แล้ว ผู้ใช้ต้องออกจากที่จอดภายในเวลานี้ หากเกินเวลา ประตูจะไม่เปิดจนกว่าจะชำระส่วนที่เกิน
            </p>
            <div className="flex items-center">
              <Input
                aria-label="เวลาออกหลังชำระ"
                className="max-w-40 rounded-r-none"
                type="number"
                min="1"
                step="1"
                value={exitGraceMinutes}
                onChange={(event) => updateDraft("exitGraceMinutes", event.target.value)}
                error={!validGrace}
              />
              <span className="flex h-9 items-center rounded-r-md border border-l-0 border-line bg-subtle px-3 text-control text-fg-2">
                นาที
              </span>
            </div>
            <p className="text-label text-fg-3">จำนวนเต็มเท่านั้น · ต้องมากกว่า 0</p>
          </SettingRow>

          <div className="flex items-start gap-3 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <RotateCw size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-fg">คิดค่าจอดใหม่เมื่อออกเกินเวลา</p>
              <p className="mt-1 text-label text-fg-2">
                เกินเวลาออกแล้วให้คิดค่าจอดใหม่ นับจากเวลาที่ชำระครั้งล่าสุดจนถึงเวลาออกจริง ตามราคาต่อชั่วโมง แล้วสร้าง QR ให้ชำระส่วนที่เกิน
              </p>
              <p className="mt-1 text-label text-fg-3">ปิดไว้ = เกินเวลาแล้วออกได้โดยไม่คิดเงินเพิ่ม</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={recalcOvertime}
              aria-label="คิดค่าจอดใหม่เมื่อออกเกินเวลา"
              onClick={() => updateDraft("recalcOvertime", !recalcOvertime)}
              className={cn(
                "relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors",
                recalcOvertime ? "bg-primary" : "bg-line-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                  recalcOvertime ? "left-5.5" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-label text-fg-3">บันทึกการเปลี่ยนแปลงลง Audit Logs</p>
            {error && <p role="alert" className="mt-1 max-w-140 text-label text-danger">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={cancel} disabled={!changed}>ยกเลิก</Button>
            <Button onClick={save} disabled={!changed}>บันทึก</Button>
          </div>
        </footer>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-5 py-4">
          <h2 className="text-h3 font-semibold text-fg">ตัวอย่างจากค่าที่ตั้งไว้</h2>
        </header>
        <div className="flex flex-col gap-5 p-5">
          <div className="rounded-xl bg-subtle p-4">
            <p className="text-label text-fg-3">ตัวอย่างจากราคาตั้งต้น</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-control font-medium text-fg">
                จอด 3 ชั่วโมง · ฟรี {validFreeHours ? freeHours : 0} ชั่วโมง
              </p>
              <p className="text-h2 font-bold tabular-nums text-primary">
                {validPrice && validFreeHours ? formatMoney(example.amount) : "—"} บาท
              </p>
            </div>
            <p className="mt-2 text-label text-fg-3">
              {validPrice && validFreeHours
                ? example.billedHours > 0
                  ? `คิด ${example.billedHours} ชม. × ${formatMoney(price)} บาท`
                  : "อยู่ในช่วงเวลาจอดฟรี"
                : "กรอกค่าจอดให้ถูกต้องเพื่อดูตัวอย่าง"}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-label font-medium text-fg-3">ช่วงเวลาออกจากที่จอด</p>
            <TimelineItem icon={CheckCircle2} tone="success">
              <p className="text-control font-semibold text-fg">
                {paidAt} · สแกนจ่าย QR สำเร็จ
              </p>
              <p className="text-label text-fg-2">เริ่มนับเวลาออก {graceMinutes || 0} นาที</p>
            </TimelineItem>
            <TimelineItem icon={CheckCircle2} tone="primary">
              <p className="text-control font-semibold text-fg">
                ≤ {graceDeadline} · ออกได้ปกติ
              </p>
              <p className="text-label text-fg-2">ประตูเปิดให้ออก</p>
            </TimelineItem>
            <TimelineItem icon={recalcOvertime ? TriangleAlert : CheckCircle2} tone={recalcOvertime ? "warning" : "success"}>
              <p className="text-control font-semibold text-fg">
                {lateAt} · {recalcOvertime ? "เกินเวลา ต้องชำระเพิ่ม" : "ออกได้"}
              </p>
              <p className="text-label text-fg-2">
                {recalcOvertime
                  ? `คิดใหม่จากเวลาที่ชำระ ${paidAt} ตามอัตรา ${formatMoney(validPrice ? price : 0)} บาท/ชั่วโมง`
                  : "ไม่มีค่าจอดเพิ่ม"}
              </p>
            </TimelineItem>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  required = false,
  children,
}: {
  icon: typeof Wallet;
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon size={20} aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-body font-semibold text-fg">
          {title}{required && <span className="text-danger"> *</span>}
        </h3>
        {children}
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof CheckCircle2;
  tone: "success" | "primary" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-success-soft text-success",
    primary: "bg-primary-soft text-primary",
    warning: "bg-warning-soft text-warning",
  };
  return (
    <div className="flex items-start gap-3">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tones[tone])}>
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
