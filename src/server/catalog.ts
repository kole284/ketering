import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Service } from "@/generated/prisma/client";
import type { ServiceId } from "@/lib/booking";
import type { Config } from "@/lib/config";
import { SERVINGO_DRINKS, type MenuItem } from "@/lib/menu";
import type { Restaurant } from "@/lib/restaurants";
import { prisma } from "./db";

/** Revalidate this tag after changing restaurants, menus, drinks or settings. */
export const CATALOG_TAG = "catalog";

// The database enum uses underscores; URLs and the dictionaries use hyphens.
const serviceId = (service: Service) => service.replaceAll("_", "-") as ServiceId;

// Only what the site shows: the pickup address, order email and phone stay on the server.
const restaurantSelect = {
  id: true,
  name: true,
  area: true,
  leadTimeHours: true,
  ratingAvg: true,
  ratingCount: true,
  services: { select: { service: true } },
} as const;

type RestaurantRow = {
  id: string;
  name: string;
  area: string;
  leadTimeHours: number;
  ratingAvg: number | null;
  ratingCount: number;
  services: { service: Service }[];
};

const toRestaurant = ({ ratingAvg, services, ...row }: RestaurantRow): Restaurant => ({
  ...row,
  rating: ratingAvg,
  // Every restaurant also sells Servingo's drinks.
  services: [...services.map(({ service }) => serviceId(service)), "pica"],
});

type MenuItemRow = {
  id: string;
  restaurantId: string | null;
  service: Service;
  name: string;
  description: string;
  priceRsd: number;
  unit: MenuItem["unit"];
  unitNote: string | null;
  minQtyTenths: number;
  stepTenths: number;
  isPopular: boolean;
};

export const toMenuItem = (row: MenuItemRow): MenuItem => ({
  id: row.id,
  restaurantId: row.restaurantId ?? SERVINGO_DRINKS,
  service: serviceId(row.service),
  name: row.name,
  description: row.description,
  price: row.priceRsd,
  unit: row.unit,
  unitNote: row.unitNote ?? undefined,
  min: row.minQtyTenths / 10,
  step: row.stepTenths / 10,
  popular: row.isPopular,
});

async function menuItems(restaurantId: string | null) {
  const rows = await prisma.menuItem.findMany({
    where: { restaurantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toMenuItem);
}

export async function getRestaurants(): Promise<Restaurant[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const rows = await prisma.restaurant.findMany({
    where: { isActive: true },
    select: restaurantSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toRestaurant);
}

export async function getRestaurant(id: string): Promise<Restaurant | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const row = await prisma.restaurant.findFirst({ where: { id, isActive: true }, select: restaurantSelect });
  return row ? toRestaurant(row) : undefined;
}

export async function getDrinks(): Promise<MenuItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return menuItems(null);
}

/** A restaurant's own dishes plus Servingo's drinks. */
export async function getMenu(restaurantId: string): Promise<MenuItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const [dishes, drinks] = await Promise.all([menuItems(restaurantId), getDrinks()]);
  return [...dishes, ...drinks];
}

export async function getConfig(): Promise<Config> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const [settings, cities] = await Promise.all([
    prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.deliveryCity.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return {
    deliveryFee: settings.deliveryFeeRsd,
    platformFee: settings.platformFeeRsd,
    deliveryMinimum: settings.deliveryMinimumRsd,
    deliveryCities: cities.map((city) => city.name),
  };
}
