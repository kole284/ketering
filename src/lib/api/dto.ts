import { formatRsd } from "@/lib/utils/money";
import type { CityAvailability, Product, Restaurant } from "@/lib/types/restaurant";

export type CityDto = {
  id: number;
  slug: string;
  name: string;
  isAvailable: boolean;
};

export type ProductDto = {
  id: number;
  name: string;
  image: string;
  priceRsd: number;
  priceDisplay: string;
};

export type RestaurantSummaryDto = {
  id: number;
  slug: string;
  name: string;
  city: CityDto;
  cuisine: string;
  rating: string;
  eta: string;
  cover: string;
  description: string;
  address: string;
  minOrderRsd: number;
  minOrderDisplay: string;
  deliveryFeeRsd: number;
  deliveryFeeDisplay: string;
  leadTimeMinutes: number;
  timezone: string;
  offers: string[];
};

export type RestaurantDetailsDto = RestaurantSummaryDto & {
  products: ProductDto[];
  workingHours: Restaurant["workingHours"];
};

export function toCityDto(city: CityAvailability): CityDto {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    isAvailable: city.isAvailable,
  };
}

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    image: product.image,
    priceRsd: product.priceRsd,
    priceDisplay: formatRsd(product.priceRsd),
  };
}

export function toRestaurantSummaryDto(restaurant: Restaurant): RestaurantSummaryDto {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    city: {
      id: restaurant.cityId,
      slug: restaurant.citySlug,
      name: restaurant.city,
      isAvailable: true,
    },
    cuisine: restaurant.cuisine,
    rating: restaurant.rating,
    eta: restaurant.eta,
    cover: restaurant.cover,
    description: restaurant.description,
    address: restaurant.address,
    minOrderRsd: restaurant.minOrderRsd,
    minOrderDisplay: formatRsd(restaurant.minOrderRsd),
    deliveryFeeRsd: restaurant.deliveryFeeRsd,
    deliveryFeeDisplay: formatRsd(restaurant.deliveryFeeRsd),
    leadTimeMinutes: restaurant.leadTimeMinutes,
    timezone: restaurant.timezone,
    offers: restaurant.offers,
  };
}

export function toRestaurantDetailsDto(restaurant: Restaurant): RestaurantDetailsDto {
  return {
    ...toRestaurantSummaryDto(restaurant),
    products: restaurant.products.map(toProductDto),
    workingHours: restaurant.workingHours,
  };
}

