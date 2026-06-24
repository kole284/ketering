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

function parseRsd(value) {
  return Number(String(value).replace(/\./g, "").replace(" RSD", ""));
}

async function upsertCity(client, city) {
  const result = await client.query(
    `
      INSERT INTO cities (name, service_available)
      VALUES ($1, $2)
      ON CONFLICT (name)
      DO UPDATE SET
        service_available = EXCLUDED.service_available,
        updated_at = NOW()
      RETURNING id
    `,
    [city.name, city.isAvailable],
  );

  return result.rows[0].id;
}

async function upsertRestaurant(client, restaurant, cityId) {
  const result = await client.query(
    `
      INSERT INTO restaurants (
        id,
        city_id,
        name,
        cuisine,
        rating,
        eta,
        cover,
        description,
        address,
        min_order_rsd,
        delivery_fee_rsd
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id)
      DO UPDATE SET
        city_id = EXCLUDED.city_id,
        name = EXCLUDED.name,
        cuisine = EXCLUDED.cuisine,
        rating = EXCLUDED.rating,
        eta = EXCLUDED.eta,
        cover = EXCLUDED.cover,
        description = EXCLUDED.description,
        address = EXCLUDED.address,
        min_order_rsd = EXCLUDED.min_order_rsd,
        delivery_fee_rsd = EXCLUDED.delivery_fee_rsd,
        updated_at = NOW()
      RETURNING id
    `,
    [
      restaurant.id,
      cityId,
      restaurant.name,
      restaurant.cuisine,
      restaurant.rating,
      restaurant.eta,
      restaurant.cover,
      restaurant.description,
      restaurant.address,
      parseRsd(restaurant.minOrder),
      parseRsd(restaurant.deliveryFee),
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
        parseRsd(product.price),
        index + 1,
      ],
    );
  }
}

async function syncSequences(client) {
  await client.query("SELECT setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT MAX(id) FROM cities), 1), true)");
  await client.query("SELECT setval(pg_get_serial_sequence('restaurants', 'id'), COALESCE((SELECT MAX(id) FROM restaurants), 1), true)");
  await client.query("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1), true)");
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
