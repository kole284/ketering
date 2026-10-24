import "server-only";
import { createHash, randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import { TIME_SLOTS, belgradeNow, slotTime, type Method } from "@/lib/booking";
import { SERVINGO_DRINKS, isDrink, type MenuItem } from "@/lib/menu";
import { SERVINGO_SELLER, priceBills } from "@/lib/pricing";
import { toMenuItem } from "./catalog";
import { prisma } from "./db";
import { notifyPaidOrder, notifyRefundNeeded } from "./notifications";
import { paymentProvider, type PaymentResult } from "./payments";
import { randomToken, safeEqual } from "./signing";

export type CartInput = {
  lines: { itemId: string; restaurantId: string; quantity: number }[];
  date?: string;
  hour?: number;
  method: Method;
  /** A delivery city, or anything else (e.g. "drugo") for a place without delivery. */
  city?: string;
};

export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  buyerType: "fizicko" | "pravno";
  companyName?: string;
  pib?: string;
  mb?: string;
};

export type OrderError =
  | { code: "empty_cart" }
  | { code: "no_slot" }
  | { code: "item_unavailable"; name?: string }
  | { code: "bad_quantity"; name: string }
  | { code: "too_late"; restaurant: string }
  | { code: "city_required" }
  | { code: "invalid_details"; fields: string[] }
  | { code: "price_changed"; total: number }
  | { code: "payments_unavailable" };

const MAX_LINES = 100;

/**
 * Works the cart out again from the database: current prices, active restaurants, lead times,
 * delivery cities and fees. Nothing from the browser is trusted except ids and quantities.
 */
export async function quoteOrder(input: CartInput) {
  const errors: OrderError[] = [];
  if (input.lines.length === 0 || input.lines.length > MAX_LINES) return { errors: [{ code: "empty_cart" }] as OrderError[] };

  const restaurantIds = [...new Set(input.lines.map((line) => line.restaurantId))].filter((id) => id !== SERVINGO_DRINKS);
  const [settings, cities, rows, restaurants] = await Promise.all([
    prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.deliveryCity.findMany({ where: { isActive: true }, select: { name: true } }),
    prisma.menuItem.findMany({ where: { id: { in: input.lines.map((line) => line.itemId) }, isActive: true } }),
    prisma.restaurant.findMany({
      where: { id: { in: restaurantIds }, isActive: true },
      select: { id: true, name: true, leadTimeHours: true },
    }),
  ]);
  const items = new Map(rows.map((row) => [row.id, row]));
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  const lines = input.lines.flatMap((line) => {
    const row = items.get(line.itemId);
    if (!row) {
      errors.push({ code: "item_unavailable" });
      return [];
    }
    const item = toMenuItem(row);
    // Dishes go on their own restaurant's bill; drinks on the restaurant they were ordered with, or Servingo's.
    const sellerOk = isDrink(item)
      ? line.restaurantId === SERVINGO_DRINKS || restaurantById.has(line.restaurantId)
      : item.restaurantId === line.restaurantId && restaurantById.has(line.restaurantId);
    if (!sellerOk) {
      errors.push({ code: "item_unavailable", name: item.name });
      return [];
    }
    const tenths = Math.round(line.quantity * 10);
    const quantityOk =
      Number.isFinite(line.quantity) &&
      Math.abs(line.quantity * 10 - tenths) < 1e-6 &&
      tenths >= row.minQtyTenths &&
      (tenths - row.minQtyTenths) % row.stepTenths === 0 &&
      tenths <= 100_000;
    if (!quantityOk) {
      errors.push({ code: "bad_quantity", name: item.name });
      return [];
    }
    const restaurantName =
      line.restaurantId === SERVINGO_DRINKS ? SERVINGO_SELLER.name : restaurantById.get(line.restaurantId)!.name;
    return [{ item, row, quantity: tenths / 10, tenths, restaurantId: line.restaurantId, restaurantName }];
  });

  // The slot must be one of the hourly slots and far enough ahead for every restaurant in the order.
  const slotOk =
    input.date !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.date) &&
    !Number.isNaN(Date.parse(input.date)) &&
    TIME_SLOTS.some((slot) => slot.hour === input.hour);
  if (!slotOk) {
    errors.push({ code: "no_slot" });
  } else {
    const ahead = slotTime(input.date!, input.hour!) - belgradeNow();
    if (ahead <= 0) errors.push({ code: "no_slot" });
    for (const id of new Set(lines.map((line) => line.restaurantId))) {
      const restaurant = restaurantById.get(id);
      if (restaurant && ahead < restaurant.leadTimeHours * 3_600_000) errors.push({ code: "too_late", restaurant: restaurant.name });
    }
  }

  if (input.method === "dostava" && !input.city) errors.push({ code: "city_required" });
  const cityOk = input.method === "dostava" && cities.some((city) => city.name === input.city);

  const fees = {
    deliveryFee: settings.deliveryFeeRsd,
    platformFee: settings.platformFeeRsd,
    deliveryMinimum: settings.deliveryMinimumRsd,
  };
  const quote = priceBills(lines, fees, { method: input.method, cityOk });
  // Fresh copies of the cart's items, so the browser can update what it shows.
  const catalog: MenuItem[] = lines.map((line) => line.item);
  return { errors, quote, settings, catalog };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const trim = (value: string | undefined, max: number) => value?.trim().slice(0, max) || undefined;

