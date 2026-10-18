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

type Draft = Omit<MenuItem, "id" | "restaurantId" | "step" | "min"> & { step?: number; min?: number };

function items(restaurantId: string, drafts: Draft[]): MenuItem[] {
  return drafts.map((d, i) => ({
    id: `${restaurantId}-${i + 1}`,
    restaurantId,
    step: d.unit === "kg" ? 0.5 : 1,
    min: 1,
    ...d,
  }));
}

// Placeholder menus until the backend is decided.
export const MENU: MenuItem[] = [
  ...items("bistro-dorcol", [
    { service: "ketering", name: "Mešano predjelo", description: "Pršuta, kulen, sirevi, masline i domaći hleb.", price: 3200, unit: "kg", popular: true },
    { service: "ketering", name: "Mini sendviči", description: "Tri vrste, sa šunkom, ćuretinom i grilovanim povrćem.", price: 140, unit: "kom", min: 20, step: 10 },
    { service: "kuvana-jela", name: "Sarma", description: "Kiseli kupus, mleveno meso i dimljena rebra.", price: 2400, unit: "kg", popular: true },
    { service: "kuvana-jela", name: "Pečena junetina sa krompirom", description: "Sporo pečena, sa mladim krompirom i ruzmarinom.", price: 3900, unit: "kg" },
    { service: "pica", name: "Coca-Cola", description: "Staklena boca.", price: 1440, unit: "paket", unitNote: "paket od 8 × 0,33 l", popular: true },
    { service: "pica", name: "Kisela voda", description: "Gazirana mineralna voda.", price: 960, unit: "paket", unitNote: "paket od 6 × 1,5 l" },
  ]),
  ...items("kuhinja-ognjiste", [
    { service: "ketering", name: "Hladna plata", description: "Suhomesnato, sirevi, pohovani kačkavalj i salate.", price: 2900, unit: "kg", popular: true },
    { service: "ketering", name: "Ruske kiflice", description: "Lisnato testo sa šunkom i sirom.", price: 1800, unit: "kg" },
    { service: "kuvana-jela", name: "Gulaš", description: "Juneći gulaš sa paprikom i lukom.", price: 2600, unit: "kg", popular: true },
    { service: "kuvana-jela", name: "Punjene paprike", description: "Sa mlevenim mesom i pirinčem, u paradajz sosu.", price: 2200, unit: "kg" },
  ]),
  ...items("poslasticarnica-mila", [
    { service: "torte-i-kolaci", name: "Čokoladna torta", description: "Tamna čokolada, lešnik i ganaš.", price: 3800, unit: "kg", popular: true },
    { service: "torte-i-kolaci", name: "Reform torta", description: "Klasična, sa orasima i čokoladnim filom.", price: 4200, unit: "kg", popular: true },
    { service: "torte-i-kolaci", name: "Sitni kolači", description: "Mešani, oko 30 komada po kilogramu.", price: 2400, unit: "kg" },
  ]),
  ...items("vinoteka-sokak", [
    { service: "pica", name: "Crno vino, Prokupac", description: "Suvo, berba 2023.", price: 7200, unit: "paket", unitNote: "paket od 6 × 0,75 l", popular: true },
    { service: "pica", name: "Belo vino, Tamjanika", description: "Aromatično, berba 2024.", price: 6600, unit: "paket", unitNote: "paket od 6 × 0,75 l" },
    { service: "pica", name: "Pivo, lager", description: "Svetlo pivo u limenci.", price: 2160, unit: "paket", unitNote: "paket od 12 × 0,5 l", popular: true },
    { service: "pica", name: "Coca-Cola", description: "Staklena boca.", price: 1400, unit: "paket", unitNote: "paket od 8 × 0,33 l" },
  ]),
  ...items("domaca-trpeza", [
    { service: "kuvana-jela", name: "Pasulj sa kobasicom", description: "Prebranac na domaći način.", price: 1900, unit: "kg" },
    { service: "kuvana-jela", name: "Musaka", description: "Krompir, mleveno meso i bešamel.", price: 2300, unit: "kg", popular: true },
    { service: "ketering", name: "Pita sa sirom", description: "Domaće kore, cela tepsija.", price: 2800, unit: "kom", unitNote: "tepsija, oko 2 kg", popular: true },
  ]),
  ...items("slatki-kutak", [
    { service: "torte-i-kolaci", name: "Torta sa malinama", description: "Vanila krem i sveže maline.", price: 3900, unit: "kg", popular: true },
    { service: "torte-i-kolaci", name: "Krempite", description: "Pakovanje od 12 komada.", price: 2400, unit: "paket", unitNote: "paket od 12 kom" },
    { service: "pica", name: "Domaća limunada", description: "Sveže ceđena, u staklenim flašama.", price: 1800, unit: "paket", unitNote: "paket od 6 × 1 l", popular: true },
  ]),
];

export const menuFor = (restaurantId: string) =>
  MENU.filter((item) => item.restaurantId === restaurantId);

export const findItem = (id: string) => MENU.find((item) => item.id === id);

export const DRINKS = MENU.filter((item) => item.service === "pica");

export const DELIVERY_FEE = 400;
export const PLATFORM_FEE = 150;
/** Each restaurant's bill must reach this for delivery; below it the customer picks up in person. */
export const DELIVERY_MINIMUM = 4000;

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
