import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/orders/route";
import { resetRateLimitForTests } from "@/lib/server/rate-limit";
import { DatabaseUnavailableError, IdempotencyConflictError } from "@/lib/server/errors";
import { submitOrder } from "@/services/order.service";

vi.mock("@/services/order.service", () => ({
  submitOrder: vi.fn(),
}));

function requestWithBody(body: unknown, headers?: HeadersInit): Request {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validPayload = {
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

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitForTests();
    process.env.ORDER_RATE_LIMIT_MAX = "20";
    process.env.ORDER_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.ORDER_REQUEST_MAX_BYTES = "16384";
  });

  it("returns 201 with success envelope for a valid request", async () => {
    vi.mocked(submitOrder).mockResolvedValue({
      id: 1,
      accessToken: "token",
      status: "pending",
      totalRsd: 1200,
      total: "1.200 RSD",
      subtotalRsd: 1000,
      deliveryFeeRsd: 200,
      orderSource: "db",
      idempotentReplay: false,
      smsDelivery: "skipped",
      emailDelivery: "skipped",
      customerPhone: "+381641234567",
      customerEmail: "marko@example.com",
    });

    const response = await POST(requestWithBody(validPayload, { "Idempotency-Key": "idem-key-1" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ success: true, data: { id: 1, totalRsd: 1200 } });
    expect(submitOrder).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 1 }), { idempotencyKey: "idem-key-1" });
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(requestWithBody("{bad-json"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ success: false, error: { code: "BAD_REQUEST" } });
  });

  it("returns 422 for invalid payload", async () => {
    const response = await POST(requestWithBody({ ...validPayload, items: [] }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
  });

  it("returns 503 when the database is unavailable", async () => {
    vi.mocked(submitOrder).mockRejectedValue(new DatabaseUnavailableError());

    const response = await POST(requestWithBody(validPayload));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ success: false, error: { code: "DATABASE_UNAVAILABLE" } });
  });

  it("returns 409 when the same idempotency key is used for a different payload", async () => {
    vi.mocked(submitOrder).mockRejectedValue(new IdempotencyConflictError());

    const response = await POST(requestWithBody(validPayload, { "Idempotency-Key": "idem-conflict-1" }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({ success: false, error: { code: "IDEMPOTENCY_CONFLICT" } });
  });

  it("returns 422 for invalid idempotency key format", async () => {
    const response = await POST(requestWithBody(validPayload, { "Idempotency-Key": "bad key" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(submitOrder).not.toHaveBeenCalled();
  });

  it("returns 413 when request body exceeds the configured limit", async () => {
    process.env.ORDER_REQUEST_MAX_BYTES = "64";

    const response = await POST(requestWithBody({ ...validPayload, note: "x".repeat(200) }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({ success: false, error: { code: "REQUEST_TOO_LARGE" } });
    expect(submitOrder).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    process.env.ORDER_RATE_LIMIT_MAX = "1";

    await POST(requestWithBody(validPayload));
    const response = await POST(requestWithBody(validPayload));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(body).toMatchObject({ success: false, error: { code: "RATE_LIMITED" } });
  });
});
