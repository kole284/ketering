import { NextResponse } from "next/server";
import { getRestaurantById } from "@/services/restaurant.service";
import { getCorsHeaders, noStoreHeaders } from "@/lib/server/cors";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json({ message: "Nevažeći ID restorana." }, { status: 400, headers: getCorsHeaders(request) });
  }

  try {
    const restaurant = await getRestaurantById(restaurantId);

    if (!restaurant) {
      return NextResponse.json({ message: "Restoran nije pronađen." }, { status: 404, headers: getCorsHeaders(request) });
    }

    return NextResponse.json(restaurant, { headers: noStoreHeaders(getCorsHeaders(request)) });
  } catch (error) {
    console.error(`GET /api/restaurants/${restaurantId} failed`, error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje restorana." },
      { status: 500, headers: getCorsHeaders(request) },
    );
  }
}
