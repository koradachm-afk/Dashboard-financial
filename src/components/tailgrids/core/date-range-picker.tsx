"use client";

import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  isSameDay,
  parseDate,
  today as todayIn,
} from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  I18nProvider,
  RangeCalendar,
  RangeCalendarStateContext,
} from "react-aria-components";
import { cn } from "@/utils/cn";
import { Button } from "./button";
import { Input } from "./input";

export type DateRange = { start: CalendarDate; end: CalendarDate };

// Thai month names and weekdays, Gregorian year (2026, not the Buddhist 2569).
const LOCALE = "th-TH-u-ca-gregory";
const monthShort = new DateFormatter(LOCALE, { month: "short", timeZone: "UTC" });
const mon = (d: CalendarDate) => monthShort.format(d.toDate("UTC"));

/** Inclusive number of days: 1 Oct to 3 Oct is 3. */
export const rangeDayCount = (start: CalendarDate, end: CalendarDate) => end.compare(start) + 1;

/** `1 – 3 ต.ค. 2026`, `30 ก.ย. – 2 ต.ค. 2026`, `30 ธ.ค. 2026 – 2 ม.ค. 2027`; a single day is `3 ต.ค. 2026`. */
export function formatDateRange(start: CalendarDate, end: CalendarDate): string {
  if (isSameDay(start, end)) return `${start.day} ${mon(start)} ${start.year}`;
  if (start.year !== end.year) return `${start.day} ${mon(start)} ${start.year} – ${end.day} ${mon(end)} ${end.year}`;
  if (start.month !== end.month) return `${start.day} ${mon(start)} – ${end.day} ${mon(end)} ${end.year}`;
  return `${start.day} – ${end.day} ${mon(end)} ${end.year}`;
}

/** The footer text of the picker: the range and its inclusive day count. */
export const formatRangeSummary = (start: CalendarDate, end: CalendarDate) =>
  `${formatDateRange(start, end)} · ${rangeDayCount(start, end)} วัน`;

const parse = (text: string): CalendarDate | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  try {
    return parseDate(text); // Throws for 2026-02-30 and 2026-13-01.
  } catch {
    return null;
  }
};

/** Renders nothing: lends the calendar's in-progress anchor to the picker and lets it be cleared. */
function AnchorBridge({
  onAnchor,
  stateRef,
}: {
  onAnchor: (anchor: CalendarDate | null) => void;
  stateRef: React.RefObject<{ setAnchorDate: (d: CalendarDate | null) => void } | null>;
}) {
  const state = useContext(RangeCalendarStateContext);
  useEffect(() => {
    stateRef.current = state;
  });
  const anchor = state?.anchorDate ?? null;
  const key = anchor?.toString() ?? "";
  useEffect(() => {
    onAnchor(key ? parseDate(key) : null);
  }, [key, onAnchor]);
  return null;
}

const NAV =
  "grid size-6 shrink-0 cursor-default place-items-center rounded-md text-fg-2 outline-none hover:text-fg data-disabled:opacity-35 data-focus-visible:ring-2 data-focus-visible:ring-focus";

export type DateRangePickerProps = {
  /** The range to start from, or null for nothing selected. */
  value: DateRange | null;
  /** Called with the chosen range; the caller closes the popover. */
  onApply: (range: DateRange) => void;
  /** Called by "cancel"; the picker keeps nothing, so the caller just closes. */
  onCancel: () => void;
  /** Today in the user's time zone. Days after it are disabled. Defaults to the real today. */
  today?: CalendarDate;
  /** Accessible names and copy come from the caller. */
  label: string;
  startLabel: string;
  endLabel: string;
  previousLabel: string;
  nextLabel: string;
  cancelLabel: string;
  applyLabel: string;
  /** Footer hint before anything is picked. */
  startHint: string;
  /** Footer hint after the start is picked; receives e.g. `1 ต.ค.`. */
  endHint: (start: string) => string;
  className?: string;
};

/**
 * The content of a date-range popover (Figma 08.5): two date inputs, a range calendar
 * and a footer with the summary and two buttons. It has no trigger or popover of its own;
 * the caller places it in one that supplies the border and shadow.
 */