function checkCustomer(customer: CustomerInput, needsAddress: boolean) {
  const fields: string[] = [];
  const name = trim(customer.name, 120);
  const email = trim(customer.email, 200);
  const phone = trim(customer.phone, 40);
  const address = trim(customer.address, 300);
  if (!name || name.length < 2) fields.push("name");
  if (!email || !EMAIL.test(email)) fields.push("email");
  if (!phone || !/^\+?[\d\s/()-]{6,}$/.test(phone)) fields.push("phone");
  if (needsAddress && (!address || address.length < 4)) fields.push("address");
  const company = customer.buyerType === "pravno";
  const companyName = company ? trim(customer.companyName, 200) : undefined;
  const pib = company ? trim(customer.pib, 9) : undefined;
  const mb = company ? trim(customer.mb, 8) : undefined;
  if (company && !companyName) fields.push("companyName");
  if (company && !/^\d{9}$/.test(pib ?? "")) fields.push("pib");
  if (company && !/^\d{8}$/.test(mb ?? "")) fields.push("mb");
  return { fields, customer: { name: name!, email: email!, phone: phone!, address, companyName, pib, mb } };
}

// No 0/O or 1/I, so codes read back over the phone.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newPublicCode = () =>
  `SRV-${Array.from({ length: 5 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("")}`;

/**
 * Creates the order and its bills, waiting for payment, and returns the payment page to open.
 * The same browser key with the same cart and details returns the existing order instead of a second one.
 */
export async function createOrder({
  cart,
  customer: rawCustomer,
  clientKey,
  expectedTotal,
  locale,
}: {
  cart: CartInput;
  customer: CustomerInput;
  clientKey: string;
  /** The total the customer saw; if the server's differs, they confirm the new amount first. */
  expectedTotal: number;
  locale: Locale;
}): Promise<{ ok: true; code: string; redirectUrl: string } | { ok: false; errors: OrderError[]; catalog?: MenuItem[] }> {
  const provider = paymentProvider();
  if (!provider) return { ok: false, errors: [{ code: "payments_unavailable" }] };

  const quoted = await quoteOrder(cart);
  if (!quoted.quote) return { ok: false, errors: quoted.errors };
  const { errors, quote, settings, catalog } = quoted;
  const { fields, customer } = checkCustomer(rawCustomer, quote.needsAddress);
  if (fields.length > 0) errors.push({ code: "invalid_details", fields });
  if (errors.length > 0) return { ok: false, errors, catalog };
  if (quote.total !== expectedTotal) return { ok: false, errors: [{ code: "price_changed", total: quote.total }], catalog };

  const idempotencyKey = createHash("sha256")
    .update(JSON.stringify([clientKey, cart, customer, rawCustomer.buyerType, quote.total]))
    .digest("base64url");
  const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existing && existing.status === "pending_payment" && existing.expiresAt > new Date()) {
    return { ok: true, code: existing.publicCode, redirectUrl: provider.startPayment(existing) };
  }
  if (existing) return { ok: false, errors: [{ code: "price_changed", total: quote.total }], catalog };

  const data = {
    accessToken: randomToken(),
    locale,
    deliveryDate: new Date(`${cart.date}T00:00:00Z`),
    slotHour: cart.hour!,
    method: cart.method,
    city: cart.method === "dostava" ? trim(cart.city, 100) : undefined,
    address: quote.needsAddress ? customer.address : undefined,
    customerName: customer.name,
    email: customer.email,
    phone: customer.phone,
    buyerType: rawCustomer.buyerType,
    companyName: customer.companyName,
    pib: customer.pib,
    mb: customer.mb,
    totalRsd: quote.total,
    idempotencyKey,
    expiresAt: new Date(Date.now() + settings.pendingPaymentMinutes * 60_000),
    bills: {
      create: quote.bills.map((bill) => ({
        restaurantId: bill.restaurant.id === SERVINGO_DRINKS ? null : bill.restaurant.id,
        sellerName: bill.restaurant.name,
        fulfilment: bill.delivery ? ("delivery" as const) : ("pickup" as const),
        pickupReason: bill.pickupReason,
        subtotalRsd: bill.subtotal,
        deliveryFeeRsd: bill.deliveryFee,
        platformFeeRsd: bill.platformFee,
        totalRsd: bill.total,
        hasDrinks: bill.notifyServingo,
        items: {
          create: bill.lines.map((line, i) => ({
            menuItemId: line.item.id,
            name: line.item.name,
            unit: line.item.unit,
            unitNote: line.item.unitNote,
            unitPriceRsd: line.item.price,
            quantityTenths: line.tenths,
            lineTotalRsd: line.total,
            isDrink: isDrink(line.item),
            sortOrder: i,
          })),
        },
      })),
    },
  };

  // A clash on the five-character code is rare; try a new one a few times.
  for (let attempt = 0; ; attempt++) {
    try {
      const order = await prisma.order.create({ data: { ...data, publicCode: newPublicCode() } });
      return { ok: true, code: order.publicCode, redirectUrl: provider.startPayment(order) };
    } catch (error) {
      const clash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!clash || attempt >= 4) throw error;
      const raced = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (raced) return { ok: true, code: raced.publicCode, redirectUrl: provider.startPayment(raced) };
    }
  }
}

