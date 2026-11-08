"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  CarFront,
  CheckCircle2,
  Clock3,
  Crown,
  DoorOpen,
  ExternalLink,
  ScanLine,
  SquareParking,
  Zap,
} from "lucide-react";

import { Button } from "@/components/tailgrids/core/button";
import { siteConfig } from "@/config/site";
import { audit } from "@/db/audit/audit";
import { getFloors } from "@/db/floors/floors";
import { recordMockPayment, usePayments } from "@/db/payments/payments-store";
import { getSlotTypes } from "@/db/slot-types/slot-types";
import { useSettings } from "@/db/settings/settings";
import {
  isParked,
  type Session,
} from "@/db/sessions/sessions";
import {
  createSession,
  updateSession,
  useSessions,
} from "@/db/sessions/sessions-store";
import { cn } from "@/utils/cn";

type KioskMode = "entry" | "exit";
type KioskState =
  | "waiting"
  | "reading"
  | "success"
  | "failed"
  | "full"
  | "fee"
  | "paid"
  | "web-paid";

const MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function isKioskState(value: string, mode: KioskMode): value is KioskState {
  const states: readonly KioskState[] =
    mode === "entry"
      ? ["waiting", "reading", "success", "failed", "full"]
      : ["waiting", "reading", "fee", "paid", "web-paid", "failed"];
  return states.includes(value as KioskState);
}

function normalizeState(value: string, mode: KioskMode): KioskState {
  if (value === "success" && mode === "exit") return "paid";
  if (value === "read-failed" || value === "error") return "failed";
  return isKioskState(value, mode) ? value : "waiting";
}

function stamp(date: Date): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
}

function parseStamp(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const [hour, minute] = value.slice(11, 16).split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCameraTimestamp(date: Date): string {
  const two = (value: number) => String(value).padStart(2, "0");
  return `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()} ${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours} ชม. ${remainder} น.` : `${remainder} น.`;
}

function demoNow(session: Session): Date {
  const enteredAt = parseStamp(session.entryAt);
  if (enteredAt.getFullYear() !== 2026 || enteredAt.getMonth() !== 9 || enteredAt.getDate() !== 17) {
    return new Date();
  }
  const fixed = new Date(2026, 9, 17, 21, 55);
  return fixed > enteredAt ? fixed : new Date(enteredAt.getTime() + 60_000);
}

function getExitAmount(
  session: Session,
  payments: ReturnType<typeof usePayments>,
  pricePerHour: number,
  graceMinutes: number,
  recalcOvertime: boolean,
): { amount: number; now: Date; minutes: number } {
  const now = demoNow(session);
  const enteredAt = parseStamp(session.entryAt);
  const minutes = Math.max(1, Math.floor((now.getTime() - enteredAt.getTime()) / 60_000));
  const previousPayment = payments
    .filter((payment) => payment.sessionId === session.id)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];

  if (previousPayment) {
    const paidAt = parseStamp(previousPayment.paidAt);
    const elapsedSincePayment = Math.max(
      0,
      Math.floor((now.getTime() - paidAt.getTime()) / 60_000),
    );
    if (elapsedSincePayment <= graceMinutes) return { amount: 0, now, minutes };
    if (recalcOvertime) {
      return {
        amount: Math.ceil(elapsedSincePayment / 60) * pricePerHour,
        now,
        minutes,
      };
    }
  }

  return {
    amount: session.fee ?? Math.max(1, Math.ceil(minutes / 60)) * pricePerHour,
    now,
    minutes,
  };
}

