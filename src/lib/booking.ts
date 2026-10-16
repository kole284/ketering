export const SERVICES = [
  { id: "ketering", label: "Ketering" },
  { id: "torte-i-kolaci", label: "Torte i kolači" },
  { id: "kuvana-jela", label: "Kuvana jela" },
  { id: "pica", label: "Pića" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

const pad = (n: number) => String(n).padStart(2, "0");

export const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 9 + i;
  return { hour, label: `${pad(hour)}:00 – ${pad(hour + 1)}:00` };
});

export type Booking = {
  date?: string;
  hour?: number;
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

  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    hour: TIME_SLOTS.some((slot) => slot.hour === hour) ? hour : undefined,
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
  return search.toString();
}

export const serviceLabel = (id: ServiceId) =>
  SERVICES.find((service) => service.id === id)?.label ?? id;

export const slotLabel = (hour: number) =>
  TIME_SLOTS.find((slot) => slot.hour === hour)?.label ?? `${pad(hour)}:00`;

export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const text = new Intl.DateTimeFormat("sr-Latn", {
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
