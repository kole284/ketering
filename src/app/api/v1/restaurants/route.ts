import { z } from "zod";
import { listRestaurantsWithSource } from "@/services/restaurant.service";
import { successResponse, errorResponse } from "@/lib/server/api-response";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";
import { toRestaurantSummaryDto } from "@/lib/api/dto";
import { ValidationError } from "@/lib/server/errors";

export const runtime = "nodejs";

const querySchema = z.object({
  city: z.string().trim().min(1).optional(),
  sort: z.enum(["rating_desc", "name_asc"]).optional().default("rating_desc"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const validation = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0]?.message ?? "Nevalidni query parametri.");
    }

    const { city, sort, limit, offset } = validation.data;
    const result = await listRestaurantsWithSource(city);
    const sorted = [...result.data].sort((first, second) => {
      if (sort === "name_asc") {
        return first.name.localeCompare(second.name);
      }

      return Number.parseFloat(second.rating) - Number.parseFloat(first.rating);
    });
    const paged = sorted.slice(offset, offset + limit);

    return successResponse(
      {
        items: paged.map(toRestaurantSummaryDto),
        pagination: {
          limit,
          offset,
          total: sorted.length,
        },
      },
      {
        headers: noStoreHeaders({
          ...getCorsHeaders(request),
          "x-data-source": result.source,
        }),
      },
    );
  } catch (error) {
    return errorResponse(error, { headers: getCorsHeaders(request) });
  }
}
