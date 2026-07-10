import type { Restaurant, RestaurantWorkingHour } from "@/lib/types/restaurant";

const MINUTES_IN_DAY = 24 * 60;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function parseToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHHMM(minutes: number): string {
  const normalized = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }

  return parsed;
}

function assertValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function getTimeZoneParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = getTimeZoneParts(date, timezone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return localAsUtc - date.getTime();
}

function zonedDateTimeToUtc(date: string, time: string, timezone: string): Date | null {
  const parsed = parseDateInput(date);

  if (!parsed || !TIME_PATTERN.test(time) || !assertValidTimeZone(timezone)) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const firstPass = new Date(localAsUtc - getTimeZoneOffsetMs(new Date(localAsUtc), timezone));
  const secondPass = new Date(localAsUtc - getTimeZoneOffsetMs(firstPass, timezone));

  return secondPass;
}

function getDayOfWeekForDate(date: string, timezone = "Europe/Belgrade"): number | null {
  const parsed = parseDateInput(date);

  if (!parsed || !assertValidTimeZone(timezone)) {
    return null;
  }

  const parts = getTimeZoneParts(parsed, timezone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

function getWorkingHourForDate(
  workingHours: RestaurantWorkingHour[],
  date: string,
  timezone = "Europe/Belgrade",
): RestaurantWorkingHour | null {
  const dayOfWeek = getDayOfWeekForDate(date, timezone);

  if (dayOfWeek === null) {
    return null;
  }

  return workingHours.find((entry) => entry.dayOfWeek === dayOfWeek) ?? null;
}

function isTimeInWorkingWindow(entry: RestaurantWorkingHour, time: string): boolean {
  if (entry.isClosed || !entry.opensAt || !entry.closesAt) {
    return false;
  }

  const requested = parseToMinutes(time);
  const open = parseToMinutes(entry.opensAt);
  const close = parseToMinutes(entry.closesAt);

  if (open === close) {
    return false;
  }

  if (open < close) {
    return requested >= open && requested <= close;
  }

  return requested >= open || requested <= close;
}

export function formatWorkingHoursLabel(restaurant: Pick<Restaurant, "workingHours">): string {
  const openDays = restaurant.workingHours.filter((entry) => !entry.isClosed && entry.opensAt && entry.closesAt);

  if (openDays.length === 0) {
    return "Radno vreme nije određeno";
  }

  const first = openDays[0];
  return `${first.opensAt} - ${first.closesAt}`;
}

export function getRestaurantOrderTimeBounds(
  restaurant: Pick<Restaurant, "workingHours" | "leadTimeMinutes"> & Partial<Pick<Restaurant, "timezone">>,
  date?: string,
): { min: string; max: string } {
  const timezone = restaurant.timezone ?? "Europe/Belgrade";
  const entry = date ? getWorkingHourForDate(restaurant.workingHours, date, timezone) : restaurant.workingHours.find((item) => !item.isClosed);

  if (!entry || entry.isClosed || !entry.opensAt || !entry.closesAt) {
    return { min: "00:00", max: "00:00" };
  }

  const open = parseToMinutes(entry.opensAt);
  const close = parseToMinutes(entry.closesAt);
  const minAllowed = Math.min(open + restaurant.leadTimeMinutes, MINUTES_IN_DAY - 1);

  return {
    min: formatHHMM(minAllowed),
    max: formatHHMM(close),
  };
}

export function isTimeWithinRestaurantHours(
  restaurant: Pick<Restaurant, "workingHours"> & Partial<Pick<Restaurant, "timezone">>,
  date: string,
  time: string,
): boolean {
  if (!TIME_PATTERN.test(time)) {
    return false;
  }

  const entry = getWorkingHourForDate(restaurant.workingHours, date, restaurant.timezone ?? "Europe/Belgrade");
  return entry ? isTimeInWorkingWindow(entry, time) : false;
}

export type OrderTimeValidationResult =
  | { valid: true }
  | { valid: false; reason: "closed" | "before_opening" | "after_closing" | "past" | "lead_time" | "invalid" };

export function validateRestaurantOrderTime(
  restaurant: Pick<Restaurant, "workingHours" | "leadTimeMinutes" | "timezone">,
  eventDate: string,
  eventTime: string,
  referenceDate = new Date(),
): OrderTimeValidationResult {
  if (!TIME_PATTERN.test(eventTime)) {
    return { valid: false, reason: "invalid" };
  }

  const date = parseDateInput(eventDate);

  if (!date) {
    return { valid: false, reason: "invalid" };
  }

  if (!assertValidTimeZone(restaurant.timezone)) {
    return { valid: false, reason: "invalid" };
  }

  const entry = getWorkingHourForDate(restaurant.workingHours, eventDate, restaurant.timezone);

  if (!entry || entry.isClosed || !entry.opensAt || !entry.closesAt) {
    return { valid: false, reason: "closed" };
  }

  if (!isTimeInWorkingWindow(entry, eventTime)) {
    const requested = parseToMinutes(eventTime);
    const open = parseToMinutes(entry.opensAt);
    const close = parseToMinutes(entry.closesAt);

    if (open < close && requested < open) {
      return { valid: false, reason: "before_opening" };
    }

    return { valid: false, reason: "after_closing" };
  }

  const requestedDateTime = zonedDateTimeToUtc(eventDate, eventTime, restaurant.timezone);

  if (!requestedDateTime) {
    return { valid: false, reason: "invalid" };
  }

  if (requestedDateTime.getTime() <= referenceDate.getTime()) {
    return { valid: false, reason: "past" };
  }

  const earliestAllowed = new Date(referenceDate.getTime() + restaurant.leadTimeMinutes * 60_000);

  if (requestedDateTime.getTime() < earliestAllowed.getTime()) {
    return { valid: false, reason: "lead_time" };
  }

  return { valid: true };
}

export function getOrderTimeValidationMessage(reason: Exclude<OrderTimeValidationResult, { valid: true }>["reason"]): string {
  switch (reason) {
    case "closed":
      return "Restoran je zatvoren izabranog dana.";
    case "before_opening":
      return "Izabrano vreme je pre otvaranja restorana.";
    case "after_closing":
      return "Izabrano vreme je posle zatvaranja restorana.";
    case "past":
      return "Izabrani termin je u prošlosti.";
    case "lead_time":
      return "Izabrani termin je preblizu trenutnom vremenu.";
    case "invalid":
    default:
      return "Izabrani termin nije validan.";
  }
}