/** A pending order past its payment window counts as cancelled, whether or not cleanup has run. */
export const effectiveStatus = (order: { status: string; expiresAt: Date }) =>
  order.status === "pending_payment" && order.expiresAt <= new Date() ? "cancelled" : order.status;

const orderWithBills = {
  bills: {
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      restaurant: { select: { pickupAddress: true, city: true, orderEmail: true, phone: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithBills = Prisma.OrderGetPayload<{ include: typeof orderWithBills }>;

/** The order for its status page; null unless the token matches. */
export async function getOrderForCustomer(code: string, token: string | undefined) {
  if (!token) return null;
  const order = await prisma.order.findUnique({ where: { publicCode: code }, include: orderWithBills });
  if (!order || !safeEqual(order.accessToken, token)) return null;
  return order;
}

/** Whether every restaurant in the order can still make the slot. */
function slotStillPossible(order: OrderWithBills, leadTimes: Map<string, number>) {
  const ahead = slotTime(order.deliveryDate.toISOString().slice(0, 10), order.slotHour) - belgradeNow();
  return ahead > 0 && order.bills.every((bill) => !bill.restaurantId || ahead >= (leadTimes.get(bill.restaurantId) ?? 0) * 3_600_000);
}

/**
 * Records what the payment provider reported. Safe to call twice with the same result.
 * Emails go out once, when the order first becomes paid.
 */
export async function recordPayment(provider: string, result: PaymentResult) {
  const order = await prisma.order.findUnique({ where: { publicCode: result.publicCode }, include: orderWithBills });
  if (!order) return null;

  try {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider,
        providerRef: result.providerRef,
        amountRsd: result.amountRsd,
        status: result.succeeded ? "succeeded" : "failed",
        rawPayload: result.raw,
      },
    });
  } catch (error) {
    // Already recorded: the provider (or the browser) sent the same result again.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { order, outcome: "duplicate" as const };
    throw error;
  }

  if (!result.succeeded) {
    await prisma.order.updateMany({ where: { id: order.id, status: "pending_payment" }, data: { status: "payment_failed" } });
    return { order, outcome: "failed" as const };
  }
  // Money was taken but cannot count for this order: Servingo has to return it.
  if (result.amountRsd !== order.totalRsd || order.status === "paid") {
    await notifyRefundNeeded(order, result.amountRsd !== order.totalRsd ? "amount" : "duplicate");
    return { order, outcome: "refund" as const };
  }

  // Paid after the window closed: keep it only if every restaurant can still make the slot.
  if (order.expiresAt <= new Date() || order.status === "cancelled") {
    const leadTimes = new Map(
      (
        await prisma.restaurant.findMany({
          where: { id: { in: order.bills.flatMap((bill) => (bill.restaurantId ? [bill.restaurantId] : [])) } },
          select: { id: true, leadTimeHours: true },
        })
      ).map((r) => [r.id, r.leadTimeHours]),
    );
    if (!slotStillPossible(order, leadTimes)) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
      await notifyRefundNeeded(order, "late");
      return { order, outcome: "refund" as const };
    }
  }

  // Only the first successful result moves the order to paid and sends the emails.
  const { count } = await prisma.order.updateMany({
    where: { id: order.id, status: { in: ["pending_payment", "payment_failed", "cancelled"] } },
    data: { status: "paid", paidAt: new Date() },
  });
  if (count === 1) await notifyPaidOrder(order);
  return { order, outcome: "paid" as const };
}

/** A new payment attempt for an order that failed or was left unpaid, while its window is still open. */
export async function retryPayment(code: string, token: string) {
  const provider = paymentProvider();
  const order = await getOrderForCustomer(code, token);
  if (!provider || !order || order.expiresAt <= new Date()) return null;
  if (order.status !== "pending_payment" && order.status !== "payment_failed") return null;
  await prisma.order.update({ where: { id: order.id }, data: { status: "pending_payment" } });
  return provider.startPayment(order);
}

/** Marks pending orders past their window as cancelled; run by the cleanup cron. */
export async function cancelExpiredOrders() {
  const { count } = await prisma.order.updateMany({
    where: { status: { in: ["pending_payment", "payment_failed"] }, expiresAt: { lte: new Date() } },
    data: { status: "cancelled" },
  });
  return count;
}
