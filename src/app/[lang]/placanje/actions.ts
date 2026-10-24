"use server";

import { parseLocale } from "@/i18n/config";
import { METHODS } from "@/lib/booking";
import { createOrder, type CartInput } from "@/server/orders";

export type PlaceOrderResult = Awaited<ReturnType<typeof createOrder>> | null;

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : undefined;
};

/** Only ids and quantities are taken from the browser's cart; the server prices everything. */
function parseLines(raw: string | undefined): CartInput["lines"] {
  try {
    const lines: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(lines)) return [];
    return lines.flatMap((line) =>
      line &&
      typeof line.itemId === "string" &&
      typeof line.restaurantId === "string" &&
      typeof line.quantity === "number"
        ? [{ itemId: line.itemId, restaurantId: line.restaurantId, quantity: line.quantity }]
        : [],
    );
  } catch {
    return [];
  }
}

/** Checkout form: creates the order and returns the payment page to open. */
export async function placeOrder(_: PlaceOrderResult, form: FormData): Promise<PlaceOrderResult> {
  const method = METHODS.find((m) => m === text(form, "nacin")) ?? "dostava";
  const hour = Number(text(form, "vreme"));
  return createOrder({
    cart: {
      lines: parseLines(text(form, "korpa")),
      date: text(form, "datum"),
      hour: Number.isInteger(hour) ? hour : undefined,
      method,
      city: text(form, "grad"),
    },
    customer: {
      name: text(form, "ime") ?? "",
      email: text(form, "email") ?? "",
      phone: text(form, "telefon") ?? "",
      address: text(form, "adresa"),
      buyerType: text(form, "kupac") === "pravno" ? "pravno" : "fizicko",
      companyName: text(form, "firma"),
      pib: text(form, "pib"),
      mb: text(form, "mb"),
    },
    clientKey: (text(form, "kljuc") ?? "").slice(0, 100),
    expectedTotal: Number(text(form, "iznos")),
    locale: parseLocale(text(form, "jezik")),
  });
}
