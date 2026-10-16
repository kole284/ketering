"use client";

import { useState } from "react";
import Form from "next/form";
import { SERVICES, TIME_SLOTS, type ServiceId } from "@/lib/booking";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

const WEEKDAYS = ["P", "U", "S", "Č", "P", "S", "N"];
const WEEKDAY_NAMES = ["ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota", "nedelja"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function monthTitle(year: number, month: number) {
  const text = new Intl.DateTimeFormat("sr-Latn", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, "");
}

function StepLabel({ step, children, htmlFor }: { step: number; children: string; htmlFor?: string }) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag htmlFor={htmlFor} className="flex items-center gap-3 text-[15px] font-medium">
      <span className="flex size-7 items-center justify-center rounded-full border border-ink text-[13px]">
        {step}
      </span>
      {children}
      <span className="text-accent" aria-hidden="true">*</span>
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
      <div className="flex items-center justify-between">
        <p className="text-[22px] font-medium tracking-[-0.01em] md:text-[28px]" aria-live="polite">
          {monthTitle(view.y, view.m)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={atCurrentMonth}
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface disabled:text-line disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon />
            <span className="sr-only">Prethodni mesec</span>
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ChevronRightIcon />
            <span className="sr-only">Sledeći mesec</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-y-1 text-center" role="grid">
        {WEEKDAYS.map((day, i) => (
          <span key={i} className="pb-3 text-[13px] font-medium text-muted" title={WEEKDAY_NAMES[i]}>
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
            <div key={iso} className="flex justify-center">
              <button
                type="button"
                disabled={past}
                onClick={() => onChange(iso)}
                aria-pressed={selected}
                aria-label={`${day}. ${monthTitle(view.y, view.m)}`}
                className={[
                  "flex aspect-square w-full max-w-14 items-center justify-center rounded-full text-lg tabular-nums transition-colors md:text-[22px]",
                  selected
                    ? "bg-accent font-semibold text-on-accent"
                    : past
                      ? "text-line"
                      : "hover:bg-surface",
                  isToday && !selected ? "ring-1 ring-ink ring-inset" : "",
                ].join(" ")}
              >
                {day}
              </button>
            </div>
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
  const [date, setDate] = useState(defaultDate);
  const [services, setServices] = useState<ServiceId[]>(defaultServices);
  const [hour, setHour] = useState(defaultHour === undefined ? "" : String(defaultHour));

  const missing = [!date && "datum", services.length === 0 && "uslugu", !hour && "vreme"].filter(
    Boolean,
  ) as string[];
  const ready = missing.length === 0;

  const toggle = (id: ServiceId) =>
    setServices((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );

  return (
    <Form action="/restorani" className="grid flex-1 md:grid-cols-2">
      <h1 className="sr-only">Poruči ketering, torte, kuvana jela i pića</h1>
      {date && <input type="hidden" name="datum" value={date} />}

      <section className="border-line px-4 py-8 md:border-r md:px-6 md:py-12 xl:px-12 xl:py-16">
        <StepLabel step={1}>Izaberi datum</StepLabel>
        <div className="mt-8 max-w-[560px]">
          <Calendar value={date} todayIso={todayIso} onChange={setDate} />
        </div>
      </section>

      <section className="flex flex-col gap-10 border-t border-line px-4 py-8 md:border-t-0 md:px-6 md:py-12 xl:px-12 xl:py-16">
        <fieldset>
          <legend>
            <StepLabel step={2}>Izaberi uslugu</StepLabel>
          </legend>
          <p className="mt-2 ml-10 text-sm text-muted">Možeš da izabereš jednu ili više.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SERVICES.map((service) => {
              const checked = services.includes(service.id);
              return (
                <label
                  key={service.id}
                  className={`flex h-16 cursor-pointer items-center gap-4 rounded-2xl border px-5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ink ${
                    checked ? "border-accent bg-accent-soft" : "border-line hover:border-ink"
                  }`}
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
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                      checked ? "border-accent bg-accent" : "border-muted"
                    }`}
                  >
                    {checked && <CheckIcon size={16} strokeWidth={2.5} className="text-on-accent" />}
                  </span>
                  <span className="text-lg font-medium">{service.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <StepLabel step={3} htmlFor="vreme">
            Izaberi vreme dostave
          </StepLabel>
          <div className="relative mt-5">
            <select
              id="vreme"
              name="vreme"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className={`h-16 w-full appearance-none rounded-2xl border border-line bg-bg px-5 text-lg focus:border-ink focus:outline-none ${
                hour ? "font-medium" : "text-muted"
              }`}
            >
              <option value="" disabled>
                Izaberi termin
              </option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot.hour} value={slot.hour}>
                  {slot.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2" />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="submit"
            disabled={!ready}
            className="h-14 rounded-full bg-accent text-base font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:bg-surface disabled:text-muted"
          >
            Prikaži restorane
          </button>
          <p className="text-center text-sm text-muted" aria-live="polite">
            {ready
              ? "Prikazaćemo restorane koji stižu da pripreme porudžbinu za taj termin."
              : `Još izaberi ${missing.join(", ")}.`}
          </p>
        </div>
      </section>
    </Form>
  );
}
