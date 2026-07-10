import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { formatRsd } from "@/lib/utils/money";
import {
  generateOrderAccessToken,
  verifyOrderAccessToken,
  hashOrderAccessToken,
} from "@/lib/server/order-access-token";
import type { NotificationStatus } from "@/lib/server/notification-status";
import {
  IdempotencyConflictError,
  InvalidOrderTimeError,
  MinimumOrderNotMetError,
  ProductNotFoundError,
  RestaurantNotFoundError,
  RestaurantUnavailableError,
} from "@/lib/server/errors";
import {
  getOrderTimeValidationMessage,
  validateRestaurantOrderTime,
} from "@/lib/order-time";

export type CreateOrderInput = {
  restaurantId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  note?: string;
  idempotencyKey?: string;
  requestHash?: string;
  referenceDate?: Date;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
};

export type OrderLineResult = {
  productId: number;
  name: string;
  quantity: number;
  unitPriceRsd: number;
  lineTotalRsd: number;
};

export type CreateOrderResult = {
  id: number;
  accessToken?: string;
  totalRsd: number;
  total: string;
  subtotalRsd: number;
  deliveryFeeRsd: number;
  status: string;
  emailStatus: NotificationStatus;
  smsStatus: NotificationStatus;
  idempotentReplay: boolean;
  restaurantName: string;
  items: OrderLineResult[];
};

function toEventDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toEventTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function stableOrderRequest(input: CreateOrderInput) {
  return {
    restaurantId: input.restaurantId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    eventAddress: input.eventAddress,
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    note: input.note ?? "",
    items: [...input.items].sort((a, b) => a.productId - b.productId),
  };
}

export function hashOrderRequest(input: CreateOrderInput): string {
  return createHash("sha256").update(JSON.stringify(stableOrderRequest(input))).digest("hex");
}

async function mapExistingOrder(orderId: bigint): Promise<CreateOrderResult> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      restaurant: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return {
    id: Number(order.id),
    totalRsd: order.totalRsd,
    total: formatRsd(order.totalRsd),
    subtotalRsd: order.subtotalRsd,
    deliveryFeeRsd: order.deliveryFeeRsd,
    status: order.status,
    emailStatus: order.emailStatus as NotificationStatus,
    smsStatus: order.smsStatus as NotificationStatus,
    idempotentReplay: true,
    restaurantName: order.restaurant.name,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      unitPriceRsd: item.unitPriceRsd,
      lineTotalRsd: item.unitPriceRsd * item.quantity,
    })),
  };
}

async function getExistingIdempotentOrder(input: {
  idempotencyKey: string;
  requestHash: string;
}): Promise<CreateOrderResult | null> {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: {
      id: true,
      idempotencyRequestHash: true,
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.idempotencyRequestHash !== input.requestHash) {
    throw new IdempotencyConflictError();
  }

  return mapExistingOrder(existing.id);
}

function isIdempotencyUniqueConflict(error: unknown): boolean {
  const target = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : undefined;

  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2002"
    && (Array.isArray(target) ? target.includes("idempotency_key") : target === "idempotency_key");
}

