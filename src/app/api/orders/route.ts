import { NextResponse } from "next/server";
import { fallbackRestaurants } from "@/lib/server/fallback-data";
import { createOrder, getRestaurantById } from "@/lib/server/restaurant-repository";
import { deliverOrderEmail } from "@/lib/server/email";
import {
  buildOrderSmsMessage,
  deliverOrderSms,
  normalizeSerbianPhoneNumber,
} from "@/lib/server/sms";
import { type ValidatedOrderPayload, validateOrderPayload } from "@/lib/server/order-validation";
import type { Restaurant } from "@/lib/types/restaurant";

export const runtime = "nodejs";

type OrderResult = {
  id: number;
  status: string;
  total: string;
  source: "db" | "fallback";
};

function formatRsd(value: number): string {
  return `${new Intl.NumberFormat("sr-RS").format(value)} RSD`;
}

function parseRsdPrice(value: string): number {
  return Number(value.replace(/\./g, "").replace(" RSD", ""));
}

function generateOfflineOrderId(): number {
  const randomSuffix = Math.floor(Math.random() * 900) + 100;
  return Number(`${Date.now()}${randomSuffix}`);
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("could not connect") ||
    message.includes("server closed the connection unexpectedly") ||
    message.includes("terminating connection") ||
    message.includes("relation ") ||
    message.includes("database")
  );
}

function buildFallbackOrder(bodyData: ValidatedOrderPayload, restaurantId: number) {
  const restaurant = fallbackRestaurants.find((entry) => entry.id === restaurantId);

  if (!restaurant) {
    throw new Error("Restoran nije pronadjen.");
  }

  const priceByProductId = new Map<number, number>(
    restaurant.products.map((product) => [product.id, parseRsdPrice(product.price)]),
  );

  for (const item of bodyData.items) {
    if (!priceByProductId.has(item.productId)) {
      throw new Error("Neki proizvodi nisu važeći za izabrani restoran.");
    }
  }

  const subtotal = bodyData.items.reduce((sum, item) => {
    const unitPrice = priceByProductId.get(item.productId) ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const deliveryFee = parseRsdPrice(restaurant.deliveryFee);
  const total = subtotal + deliveryFee;

  return {
    id: generateOfflineOrderId(),
    status: "pending",
    total: formatRsd(total),
    source: "fallback" as const,
  };
}

function buildEmailItems(restaurant: Restaurant, items: ValidatedOrderPayload["items"]) {
  return items.map((item) => {
    const product = restaurant.products.find((entry) => entry.id === item.productId);
    const unitPrice = product?.price ?? "0 RSD";
    const unitPriceValue = parseRsdPrice(unitPrice);

    return {
      name: product?.name ?? `Proizvod #${item.productId}`,
      quantity: item.quantity,
      unitPrice,
      lineTotal: formatRsd(unitPriceValue * item.quantity),
    };
  });
}

function getOrderNotificationPhone(): string {
  const configuredPhone = process.env.ORDER_NOTIFICATION_PHONE ?? "0605581104";
  const phone = normalizeSerbianPhoneNumber(configuredPhone);

  if (!phone) {
    throw new Error("Nevažeći broj za obaveštenje o porudžbini.");
  }

  return phone;
}

const ORDER_NOTIFICATION_PHONE = getOrderNotificationPhone();

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Nevažeći JSON payload." }, { status: 400 });
  }

  const validation = validateOrderPayload(body);

  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: 400 },
    );
  }

  const bodyData = validation.data;
  const restaurant = await getRestaurantById(bodyData.restaurantId);

  if (!restaurant) {
    return NextResponse.json({ message: "Restoran nije pronadjen." }, { status: 404 });
  }

  let order: OrderResult;

  try {
    const persistedOrder = await createOrder({
      restaurantId: bodyData.restaurantId,
      customerName: bodyData.customerName,
      customerEmail: bodyData.customerEmail,
      customerPhone: bodyData.customerPhone,
      eventAddress: bodyData.eventAddress,
      eventDate: bodyData.eventDate,
      eventTime: bodyData.eventTime,
      note: bodyData.note,
      items: bodyData.items,
    });

    order = {
      ...persistedOrder,
      source: "db",
    };
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      console.error("POST /api/orders failed", error);
      return NextResponse.json(
        { message: "Porudzbina nije sacuvana. Pokusaj ponovo." },
        { status: 500 },
      );
    }

    try {
      order = buildFallbackOrder(bodyData, bodyData.restaurantId);
      console.warn("POST /api/orders using fallback order storage", error);
    } catch (fallbackError) {
      const status = fallbackError instanceof Error && fallbackError.message.includes("nije pronadjen") ? 404 : 400;
      return NextResponse.json(
        {
          message:
            fallbackError instanceof Error ? fallbackError.message : "Porudzbina nije sacuvana.",
        },
        { status },
      );
    }
  }

  let smsResult: Awaited<ReturnType<typeof deliverOrderSms>> | null = null;
  let emailResult: Awaited<ReturnType<typeof deliverOrderEmail>> | null = null;

  if (bodyData.sendSms) {
    const smsMessage = buildOrderSmsMessage({
      orderId: order.id,
      restaurantName: restaurant.name,
      customerName: bodyData.customerName,
      total: order.total,
      eventAddress: bodyData.eventAddress,
      eventDate: bodyData.eventDate,
      eventTime: bodyData.eventTime,
      items: bodyData.items.map((item) => {
        const product = restaurant.products.find((entry) => entry.id === item.productId);
        return {
          name: product?.name ?? `Proizvod #${item.productId}`,
          quantity: item.quantity,
        };
      }),
      note: bodyData.note,
    });

    smsResult = await deliverOrderSms(ORDER_NOTIFICATION_PHONE, smsMessage);
  }

  if (bodyData.sendEmail) {
    try {
      emailResult = await deliverOrderEmail({
        orderId: order.id,
        restaurantName: restaurant.name,
        customerName: bodyData.customerName,
        customerEmail: bodyData.customerEmail,
        customerPhone: bodyData.customerPhone,
        total: order.total,
        eventAddress: bodyData.eventAddress,
        eventDate: bodyData.eventDate,
        eventTime: bodyData.eventTime,
        items: buildEmailItems(restaurant, bodyData.items),
        note: bodyData.note,
      });
    } catch (error) {
      console.warn("EmailJS delivery failed", error);
      emailResult = {
        method: "skipped",
        message: error instanceof Error ? error.message : "Email nije poslat.",
      };
    }
  }

  return NextResponse.json(
    {
      id: order.id,
      status: order.status,
      total: order.total,
      orderSource: order.source,
      smsDelivery: smsResult?.method ?? "none",
      smsLink: smsResult?.smsLink,
      smsRecipient: ORDER_NOTIFICATION_PHONE,
      emailDelivery: emailResult?.method ?? "none",
      emailMessage: emailResult?.message,
      customerPhone: bodyData.customerPhone,
      customerEmail: bodyData.customerEmail,
    },
    { status: 201 },
  );
}
