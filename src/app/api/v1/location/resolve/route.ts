import { z } from "zod";
import { listCitiesWithSource } from "@/services/restaurant.service";
import { successResponse, errorResponse } from "@/lib/server/api-response";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";
import { toCityDto } from "@/lib/api/dto";
import { ValidationError } from "@/lib/server/errors";

export const runtime = "nodejs";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const cityBounds = [
  { slug: "beograd", minLat: 44.55, maxLat: 45.05, minLng: 20.15, maxLng: 20.75 },
  { slug: "novi-sad", minLat: 45.15, maxLat: 45.38, minLng: 19.70, maxLng: 20.02 },
  { slug: "nis", minLat: 43.20, maxLat: 43.42, minLng: 21.78, maxLng: 22.05 },
  { slug: "kragujevac", minLat: 43.93, maxLat: 44.10, minLng: 20.82, maxLng: 21.05 },
];

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

    const { lat, lng } = validation.data;
    const matchedBounds = cityBounds.find((entry) =>
      lat >= entry.minLat && lat <= entry.maxLat && lng >= entry.minLng && lng <= entry.maxLng,
    );

    const result = await listCitiesWithSource();
    const city = matchedBounds
      ? result.data.find((entry) => entry.slug === matchedBounds.slug) ?? null
      : null;

    const cityDto = city ? toCityDto(city) : null;

    return successResponse(
      {
        city: cityDto ? { ...cityDto, serviceAvailable: cityDto.isAvailable } : null,
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
