import { getRestaurantById } from "@/services/restaurant.service";
import { successResponse, errorResponse } from "@/lib/server/api-response";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";
import { toRestaurantDetailsDto } from "@/lib/api/dto";
import { BadRequestError, RestaurantNotFoundError } from "@/lib/server/errors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const restaurantId = Number(id);

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      throw new BadRequestError("Nevažeći ID restorana.");
    }

    const restaurant = await getRestaurantById(restaurantId);

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    return successResponse(toRestaurantDetailsDto(restaurant), {
      headers: noStoreHeaders(getCorsHeaders(request)),
    });
  } catch (error) {
    return errorResponse(error, { headers: getCorsHeaders(request) });
  }
}
