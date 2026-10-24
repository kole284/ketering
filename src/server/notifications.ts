import "server-only";
import { fill, parseLocale, type Locale } from "@/i18n/config";
import { dictionaryFor } from "@/i18n/server";
import { formatDate, slotLabel } from "@/lib/booking";
import { formatPrice, formatQuantity } from "@/lib/menu";
import { prisma } from "./db";
import { sendMail, type Mail } from "./mail";
import type { OrderWithBills } from "./orders";
import { sign } from "./signing";

/** Absolute site address for links in emails. */
export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const orderStatusUrl = (order: { publicCode: string; accessToken: string; locale: string }) =>
  `/${parseLocale(order.locale)}/porudzbina/${order.publicCode}?t=${order.accessToken}`;

/** The restaurant's link for one bill; restaurants work in Serbian. */
export const billUrl = (billId: string) => `/sr/racun/${billId}?sig=${sign("bill", billId)}`;

type Bill = OrderWithBills["bills"][number];

const slotText = (order: OrderWithBills, locale: Locale) =>
  `${formatDate(order.deliveryDate.toISOString().slice(0, 10), locale)}, ${slotLabel(order.slotHour)}`;

const itemLines = (bill: Bill, locale: Locale, items = bill.items) => {
  const t = dictionaryFor(locale);
  return items
    .map((item) => {
      const quantity = formatQuantity(item, item.quantityTenths / 10, locale, t);
      return `• ${item.name}: ${quantity} = ${formatPrice(item.lineTotalRsd, locale, t)}`;
    })
    .join("\n");
};

const fullAddress = (address: string | null | undefined, city: string | null | undefined) =>
  [address, city].filter(Boolean).join(", ");

function customerMail(order: OrderWithBills): Mail {
  const locale = parseLocale(order.locale);
  const t = dictionaryFor(locale);
  const price = (amount: number) => formatPrice(amount, locale, t);

  const bills = order.bills.map((bill) => {
    const where =
      bill.fulfilment === "delivery"
        ? fill(t.email.deliveryTo, { address: fullAddress(order.address, order.city) })
        : bill.restaurant
          ? fill(t.email.pickupAt, { address: fullAddress(bill.restaurant.pickupAddress, bill.restaurant.city) })
          : t.email.pickupServingo;
    const fee = `${bill.fulfilment === "delivery" ? t.email.deliveryFee : t.email.pickupFee}: ${price(bill.deliveryFeeRsd)}`;
    return [
      bill.sellerName.toUpperCase(),
      itemLines(bill, locale),
      where,
      `${t.cart.subtotal}: ${price(bill.subtotalRsd)}\n${fee}\n${t.cart.platform}: ${price(bill.platformFeeRsd)}\n${t.cart.billTotal}: ${price(bill.totalRsd)}`,
    ].join("\n");
  });

  return {
    to: order.email,
    subject: fill(t.email.subject, { code: order.publicCode }),
    text: [
      fill(t.email.greeting, { name: order.customerName }),
      fill(t.email.intro, { code: order.publicCode }),
      fill(t.email.slot, { slot: slotText(order, locale) }),
      ...bills,
      fill(t.email.total, { amount: price(order.totalRsd) }),
      fill(t.email.status, { link: siteUrl() + orderStatusUrl(order) }),
      t.email.thanks,
    ].join("\n\n"),
  };
}

// Restaurants and Servingo staff get Serbian emails.
const sr = dictionaryFor("sr");
const priceSr = (amount: number) => formatPrice(amount, "sr", sr);

function buyerText(order: OrderWithBills) {
  const company = order.buyerType === "pravno" ? `\nFirma: ${order.companyName}, PIB ${order.pib}, MB ${order.mb}` : "";
  return `Kupac: ${order.customerName}, ${order.phone}, ${order.email}${company}`;
}

const fulfilmentText = (order: OrderWithBills, bill: Bill) =>
  bill.fulfilment === "delivery"
    ? `Dostava na adresu: ${fullAddress(order.address, order.city)}`
    : "Lično preuzimanje u restoranu";