export function DateRangePicker({
  value,
  onApply,
  onCancel,
  today: todayProp,
  label,
  startLabel,
  endLabel,
  previousLabel,
  nextLabel,
  cancelLabel,
  applyLabel,
  startHint,
  endHint,
  className,
}: DateRangePickerProps) {
  const [today] = useState(() => todayProp ?? todayIn(getLocalTimeZone()));
  const [startText, setStartText] = useState(value?.start.toString() ?? "");
  const [endText, setEndText] = useState(value?.end.toString() ?? "");
  const [focused, setFocused] = useState(value?.end ?? today);
  const stateRef = useRef<{ setAnchorDate: (d: CalendarDate | null) => void } | null>(null);

  const start = parse(startText);
  const end = parse(endText);
  const startOk = start !== null && start.compare(today) <= 0;
  const endOk = end !== null && end.compare(today) <= 0 && (start === null || end.compare(start) >= 0);
  const range: DateRange | null = startOk && endOk && start && end ? { start, end } : null;

  const type = (set: (t: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    set(text);
    stateRef.current?.setAnchorDate(null); // A typed value replaces a half-finished click selection.
    const d = parse(text);
    if (d && d.compare(today) <= 0) setFocused(d);
  };
  // Mark an input only once a whole date is typed, so partial input is not nagged.
  const startError = startText.length >= 10 && !startOk;
  const endError = endText.length >= 10 && !endOk;

  return (
    <I18nProvider locale={LOCALE}>
      <div className={cn("flex w-79.5 flex-col gap-3 p-3.5", className)}>
        <div className="flex items-center gap-2">
          <Input
            aria-label={startLabel}
            placeholder="YYYY-MM-DD"
            value={startText}
            onChange={type(setStartText)}
            error={startError}
            className="h-8.5 min-w-0 flex-1 text-control"
            inputMode="numeric"
          />
          <span aria-hidden className="text-body text-fg-3">
            –
          </span>
          <Input
            aria-label={endLabel}
            placeholder="YYYY-MM-DD"
            value={endText}
            onChange={type(setEndText)}
            error={endError}
            className="h-8.5 min-w-0 flex-1 text-control"
            inputMode="numeric"
          />
        </div>

        <RangeCalendar
          aria-label={label}
          value={range}
          maxValue={today}
          focusedValue={focused}
          onFocusChange={setFocused}
          onChange={(r) => {
            setStartText(r.start.toString());
            setEndText(r.end.toString());
          }}
          className="flex flex-col gap-3"
        >
          <AnchorBridge
            stateRef={stateRef}
            onAnchor={(anchor) => {
              if (!anchor) return;
              setStartText(anchor.toString());
              setEndText("");
            }}
          />
          <header className="flex items-center">
            <AriaButton slot="previous" aria-label={previousLabel} className={NAV}>
              <ChevronLeft size={16} aria-hidden />
            </AriaButton>
            <Heading className="flex-1 text-center text-body font-semibold text-fg" />
            <AriaButton slot="next" aria-label={nextLabel} className={NAV}>
              <ChevronRight size={16} aria-hidden />
            </AriaButton>
          </header>
          <CalendarGrid className="-m-0.5 border-separate border-spacing-0.5">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="h-7 w-9.5 text-center text-caption font-medium text-fg-3">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  aria-current={isSameDay(date, today) ? "date" : undefined}
                  className={({ isSelected, isSelectionStart, isSelectionEnd, isDisabled, isOutsideMonth, isFocusVisible }) =>
                    cn(
                      "grid h-8.5 w-9.5 cursor-default place-items-center rounded-md border border-transparent text-body font-normal text-fg outline-none",
                      !isSelected && !isDisabled && "hover:bg-subtle",
                      isSelected && "bg-primary-soft font-medium text-primary",
                      (isSelectionStart || isSelectionEnd) && "bg-primary font-semibold text-on-primary",
                      isSameDay(date, today) && !(isSelectionStart || isSelectionEnd) && "border-primary font-semibold text-primary",
                      isDisabled && "opacity-35",
                      isOutsideMonth && "invisible",
                      isFocusVisible && "ring-2 ring-focus",
                    )
                  }
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </RangeCalendar>

        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 text-label text-fg-2">
            {range
              ? formatRangeSummary(range.start, range.end)
              : startOk && start && !endText
                ? endHint(`${start.day} ${mon(start)}`)
                : startHint}
          </p>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button size="sm" disabled={!range} onClick={() => range && onApply(range)}>
            {applyLabel}
          </Button>
        </div>
      </div>
    </I18nProvider>
  );
}
