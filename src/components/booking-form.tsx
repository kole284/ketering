"use client";

import { useState } from "react";
import Form from "next/form";
import { INTL_LOCALE, fill, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { SERVICES, TIME_SLOTS, type ServiceId } from "@/lib/booking";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function monthTitle(locale: Locale, year: number, month: number) {
  const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
  // Russian adds " г." after the year; drop trailing abbreviations.
  return capitalize(text.replace(/\s?г\.$/, "").replace(/\.$/, ""));
}

const dayLabel = (locale: Locale, year: number, month: number, day: number) =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(year, month, day),
  );

// 5 January 2026 is a Monday.
const weekdayName = (locale: Locale, index: number) =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long" }).format(new Date(2026, 0, 5 + index));

function StepLabel({ step, children, htmlFor }: { step: number; children: string; htmlFor?: string }) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag htmlFor={htmlFor} className="caps flex items-baseline gap-3">
      <span className="tabular-nums text-muted">{String(step).padStart(2, "0")}</span>
      <span>
        {children}
        <span className="text-accent" aria-hidden="true">
          {" "}*
        </span>
      </span>
    </Tag>
  );
}

function Calendar({
  value,
  todayIso,
  onChange,
}: {
  value?: string;
  todayIso: string;
  onChange: (iso: string) => void;
}) {
  const { locale, t } = useI18n();
  const [ty, tm] = todayIso.split("-").map(Number);
  const today = { y: ty, m: tm - 1 };
  const initial = (value ?? todayIso).split("-").map(Number);
  const [view, setView] = useState({ y: initial[0], m: initial[1] - 1 });

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday first
  const atCurrentMonth = view.y === today.y && view.m === today.m;

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="caps-title text-base md:text-lg md:whitespace-nowrap xl:text-[26px]" aria-live="polite">
          {monthTitle(locale, view.y, view.m)}
        </p>
        <div className="flex">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={atCurrentMonth}
            className="flex size-10 items-center justify-center hover:bg-bg disabled:text-line disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon />
            <span className="sr-only">{t.booking.prevMonth}</span>
          </button>
          <button type="button" onClick={() => shift(1)} className="flex size-10 items-center justify-center hover:bg-bg">
            <ChevronRightIcon />
            <span className="sr-only">{t.booking.nextMonth}</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-7 gap-1 text-center" role="grid">
        {t.booking.weekdays.map((day, i) => (
          <span key={i} className="caps pb-3 text-muted" title={weekdayName(locale, i)}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = toIso(view.y, view.m, day);
          const past = iso < todayIso;
          const selected = iso === value;
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={dayLabel(locale, view.y, view.m, day)}
              className={[
                "flex aspect-square items-center justify-center text-base tabular-nums transition-colors md:text-lg",
                selected ? "bg-cta font-bold text-on-cta" : past ? "text-[#c9c9c6]" : "hover:bg-bg",
                isToday && !selected ? "ring-1 ring-ink ring-inset" : "",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingForm({
  todayIso,
  defaultDate,
  defaultHour,
  defaultServices = [],
}: {
  /** Today's date in Belgrade, from the server, so server and client render the same calendar. */
  todayIso: string;
  defaultDate?: string;
  defaultHour?: number;
  defaultServices?: ServiceId[];
}) {
  const { t, href } = useI18n();
  const [date, setDate] = useState(defaultDate);
  const [services, setServices] = useState<ServiceId[]>(defaultServices);
  const [hour, setHour] = useState(defaultHour === undefined ? "" : String(defaultHour));

  const missing = [
    !date && t.booking.missingDate,
    services.length === 0 && t.booking.missingService,
    !hour && t.booking.missingTime,
  ].filter(Boolean) as string[];
  const ready = missing.length === 0;

  const toggle = (id: ServiceId) =>
    setServices((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));

  return (
    <div className="w-full px-4 py-6 md:px-6 md:py-10 xl:px-12 xl:py-12">
      {/* COS-style framed split panel: calendar on a quiet grey field, choices on white. */}
      <Form action={href("/restorani")} className="grid grid-cols-1 border border-line md:grid-cols-2">
        <h1 className="sr-only">{t.booking.heading}</h1>
        {date && <input type="hidden" name="datum" value={date} />}

        <section className="min-w-0 bg-surface px-5 py-8 md:px-8 md:py-12 xl:px-16 xl:py-16">
          <StepLabel step={1}>{t.booking.date}</StepLabel>
          <div className="mt-8 max-w-[520px]">
            <Calendar value={date} todayIso={todayIso} onChange={setDate} />
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-12 px-5 py-8 md:px-8 md:py-12 xl:px-16 xl:py-16">
          <fieldset>
            <legend>
              <StepLabel step={2}>{t.booking.service}</StepLabel>
            </legend>
            <p className="mt-2 text-sm text-muted">{t.booking.serviceHint}</p>
            <div className="mt-5 border-t border-line">
              {SERVICES.map((service) => {
                const checked = services.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className="flex h-15 cursor-pointer items-center gap-4 border-b border-line has-focus-visible:outline-2 has-focus-visible:outline-ink"
                  >
                    <input
                      type="checkbox"
                      name="usluge"
                      value={service.id}
                      checked={checked}
                      onChange={() => toggle(service.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center border ${
                        checked ? "border-cta bg-cta" : "border-ink"
                      }`}
                    >
                      {checked && <CheckIcon size={14} strokeWidth={2.5} className="text-on-cta" />}
                    </span>
                    <span className="caps-title text-[15px]">{t.services[service.id]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <StepLabel step={3} htmlFor="vreme">
              {t.booking.time}
            </StepLabel>
            <div className="relative mt-5">
              <select
                id="vreme"
                name="vreme"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className={`h-14 w-full appearance-none border-b border-ink bg-transparent pr-8 text-lg focus:outline-none ${
                  hour ? "" : "text-muted"
                }`}
              >
                <option value="" disabled>
                  {t.booking.slotPlaceholder}
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.hour} value={slot.hour}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={18} className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2" />
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button
              type="submit"
              disabled={!ready}
              className="caps-cta h-13 bg-cta text-on-cta transition-colors hover:bg-cta-strong disabled:bg-surface disabled:text-muted"
            >
              {t.booking.submit}
            </button>
            <p className="text-sm text-muted" aria-live="polite">
              {ready ? t.booking.ready : fill(t.booking.missing, { list: missing.join(", ") })}
            </p>
          </div>
        </section>
      </Form>
    </div>
  );
}