function CameraScene({
  mode,
  state,
  now,
}: {
  mode: KioskMode;
  state: KioskState;
  now: Date;
}) {
  const entry = mode === "entry";
  const showVehicle = state !== "waiting";
  const isOpen = state === "success" || state === "paid" || state === "web-paid";

  return (
    <div
      role="img"
      aria-label={`ภาพจำลองจากกล้อง ${entry ? "ทางเข้า" : "ทางออก"} ประตู 1`}
      className="relative aspect-video overflow-hidden rounded-xl bg-fg"
    >
      <svg
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="absolute inset-0 size-full"
      >
        <rect width="800" height="450" className="fill-fg" />
        <rect y="245" width="800" height="205" className="fill-map-wall" />
        <polygon points="0,450 235,245 565,245 800,450" className="fill-map-pillar" />
        <path
          d="M400 260v22m0 22v22m0 22v22m0 22v22"
          className="stroke-warning"
          strokeWidth="7"
          strokeDasharray="12 10"
        />
        <path d="M190 420h420" className="stroke-surface" strokeWidth="6" />
        <rect
          x={entry ? 112 : 665}
          y="270"
          width="24"
          height="146"
          rx="3"
          className="fill-surface"
        />
        <rect
          x={entry ? 100 : 650}
          y="345"
          width="48"
          height="64"
          rx="7"
          className="fill-warning"
        />
        <rect
          x={entry ? 130 : 275}
          y="285"
          width={entry ? 370 : 400}
          height="14"
          rx="7"
          className={cn(
            "transition-colors duration-150",
            isOpen ? "fill-success" : "fill-danger",
          )}
        />
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <rect
            key={index}
            x={(entry ? 130 : 275) + index * 64 + 36}
            y="285"
            width="25"
            height="14"
            className="fill-surface"
          />
        ))}
        {showVehicle && (
          <g className="text-line-strong">
            <path
              d="M345 325h110l18 25v29H325v-29z"
              className="fill-line-strong"
            />
            <circle cx="355" cy="381" r="13" className="fill-fg" />
            <circle cx="437" cy="381" r="13" className="fill-fg" />
          </g>
        )}
      </svg>
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-fg px-2.5 py-1 text-caption font-medium text-on-primary">
          <span className="size-2 rounded-full bg-danger" />
          LIVE · CAM-{entry ? "ENTRY" : "EXIT"}-01
        </span>
        <span className="rounded-full bg-fg px-2.5 py-1 text-caption font-medium tabular-nums text-on-primary">
          {formatCameraTimestamp(now)}
        </span>
      </div>
      {state === "reading" && (
        <div className="absolute inset-x-0 top-7 flex justify-center">
          <span className="rounded-lg bg-success px-6 py-2 text-h3 font-bold text-on-primary">
            {entry ? "ENTRANCE · ทางเข้า" : "EXIT · ทางออก"}
          </span>
        </div>
      )}
      {isOpen && (
        <div className="absolute inset-x-0 top-7 flex justify-center">
          <span className="rounded-lg bg-success px-6 py-2 text-h3 font-bold text-on-primary">
            {entry ? "บันทึกเวลาเข้าแล้ว" : "ไม้กั้นเปิด"}
          </span>
        </div>
      )}
      {!isOpen && state !== "reading" && (
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 rounded-full bg-fg px-3 py-1 text-caption font-medium text-on-primary">
          รถจอดอยู่ที่เส้นหยุด
        </div>
      )}
      {state === "failed" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-danger px-3 py-1 text-caption font-medium text-on-primary">
          อ่านป้ายทะเบียนไม่สำเร็จ
        </div>
      )}
    </div>
  );
}

function QrPattern({ reference }: { reference: string }) {
  const size = 29;
  const cells = useMemo(() => {
    const points: [number, number][] = [];
    const finder = (x: number, y: number, left: number, top: number) => {
      const dx = x - left;
      const dy = y - top;
      return (
        dx >= 0 &&
        dx < 7 &&
        dy >= 0 &&
        dy < 7 &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
      );
    };
    const seed = Array.from(reference).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const reserved =
          (x < 8 && y < 8) ||
          (x >= size - 8 && y < 8) ||
          (x < 8 && y >= size - 8);
        const mark =
          finder(x, y, 0, 0) ||
          finder(x, y, size - 7, 0) ||
          finder(x, y, 0, size - 7);
        if (mark || (!reserved && (x * 17 + y * 31 + seed * 7 + x * y * 3) % 11 < 5)) {
          points.push([x, y]);
        }
      }
    }
    return points;
  }, [reference]);

  return (
    <svg
      role="img"
      aria-label="QR PromptPay จำลอง ไม่สามารถใช้ชำระเงินจริง"
      viewBox={`0 0 ${size} ${size}`}
      className="aspect-square w-full text-fg"
    >
      <rect width={size} height={size} className="fill-white" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  );
}

