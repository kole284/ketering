import process from "node:process";
import { Pool } from "pg";
import { loadEnvFiles } from "./load-env.mjs";

await loadEnvFiles();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL nije definisan.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const statements = [
  `
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      service_available BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      city_id INT NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      rating NUMERIC(2,1) NOT NULL,
      eta TEXT NOT NULL,
      cover TEXT NOT NULL,
      description TEXT NOT NULL,
      address TEXT NOT NULL,
      min_order_rsd INT NOT NULL,
      delivery_fee_rsd INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      price_rsd INT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      event_address TEXT NOT NULL,
      event_date DATE NOT NULL,
      event_time TIME NOT NULL,
      note TEXT,
      subtotal_rsd INT NOT NULL,
      delivery_fee_rsd INT NOT NULL,
      total_rsd INT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INT NOT NULL CHECK (quantity > 0),
      unit_price_rsd INT NOT NULL
    )
  `,
  `CREATE INDEX IF NOT EXISTS idx_restaurants_city_id ON restaurants(city_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id ON offers(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id)`,
];

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const statement of statements) {
      await client.query(statement);
    }

    await client.query("COMMIT");
    console.log("Migracija uspešno završena.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migracija neuspešna:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
