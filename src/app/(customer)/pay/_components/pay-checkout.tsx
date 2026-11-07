"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  QrCode,
  RefreshCw,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/tailgrids/core/button";
import { siteConfig } from "@/config/site";
import { getBanks } from "@/db/banks/banks";
import { openBankApp } from "@/db/payments/payments";
import { useSettings } from "@/db/settings/settings";
import type { Session } from "@/db/sessions/sessions";
import { newSessionId } from "@/utils/id";
import { cn } from "@/utils/cn";

type CheckoutStep =
  | "detail"
  | "method"
  | "qr"
  | "bank-wait"
  | "success";
type PaymentMethod = "qr" | "bank";
type PaymentState = "pending" | "success" | "failed" | "expired" | "paid";

type CheckoutProps = {
  customerSessionId: string;
  session: Session;
  searchQuery: string;
  step: string;
  method: string;
  bank: string;
  state: string;
  reference: string;
};

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
function formatDateTime(value: string): string {
  const date = Number(value.slice(8, 10));
  const month = Number(value.slice(5, 7)) - 1;
  const year = value.slice(0, 4);
  return `${date} ${MONTHS[month]} ${year} · ${value.slice(11, 16)}`;
}

function getParkingTime(session: Session) {
  const [year, month, day] = session.entryAt.slice(0, 10).split("-").map(Number);
  const [hour, minute] = session.entryAt.slice(11, 16).split(":").map(Number);
  const enteredAt = new Date(year, month - 1, day, hour, minute);
  let now = new Date(year, month - 1, day, 21, 0);
  if (now <= enteredAt) now = new Date(enteredAt.getTime() + 60_000);
  const durationMinutes = Math.max(
    1,
    Math.floor((now.getTime() - enteredAt.getTime()) / 60_000),
  );
  const billedHours = Math.max(1, Math.ceil(durationMinutes / 60));
  return {
    nowLabel: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    durationMinutes,
    billedHours,
    dateLabel: formatDateTime(session.entryAt),
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours} ชม. ${remainder} น.` : `${remainder} น.`;
}

function getExitDeadline(time: string, graceMinutes: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + graceMinutes;
  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function formatMoney(value: number, decimals = 0): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["ค้นหา", "ตรวจสอบ", "ชำระ"] as const;
  return (
    <nav aria-label="ขั้นตอนการชำระค่าจอดรถ" className="px-5 pt-3.5">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          return (
            <li
              key={step}
              className={cn(
                "flex min-w-0 items-center gap-2",
                index < steps.length - 1 && "flex-1",
              )}
            >
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-label font-bold",
                  done || active
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-fg-3",
                )}
              >
                {done ? <Check size={14} aria-hidden /> : number}
              </span>
              <span
                className={cn(
                  "shrink-0 text-lead",
                  active ? "font-semibold text-fg" : "text-fg-3",
                )}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-1 h-0.5 min-w-2 flex-1 rounded-xs",
                    done ? "bg-primary" : "bg-line",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function VehiclePlate({ session }: { session: Session }) {
  return (
    <div className="mx-auto w-fit rounded-xl border-2 border-fg px-5 py-2 text-center">
      <p className="text-kpi font-bold text-fg">{session.plate}</p>
      <p className="text-lead text-fg-2">{session.province}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  tabular = false,
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-lead text-fg-2">{label}</dt>
      <dd
        className={cn(
          "text-right text-lead font-semibold text-fg",
          tabular && "tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function QrPattern({ reference }: { reference: string }) {
  const size = 29;
  const cells = useMemo(() => {
    const points: [number, number][] = [];
    const finder = (x: number, y: number, ox: number, oy: number) => {
      const dx = x - ox;
      const dy = y - oy;
      return (
        dx >= 0 &&
        dx < 7 &&
        dy >= 0 &&
        dy < 7 &&
        (dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
      );
    };
    const seed = Array.from(reference).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const inFinderArea =
          (x < 8 && y < 8) ||
          (x >= size - 8 && y < 8) ||
          (x < 8 && y >= size - 8);
        const isFinder =
          finder(x, y, 0, 0) ||
          finder(x, y, size - 7, 0) ||
          finder(x, y, 0, size - 7);
        if (
          isFinder ||
          (!inFinderArea &&
            (x * 17 + y * 31 + seed * 7 + x * y * 3) % 11 < 5)
        ) {
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

function createQrSvg(reference: string): string {
  const size = 29;
  let cells = "";
  const seed = Array.from(reference).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finder =
        ((x < 7 && (x === 0 || x === 6 || y === 0 || y === 6)) ||
          (x >= size - 7 && y < 7 && (x === size - 7 || x === size - 1 || y === 0 || y === 6)) ||
          (x < 7 && y >= size - 7 && (x === 0 || x === 6 || y === size - 7 || y === size - 1))) ||
        (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
        (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4) ||
        (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3);
      const reserved =
        (x < 8 && y < 8) ||
        (x >= size - 8 && y < 8) ||
        (x < 8 && y >= size - 8);
      if (finder || (!reserved && (x * 17 + y * 31 + seed * 7 + x * y * 3) % 11 < 5)) {
        cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="black">${cells}</g></svg>`;
}

