import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseUnavailableError } from "@/lib/server/errors";
import { submitOrder } from "@/services/order.service";
import { createOrderInTransaction } from "@/repositories/order.repository";

vi.mock("@/repositories/order.repository", () => ({
  createOrderInTransaction: vi.fn(),
  hashOrderRequest: vi.fn(() => "request-hash"),
  recordOrderEmailFailure: vi.fn(),
  recordOrderNotificationLog: vi.fn(),
  updateOrderNotificationStatus: vi.fn(),
}));

const payload = {
  restaurantId: 1,
  customerName: "Marko Marković",
  customerEmail: "marko@example.com",
  customerPhone: "+381641234567",
  eventAddress: "Bulevar 1",
  eventDate: "2026-07-13",
  eventTime: "12:00",
  sendSms: true,
  sendEmail: true,
  items: [{ productId: 1, quantity: 2 }],
};

describe("submitOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ORDER_NOTIFICATION_PHONE = "+381641111111";
  });

  it("returns a saved order and notification statuses", async () => {
    vi.mocked(createOrderInTransaction).mockResolvedValue({
      id: 10,
      accessToken: "token",
      status: "pending",
      totalRsd: 1200,
      total: "1.200 RSD",
      subtotalRsd: 1000,
      deliveryFeeRsd: 200,
      emailStatus: "pending",
      smsStatus: "pending",
      idempotentReplay: false,
      restaurantName: "Restoran",
      items: [{ productId: 1, name: "Ručak", quantity: 2, unitPriceRsd: 500, lineTotalRsd: 1000 }],
    });

    const deliverEmail = vi.fn().mockResolvedValue({ method: "skipped", message: "Email nije konfigurisan." });
    const deliverSms = vi.fn().mockResolvedValue({ method: "composer", smsLink: "sms:+381641111111" });

    const result = await submitOrder(payload, { deliverEmail, deliverSms, idempotencyKey: "idem-1" });

    expect(result.id).toBe(10);
    expect(result.orderSource).toBe("db");
    expect(result.totalRsd).toBe(1200);
    expect(result.smsDelivery).toBe("skipped");
    expect(result.emailDelivery).toBe("skipped");
    expect(deliverEmail).toHaveBeenCalledTimes(1);
    expect(deliverSms).toHaveBeenCalledTimes(1);
  });

  it("throws 503-style error and does not send notifications when database is unavailable", async () => {
    vi.mocked(createOrderInTransaction).mockRejectedValue(new Error("ECONNREFUSED"));
    const deliverEmail = vi.fn();
    const deliverSms = vi.fn();

    await expect(submitOrder(payload, { deliverEmail, deliverSms })).rejects.toBeInstanceOf(DatabaseUnavailableError);
    expect(deliverEmail).not.toHaveBeenCalled();
    expect(deliverSms).not.toHaveBeenCalled();
  });

  it("does not resend notifications for an idempotent replay", async () => {
    vi.mocked(createOrderInTransaction).mockResolvedValue({
      id: 10,
      status: "pending",
      totalRsd: 1200,
      total: "1.200 RSD",
      subtotalRsd: 1000,
      deliveryFeeRsd: 200,
      emailStatus: "skipped",
      smsStatus: "skipped",
      idempotentReplay: true,
      restaurantName: "Restoran",
      items: [{ productId: 1, name: "Ručak", quantity: 2, unitPriceRsd: 500, lineTotalRsd: 1000 }],
    });
    const deliverEmail = vi.fn();
    const deliverSms = vi.fn();

    const result = await submitOrder(payload, { deliverEmail, deliverSms, idempotencyKey: "idem-1" });

    expect(result.idempotentReplay).toBe(true);
    expect(deliverEmail).not.toHaveBeenCalled();
    expect(deliverSms).not.toHaveBeenCalled();
  });

  it("keeps a saved order when email delivery fails", async () => {
    vi.mocked(createOrderInTransaction).mockResolvedValue({
      id: 10,
      accessToken: "token",
      status: "pending",
      totalRsd: 1200,
      total: "1.200 RSD",
      subtotalRsd: 1000,
      deliveryFeeRsd: 200,
      emailStatus: "pending",
      smsStatus: "pending",
      idempotentReplay: false,
      restaurantName: "Restoran",
      items: [{ productId: 1, name: "Ručak", quantity: 2, unitPriceRsd: 500, lineTotalRsd: 1000 }],
    });
    const deliverEmail = vi.fn().mockRejectedValue(new Error("provider down"));
    const deliverSms = vi.fn().mockResolvedValue({ method: "composer", smsLink: "sms:+381641111111" });

    const result = await submitOrder(payload, { deliverEmail, deliverSms, idempotencyKey: "idem-1" });

    expect(result.id).toBe(10);
    expect(result.emailDelivery).toBe("failed");
    expect(result.smsDelivery).toBe("skipped");
  });
});
