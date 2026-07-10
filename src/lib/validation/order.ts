import { z } from "zod";
import { isOrderDateWithinBounds } from "@/lib/order-date";
import { normalizeSerbianPhoneNumber } from "@/lib/server/sms";

function isValidDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const orderPayloadSchema = z.object({
  restaurantId: z.number().int().positive({
    message: "Nedostaje ili je nevažeći restoran.",
  }),
  customerName: z.string().trim().min(2, "Ime i prezime moraju imati najmanje 2 karaktera."),
  customerEmail: z.string().trim().email("Unesi ispravnu email adresu."),
  customerPhone: z.string().trim().transform((value, ctx) => {
    const normalizedPhone = normalizeSerbianPhoneNumber(value);

    if (!normalizedPhone) {
      ctx.addIssue({
        code: "custom",
        message: "Broj telefona mora biti u srpskom formatu, npr. +381641234567 ili 064 123 4567.",
      });
      return z.NEVER;
    }

    return normalizedPhone;
  }),
  eventAddress: z.string().trim().min(5, "Adresa događaja mora imati najmanje 5 karaktera."),
  eventDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Unesi validan datum isporuke.").refine(
    isValidDate,
    "Unesi validan datum isporuke.",
  ).refine(isOrderDateWithinBounds, "Datum isporuke može biti najviše 7 dana unapred."),
  eventTime: z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Unesi validno vreme isporuke."),
  note: z.string().trim().max(500, "Napomena ne može biti duža od 500 karaktera.").optional(),
  sendSms: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
  items: z.array(orderItemSchema).min(1, "Dodaj bar jednu stavku u porudžbinu."),
});

export type ValidatedOrderPayload = z.infer<typeof orderPayloadSchema>;

export function getValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Nevažeći JSON payload.";
}
