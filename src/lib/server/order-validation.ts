import { isOrderDateWithinBounds } from "@/lib/order-date";
import { normalizeSerbianPhoneNumber } from "@/lib/server/sms";

export type ValidatedOrderItem = {
  productId: number;
  quantity: number;
};

export type ValidatedOrderPayload = {
  restaurantId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  note?: string;
  sendSms: boolean;
  sendEmail: boolean;
  items: ValidatedOrderItem[];
};

export type ValidationResult =
  | {
      ok: true;
      data: ValidatedOrderPayload;
    }
  | {
      ok: false;
      message: string;
    };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isValidTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateOrderPayload(value: unknown): ValidationResult {
  if (!value || typeof value !== "object") {
    return { ok: false, message: "Nevažeći JSON payload." };
  }

  const payload = value as Record<string, unknown>;

  const restaurantId = payload.restaurantId;

  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return { ok: false, message: "Nedostaje ili je nevažeći restoran." };
  }

  if (!isNonEmptyString(payload.customerName) || payload.customerName.trim().length < 2) {
    return { ok: false, message: "Ime i prezime moraju imati najmanje 2 karaktera." };
  }

  if (!isNonEmptyString(payload.customerEmail) || !isValidEmail(payload.customerEmail.trim())) {
    return { ok: false, message: "Unesi ispravnu email adresu." };
  }

  if (!isNonEmptyString(payload.customerPhone)) {
    return { ok: false, message: "Broj telefona je obavezan." };
  }

  const normalizedPhone = normalizeSerbianPhoneNumber(payload.customerPhone);

  if (!normalizedPhone) {
    return {
      ok: false,
      message: "Broj telefona mora biti u srpskom formatu, npr. +381641234567 ili 064 123 4567.",
    };
  }

  if (!isNonEmptyString(payload.eventAddress) || payload.eventAddress.trim().length < 5) {
    return { ok: false, message: "Adresa događaja mora imati najmanje 5 karaktera." };
  }

  if (!isNonEmptyString(payload.eventDate) || !isValidDate(payload.eventDate.trim())) {
    return { ok: false, message: "Unesi validan datum isporuke." };
  }

  if (!isOrderDateWithinBounds(payload.eventDate.trim())) {
    return { ok: false, message: "Datum isporuke može biti najviše 7 dana unapred." };
  }

  if (!isNonEmptyString(payload.eventTime) || !isValidTime(payload.eventTime.trim())) {
    return { ok: false, message: "Unesi validno vreme isporuke." };
  }

  if (payload.note !== undefined && typeof payload.note !== "string") {
    return { ok: false, message: "Napomena mora biti tekstualna vrednost." };
  }

  if (payload.note !== undefined && payload.note.trim().length > 500) {
    return { ok: false, message: "Napomena ne može biti duža od 500 karaktera." };
  }

  if (payload.sendSms !== undefined && typeof payload.sendSms !== "boolean") {
    return { ok: false, message: "Polje sendSms mora biti boolean." };
  }

  if (payload.sendEmail !== undefined && typeof payload.sendEmail !== "boolean") {
    return { ok: false, message: "Polje sendEmail mora biti boolean." };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, message: "Dodaj bar jednu stavku u porudžbinu." };
  }

  const items: ValidatedOrderItem[] = [];

  for (const item of payload.items) {
    if (!item || typeof item !== "object") {
      return { ok: false, message: "Stavke porudžbine nisu ispravne." };
    }

    const candidate = item as Record<string, unknown>;
    const productId = candidate.productId;
    const quantity = candidate.quantity;

    if (
      typeof productId !== "number" ||
      typeof quantity !== "number" ||
      !Number.isInteger(productId) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return { ok: false, message: "Svaka stavka mora imati validan proizvod i količinu veću od nule." };
    }

    items.push({
      productId,
      quantity,
    });
  }

  return {
    ok: true,
    data: {
      restaurantId,
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail.trim(),
      customerPhone: normalizedPhone,
      eventAddress: payload.eventAddress.trim(),
      eventDate: payload.eventDate.trim(),
      eventTime: payload.eventTime.trim(),
      note: typeof payload.note === "string" && payload.note.trim().length > 0 ? payload.note.trim() : undefined,
      sendSms: typeof payload.sendSms === "boolean" ? payload.sendSms : true,
      sendEmail: typeof payload.sendEmail === "boolean" ? payload.sendEmail : true,
      items,
    },
  };
}
