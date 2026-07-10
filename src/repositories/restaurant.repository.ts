import { prisma } from "@/lib/database/prisma";
import type { CityAvailability, Product, Restaurant, RestaurantWorkingHour } from "@/lib/types/restaurant";

type RestaurantRecord = Awaited<ReturnType<typeof getRestaurantRecordById>>;

function mapRestaurant(row: NonNullable<RestaurantRecord>): Restaurant {
  const products: Product[] = row.products.map((product) => ({
    id: product.id,
    name: product.name,
    image: product.image,
    priceRsd: product.priceRsd,
  }));

  const workingHours: RestaurantWorkingHour[] = row.workingHours.map((entry) => ({
    dayOfWeek: entry.dayOfWeek,
    opensAt: entry.opensAt,
    closesAt: entry.closesAt,
    isClosed: entry.isClosed,
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    cityId: row.city.id,
    city: row.city.name,
    citySlug: row.city.slug,
    cuisine: row.cuisine,
    rating: row.rating.toString(),
    eta: row.eta,
    cover: row.cover,
    description: row.description,
    address: row.address,
    minOrderRsd: row.minOrderRsd,
    deliveryFeeRsd: row.deliveryFeeRsd,
    leadTimeMinutes: row.leadTimeMinutes,
    timezone: row.timezone,
    isActive: row.isActive,
    offers: row.offers.map((offer) => offer.text),
    products,
    workingHours,
  };
}

async function getRestaurantRecordById(id: number) {
  return prisma.restaurant.findFirst({
    where: {
      id,
      isActive: true,
      city: {
        serviceAvailable: true,
      },
    },
    include: {
      city: true,
      offers: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      products: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      workingHours: {
        orderBy: [{ dayOfWeek: "asc" }],
      },
    },
  });
}

export async function listCitiesFromDatabase(): Promise<CityAvailability[]> {
  const rows = await prisma.city.findMany({
    orderBy: [
      {
        name: "asc",
      },
    ],
  });

  return rows
    .sort((a, b) => {
      const priority = new Map([
        ["Beograd", 1],
        ["Novi Sad", 2],
        ["Niš", 3],
        ["Kragujevac", 4],
      ]);

      return (priority.get(a.name) ?? 5) - (priority.get(b.name) ?? 5) || a.name.localeCompare(b.name);
    })
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      isAvailable: row.serviceAvailable,
    }));
}

export async function listRestaurantsFromDatabase(city?: string): Promise<Restaurant[]> {
  const rows = await prisma.restaurant.findMany({
    where: {
      isActive: true,
      city: {
        serviceAvailable: true,
        ...(city ? { name: city } : {}),
      },
    },
    include: {
      city: true,
      offers: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      products: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      workingHours: {
        orderBy: [{ dayOfWeek: "asc" }],
      },
    },
    orderBy: [{ rating: "desc" }, { id: "asc" }],
  });

  return rows.map(mapRestaurant);
}

export async function getRestaurantByIdFromDatabase(id: number): Promise<Restaurant | null> {
  const row = await getRestaurantRecordById(id);
  return row ? mapRestaurant(row) : null;
}
