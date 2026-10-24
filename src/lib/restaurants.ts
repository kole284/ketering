import { plural, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import { belgradeNow, slotTime, type Booking, type ServiceId } from "./booking";

/** What the site shows of a restaurant; loaded by `src/server/catalog.ts`. */
export type Restaurant = {
  id: string;
  name: string;
  area: string;
  /** Null until the restaurant has its first review. */
  rating: number | null;
  ratingCount: number;
  /** Minimum hours between ordering and delivery. */
  leadTimeHours: number;
  /** Always includes "pica": every restaurant sells Servingo's drinks. */
  services: ServiceId[];
};

export function availableRestaurants(restaurants: Restaurant[], booking: Booking) {
  const now = belgradeNow();
  const slot =
    booking.date && booking.hour !== undefined
      ? slotTime(booking.date, booking.hour)
      : undefined;
  const query = booking.query?.toLocaleLowerCase("sr");

  return restaurants.filter((restaurant) => {
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
