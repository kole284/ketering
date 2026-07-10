import { fallbackCities, fallbackRestaurants } from "@/lib/server/fallback-data";
import type { CityAvailability, Restaurant } from "@/lib/types/restaurant";
import { isDatabaseUnavailableError } from "@/lib/server/errors";
import {
  getRestaurantByIdFromDatabase,
  listCitiesFromDatabase,
  listRestaurantsFromDatabase,
} from "@/repositories/restaurant.repository";

export type DataSource = "db" | "fallback";

export type DataResult<T> = {
  data: T;
  source: DataSource;
};

export function isExpectedDatabaseUnavailableError(error: unknown): boolean {
  return isDatabaseUnavailableError(error);
}

function getAvailableFallbackRestaurants(city?: string): Restaurant[] {
  const availableCityNames = new Set(
    fallbackCities.filter((entry) => entry.isAvailable).map((entry) => entry.name),
  );

  const availableRestaurants = fallbackRestaurants.filter((restaurant) =>
    restaurant.isActive && availableCityNames.has(restaurant.city),
  );

  if (!city) {
    return availableRestaurants;
  }

  return availableRestaurants.filter((restaurant) => restaurant.city === city);
}

export async function listCitiesWithSource(): Promise<DataResult<CityAvailability[]>> {
  try {
    return {
      data: await listCitiesFromDatabase(),
      source: "db",
    };
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("listCities fallback active", error);
    }

    return {
      data: fallbackCities,
      source: "fallback",
    };
  }
}

export async function listCities(): Promise<CityAvailability[]> {
  const result = await listCitiesWithSource();
  return result.data;
}

export async function listRestaurantsWithSource(city?: string): Promise<DataResult<Restaurant[]>> {
  try {
    return {
      data: await listRestaurantsFromDatabase(city),
      source: "db",
    };
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("listRestaurants fallback active", error);
    }

    return {
      data: getAvailableFallbackRestaurants(city),
      source: "fallback",
    };
  }
}

export async function listRestaurants(city?: string): Promise<Restaurant[]> {
  const result = await listRestaurantsWithSource(city);
  return result.data;
}

export async function getRestaurantById(id: number): Promise<Restaurant | null> {
  try {
    return await getRestaurantByIdFromDatabase(id);
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("getRestaurantById fallback active", error);
    }

    return getAvailableFallbackRestaurants().find((restaurant) => restaurant.id === id) ?? null;
  }
}
