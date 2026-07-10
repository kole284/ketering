export type Product = {
  id: number;
  name: string;
  image: string;
  priceRsd: number;
};

export type RestaurantWorkingHour = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type Restaurant = {
  id: number;
  slug: string;
  name: string;
  city: string;
  cityId: number;
  citySlug: string;
  cuisine: string;
  rating: string;
  eta: string;
  cover: string;
  description: string;
  address: string;
  minOrderRsd: number;
  deliveryFeeRsd: number;
  leadTimeMinutes: number;
  timezone: string;
  isActive: boolean;
  offers: string[];
  products: Product[];
  workingHours: RestaurantWorkingHour[];
};

export type CityAvailability = {
  id: number;
  slug: string;
  name: string;
  isAvailable: boolean;
};
