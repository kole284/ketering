import { plural, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import { belgradeNow, slotTime, type Booking, type ServiceId } from "./booking";

export type Restaurant = {
  id: string;
  name: string;
  area: string;
  rating: number;
  ratingCount: number;
  /** Minimum hours between ordering and delivery. */
  leadTimeHours: number;
  services: ServiceId[];
};

// Placeholder data until the backend is decided.
export const RESTAURANTS: Restaurant[] = [
  {
    id: "bistro-dorcol",
    name: "Bistro Dorćol",
    area: "Dorćol",
    rating: 4.6,
    ratingCount: 128,
    leadTimeHours: 24,
    services: ["ketering", "kuvana-jela", "pica"],
  },
  {
    id: "kuhinja-ognjiste",
    name: "Kuhinja Ognjište",
    area: "Vračar",
    rating: 4.8,
    ratingCount: 212,
    leadTimeHours: 48,
    services: ["ketering", "kuvana-jela"],
  },
  {
    id: "poslasticarnica-mila",
    name: "Poslastičarnica Mila",
    area: "Novi Beograd",
    rating: 4.9,
    ratingCount: 341,
    leadTimeHours: 72,
    services: ["torte-i-kolaci"],
  },
  {
    id: "vinoteka-sokak",
    name: "Vinoteka Sokak",
    area: "Zemun",
    rating: 4.7,
    ratingCount: 96,
    leadTimeHours: 12,
    services: ["pica"],
  },
  {
    id: "domaca-trpeza",
    name: "Domaća trpeza",
    area: "Zvezdara",
    rating: 4.5,
    ratingCount: 77,
    leadTimeHours: 24,
    services: ["kuvana-jela", "ketering"],
  },
  {
    id: "slatki-kutak",
    name: "Slatki kutak",
    area: "Banovo brdo",
    rating: 4.4,
    ratingCount: 59,
    leadTimeHours: 36,
    services: ["torte-i-kolaci", "pica"],
  },
];

export function findRestaurant(id: string) {
  return RESTAURANTS.find((restaurant) => restaurant.id === id);
}

export function availableRestaurants(booking: Booking) {
  const now = belgradeNow();
  const slot =
    booking.date && booking.hour !== undefined
      ? slotTime(booking.date, booking.hour)
      : undefined;
  const query = booking.query?.toLocaleLowerCase("sr");

  return RESTAURANTS.filter((restaurant) => {
    if (
      booking.services.length > 0 &&
      !booking.services.some((service) => restaurant.services.includes(service))
    ) {
      return false;
    }
    if (query && !restaurant.name.toLocaleLowerCase("sr").includes(query)) {
      return false;
    }
    if (slot !== undefined && slot - now < restaurant.leadTimeHours * 3_600_000) {
      return false;
    }
    return true;
  });
}

export function leadTimeLabel(hours: number, locale: Locale, t: Dictionary) {
  const time =
    hours % 24 === 0 && hours > 24
      ? plural(locale, hours / 24, t.restaurants.days)
      : plural(locale, hours, t.restaurants.hours);
  return t.restaurants.leadTime.replace("{time}", time);
}
