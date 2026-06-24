import { NextResponse } from "next/server";
import { getRestaurantById } from "@/lib/server/restaurant-repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json({ message: "Nevažeći ID restorana." }, { status: 400 });
  }

  try {
    const restaurant = await getRestaurantById(restaurantId);

    if (!restaurant) {
      return NextResponse.json({ message: "Restoran nije pronadjen." }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error(`GET /api/restaurants/${restaurantId} failed`, error);
    return NextResponse.json(
      { message: "Neuspešno učitavanje restorana." },
      { status: 500 },
    );
  }
}
