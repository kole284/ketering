// Test data the frontend used before the database. Safe to run again: everything is upserted.
// Restaurants, addresses, emails and ratings are made up; never run this against production.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Service, type Unit } from "../src/generated/prisma/client";

config({ path: ".env", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL }),
});

const RESTAURANTS = [
  { id: "bistro-dorcol", name: "Bistro Dorćol", area: "Dorćol", ratingAvg: 4.6, ratingCount: 128, leadTimeHours: 24, services: ["ketering", "kuvana_jela"] },
  { id: "kuhinja-ognjiste", name: "Kuhinja Ognjište", area: "Vračar", ratingAvg: 4.8, ratingCount: 212, leadTimeHours: 48, services: ["ketering", "kuvana_jela"] },
  { id: "poslasticarnica-mila", name: "Poslastičarnica Mila", area: "Novi Beograd", ratingAvg: 4.9, ratingCount: 341, leadTimeHours: 72, services: ["torte_i_kolaci"] },
  { id: "gril-sokak", name: "Gril Sokak", area: "Zemun", ratingAvg: 4.7, ratingCount: 96, leadTimeHours: 12, services: ["ketering", "kuvana_jela"] },
  { id: "domaca-trpeza", name: "Domaća trpeza", area: "Zvezdara", ratingAvg: 4.5, ratingCount: 77, leadTimeHours: 24, services: ["kuvana_jela", "ketering"] },
  { id: "slatki-kutak", name: "Slatki kutak", area: "Banovo brdo", ratingAvg: 4.4, ratingCount: 59, leadTimeHours: 36, services: ["torte_i_kolaci"] },
] satisfies { services: Service[]; [key: string]: unknown }[];

type Draft = {
  service: Service;
  name: string;
  description: string;
  priceRsd: number;
  unit: Unit;
  unitNote?: string;
  /** In units, like the old frontend data; stored as tenths. */
  min?: number;
  step?: number;
  isPopular?: boolean;
};

const MENUS: Record<string, Draft[]> = {
  "bistro-dorcol": [
    { service: "ketering", name: "Mešano predjelo", description: "Pršuta, kulen, sirevi, masline i domaći hleb.", priceRsd: 3200, unit: "kg", isPopular: true },
    { service: "ketering", name: "Mini sendviči", description: "Tri vrste, sa šunkom, ćuretinom i grilovanim povrćem.", priceRsd: 140, unit: "kom", min: 20, step: 10 },
    { service: "kuvana_jela", name: "Sarma", description: "Kiseli kupus, mleveno meso i dimljena rebra.", priceRsd: 2400, unit: "kg", isPopular: true },
    { service: "kuvana_jela", name: "Pečena junetina sa krompirom", description: "Sporo pečena, sa mladim krompirom i ruzmarinom.", priceRsd: 3900, unit: "kg" },
  ],
  "kuhinja-ognjiste": [
    { service: "ketering", name: "Hladna plata", description: "Suhomesnato, sirevi, pohovani kačkavalj i salate.", priceRsd: 2900, unit: "kg", isPopular: true },
    { service: "ketering", name: "Ruske kiflice", description: "Lisnato testo sa šunkom i sirom.", priceRsd: 1800, unit: "kg" },
    { service: "kuvana_jela", name: "Gulaš", description: "Juneći gulaš sa paprikom i lukom.", priceRsd: 2600, unit: "kg", isPopular: true },
    { service: "kuvana_jela", name: "Punjene paprike", description: "Sa mlevenim mesom i pirinčem, u paradajz sosu.", priceRsd: 2200, unit: "kg" },
  ],
  "poslasticarnica-mila": [
    { service: "torte_i_kolaci", name: "Čokoladna torta", description: "Tamna čokolada, lešnik i ganaš.", priceRsd: 3800, unit: "kg", isPopular: true },
    { service: "torte_i_kolaci", name: "Reform torta", description: "Klasična, sa orasima i čokoladnim filom.", priceRsd: 4200, unit: "kg", isPopular: true },
    { service: "torte_i_kolaci", name: "Sitni kolači", description: "Mešani, oko 30 komada po kilogramu.", priceRsd: 2400, unit: "kg" },
  ],
  "gril-sokak": [
    { service: "ketering", name: "Mešano meso sa roštilja", description: "Ćevapi, pljeskavice, vešalica i kobasice.", priceRsd: 3600, unit: "kg", isPopular: true },
    { service: "ketering", name: "Ražnjići", description: "Svinjski i pileći, sa lukom i ajvarom.", priceRsd: 160, unit: "kom", min: 20, step: 10 },
    { service: "kuvana_jela", name: "Pasulj prebranac", description: "Pečeni pasulj sa crnim lukom.", priceRsd: 1700, unit: "kg" },
  ],
  "domaca-trpeza": [
    { service: "kuvana_jela", name: "Pasulj sa kobasicom", description: "Prebranac na domaći način.", priceRsd: 1900, unit: "kg" },
    { service: "kuvana_jela", name: "Musaka", description: "Krompir, mleveno meso i bešamel.", priceRsd: 2300, unit: "kg", isPopular: true },
    { service: "ketering", name: "Pita sa sirom", description: "Domaće kore, cela tepsija.", priceRsd: 2800, unit: "kom", unitNote: "tepsija, oko 2 kg", isPopular: true },
  ],
  "slatki-kutak": [
    { service: "torte_i_kolaci", name: "Torta sa malinama", description: "Vanila krem i sveže maline.", priceRsd: 3900, unit: "kg", isPopular: true },
    { service: "torte_i_kolaci", name: "Krempite", description: "Pakovanje od 12 komada.", priceRsd: 2400, unit: "paket", unitNote: "paket od 12 kom" },
  ],
};

