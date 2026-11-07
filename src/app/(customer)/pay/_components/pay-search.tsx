"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  CarFront,
  Coins,
  Info,
  Search,
  SquareParking,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { siteConfig } from "@/config/site";
import { getCustomerSessions } from "@/db/customer/customer";
import { useSettings } from "@/db/settings/settings";
import { isParked, type Session } from "@/db/sessions/sessions";
import { newSessionId } from "@/utils/id";
import { cn } from "@/utils/cn";

const steps = ["ค้นหา", "ตรวจสอบ", "ชำระ"] as const;
const thaiMonths = [
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

function normalizePlate(value: string): string {
  return value.replace(/\s+/g, "").toLocaleUpperCase("th-TH");
}

function formatEntryTime(value: string): string {
  const day = Number(value.slice(8, 10));
  const month = Number(value.slice(5, 7)) - 1;
  return `${day} ${thaiMonths[month]} · ${value.slice(11, 16)}`;
}

function EntrySnapshot({ session }: { session: Session }) {
  return (
    <div
      role="img"
      aria-label={`ภาพจำลองจากกล้องทางเข้า เวลา ${session.entryAt.slice(11, 16)}`}
      className="relative h-24 w-32 shrink-0 overflow-hidden rounded-pop bg-fg"
    >
      {session.entryImage ? (
        <Image
          src={session.entryImage}
          alt=""
          fill
          sizes="128px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 h-2.5 bg-success" />
          <div className="absolute inset-x-0 top-0.5 text-center text-nano font-semibold text-on-primary">
            ENTRANCE · ทางเข้า
          </div>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-map-lane" />
          <div className="absolute inset-x-0 bottom-4 border-t border-dashed border-warning" />
          <CarFront
            size={58}
            strokeWidth={1.5}
            aria-hidden
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-line-strong"
          />
          <div className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-between bg-linear-to-b from-transparent to-black/80 px-1.5 pt-1 text-on-primary">
            <span className="text-caption">CAM-IN-01</span>
            <span className="text-lead font-semibold tabular-nums">
              {session.entryAt.slice(11, 16)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function PlateMatchCard({
  session,
  selected,
  onSelect,
}: {
  session: Session;
  selected: boolean;
  onSelect: () => void;
}) {
  const radioId = `vehicle-${session.id}`;

  return (
    <label
      htmlFor={radioId}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3",
        selected
          ? "border-2 border-primary bg-primary-soft"
          : "border-line",
      )}
    >
      <EntrySnapshot session={session} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-h3 font-bold text-fg">
          {session.plate}
        </span>
        <span className="block truncate text-lead text-fg-2">
          {session.province}
        </span>
        <span className="block text-control text-fg-3">
          เข้า {formatEntryTime(session.entryAt)} · {session.entryGate}
        </span>
      </span>
      <input
        id={radioId}
        type="radio"
        name="vehicle"
        value={session.id}
        checked={selected}
        onChange={onSelect}
        aria-label={`${session.plate} ${session.province}, เข้า ${formatEntryTime(session.entryAt)}`}
        className="size-6 shrink-0 accent-primary"
      />
    </label>
  );
}

export function PaySearch({ query }: { query: string }) {
  const [plate, setPlate] = useState(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();
  const settings = useSettings();
  const normalizedQuery = normalizePlate(query);

  const results = useMemo(
    () =>
      normalizedQuery
        ? getCustomerSessions()
            .filter(
              (session) =>
                isParked(session) &&
                normalizePlate(session.plate).includes(normalizedQuery),
            )
            .sort((a, b) => a.entryAt.localeCompare(b.entryAt))
        : [],
    [normalizedQuery],
  );
  const isCurrentQuery = normalizePlate(plate) === normalizedQuery;
  const visibleResults = isCurrentQuery ? results : [];
  const selectedSession =
    results.find((session) => session.id === selectedId) ?? results[0];
  const notFound =
    isCurrentQuery && normalizedQuery.length > 0 && results.length === 0;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = plate.trim();
    if (!nextQuery) return;

    const matches = getCustomerSessions()
      .filter(
        (session) =>
          isParked(session) &&
          normalizePlate(session.plate).includes(normalizePlate(nextQuery)),
      )
      .sort((a, b) => a.entryAt.localeCompare(b.entryAt));

    if (matches.length === 1) {
      startCheckout(matches[0], nextQuery);
      return;
    }

    router.push(`/pay?q=${encodeURIComponent(nextQuery)}`);
  }

  function startCheckout(session: Session, searchQuery: string) {
    const customerSessionId = newSessionId();
    const reference = `PK-26-10-${customerSessionId.replaceAll("-", "").slice(-4).toUpperCase()}`;
    const params = new URLSearchParams({
      vehicle: session.id,
      q: searchQuery,
      step: "detail",
      ref: reference,
    });
    router.push(`/pay/${customerSessionId}?${params.toString()}`);
  }

  function searchAgain() {
    setPlate("");
    setSelectedId(null);
    router.push("/pay");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-1 flex-col bg-page">
      <header className="flex h-24 shrink-0 items-center gap-3 border-b border-line bg-surface px-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
          <SquareParking size={24} aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-h3 font-bold leading-tight text-fg">
            {siteConfig.brandName}
          </h1>
          <p className="text-control text-fg-3">
            {settings.branchName} · ชำระค่าจอดรถ
          </p>
        </div>
      </header>

      <nav aria-label="ขั้นตอนการชำระค่าจอดรถ" className="px-5 pt-3.5">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li
              key={step}
              className={cn(
                "flex min-w-0 items-center gap-2",
                index < steps.length - 1 && "flex-1",
              )}
            >
              <span
                aria-current={index === 0 ? "step" : undefined}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-label font-bold",
                  index === 0
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-fg-3",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "shrink-0 text-lead",
                  index === 0 ? "font-semibold text-fg" : "text-fg-3",
                )}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="mx-1 h-0.5 min-w-2 flex-1 rounded-xs bg-line" />
              )}
            </li>
          ))}
        </ol>
      </nav>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
        <section className="flex flex-col gap-4">
          <h2 className="text-h2 font-bold text-fg">
            {visibleResults.length > 0 ? "เลือกรถของคุณ" : "ชำระค่าจอดรถ"}
          </h2>
          <p className="text-lead text-fg-2">
            {visibleResults.length > 0
              ? `พบ ${visibleResults.length} คันที่ทะเบียนตรงกับที่ค้นหา ดูสีและรูปตอนเข้าลานแล้วเลือกคันของคุณ`
              : "กรอกทะเบียนรถเพื่อค้นหาข้อมูลการจอดและชำระค่าจอด ไม่ต้องติดตั้งแอป"}
          </p>
        </section>

        <form onSubmit={search} className="flex flex-col gap-1.5">
          <label htmlFor="plate" className="text-lead font-medium text-fg">
            ทะเบียนรถ
          </label>
          <Input
            id="plate"
            name="plate"
            size="lg"
            icon={Search}
            autoComplete="off"
            placeholder="เช่น กข 1234"
            value={plate}
            onChange={(event) => {
              setPlate(event.target.value);
            }}
            aria-invalid={notFound || undefined}
            aria-describedby={
              notFound ? "plate-error" : "plate-hint"
            }
            error={notFound}
            className="bg-surface"
          />
          {notFound ? (
            <p
              id="plate-error"
              role="alert"
              className="flex items-center gap-1.5 text-lead font-medium text-danger"
            >
              <TriangleAlert size={20} className="shrink-0" aria-hidden />
              ไม่พบรถทะเบียน {query} ในที่จอดตอนนี้
            </p>
          ) : (
            <p id="plate-hint" className="text-control text-fg-3">
              {visibleResults.length > 0
                ? "ทะเบียนเดียวกันอาจมีหลายจังหวัด · แก้คำค้นได้"
                : "ไม่ต้องเว้นวรรคระหว่างตัวอักษรและตัวเลข เว้นวรรคหรือไม่ก็ได้"}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            icon={Search}
            disabled={!plate.trim()}
            className="mt-3 w-full shadow-primary"
          >
            ค้นหารถ
          </Button>
        </form>

        {visibleResults.length > 0 ? (
          <section aria-labelledby="results-heading" className="flex flex-col gap-2.5">
            <h3 id="results-heading" className="text-lead font-medium text-fg-2">
              ผลการค้นหา · {visibleResults.length} คัน
            </h3>
            <div role="radiogroup" aria-label="เลือกรถของคุณ" className="flex flex-col gap-2.5">
              {visibleResults.map((session) => (
                <PlateMatchCard
                  key={session.id}
                  session={session}
                  selected={selectedSession?.id === session.id}
                  onSelect={() => {
                    setSelectedId(session.id);
                  }}
                />
              ))}
            </div>
            {selectedSession && (
              <>
                <Button
                  size="lg"
                  className="mt-1 w-full"
                  onClick={() => startCheckout(selectedSession, query)}
                >
                  ยืนยัน · {selectedSession.plate} {selectedSession.province}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full text-fg-2"
                  onClick={searchAgain}
                >
                  ไม่พบรถของฉัน · ค้นหาใหม่
                </Button>
              </>
            )}
          </section>
        ) : (
          <aside
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-4.5",
              notFound
                ? "border-warning bg-warning-soft"
                : "border-line bg-surface",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Info
                size={20}
                className={cn(
                  "shrink-0",
                  notFound ? "text-warning" : "text-primary",
                )}
                aria-hidden
              />
              <h3 className="text-h3 font-semibold text-fg">
                หาไม่เจอหรือมีปัญหา?
              </h3>
            </div>
            {notFound ? (
              <ul className="list-disc space-y-0.5 pl-5 text-lead text-fg-2">
                <li>ตรวจหมวดอักษรและตัวเลขอีกครั้ง</li>
                <li>ทะเบียนที่กล้องอ่านอาจคลาดเคลื่อน</li>
                <li>ชำระได้ที่ตู้ Kiosk ทางออกโดยไม่ต้องค้นหา</li>
              </ul>
            ) : (
              <p className="text-control text-fg-2">
                ตรวจสอบทะเบียนอีกครั้ง หรือชำระที่ตู้ Kiosk ทางออก
                ระบบจะอ่านป้ายและแสดงค่าจอดให้อัตโนมัติ
              </p>
            )}
          </aside>
        )}
      </main>

      <footer className="flex items-center justify-center gap-2 px-5 pb-5 pt-2 text-center text-lead text-fg-3">
        <Coins size={16} className="shrink-0" aria-hidden />
        <span>
          อัตราค่าจอด{" "}
          <span className="tabular-nums">
            {new Intl.NumberFormat("th-TH").format(settings.pricePerHour)}
          </span>{" "}
          บาท/ชม. · ปัดเศษขึ้นเป็นชั่วโมง
        </span>
      </footer>
    </div>
  );
}
