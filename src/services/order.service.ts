import { deliverOrderEmail, type EmailDeliveryResult } from "@/lib/server/email";
import {
  buildOrderSmsMessage,
  deliverOrderSms,
  normalizeSerbianPhoneNumber,
} from "@/lib/server/sms";
import { getOptionalServerEnv } from "@/lib/server/env";
import type { NotificationStatus } from "@/lib/server/notification-status";
import {
  DatabaseUnavailableError,
  isDatabaseUnavailableError,
} from "@/lib/server/errors";
import { formatRsd } from "@/lib/utils/money";
import type { ValidatedOrderPayload } from "@/lib/validation/order";
import {
  createOrderInTransaction,
  hashOrderRequest,
  recordOrderEmailFailure,
  recordOrderNotificationLog,
  updateOrderNotificationStatus,
  type CreateOrderResult,
} from "@/repositories/order.repository";

export type OrderSubmissionResult = {
  id: number;
  accessToken?: string;
  status: string;
  totalRsd: number;
  total: string;
  subtotalRsd: number;
  deliveryFeeRsd: number;
  orderSource: "db";
  idempotentReplay: boolean;
  smsDelivery: NotificationStatus;
  smsLink?: string;
  smsRecipient?: string;
  emailDelivery: NotificationStatus;
  emailMessage?: string;
  customerPhone: string;
  customerEmail: string;
};

export type SubmitOrderOptions = {
  idempotencyKey?: string;
  referenceDate?: Date;
  deliverEmail?: typeof deliverOrderEmail;
  deliverSms?: typeof deliverOrderSms;
};

function getOrderNotificationPhone(): string | null {
  const configuredPhone = getOptionalServerEnv().ORDER_NOTIFICATION_PHONE;

  if (!configuredPhone) {
    return null;
  }

  return normalizeSerbianPhoneNumber(configuredPhone);
}

async function safelyRecordNotificationLog(input: Parameters<typeof recordOrderNotificationLog>[0]) {
  try {
    await recordOrderNotificationLog(input);
  } catch (error) {
    console.warn("Notification logging failed", error);
  }
}

async function safelyUpdateNotificationStatus(input: Parameters<typeof updateOrderNotificationStatus>[0]) {
  try {
    await updateOrderNotificationStatus(input);
  } catch (error) {
    console.warn("Notification status update failed", error);
  }
}

async function recordEmailFailure(orderId: number, recipient: string, error: unknown): Promise<void> {
  try {
    await recordOrderEmailFailure({
      orderId,
      recipient,
      errorMessage: error instanceof Error ? error.message : "Email nije poslat.",
    });
  } catch (loggingError) {
    console.warn("Email failure logging failed", loggingError);
  }
}

function buildEmailItems(order: CreateOrderResult) {
  return order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: formatRsd(item.unitPriceRsd),
    lineTotal: formatRsd(item.lineTotalRsd),
  }));
}

