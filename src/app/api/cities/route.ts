import { NextResponse } from "next/server";
import { listCitiesWithSource } from "@/lib/server/restaurant-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await listCitiesWithSource();
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
    console.error("GET /api/cities failed", error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje gradova." },
      { status: 500 },
    );
  }
}