function downloadQr(reference: string) {
  const svg = createQrSvg(reference);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reference}-mock.svg`;
  document.body.append(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function Countdown({
  onExpire,
}: {
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(600);
  const remainingRef = useRef(600);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (remainingRef.current <= 1) {
        remainingRef.current = 0;
        setRemaining(0);
        window.clearInterval(timer);
        return;
      }
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0) expireRef.current();
  }, [remaining]);

  return (
    <span className="tabular-nums">
      {String(Math.floor(remaining / 60)).padStart(2, "0")}:
      {String(remaining % 60).padStart(2, "0")}
    </span>
  );
}

function BankOptions({
  selectedBank,
  onSelect,
}: {
  selectedBank: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-lead font-medium text-fg-2">
        เลือกแอปธนาคาร
      </legend>
      <div className="grid grid-cols-3 gap-2.5">
        {getBanks().map((bank) => {
          const selected = bank.id === selectedBank;
          const initials: Record<string, string> = {
            KBANK: "K",
            SCB: "SCB",
            BBL: "B",
            KTB: "KTB",
            BAY: "BAY",
            TTB: "ttb",
          };
          const logoSrc: Record<string, string> = {
            SCB: "/banks/scb.png",
            TTB: "/banks/ttb.png",
          };
          return (
            <label
              key={bank.id}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3",
                selected
                  ? "border-2 border-primary bg-primary-soft"
                  : "border-line bg-surface",
              )}
            >
              <input
                type="radio"
                name="bank"
                value={bank.id}
                checked={selected}
                onChange={() => onSelect(bank.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-9 place-items-center rounded-full text-caption font-bold",
                  logoSrc[bank.id]
                    ? "overflow-hidden bg-surface"
                    : bank.id === "KBANK"
                      ? "bg-success text-on-primary"
                      : bank.id === "BAY"
                        ? "bg-warning text-fg"
                        : "bg-primary-soft text-primary",
                )}
              >
                {logoSrc[bank.id] ? (
                  <Image
                    src={logoSrc[bank.id]}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 object-contain"
                  />
                ) : (
                  initials[bank.id]
                )}
              </span>
              <span className="text-label font-medium text-fg">{bank.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PayCheckout({
  customerSessionId,
  session,
  searchQuery,
  step: rawStep,
  method: rawMethod,
  bank: rawBank,
  state: rawState,
  reference,
}: CheckoutProps) {
  const router = useRouter();
  const settings = useSettings();
  const banks = getBanks();
  const step = (
    ["detail", "method", "qr", "bank-wait", "success"].includes(rawStep)
      ? rawStep
      : "detail"
  ) as CheckoutStep;
  const method: PaymentMethod = rawMethod === "bank" ? "bank" : "qr";
  const bank = banks.find((item) => item.id === rawBank) ?? banks[0];
  const state: PaymentState = (
    ["pending", "success", "failed", "expired", "paid"].includes(rawState)
      ? rawState
      : "pending"
  ) as PaymentState;
  const paymentReference = reference || `PK-26-10-${customerSessionId.slice(-4).toUpperCase()}`;
  const parking = useMemo(() => getParkingTime(session), [session]);
  const amount = parking.billedHours * settings.pricePerHour;
  const exitDeadline = getExitDeadline(
    parking.nowLabel,
    settings.exitGraceMinutes,
  );
  const activeStep: 1 | 2 | 3 =
    step === "detail" ? 2 : 3;

  const navigate = useCallback(
    (
      nextStep: CheckoutStep,
      options: {
        method?: PaymentMethod;
        bank?: string;
        state?: PaymentState;
        reference?: string;
      } = {},
    ) => {
      const params = new URLSearchParams({
        vehicle: session.id,
        q: searchQuery,
        ref: options.reference ?? paymentReference,
        step: nextStep,
      });
      if (nextStep !== "detail") {
        params.set("method", options.method ?? method);
        params.set("bank", options.bank ?? bank.id);
      }
      if (options.state) params.set("state", options.state);
      router.push(`/pay/${customerSessionId}?${params.toString()}`);
    },
    [
      bank.id,
      customerSessionId,
      method,
      paymentReference,
      router,
      searchQuery,
      session.id,
    ],
  );

  const expirePayment = useCallback(() => {
    navigate(method === "bank" ? "bank-wait" : "qr", {
      method,
      bank: bank.id,
      state: "expired",
    });
  }, [bank.id, method, navigate]);

  const paid =
    state === "success" ||
    step === "success";
  const paidDetail = state === "paid" && step === "detail";
  const qrFailed = method === "qr" && (state === "failed" || state === "expired");
  const bankFailed = method === "bank" && state === "failed";
  const bankExpired = method === "bank" && state === "expired";

  function back() {
    if (step === "detail") {
      router.push(`/pay?q=${encodeURIComponent(searchQuery)}`);
    } else if (step === "method") {
      navigate("detail");
    } else {
      navigate("method", { method, bank: bank.id });
    }
  }

  function createNewQr() {
    const nextReference = createReference();
    navigate("qr", {
      method: "qr",
      state: "pending",
      reference: nextReference,
    });
  }

  function createReference() {
    return `PK-26-10-${newSessionId().replaceAll("-", "").slice(-4).toUpperCase()}`;
  }

  async function startBankPayment(nextReference = paymentReference) {
    const result = await openBankApp();
    navigate("bank-wait", {
      method: "bank",
      bank: bank.id,
      state: result,
      reference: nextReference,
    });
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-1 flex-col bg-page">
      <header className="flex h-24 shrink-0 items-center gap-3 border-b border-line bg-surface px-5">
        {step === "detail" || paid ? (
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
            <span className="text-h3 font-bold">P</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={back}
            aria-label="ย้อนกลับ"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-page text-fg"
          >
            <ArrowLeft size={22} aria-hidden />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-h3 font-bold leading-tight text-fg">
            {siteConfig.brandName}
          </h1>
          <p className="text-control text-fg-3">
            {settings.branchName} · ชำระค่าจอดรถ
          </p>
        </div>
      </header>

      {paid ? (
        <main className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-8">
          <section className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-22 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 size={54} aria-hidden />
            </span>
            <h2 className="text-h1 font-bold text-success">ชำระเงินสำเร็จ</h2>
            <p className="text-h3 font-semibold text-fg">
              กรุณาออกจากพื้นที่จอดภายใน {settings.exitGraceMinutes} นาที
            </p>
          </section>
          <dl className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4.5">
            <DetailRow label="ทะเบียน" value={session.plate} />
            <DetailRow label="ชำระแล้ว" value={`฿${formatMoney(amount)}`} tabular />
            <DetailRow
              label="เวลาชำระ"
              value={`17 ต.ค. 2026 · ${parking.nowLabel}`}
              tabular
            />
            <DetailRow label="เลขที่ธุรกรรม" value={`TXN 2610-${paymentReference.slice(-4)}`} tabular />
            <DetailRow label="หมดเวลาออก" value={exitDeadline} tabular />
          </dl>
          <p className="text-center text-lead text-warning">
            หากเกิน {settings.exitGraceMinutes} นาที ต้องชำระค่าจอดเพิ่ม
            โดยคิดใหม่นับจากเวลาที่ชำระครั้งนี้
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-auto w-full"
            onClick={() => router.push("/pay")}
          >
            กลับหน้าแรก
          </Button>
        </main>
      ) : (
        <>
          <Stepper current={activeStep} />
          {step === "detail" && !paidDetail && (
            <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-h2 font-bold text-fg">รายละเอียดการจอด</h2>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1.5 text-lead font-medium text-warning">
                  <span className="size-2 rounded-full bg-warning" />
                  รอชำระ
                </span>
              </div>
              <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4.5">
                <VehiclePlate session={session} />
                <div className="h-px bg-line" />
                <dl className="flex flex-col gap-3.5">
                  <DetailRow label="ทะเบียน" value={session.plate} />
                  <DetailRow
                    label="ประเภทรถ"
                    value={session.vehicleType ?? "ไม่ระบุ"}
                  />
                  <DetailRow label="เวลาเข้า" value={parking.dateLabel} tabular />
                  <DetailRow
                    label="เวลาจอด"
                    value={formatDuration(parking.durationMinutes)}
                    tabular
                  />
                </dl>
              </section>
              <section className="flex flex-col gap-3 rounded-2xl border border-primary bg-primary-soft p-4.5">
                <p className="text-lead text-fg-2">ยอดที่ต้องชำระ</p>
                <p className="text-kiosk-lg font-bold text-primary tabular-nums">
                  ฿{formatMoney(amount)}
                </p>
                <p className="text-lead text-fg-2">
                  คิด {parking.billedHours} ชม. × {formatMoney(settings.pricePerHour)} บาท
                  · คำนวณ ณ เวลา {parking.nowLabel} ·
                  อัตราค่าจอดกำหนดโดยผู้ดูแลระบบ
                </p>
              </section>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full shadow-primary"
                  onClick={() => navigate("method", { method: "qr" })}
                >
                  ชำระเงิน ฿{formatMoney(amount)}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full text-fg-2"
                  onClick={() =>
                    router.push(`/pay?q=${encodeURIComponent(searchQuery)}`)
                  }
                >
                  ไม่ใช่รถของฉัน · ค้นหาใหม่
                </Button>
              </div>
            </main>
          )}

          {paidDetail && (
            <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-h2 font-bold text-fg">รายละเอียดการจอด</h2>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-lead font-medium text-success">
                  <span className="size-2 rounded-full bg-success" />
                  ชำระแล้ว
                </span>
              </div>
              <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4.5">
                <VehiclePlate session={session} />
                <div className="h-px bg-line" />
                <dl className="flex flex-col gap-3.5">
                  <DetailRow label="ทะเบียน" value={session.plate} />
                  <DetailRow
                    label="ประเภทรถ"
                    value={session.vehicleType ?? "ไม่ระบุ"}
                  />
                  <DetailRow label="เวลาเข้า" value={parking.dateLabel} tabular />
                  <DetailRow
                    label="เวลาจอด"
                    value={formatDuration(parking.durationMinutes)}
                    tabular
                  />
                </dl>
              </section>
              <section className="flex flex-col gap-2 rounded-2xl border border-success bg-success-soft p-4.5">
                <div className="flex items-center gap-2.5 text-h3 font-bold text-success">
                  <CheckCircle2 size={24} aria-hidden />
                  ไม่มียอดค้างชำระ
                </div>
                <p className="text-lead text-fg-2">
                  ชำระ ฿{formatMoney(amount)} แล้วเมื่อ {parking.nowLabel} ·
                  ออกจากพื้นที่ได้ถึง {exitDeadline}
                </p>
              </section>
              <Button
                size="lg"
                variant="secondary"
                className="mt-auto w-full"
                onClick={() => router.push("/pay")}
              >
                กลับหน้าแรก
              </Button>
            </main>
          )}

          {step === "method" && (
            <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
              <h2 className="text-h2 font-bold text-fg">เลือกวิธีชำระเงิน</h2>
              <p className="text-lead text-fg-2">
                ยอดชำระ ฿{formatMoney(amount, 2)} · ทะเบียน {session.plate}{" "}
                {session.province}
              </p>
              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-1 text-lead font-medium text-fg-2">
                  วิธีชำระเงิน
                </legend>
                {(
                  [
                    {
                      id: "qr",
                      title: "QR PromptPay",
                      description: "สแกนด้วยแอปธนาคารใดก็ได้ หรือบันทึกรูปไปสแกนจากอัลบั้ม",
                      Icon: QrCode,
                    },
                    {
                      id: "bank",
                      title: "Mobile Banking",
                      description: "เปิดแอปธนาคารบนมือถือเครื่องนี้ แล้วกดยืนยัน ไม่ต้องสแกน",
                      Icon: Smartphone,
                    },
                  ] as const
                ).map(({ id, title, description, Icon }) => (
                  <label
                    key={id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border p-4",
                      method === id
                        ? "border-2 border-primary bg-primary-soft"
                        : "border-line bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={id}
                      checked={method === id}
                      onChange={() =>
                        navigate("method", {
                          method: id,
                          bank: bank.id,
                        })
                      }
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl",
                        method === id
                          ? "bg-surface text-primary"
                          : "bg-subtle text-fg-2",
                      )}
                    >
                      <Icon size={24} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-title font-semibold text-fg">
                        {title}
                      </span>
                      <span className="block text-lead text-fg-2">
                        {description}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border-2",
                        method === id
                          ? "border-primary bg-primary text-on-primary"
                          : "border-line-strong",
                      )}
                    >
                      {method === id && <span className="size-2.5 rounded-full bg-on-primary" />}
                    </span>
                  </label>
                ))}
              </fieldset>
              {method === "bank" && (
                <BankOptions
                  selectedBank={bank.id}
                  onSelect={(id) => navigate("method", { method: "bank", bank: id })}
                />
              )}
              <p className="text-label text-fg-3">
                ทั้งสองวิธีเป็นระบบจำลอง ไม่ตัดเงินจริง
              </p>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    method === "qr"
                      ? navigate("qr", { method, bank: bank.id, state: "pending" })
                      : startBankPayment()
                  }
                >
                  {method === "qr"
                    ? "ถัดไป · แสดง QR PromptPay"
                    : `เปิดแอป${bank.name} · ชำระ ฿${formatMoney(amount)}`}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full text-fg-2"
                  onClick={() => navigate("detail")}
                >
                  ยกเลิก
                </Button>
              </div>
            </main>
          )}

          {(step === "qr" || qrFailed) && (
            <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
              <section className="flex flex-col gap-2">
                <h2 className="text-h2 font-bold text-fg">
                  {qrFailed ? "ชำระเงินไม่สำเร็จ" : "สแกนเพื่อชำระ"}
                </h2>
                <p className="text-lead text-fg-2">
                  PromptPay QR ผูกกับบัญชีของโครงการ
                  ตรวจยอดก่อนยืนยันในแอปธนาคาร
                </p>
              </section>
              <section className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-4.5">
                <div className="w-full max-w-[240px] rounded-xl border border-line p-3">
                  <div className="mb-2 rounded-md bg-primary px-2 py-1.5 text-center text-title font-semibold text-on-primary">
                    THAI QR PAYMENT · PromptPay
                  </div>
                  <QrPattern reference={paymentReference} />
                </div>
                <p className="text-h2 font-bold text-fg tabular-nums">
                  ยอดชำระ ฿{formatMoney(amount, 2)}
                </p>
                <p className="text-lead text-fg-3">
                  ทะเบียน {session.plate} · อ้างอิง {paymentReference}
                </p>
                <p className="text-label text-warning">
                  QR จำลองสำหรับทดสอบ ไม่สามารถใช้ชำระเงินจริง
                </p>
              </section>
              {qrFailed ? (
                <section className="flex flex-col gap-2 rounded-2xl border border-danger bg-danger-soft p-4.5">
                  <div className="flex items-center gap-2.5 text-h3 font-bold text-danger">
                    <TriangleAlert size={24} aria-hidden />
                    ชำระเงินไม่สำเร็จ
                  </div>
                  <p className="text-lead text-fg-2">
                    QR หมดอายุหรือยังไม่ได้รับการยืนยันจากธนาคาร
                    ยังไม่มีการตัดเงิน กรุณาสร้าง QR ใหม่
                  </p>
                </section>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-warning-soft p-3 text-lead font-medium text-warning">
                  <span className="flex items-center gap-2">
                    <Clock size={20} aria-hidden />
                    รอการชำระเงิน · ระบบตรวจสอบอัตโนมัติ
                  </span>
                  <Countdown onExpire={expirePayment} />
                </div>
              )}
              {qrFailed ? (
                <Button
                  size="lg"
                  icon={RefreshCw}
                  className="w-full"
                  onClick={createNewQr}
                >
                  สร้าง QR ใหม่
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  icon={Download}
                  className="w-full"
                  onClick={() => downloadQr(paymentReference)}
                >
                  บันทึกรูป QR
                </Button>
              )}
              <p className="text-control text-fg-3">
                จ่ายจากมือถือเครื่องนี้: บันทึกรูป QR แล้วเปิดแอปธนาคาร
                เพื่อเลือกสแกนรูปจากอัลบั้ม
              </p>
              <Button
                size="lg"
                variant="ghost"
                className="mt-auto w-full text-fg-2"
                onClick={() => navigate("method", { method: "qr" })}
              >
                ยกเลิก
              </Button>
            </main>
          )}

          {(step === "bank-wait" || bankFailed || bankExpired) && (
            <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
              <section className="flex flex-col gap-2">
                <h2 className="text-h2 font-bold text-fg">
                  {bankExpired
                    ? "หมดเวลารอยืนยัน"
                    : bankFailed
                      ? "ชำระเงินไม่สำเร็จ"
                      : "รอยืนยันในแอปธนาคาร"}
                </h2>
                <p className="text-lead text-fg-2">
                  {bankExpired
                    ? "ไม่ได้รับการยืนยันจากธนาคารภายในเวลาที่กำหนด ยังไม่มีการตัดเงิน กรุณาเริ่มชำระใหม่"
                    : bankFailed
                      ? "ธนาคารแจ้งว่าการชำระถูกยกเลิกหรือไม่สำเร็จ ยังไม่มีการตัดเงิน กรุณาลองอีกครั้ง หรือเปลี่ยนวิธีชำระ"
                      : `เปิดแอป${bank.name}แล้ว ตรวจยอดและกดยืนยันในแอป จากนั้นกลับมาที่หน้านี้`}
                </p>
              </section>
              <section className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6">
                <span
                  className={cn(
                    "grid size-22 place-items-center rounded-full",
                    bankExpired
                      ? "bg-warning-soft text-warning"
                      : bankFailed
                        ? "bg-danger-soft text-danger"
                        : "bg-primary-soft text-primary",
                  )}
                >
                  {bankExpired ? (
                    <Clock size={40} aria-hidden />
                  ) : bankFailed ? (
                    <TriangleAlert size={40} aria-hidden />
                  ) : (
                    <Smartphone size={40} aria-hidden />
                  )}
                </span>
                <p className="text-h2 font-bold text-fg tabular-nums">
                  ยอดชำระ ฿{formatMoney(amount, 2)}
                </p>
                <p className="text-center text-lead text-fg-3">
                  ทะเบียน {session.plate} · {bank.name} · อ้างอิง{" "}
                  {paymentReference}
                </p>
              </section>
              {bankExpired ? (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-warning-soft p-3 text-lead font-semibold text-warning">
                    <Clock size={20} aria-hidden />
                    <span className="tabular-nums">00:00</span>
                  </div>
                  <Button
                    size="lg"
                    variant="secondary"
                    icon={RefreshCw}
                    className="w-full"
                    onClick={() => startBankPayment(createReference())}
                  >
                    เริ่มชำระใหม่
                  </Button>
                </>
              ) : bankFailed ? (
                <Button
                  size="lg"
                  variant="secondary"
                  icon={Smartphone}
                  className="w-full"
                  onClick={() => startBankPayment()}
                >
                  เปิดแอป{bank.name}อีกครั้ง
                </Button>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-warning-soft p-3 text-lead font-medium text-warning">
                    <span className="flex items-center gap-2">
                      <Clock size={20} aria-hidden />
                      รอยืนยันจากธนาคาร · ตรวจสอบอัตโนมัติ
                    </span>
                    <Countdown onExpire={expirePayment} />
                  </div>
                  <Button
                    size="lg"
                    variant="secondary"
                    icon={Smartphone}
                    className="w-full"
                    onClick={() => startBankPayment()}
                  >
                    เปิดแอป{bank.name}อีกครั้ง
                  </Button>
                </>
              )}
              <p className="text-control text-fg-3">
                ระบบจำลองไม่เปิดแอปธนาคารจริง และไม่มีการตัดเงินจริง
              </p>
              <div className="mt-auto">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full text-fg-2"
                  onClick={() => navigate("method", { method: "bank", bank: bank.id })}
                >
                  {bankExpired ? "เปลี่ยนวิธีชำระ" : "เปลี่ยนวิธีชำระ"}
                </Button>
              </div>
            </main>
          )}
        </>
      )}
    </div>
  );
}