const DRINKS: Draft[] = [
  { service: "pica", name: "Coca-Cola", description: "Staklena boca.", priceRsd: 1440, unit: "paket", unitNote: "paket od 8 × 0,33 l", isPopular: true },
  { service: "pica", name: "Kisela voda", description: "Gazirana mineralna voda.", priceRsd: 960, unit: "paket", unitNote: "paket od 6 × 1,5 l" },
  { service: "pica", name: "Negazirana voda", description: "Prirodna izvorska voda.", priceRsd: 840, unit: "paket", unitNote: "paket od 6 × 1,5 l" },
  { service: "pica", name: "Sok od pomorandže", description: "100% voćni sok.", priceRsd: 1500, unit: "paket", unitNote: "paket od 6 × 1 l" },
  { service: "pica", name: "Pivo, lager", description: "Svetlo pivo u limenci.", priceRsd: 2160, unit: "paket", unitNote: "paket od 12 × 0,5 l", isPopular: true },
  { service: "pica", name: "Crno vino, Prokupac", description: "Suvo, berba 2023.", priceRsd: 7200, unit: "paket", unitNote: "paket od 6 × 0,75 l" },
  { service: "pica", name: "Belo vino, Tamjanika", description: "Aromatično, berba 2024.", priceRsd: 6600, unit: "paket", unitNote: "paket od 6 × 0,75 l" },
];

const DELIVERY_CITIES = ["Beograd", "Barajevo", "Grocka", "Lazarevac", "Mladenovac", "Obrenovac", "Sopot", "Surčin", "Pančevo"];

// Ids match the old frontend data ("bistro-dorcol-1", "servingo-pica-1"), so saved carts keep working.
function menuItem(prefix: string, restaurantId: string | null, draft: Draft, index: number) {
  const { min, step, ...rest } = draft;
  const defaultStep = draft.unit === "kg" ? 0.5 : 1;
  return {
    ...rest,
    id: `${prefix}-${index + 1}`,
    restaurantId,
    minQtyTenths: Math.round((min ?? 1) * 10),
    stepTenths: Math.round((step ?? defaultStep) * 10),
    sortOrder: index,
  };
}

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, deliveryFeeRsd: 400, platformFeeRsd: 150, deliveryMinimumRsd: 4000 },
    update: {},
  });

  for (const [sortOrder, name] of DELIVERY_CITIES.entries()) {
    await prisma.deliveryCity.upsert({ where: { name }, create: { name, sortOrder }, update: { sortOrder } });
  }

  for (const { services, ...restaurant } of RESTAURANTS) {
    const data = {
      ...restaurant,
      pickupAddress: "Test adresa 1",
      city: "Beograd",
      orderEmail: `${restaurant.id}@example.com`,
      phone: "+381 11 000 0000",
    };
    await prisma.restaurant.upsert({ where: { id: restaurant.id }, create: data, update: data });
    await prisma.restaurantService.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.restaurantService.createMany({
      data: services.map((service) => ({ restaurantId: restaurant.id, service })),
    });
  }

  const items = [
    ...Object.entries(MENUS).flatMap(([restaurantId, drafts]) =>
      drafts.map((draft, i) => menuItem(restaurantId, restaurantId, draft, i)),
    ),
    ...DRINKS.map((draft, i) => menuItem("servingo-pica", null, draft, i)),
  ];
  for (const item of items) {
    await prisma.menuItem.upsert({ where: { id: item.id }, create: item, update: item });
  }

  console.log(`Seeded ${RESTAURANTS.length} restaurants, ${items.length} menu items, ${DELIVERY_CITIES.length} cities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
