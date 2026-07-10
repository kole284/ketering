import { NextResponse } from "next/server";
import { listCitiesWithSource } from "@/services/restaurant.service";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const result = await listCitiesWithSource();
    return NextResponse.json(result.data, {
      headers: noStoreHeaders({
        "x-data-source": result.source,
        ...getCorsHeaders(request),
      }),
    });
  } catch (error) {
    console.error("GET /api/cities failed", error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje gradova." },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}