function restaurantMail(order: OrderWithBills, bill: Bill & { restaurant: NonNullable<Bill["restaurant"]> }): Mail {
  return {
    to: bill.restaurant.orderEmail,
    subject: `Nova porudžbina ${order.publicCode}, ${slotText(order, "sr")}`,
    text: [
      `Stigla je nova plaćena porudžbina ${order.publicCode} za ${bill.sellerName}.`,
      `Termin: ${slotText(order, "sr")}\n${fulfilmentText(order, bill)}`,
      buyerText(order),
      itemLines(bill, "sr"),
      `Jela i pića: ${priceSr(bill.subtotalRsd)}\nDostava: ${priceSr(bill.deliveryFeeRsd)}\nUkupno za račun: ${priceSr(bill.totalRsd)}`,
      ...(bill.hasDrinks ? ["Pića iz ovog računa nabavlja Servingo i dostavlja ih restoranu."] : []),
      `Potvrdi porudžbinu i javi kad je spremna: ${siteUrl()}${billUrl(bill.id)}`,
    ].join("\n\n"),
  };
}

function servingoDrinksMail(order: OrderWithBills, to: string, bills: Bill[]): Mail {
  return {
    to,
    subject: `Pića za porudžbinu ${order.publicCode}, ${slotText(order, "sr")}`,
    text: [
      `Porudžbina ${order.publicCode} je plaćena i ima pića koja nabavlja Servingo.`,
      `Termin: ${slotText(order, "sr")}`,
      ...bills.map((bill) =>
        [
          bill.restaurant ? `Za restoran ${bill.sellerName}` : "Samo pića, bez restorana",
          itemLines(bill, "sr", bill.items.filter((item) => item.isDrink)),
          fulfilmentText(order, bill),
        ].join("\n"),
      ),
      buyerText(order),
    ].join("\n\n"),
  };
}

const REFUND_REASONS = {
  late: "uplata je stigla posle isteka roka, a restorani više ne stižu za izabrani termin",
  duplicate: "porudžbina je već bila plaćena, pa je ovo druga uplata",
  amount: "iznos uplate se ne slaže sa iznosom porudžbine",
};

async function deliver(order: OrderWithBills, mails: { mail: Mail; recipient: "customer" | "restaurant" | "servingo"; template: string; billId?: string }[]) {
  await Promise.all(
    mails.map(async ({ mail, recipient, template, billId }) => {
      const { status, error } = await sendMail(mail);
      await prisma.notification.create({
        data: { orderId: order.id, billId, recipient, toEmail: mail.to, template, status, error },
      });
    }),
  );
}

/** The customer's confirmation, each restaurant's own bill, and Servingo's list of drinks to buy. */
export async function notifyPaidOrder(order: OrderWithBills) {
  const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
  const drinkBills = order.bills.filter((bill) => bill.hasDrinks);
  await deliver(order, [
    { mail: customerMail(order), recipient: "customer", template: "order-paid" },
    ...order.bills.flatMap((bill) =>
      bill.restaurant
        ? [{ mail: restaurantMail(order, { ...bill, restaurant: bill.restaurant }), recipient: "restaurant" as const, template: "bill-new", billId: bill.id }]
        : [],
    ),
    ...(drinkBills.length > 0
      ? [{ mail: servingoDrinksMail(order, settings.servingoOrdersEmail, drinkBills), recipient: "servingo" as const, template: "drinks" }]
      : []),
  ]);
}

/** Money was taken but cannot count for the order; Servingo returns it by hand until the bank is connected. */
export async function notifyRefundNeeded(order: OrderWithBills, reason: keyof typeof REFUND_REASONS) {
  const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
  await deliver(order, [
    {
      recipient: "servingo",
      template: `refund-${reason}`,
      mail: {
        to: settings.servingoOrdersEmail,
        subject: `Potreban povraćaj novca: ${order.publicCode}`,
        text: [
          `Za porudžbinu ${order.publicCode} treba vratiti novac kupcu: ${REFUND_REASONS[reason]}.`,
          `Iznos porudžbine: ${priceSr(order.totalRsd)}\nTermin: ${slotText(order, "sr")}`,
          buyerText(order),
        ].join("\n\n"),
      },
    },
  ]);
}
