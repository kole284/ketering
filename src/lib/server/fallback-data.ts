import sampleData from "@/lib/server/sample-data.json"
import type { CityAvailability, Restaurant } from "@/lib/types/restaurant"

export const fallbackCities: CityAvailability[] = sampleData.cities

export const fallbackRestaurants: Restaurant[] = sampleData.restaurants
