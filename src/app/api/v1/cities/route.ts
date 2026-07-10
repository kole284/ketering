import { listCitiesWithSource } from "@/services/restaurant.service";
import { successResponse, errorResponse } from "@/lib/server/api-response";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";
import { toCityDto } from "@/lib/api/dto";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const result = await listCitiesWithSource();
    return successResponse(
      result.data.map(toCityDto),
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
