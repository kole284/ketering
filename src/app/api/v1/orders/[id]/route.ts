import { getOrderByIdAndAccessToken } from "@/repositories/order.repository";
import { successResponse, errorResponse } from "@/lib/server/api-response";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";
import { BadRequestError, OrderNotFoundError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const orderId = Number(id);
    const accessToken = request.headers.get("x-order-access-token")?.trim();

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestError("Nevažeći ID porudžbine.");
    }

    if (!accessToken) {
      throw new BadRequestError("Nedostaje X-Order-Access-Token header.");
    }

    const order = await getOrderByIdAndAccessToken({ id: orderId, accessToken });

    if (!order) {
      throw new OrderNotFoundError();
    }

    return successResponse(order, {
      headers: noStoreHeaders(getCorsHeaders(request)),
    });
  } catch (error) {
    return errorResponse(error, { headers: getCorsHeaders(request) });
  }
}
