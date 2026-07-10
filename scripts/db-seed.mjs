import { readFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Pool } from "pg";
import { loadEnvFiles } from "./load-env.mjs";

await loadEnvFiles();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL nije definisan.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleDataPath = resolve(__dirname, "../src/lib/server/sample-data.json");
const sampleData = JSON.parse(await readFile(sampleDataPath, "utf8"));

const pool = new Pool({ connectionString });

async function upsertCity(client, city) {
  const result = await client.query(
    `
      INSERT INTO cities (id, name, slug, service_available)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name)
      DO UPDATE SET
        slug = EXCLUDED.slug,
        service_available = EXCLUDED.service_available,
        updated_at = NOW()
      RETURNING id
    `,
    [city.id, city.name, city.slug, city.isAvailable],
  );

  return result.rows[0].id;
}

async function upsertRestaurant(client, restaurant, cityId) {
  const result = await client.query(
    `
      INSERT INTO restaurants (
        id,
        city_id,
        slug,
        name,
        cuisine,
        rating,
        eta,
        cover,
        description,
        address,
        min_order_rsd,
        delivery_fee_rsd,
        is_active,
        lead_time_minutes,
        timezone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id)
      DO UPDATE SET
        city_id = EXCLUDED.city_id,
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        cuisine = EXCLUDED.cuisine,
        rating = EXCLUDED.rating,
        eta = EXCLUDED.eta,
        cover = EXCLUDED.cover,
        description = EXCLUDED.description,
        address = EXCLUDED.address,
        min_order_rsd = EXCLUDED.min_order_rsd,
        delivery_fee_rsd = EXCLUDED.delivery_fee_rsd,
        is_active = EXCLUDED.is_active,
        lead_time_minutes = EXCLUDED.lead_time_minutes,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
      RETURNING id
    `,
    [
      restaurant.id,
      cityId,
      restaurant.slug,
      restaurant.name,
      restaurant.cuisine,
      restaurant.rating,
      restaurant.eta,
      restaurant.cover,
      restaurant.description,
      restaurant.address,
      restaurant.minOrderRsd,
      restaurant.deliveryFeeRsd,
      restaurant.isActive ?? true,
      restaurant.leadTimeMinutes ?? 60,
      restaurant.timezone ?? "Europe/Belgrade",
    ],
  );

  return result.rows[0].id;
}

async function replaceOffers(client, restaurantId, offers) {
  await client.query("DELETE FROM offers WHERE restaurant_id = $1", [restaurantId]);

  for (const [index, offer] of offers.entries()) {
    await client.query(
      `
        INSERT INTO offers (restaurant_id, text, sort_order)
        VALUES ($1, $2, $3)
      `,
      [restaurantId, offer, index + 1],
    );
  }
}

async function upsertProducts(client, restaurantId, products) {
  const productIds = products.map((product) => product.id);

  for (const [index, product] of products.entries()) {
    await client.query(
      `
        INSERT INTO products (
          id,
          restaurant_id,
          name,
          image,
          price_rsd,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id)
        DO UPDATE SET
          restaurant_id = EXCLUDED.restaurant_id,
          name = EXCLUDED.name,
          image = EXCLUDED.image,
          price_rsd = EXCLUDED.price_rsd,
          sort_order = EXCLUDED.sort_order
      `,
      [
        product.id,
        restaurantId,
        product.name,
        product.image,
        product.priceRsd,
        index + 1,
      ],
    );
  }

  if (productIds.length > 0) {
    await client.query(
      "DELETE FROM products WHERE restaurant_id = $1 AND id <> ALL($2::int[])",
      [restaurantId, productIds],
    );
  } else {
    await client.query("DELETE FROM products WHERE restaurant_id = $1", [restaurantId]);
  }
}

async function replaceWorkingHours(client, restaurantId, workingHours) {
  await client.query("DELETE FROM restaurant_working_hours WHERE restaurant_id = $1", [restaurantId]);

  for (const entry of workingHours) {
    await client.query(
      `
        INSERT INTO restaurant_working_hours (
          restaurant_id,
          day_of_week,
          opens_at,
          closes_at,
          is_closed
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [restaurantId, entry.dayOfWeek, entry.opensAt, entry.closesAt, entry.isClosed],
    );
  }
}

async function syncSequences(client) {
  await client.query("SELECT setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT MAX(id) FROM cities), 1), true)");
  await client.query("SELECT setval(pg_get_serial_sequence('restaurants', 'id'), COALESCE((SELECT MAX(id) FROM restaurants), 1), true)");
  await client.query("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), true)");
  await client.query("SELECT setval(pg_get_serial_sequence('restaurant_working_hours', 'id'), COALESCE((SELECT MAX(id) FROM restaurant_working_hours), 1), true)");
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cityIds = new Map();

    for (const city of sampleData.cities) {
      const cityId = await upsertCity(client, city);
      cityIds.set(city.name, cityId);
    }

    for (const restaurant of sampleData.restaurants) {
      const cityId = cityIds.get(restaurant.city);

      if (!cityId) {
        throw new Error(`Grad nije pronađen za restoran ${restaurant.name}: ${restaurant.city}`);
      }

      const restaurantId = await upsertRestaurant(client, restaurant, cityId);
      await replaceOffers(client, restaurantId, restaurant.offers);
      await upsertProducts(client, restaurantId, restaurant.products);
      await replaceWorkingHours(client, restaurantId, restaurant.workingHours ?? []);
    }

    const restaurantIds = sampleData.restaurants.map((restaurant) => restaurant.id);
    if (restaurantIds.length > 0) {
      await client.query("UPDATE restaurants SET is_active = FALSE WHERE id <> ALL($1::int[])", [restaurantIds]);
    }

    await syncSequences(client);
    await client.query("COMMIT");
    console.log(`Seed uspešno završen: ${sampleData.cities.length} gradova, ${sampleData.restaurants.length} restorana.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed neuspešan:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