export async function submitOrder(
  bodyData: ValidatedOrderPayload,
  options: SubmitOrderOptions = {},
): Promise<OrderSubmissionResult> {
  let order: CreateOrderResult;

  try {
    order = await createOrderInTransaction({
      restaurantId: bodyData.restaurantId,
      customerName: bodyData.customerName,
      customerEmail: bodyData.customerEmail,
      customerPhone: bodyData.customerPhone,
      eventAddress: bodyData.eventAddress,
      eventDate: bodyData.eventDate,
      eventTime: bodyData.eventTime,
      note: bodyData.note,
      items: bodyData.items,
      idempotencyKey: options.idempotencyKey,
      requestHash: hashOrderRequest({
        restaurantId: bodyData.restaurantId,
        customerName: bodyData.customerName,
        customerEmail: bodyData.customerEmail,
        customerPhone: bodyData.customerPhone,
        eventAddress: bodyData.eventAddress,
        eventDate: bodyData.eventDate,
        eventTime: bodyData.eventTime,
        note: bodyData.note,
        items: bodyData.items,
      }),
      referenceDate: options.referenceDate,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new DatabaseUnavailableError();
    }

    throw error;
  }

  let smsDelivery = order.smsStatus;
  let smsLink: string | undefined;
  let smsRecipient: string | undefined;
  let emailDelivery = order.emailStatus;
  let emailMessage: string | undefined;

  if (order.idempotentReplay) {
    return {
      id: order.id,
      accessToken: order.accessToken,
      status: order.status,
      totalRsd: order.totalRsd,
      total: order.total,
      subtotalRsd: order.subtotalRsd,
      deliveryFeeRsd: order.deliveryFeeRsd,
      orderSource: "db",
      idempotentReplay: true,
      smsDelivery,
      smsRecipient,
      emailDelivery,
      emailMessage,
      customerPhone: bodyData.customerPhone,
      customerEmail: bodyData.customerEmail,
    };
  }

  if (bodyData.sendSms) {
    const recipient = getOrderNotificationPhone();
    smsRecipient = recipient ?? undefined;

    if (!recipient) {
      smsDelivery = "skipped";
      await safelyUpdateNotificationStatus({ orderId: order.id, smsStatus: "skipped" });
      await safelyRecordNotificationLog({
        orderId: order.id,
        channel: "sms",
        status: "skipped",
        message: "ORDER_NOTIFICATION_PHONE nije konfigurisan.",
      });
    } else {
      const smsMessage = buildOrderSmsMessage({
        orderId: order.id,
        restaurantName: order.restaurantName,
        customerName: bodyData.customerName,
        total: order.total,
        eventAddress: bodyData.eventAddress,
        eventDate: bodyData.eventDate,
        eventTime: bodyData.eventTime,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
        })),
        note: bodyData.note,
      });

      const smsResult = await (options.deliverSms ?? deliverOrderSms)(recipient, smsMessage);
      smsDelivery = smsResult.method === "twilio" ? "sent" : "skipped";
      smsLink = smsResult.smsLink;
      await safelyUpdateNotificationStatus({ orderId: order.id, smsStatus: smsDelivery });
      await safelyRecordNotificationLog({
        orderId: order.id,
        channel: "sms",
        provider: smsResult.method,
        status: smsDelivery,
        message: smsResult.smsLink,
      });
    }
  } else {
    smsDelivery = "not_requested";
    await safelyUpdateNotificationStatus({ orderId: order.id, smsStatus: "not_requested" });
  }

  if (bodyData.sendEmail) {
    let emailResult: EmailDeliveryResult;

    try {
      emailResult = await (options.deliverEmail ?? deliverOrderEmail)({
        orderId: order.id,
        restaurantName: order.restaurantName,
        customerName: bodyData.customerName,
        customerEmail: bodyData.customerEmail,
        customerPhone: bodyData.customerPhone,
        total: order.total,
        eventAddress: bodyData.eventAddress,
        eventDate: bodyData.eventDate,
        eventTime: bodyData.eventTime,
        items: buildEmailItems(order),
        note: bodyData.note,
      });
    } catch (error) {
      console.warn("Order email delivery failed", error);
      await recordEmailFailure(order.id, bodyData.customerEmail, error);
      emailResult = {
        method: "skipped",
        message: "Email nije poslat.",
      };
      emailDelivery = "failed";
      emailMessage = emailResult.message;
      await safelyUpdateNotificationStatus({ orderId: order.id, emailStatus: "failed" });
      await safelyRecordNotificationLog({
        orderId: order.id,
        channel: "email",
        provider: emailResult.method,
        status: "failed",
        message: emailResult.message,
      });
      return {
        id: order.id,
        accessToken: order.accessToken,
        status: order.status,
        totalRsd: order.totalRsd,
        total: order.total,
        subtotalRsd: order.subtotalRsd,
        deliveryFeeRsd: order.deliveryFeeRsd,
        orderSource: "db",
        idempotentReplay: false,
        smsDelivery,
        smsLink,
        smsRecipient,
        emailDelivery,
        emailMessage,
        customerPhone: bodyData.customerPhone,
        customerEmail: bodyData.customerEmail,
      };
    }

    emailDelivery = emailResult.method === "resend" || emailResult.method === "emailjs" ? "sent" : "skipped";
    emailMessage = emailResult.message;
    await safelyUpdateNotificationStatus({ orderId: order.id, emailStatus: emailDelivery });
    await safelyRecordNotificationLog({
      orderId: order.id,
      channel: "email",
      provider: emailResult.method,
      status: emailDelivery,
      message: emailResult.message,
    });
  } else {
    emailDelivery = "not_requested";
    await safelyUpdateNotificationStatus({ orderId: order.id, emailStatus: "not_requested" });
  }

  return {
    id: order.id,
    accessToken: order.accessToken,
    status: order.status,
    totalRsd: order.totalRsd,
    total: order.total,
    subtotalRsd: order.subtotalRsd,
    deliveryFeeRsd: order.deliveryFeeRsd,
    orderSource: "db",
    idempotentReplay: false,
    smsDelivery,
    smsLink,
    smsRecipient,
    emailDelivery,
    emailMessage,
    customerPhone: bodyData.customerPhone,
    customerEmail: bodyData.customerEmail,
  };
}
