import { NextResponse } from "next/server";
import { listRestaurantsWithSource } from "@/services/restaurant.service";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim() || undefined;

    const result = await listRestaurantsWithSource(city);
    return NextResponse.json(result.data, {
      headers: noStoreHeaders({
        "x-data-source": result.source,
        ...getCorsHeaders(request),
      }),
    });
  } catch (error) {
    console.error("GET /api/restaurants failed", error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje restorana." },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}
