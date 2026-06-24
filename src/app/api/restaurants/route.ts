import { NextResponse } from "next/server";
import { listRestaurantsWithSource } from "@/lib/server/restaurant-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim() || undefined;

    const result = await listRestaurantsWithSource(city);
    return NextResponse.json(result.data, {
      headers: {
        "x-data-source": result.source,
        "Access-Control-Expose-Headers": "x-data-source",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("GET /api/restaurants failed", error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje restorana." },
      { status: 500 },
    );
  }
}
