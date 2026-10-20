import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";

// Labels live in the dictionaries under `services`.
export const SERVICES = [
  { id: "ketering" },
  { id: "torte-i-kolaci" },
  { id: "kuvana-jela" },
  { id: "pica" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

const pad = (n: number) => String(n).padStart(2, "0");

export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i;
  return { hour, label: `${pad(hour)}:00 – ${pad(hour + 1)}:00` };
});

export const METHODS = ["dostava", "preuzimanje"] as const;
export type Method = (typeof METHODS)[number];

export type Booking = {
  date?: string;
  hour?: number;
  method?: Method;
  services: ServiceId[];
  query?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const all = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

export function parseBooking(params: SearchParams): Booking {
  const date = first(params.datum);
  const hour = Number(first(params.vreme));
  const query = first(params.q)?.trim();
  const method = first(params.nacin);

  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    hour: TIME_SLOTS.some((slot) => slot.hour === hour) ? hour : undefined,
    method: METHODS.find((m) => m === method),
    services: all(params.usluge).filter((id): id is ServiceId =>
      SERVICES.some((service) => service.id === id),
    ),
    query: query || undefined,
  };
}

export function bookingSearch(booking: Booking) {
  const search = new URLSearchParams();
  if (booking.date) search.set("datum", booking.date);
  for (const service of booking.services) search.append("usluge", service);
  if (booking.hour !== undefined) search.set("vreme", String(booking.hour));
  if (booking.method) search.set("nacin", booking.method);
  return search.toString();
}

export const serviceLabel = (id: ServiceId, t: Dictionary) => t.services[id];

export const slotLabel = (hour: number) =>
  TIME_SLOTS.find((slot) => slot.hour === hour)?.label ?? `${pad(hour)}:00`;

export function formatDate(isoDate: string, locale: Locale) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Current wall-clock time in Belgrade, expressed as a UTC timestamp so it compares with slotTime(). */
export function belgradeNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

export function belgradeTodayIso() {
  return new Date(belgradeNow()).toISOString().slice(0, 10);
}

export function slotTime(isoDate: string, hour: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d, hour);
}

/** Delivery covers Belgrade and its surrounding municipalities; anywhere else is pickup only. */
export const DELIVERY_CITIES = [
  "Beograd",
  "Barajevo",
  "Grocka",
  "Lazarevac",
  "Mladenovac",
  "Obrenovac",
  "Sopot",
  "Surčin",
  "Pančevo",
] as const;
