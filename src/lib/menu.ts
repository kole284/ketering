import { INTL_LOCALE, plural, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import type { ServiceId } from "./booking";

export type Unit = "kg" | "kom" | "porcija" | "paket";

export type MenuItem = {
  id: string;
  restaurantId: string;
  service: ServiceId;
  name: string;
  description: string;
  /** Price in RSD for one unit. */
  price: number;
  unit: Unit;
  /** Shown next to the price, e.g. "paket od 8 × 0,33 l". Defaults to the unit. */
  unitNote?: string;
  /** Quantity step and minimum; kg goes in halves. */
  step: number;
  min: number;
  /** Shown in the restaurant's "Bestsellers" strip. */
  popular?: boolean;
};

/** Drinks are bought and supplied by Servingo itself, so every restaurant offers the same list. */
export const SERVINGO_DRINKS = "servingo-pica";

export const isDrink = (item: Pick<MenuItem, "restaurantId">) => item.restaurantId === SERVINGO_DRINKS;

export function formatPrice(amount: number, locale: Locale, t: Dictionary) {
  const number = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${number} ${t.units.currency}`;
}

export function formatQuantity(item: Pick<MenuItem, "unit">, quantity: number, locale: Locale, t: Dictionary) {
  if (item.unit === "kg") {
    return `${new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 }).format(quantity)} ${t.units.kg}`;
  }
  if (item.unit === "paket") return plural(locale, quantity, t.units.paket);
  if (item.unit === "porcija") return plural(locale, quantity, t.units.porcija);
  return `${quantity} ${t.units.kom}`;
}

const UNIT_KEY = { kg: "kg", kom: "kom", porcija: "perPortion", paket: "perPack" } as const;

// unitNote comes from restaurant data and is not translated.
export const priceLabel = (item: MenuItem, locale: Locale, t: Dictionary) =>
  `${formatPrice(item.price, locale, t)} / ${item.unitNote ?? t.units[UNIT_KEY[item.unit]]}`;
