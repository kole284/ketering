const ORDER_DATE_WINDOW_DAYS = 7;

const DAY_NAMES = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "avg",
  "sep",
  "okt",
  "nov",
  "dec",
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function toDateParts(date: Date): { dayName: string; dayNumber: string; monthName: string } {
  return {
    dayName: DAY_NAMES[date.getDay()] ?? "",
    dayNumber: String(date.getDate()),
    monthName: MONTH_NAMES[date.getMonth()] ?? "",
  };
}

export function getOrderDateBounds(referenceDate = new Date()): { min: string; max: string } {
  const minDate = startOfLocalDay(referenceDate);
  const maxDate = startOfLocalDay(referenceDate);
  maxDate.setDate(maxDate.getDate() + ORDER_DATE_WINDOW_DAYS);

  return {
    min: toDateInputValue(minDate),
    max: toDateInputValue(maxDate),
  };
}

export function isOrderDateWithinBounds(value: string, referenceDate = new Date()): boolean {
  const candidate = parseDateInput(value);

  if (!candidate) {
    return false;
  }

  const minDate = startOfLocalDay(referenceDate);
  const maxDate = startOfLocalDay(referenceDate);
  maxDate.setDate(maxDate.getDate() + ORDER_DATE_WINDOW_DAYS);
  candidate.setHours(0, 0, 0, 0);

  return candidate.getTime() >= minDate.getTime() && candidate.getTime() <= maxDate.getTime();
}

export function formatOrderDateLabel(value: string): string {
  const parsed = parseDateInput(value);

  if (!parsed) {
    return value;
  }

  const parts = toDateParts(parsed);
  return `${parts.dayName}, ${parts.dayNumber}. ${parts.monthName}`;
}

export function getOrderDateRange(referenceDate = new Date()): Array<{ value: string; label: string; dayNumber: string }> {
  const minDate = startOfLocalDay(referenceDate);
  const maxDate = startOfLocalDay(referenceDate);
  maxDate.setDate(maxDate.getDate() + ORDER_DATE_WINDOW_DAYS);

  const result: Array<{ value: string; label: string; dayNumber: string }> = [];
  const current = new Date(minDate);

  while (current.getTime() <= maxDate.getTime()) {
    const value = toDateInputValue(current);
    const parts = toDateParts(current);

    result.push({
      value,
      label: `${parts.dayName}, ${parts.dayNumber}. ${parts.monthName}`,
      dayNumber: parts.dayNumber,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}
