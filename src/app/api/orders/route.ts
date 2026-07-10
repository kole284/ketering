import { getValidationMessage, orderPayloadSchema } from "@/lib/validation/order";
import { submitOrder } from "@/services/order.service";
import { errorResponse, successResponse } from "@/lib/server/api-response";
import { BadRequestError, RateLimitedError, RequestTooLargeError, ValidationError } from "@/lib/server/errors";
import { getOptionalServerEnv } from "@/lib/server/env";
import { checkRateLimit, getRateLimitKey } from "@/lib/server/rate-limit";
import { getCorsHeaders } from "@/lib/server/cors";
import { readJsonWithLimit } from "@/lib/server/request";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

function parseIdempotencyKey(request: Request): string | undefined {
  const value = request.headers.get("idempotency-key")?.trim();

  if (!value) {
    return undefined;
  }

  if (value.length < 8 || value.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
    throw new ValidationError("Idempotency-Key mora imati 8-200 karaktera i sme sadržati slova, brojeve, tačku, donju crtu, dvotačku ili crticu.");
  }

  return value;
}

export async function POST(request: Request) {
  const env = getOptionalServerEnv();
  const maxBytes = env.ORDER_REQUEST_MAX_BYTES ?? 16_384;

  const rateLimit = checkRateLimit({
    key: `orders:${getRateLimitKey(request)}`,
    limit: env.ORDER_RATE_LIMIT_MAX ?? 20,
    windowMs: env.ORDER_RATE_LIMIT_WINDOW_MS ?? 60_000,
  });

  if (!rateLimit.allowed) {
    return errorResponse(new RateLimitedError(), {
      headers: {
        ...getCorsHeaders(request),
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    });
  }

  let body: unknown;
  let idempotencyKey: string | undefined;

  try {
    idempotencyKey = parseIdempotencyKey(request);
    body = await readJsonWithLimit(request, maxBytes);
  } catch (error) {
    if (error instanceof RequestTooLargeError || error instanceof BadRequestError || error instanceof ValidationError) {
      return errorResponse(error, { headers: getCorsHeaders(request) });
    }

    return errorResponse(new BadRequestError("Nevažeći JSON payload."), { headers: getCorsHeaders(request) });
  }

  const validation = orderPayloadSchema.safeParse(body);

  if (!validation.success) {
    return errorResponse(new ValidationError(getValidationMessage(validation.error)), { headers: getCorsHeaders(request) });
  }

  try {
    const result = await submitOrder(validation.data, { idempotencyKey });
    return successResponse(result, { status: result.idempotentReplay ? 200 : 201, headers: getCorsHeaders(request) });
  } catch (error) {
    console.error("POST /api/orders failed", error);
    return errorResponse(error, { headers: getCorsHeaders(request) });
  }
}