export async function createOrderInTransaction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const requestHash = input.requestHash ?? hashOrderRequest(input);

  if (input.idempotencyKey) {
    const existing = await getExistingIdempotentOrder({
      idempotencyKey: input.idempotencyKey,
      requestHash,
    });

    if (existing) {
      return existing;
    }
  }

  const accessToken = generateOrderAccessToken();
  const accessTokenHash = hashOrderAccessToken(accessToken);

  try {
    return await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.findUnique({
      where: {
        id: input.restaurantId,
      },
      include: {
        city: true,
        workingHours: {
          orderBy: [{ dayOfWeek: "asc" }],
        },
      },
    });

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    if (!restaurant.isActive || !restaurant.city.serviceAvailable) {
      throw new RestaurantUnavailableError();
    }

    const timeValidation = validateRestaurantOrderTime(
      {
        workingHours: restaurant.workingHours.map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          opensAt: entry.opensAt,
          closesAt: entry.closesAt,
          isClosed: entry.isClosed,
        })),
        leadTimeMinutes: restaurant.leadTimeMinutes,
        timezone: restaurant.timezone,
      },
      input.eventDate,
      input.eventTime,
      input.referenceDate,
    );

    if (!timeValidation.valid) {
      throw new InvalidOrderTimeError(getOrderTimeValidationMessage(timeValidation.reason));
    }

    const requestedQuantities = new Map<number, number>();

    for (const item of input.items) {
      requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) ?? 0) + item.quantity);
    }

    const products = await tx.product.findMany({
      where: {
        restaurantId: input.restaurantId,
        id: {
          in: Array.from(requestedQuantities.keys()),
        },
      },
      select: {
        id: true,
        name: true,
        priceRsd: true,
      },
    });

    if (products.length !== requestedQuantities.size) {
      throw new ProductNotFoundError();
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const lines: OrderLineResult[] = Array.from(requestedQuantities.entries()).map(([productId, quantity]) => {
      const product = productById.get(productId);

      if (!product) {
        throw new ProductNotFoundError();
      }

      return {
        productId,
        name: product.name,
        quantity,
        unitPriceRsd: product.priceRsd,
        lineTotalRsd: product.priceRsd * quantity,
      };
    });

    const subtotal = lines.reduce((sum, item) => sum + item.lineTotalRsd, 0);

    if (subtotal < restaurant.minOrderRsd) {
      throw new MinimumOrderNotMetError(`Minimalna vrednost porudžbine je ${formatRsd(restaurant.minOrderRsd)}.`);
    }

    const total = subtotal + restaurant.deliveryFeeRsd;
    const order = await tx.order.create({
      data: {
        restaurantId: input.restaurantId,
        idempotencyKey: input.idempotencyKey,
        idempotencyRequestHash: input.idempotencyKey ? requestHash : undefined,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        eventAddress: input.eventAddress,
        eventDate: toEventDate(input.eventDate),
        eventTime: toEventTime(input.eventTime),
        note: input.note ?? null,
        subtotalRsd: subtotal,
        deliveryFeeRsd: restaurant.deliveryFeeRsd,
        totalRsd: total,
        emailStatus: "pending",
        smsStatus: "pending",
        accessTokenHash,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPriceRsd: line.unitPriceRsd,
          })),
        },
      },
      select: {
        id: true,
        status: true,
        emailStatus: true,
        smsStatus: true,
      },
    });

    return {
      id: Number(order.id),
      accessToken,
      status: order.status,
      totalRsd: total,
      total: formatRsd(total),
      subtotalRsd: subtotal,
      deliveryFeeRsd: restaurant.deliveryFeeRsd,
      emailStatus: order.emailStatus as NotificationStatus,
      smsStatus: order.smsStatus as NotificationStatus,
      idempotentReplay: false,
      restaurantName: restaurant.name,
      items: lines,
    };
    });
  } catch (error) {
    if (input.idempotencyKey && isIdempotencyUniqueConflict(error)) {
      const existing = await getExistingIdempotentOrder({
        idempotencyKey: input.idempotencyKey,
        requestHash,
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}

export async function updateOrderNotificationStatus(input: {
  orderId: number;
  emailStatus?: NotificationStatus;
  smsStatus?: NotificationStatus;
}): Promise<void> {
  await prisma.order.update({
    where: { id: BigInt(input.orderId) },
    data: {
      ...(input.emailStatus ? { emailStatus: input.emailStatus } : {}),
      ...(input.smsStatus ? { smsStatus: input.smsStatus } : {}),
    },
  });
}

export async function recordOrderNotificationLog(input: {
  orderId: number;
  channel: "email" | "sms";
  provider?: string;
  status: NotificationStatus;
  message?: string;
  errorMessage?: string;
}): Promise<void> {
  await prisma.orderNotificationLog.create({
    data: {
      orderId: BigInt(input.orderId),
      channel: input.channel,
      provider: input.provider,
      status: input.status,
      message: input.message,
      errorMessage: input.errorMessage,
    },
  });
}

export async function recordOrderEmailFailure(input: {
  orderId: number;
  recipient: string;
  errorMessage: string;
}): Promise<void> {
  await prisma.orderEmailFailure.create({
    data: {
      orderId: BigInt(input.orderId),
      recipient: input.recipient,
      errorMessage: input.errorMessage,
    },
  });
}

export async function getOrderByIdAndAccessToken(input: {
  id: number;
  accessToken: string;
}) {
  const order = await prisma.order.findFirst({
    where: {
      id: BigInt(input.id),
    },
    include: {
      restaurant: true,
      items: {
        include: {
          product: true,
        },
        orderBy: [{ id: "asc" }],
      },
    },
  });

  if (!order) {
    return null;
  }

  if (!verifyOrderAccessToken(input.accessToken, order.accessTokenHash)) {
    return null;
  }

  return {
    id: Number(order.id),
    status: order.status,
    restaurant: {
      id: order.restaurant.id,
      name: order.restaurant.name,
    },
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    eventAddress: order.eventAddress,
    eventDate: order.eventDate.toISOString().slice(0, 10),
    eventTime: order.eventTime.toISOString().slice(11, 16),
    note: order.note,
    subtotalRsd: order.subtotalRsd,
    deliveryFeeRsd: order.deliveryFeeRsd,
    totalRsd: order.totalRsd,
    emailStatus: order.emailStatus,
    smsStatus: order.smsStatus,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      unitPriceRsd: item.unitPriceRsd,
      lineTotalRsd: item.unitPriceRsd * item.quantity,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}