function PlatePreview({
  mode,
  state,
  session,
  entryAt,
  exitAt,
  amount,
  duration,
  pricePerHour,
}: {
  mode: KioskMode;
  state: KioskState;
  session: Session | null;
  entryAt: string;
  exitAt: string;
  amount: number;
  duration: string;
  pricePerHour: number;
}) {
  const waiting = state === "waiting";
  const failed = state === "failed";
  const success = state === "success" || state === "paid" || state === "web-paid";
  const title = waiting
    ? "รอรถเข้าจุดอ่านป้าย"
    : failed
      ? "อ่านป้ายทะเบียนไม่สำเร็จ"
      : state === "reading"
        ? "กำลังอ่านป้ายทะเบียน"
        : mode === "entry"
          ? state === "full"
            ? "ที่จอดเต็ม"
            : "บันทึกเวลาเข้าแล้ว"
          : state === "fee"
            ? "ชำระค่าจอดก่อนออก"
            : state === "web-paid"
              ? "ชำระผ่านเว็บแล้ว"
              : "ชำระเงินสำเร็จ";

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div className="text-caption text-fg-3">ทะเบียนรถ</div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            "grid min-h-22 flex-1 place-items-center rounded-lg border border-dashed",
            waiting
              ? "border-line-strong bg-page text-fg-3"
              : failed
                ? "border-danger bg-danger-soft text-danger"
                : "border-success bg-success-soft text-success",
          )}
        >
          {waiting ? (
            <ScanLine size={26} aria-hidden />
          ) : failed ? (
            <AlertTriangle size={26} aria-hidden />
          ) : (
            <span className="text-h2 font-bold tabular-nums text-fg">
              {session?.plate ?? "ผบ 9370"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-title font-bold text-fg">{title}</h2>
          <p className="mt-1 text-body text-fg-2">
            {waiting
              ? "กรุณาหยุดรถที่เส้นหยุด ระบบจะอ่านป้ายและแสดงค่าจอดอัตโนมัติ"
              : failed
                ? "กรุณาหยุดรถให้ตรงจุดอ่านป้ายทะเบียน"
                : state === "full"
                  ? "ขออภัย ช่องจอดเต็ม ไม้กั้นยังปิดอยู่"
                  : mode === "entry"
                    ? "ระบบบันทึกเวลาเข้าเรียบร้อยแล้ว"
                    : state === "fee"
                      ? "สแกน QR PromptPay เพื่อชำระค่าจอด"
                      : "ระบบยืนยันรายการเรียบร้อยแล้ว"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-line pt-3">
        <div>
          <div className="flex items-center gap-1.5 text-caption text-fg-3">
            <DoorOpen size={14} aria-hidden />
            เวลาเข้า
          </div>
          <p className="mt-1 text-control font-semibold tabular-nums text-fg">
            {waiting || failed ? "—" : entryAt ? formatClock(parseStamp(entryAt)) : "—"}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-caption text-fg-3">
            {mode === "entry" ? <Clock3 size={14} aria-hidden /> : <DoorOpen size={14} aria-hidden />}
            {mode === "entry" ? "อัตราค่าจอด" : "เวลาออก"}
          </div>
          <p className="mt-1 text-control font-semibold tabular-nums text-fg">
            {mode === "entry"
              ? `${formatMoney(pricePerHour)} บาท/ชม.`
              : waiting || failed
                ? "—"
                : exitAt
                  ? formatClock(parseStamp(exitAt))
                  : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-subtle px-4 py-3">
        <span className="flex items-center gap-2 text-body text-fg-2">
          <Clock3 size={18} aria-hidden />
          {mode === "entry" ? "เริ่มนับเวลาจอด" : "เวลาจอดทั้งหมด"}
        </span>
        <span className="text-title font-bold tabular-nums text-fg">
          {waiting || failed ? "—" : mode === "entry" ? "—" : duration}
        </span>
      </div>
      {mode === "exit" && state === "fee" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-3">
          <div className="w-full max-w-52 rounded-lg border border-line p-2.5">
            <div className="mb-2 rounded-md bg-primary px-2 py-1.5 text-center text-caption font-semibold text-on-primary">
              THAI QR PAYMENT · PromptPay
            </div>
            <QrPattern reference={session?.id ?? "kiosk-demo"} />
          </div>
          <p className="text-h2 font-bold tabular-nums text-fg">
            ฿{formatMoney(amount)}
          </p>
          <p className="text-caption text-fg-3">QR จำลองสำหรับทดสอบ ไม่สามารถใช้ชำระเงินจริง</p>
        </div>
      )}
      {mode === "entry" && state === "success" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-3">
          <p className="text-body font-medium text-fg">
            สแกน QR เพื่อค้นหาทะเบียนและชำระค่าจอด
          </p>
          <div className="w-36 rounded-lg border border-line p-2.5">
            <QrPattern reference={session?.id ?? "customer-pay"} />
          </div>
          <p className="text-caption text-fg-3">QR จำลองสำหรับทดสอบ</p>
        </div>
      )}
      {success && mode === "exit" && (
        <div className="flex items-center gap-3 rounded-lg bg-success-soft px-4 py-3 text-success">
          <CheckCircle2 size={22} aria-hidden />
          <span className="text-body font-medium">
            {state === "web-paid" ? "ชำระค่าจอดผ่านเว็บแล้ว" : "ไม้กั้นเปิดได้"}
          </span>
        </div>
      )}
    </section>
  );
}

export function KioskGateView({
  mode,
  initialState,
  initialTime,
  demo,
}: {
  mode: KioskMode;
  initialState: string;
  initialTime: string;
  demo: boolean;
}) {
  const settings = useSettings();
  const sessions = useSessions();
  const payments = usePayments();
  const [clock, setClock] = useState(() => new Date(initialTime));
  const [state, setState] = useState<KioskState>(() => normalizeState(initialState, mode));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [entrySession, setEntrySession] = useState<Session | null>(null);
  const pinnedState = initialState !== "";
  const entry = mode === "entry";

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeSessions = useMemo(
    () =>
      sessions
        .filter(isParked)
        .sort((a, b) => a.entryAt.localeCompare(b.entryAt)),
    [sessions],
  );
  const sampleSession = sessions.find((session) => session.id === "sess_016") ?? null;
  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    (mode === "exit" && state !== "waiting"
      ? sampleSession ?? activeSessions[activeSessions.length - 1] ?? null
      : null);
  const displaySession =
    entrySession ??
    selectedSession ??
    (entry && state !== "waiting"
      ? {
          id: "sess_demo",
          plate: "ผบ 9370",
          province: "กรุงเทพมหานคร",
          vehicleType: "Sedan" as const,
          floor: "b1",
          slot: null,
          entryAt: stamp(clock),
          exitAt: null,
          entryGate: "ประตู 1",
          entryImage: null,
          fee: null,
        }
      : null);

  const exitDetails = displaySession
    ? getExitAmount(
        displaySession,
        payments,
        settings.pricePerHour,
        settings.exitGraceMinutes,
        settings.recalcOvertime,
      )
    : { amount: 0, now: clock, minutes: 0 };
  const floor = getFloors()
    .flatMap((building) => building.floors)
    .find((item) => item.id === "b1");
  const slotTypes = getSlotTypes();
  const freeByType = floor?.slots.reduce<Record<string, number>>((counts, slot) => {
    if (slot.status === "free") counts[slot.type] = (counts[slot.type] ?? 0) + 1;
    return counts;
  }, {}) ?? {};
  const availableSlots = floor?.slots.filter((slot) => slot.status === "free").length ?? 0;
  const totalSlots = floor?.slots.length ?? 0;
  const duration = displaySession ? formatDuration(exitDetails.minutes) : "";
  const cameraTitle = entry ? "กล้อง CCTV · ทางเข้า ประตู 1" : "กล้อง CCTV · ทางออก ประตู 1";
  const subline = entry ? "ทางเข้า · ประตู 1 (ชั้น B1)" : "ทางออก · ประตู 1 (ชั้น B1)";
  const cameraId = `CAM-${entry ? "ENTRY" : "EXIT"}-01`;
  const isPaid = state === "paid" || state === "web-paid";

  function resetDemoState() {
    setState("waiting");
    setSelectedSessionId(null);
    setEntrySession(null);
  }

  function startRead() {
    setState("reading");
    window.setTimeout(() => {
      if (entry) {
        if (availableSlots === 0) {
          setState("full");
          return;
        }
        const created = createSession({
          plate: "ผบ 9370",
          province: "กรุงเทพมหานคร",
          vehicleType: "Sedan",
          floor: "b1",
          slot: null,
          entryAt: stamp(new Date()),
          exitAt: null,
          entryGate: "ประตู 1",
          entryImage: null,
          fee: null,
        });
        setEntrySession(created);
        setSelectedSessionId(created.id);
        setState("success");
        audit({
          ip: "127.0.0.1",
          actor: "ระบบ",
          role: null,
          action: "สร้าง",
          page: "Kiosk ทางเข้า",
          detail: `บันทึกเวลาเข้ารถทะเบียน ${created.plate}`,
          target: created.id,
          device: cameraId,
          result: "สำเร็จ",
          title: "บันทึกเวลาเข้า",
        });
        if (demo) window.setTimeout(resetDemoState, 5_000);
        return;
      }

      const nextSession = activeSessions[activeSessions.length - 1];
      if (!nextSession) {
        setState("failed");
        if (demo) window.setTimeout(resetDemoState, 3_000);
        return;
      }
      setSelectedSessionId(nextSession.id);
      const previousPayment = payments
        .filter((payment) => payment.sessionId === nextSession.id)
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt))[0];
      if (previousPayment) {
        const age = Math.floor(
          (Date.now() - parseStamp(previousPayment.paidAt).getTime()) / 60_000,
        );
        if (age <= settings.exitGraceMinutes) {
          setState("web-paid");
          if (demo) {
            window.setTimeout(() => completeExit(nextSession.id), 5_000);
          }
          return;
        }
      }
      setState("fee");
    }, 1_500);
  }

  const completeExit = useCallback((targetSessionId?: string, completedAt?: Date) => {
    const targetSession = targetSessionId
      ? sessions.find((session) => session.id === targetSessionId)
      : selectedSession;
    if (!targetSession || targetSession.exitAt !== null) return;
    const exitedAt = stamp(completedAt ?? new Date());
    updateSession(targetSession.id, { exitAt: exitedAt });
    audit(
      {
        ip: "127.0.0.1",
        actor: "ระบบ",
        role: null,
        action: "แก้ไข",
        page: "Kiosk ทางออก",
        detail: `บันทึกเวลาออกรถทะเบียน ${targetSession.plate}`,
        target: targetSession.id,
        device: cameraId,
        result: "สำเร็จ",
        title: "บันทึกเวลาออก",
      },
      completedAt,
    );
    setState("waiting");
    setSelectedSessionId(null);
    setEntrySession(null);
  }, [cameraId, selectedSession, sessions]);

  function completeMockPayment() {
    if (!selectedSession || exitDetails.amount <= 0) return;
    recordMockPayment({
      sessionId: selectedSession.id,
      amount: exitDetails.amount,
      method: "qr",
      paidAt: exitDetails.now,
    });
    setState("paid");
    window.setTimeout(
      () => completeExit(selectedSession.id, exitDetails.now),
      5_000,
    );
  }

  useEffect(() => {
    if (
      entry ||
      pinnedState ||
      state !== "fee" ||
      !selectedSession ||
      exitDetails.amount > 0
    ) {
      return;
    }
    const paidOnline = payments.some(
      (payment) => payment.sessionId === selectedSession.id,
    );
    if (!paidOnline) return;
    const transition = window.setTimeout(() => setState("web-paid"), 0);
    const timer = window.setTimeout(
      () => completeExit(selectedSession.id),
      5_000,
    );
    return () => {
      window.clearTimeout(transition);
      window.clearTimeout(timer);
    };
  }, [
    completeExit,
    entry,
    exitDetails.amount,
    payments,
    pinnedState,
    selectedSession,
    state,
  ]);

  const statusHeading = entry
    ? state === "waiting"
      ? "ยินดีต้อนรับ"
      : state === "full"
        ? "ที่จอดเต็ม"
        : state === "reading"
          ? "กำลังอ่านป้ายทะเบียน"
          : "บันทึกเวลาเข้าแล้ว"
    : state === "waiting"
      ? "ค่าจอดจะแสดงเมื่ออ่านป้ายทะเบียนสำเร็จ"
      : state === "reading"
        ? "กำลังอ่านป้ายทะเบียน"
        : state === "fee"
          ? "กรุณาชำระค่าจอดก่อนออก"
          : state === "web-paid"
            ? "ยืนยันชำระเงินทางเว็บแล้ว"
            : "ชำระเงินสำเร็จ";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-page text-fg">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
            <SquareParking size={26} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-h2 font-bold text-fg">{siteConfig.brandName}</h1>
            <p className="truncate text-caption text-fg-3">{subline}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-caption font-semibold text-success sm:inline-flex">
            <span className="size-2 rounded-full bg-success" />
            ระบบพร้อมใช้งาน
          </span>
          <div className="text-right">
            <p className="text-h2 font-bold tabular-nums leading-none text-fg">
              {formatClock(clock)}
            </p>
            <p className="mt-1 text-caption text-fg-3">{formatDate(clock)}</p>
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-2 items-start gap-5 p-5 portrait:grid-cols-1 portrait:content-start portrait:p-4">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="flex min-w-0 items-center gap-2 text-control font-semibold text-fg">
              <span className="text-fg-2"><ScanLine size={18} aria-hidden /></span>
              <span className="truncate">{cameraTitle}</span>
            </h2>
            <span className="shrink-0 text-caption text-fg-3">วิดีโอสด · 1080p</span>
          </div>
          <CameraScene mode={mode} state={state} now={clock} />
          <section className="grid grid-cols-3 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <div className="min-w-0">
              <p className="text-caption text-fg-3">ทะเบียนที่อ่านได้ (AI)</p>
              <p className="mt-1 truncate text-h3 font-bold tabular-nums text-fg">
                {state === "waiting" || state === "failed" || state === "full"
                  ? "—"
                  : displaySession?.plate ?? "ผบ 9370"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-caption text-fg-3">ความมั่นใจในการอ่าน</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      state === "waiting" || state === "failed" ? "w-0 bg-success" : "w-11/12 bg-success",
                    )}
                  />
                </span>
                <span className="text-control font-semibold tabular-nums text-fg">
                  {state === "waiting" || state === "failed" ? "—" : "98%"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-caption text-fg-3">เวลาที่อ่าน</p>
              <p className="mt-1 text-control font-semibold tabular-nums text-fg">
                {state === "waiting" || state === "failed" ? "—" : formatClock(clock)}
              </p>
            </div>
          </section>
          {entry && (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-caption text-fg-3">ช่องว่างตอนนี้ (จากเซนเซอร์)</p>
                <p className="text-kpi font-bold tabular-nums text-success">
                  {availableSlots}
                  <span className="ml-1 text-body font-normal text-fg-3">/ {totalSlots} ช่อง</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {slotTypes
                  .filter((type) => type.isDefault)
                  .map((type) => {
                    const Icon =
                      type.id === "ev"
                        ? Zap
                        : type.id === "accessible"
                          ? Accessibility
                          : type.id === "vip"
                            ? Crown
                            : CarFront;
                    return (
                      <span
                        key={type.id}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-caption font-medium text-fg-2"
                      >
                        <Icon size={13} aria-hidden />
                        {type.name}
                        <strong className="ml-1 text-control tabular-nums text-fg">
                          {freeByType[type.id] ?? 0}
                        </strong>
                      </span>
                    );
                  })}
              </div>
            </section>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          <PlatePreview
            mode={mode}
            state={state}
            session={displaySession}
            entryAt={displaySession?.entryAt ?? ""}
            exitAt={displaySession ? stamp(exitDetails.now) : ""}
            amount={exitDetails.amount}
            duration={duration}
            pricePerHour={settings.pricePerHour}
          />
          <section className="flex min-h-22 items-center gap-4 rounded-xl border border-line bg-surface p-4">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-lg",
                isPaid ? "bg-success-soft text-success" : "bg-subtle text-fg-3",
              )}
            >
              {entry ? <CarFront size={28} aria-hidden /> : isPaid ? <CheckCircle2 size={28} aria-hidden /> : <Clock3 size={28} aria-hidden />}
            </span>
            <div className="min-w-0">
              <h2 className="text-title font-bold text-fg">{statusHeading}</h2>
              <p className="mt-1 text-body text-fg-2">
                {entry
                  ? "ไม่ต้องรับบัตรจอด ระบบใช้ป้ายทะเบียนแทนบัตร · ชำระได้ทางเว็บหรือที่ตู้ทางออก"
                  : state === "waiting"
                    ? "ชำระผ่าน QR PromptPay ได้ที่หน้าจอนี้ หรือชำระผ่านเว็บก่อนถึงทางออก"
                    : state === "fee"
                      ? `คิดค่าจอด ${formatMoney(settings.pricePerHour)} บาท/ชม. · ออกจากพื้นที่ภายใน ${settings.exitGraceMinutes} นาที`
                      : "ขอบคุณที่ใช้บริการ AUTO PARKING"}
              </p>
            </div>
          </section>
          {demo && (
            <section className="flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-3">
              {state === "waiting" ? (
                <Button size="sm" className="hover:bg-primary" onClick={startRead}>
                  จำลองอ่านป้ายทะเบียน
                </Button>
              ) : state === "fee" && exitDetails.amount > 0 ? (
                <Button size="sm" className="hover:bg-primary" onClick={completeMockPayment}>
                  จำลองรับชำระเงิน
                </Button>
              ) : isPaid && !entry ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="hover:bg-surface"
                  onClick={() => completeExit(selectedSession?.id, exitDetails.now)}
                >
                  จำลองรถออกจากลานจอด
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="hover:bg-surface"
                  onClick={resetDemoState}
                >
                  กลับสู่สถานะรอรถ
                </Button>
              )}
              {entry && state === "success" && displaySession && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={ExternalLink}
                  className="hover:bg-surface"
                  onClick={() =>
                    window.open(
                      `/pay?q=${encodeURIComponent(displaySession.plate)}`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  เปิดหน้าชำระเงิน
                </Button>
              )}
            </section>
          )}
        </aside>
      </main>
      {demo && (
        <p className="px-5 pb-4 text-caption text-fg-3">
          โหมดจำลอง · ใช้สำหรับทดสอบ flow เท่านั้น ไม่มีการเชื่อมต่อกล้องหรือระบบชำระเงินจริง
        </p>
      )}
    </div>
  );
}
