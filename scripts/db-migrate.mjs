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
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,
  `
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      service_available BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      city_id INT NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      rating NUMERIC(2,1) NOT NULL,
      eta TEXT NOT NULL,
      cover TEXT NOT NULL,
      description TEXT NOT NULL,
      address TEXT NOT NULL,
      min_order_rsd INT NOT NULL,
      delivery_fee_rsd INT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      lead_time_minutes INT NOT NULL DEFAULT 60,
      timezone TEXT NOT NULL DEFAULT 'Europe/Belgrade',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS restaurant_working_hours (
      id SERIAL PRIMARY KEY,
      restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
      opens_at VARCHAR(5),
      closes_at VARCHAR(5),
      is_closed BOOLEAN NOT NULL DEFAULT FALSE,
      CONSTRAINT restaurant_working_hours_restaurant_day_key UNIQUE (restaurant_id, day_of_week)
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
      idempotency_key TEXT UNIQUE,
      idempotency_request_hash TEXT,
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
      email_status TEXT NOT NULL DEFAULT 'not_requested',
      sms_status TEXT NOT NULL DEFAULT 'not_requested',
      access_token_hash TEXT NOT NULL UNIQUE,
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
  `
    CREATE TABLE IF NOT EXISTS order_email_failures (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      recipient TEXT NOT NULL,
      error_message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_notification_logs (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      provider TEXT,
      status TEXT NOT NULL,
      message TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `ALTER TABLE cities ADD COLUMN IF NOT EXISTS slug TEXT`,
  `UPDATE cities SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL OR slug = ''`,
  `ALTER TABLE cities ALTER COLUMN slug SET NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cities_slug_key ON cities(slug)`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug TEXT`,
  `UPDATE restaurants SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL OR slug = ''`,
  `ALTER TABLE restaurants ALTER COLUMN slug SET NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_key ON restaurants(slug)`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lead_time_minutes INT NOT NULL DEFAULT 60`,
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Belgrade'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_request_hash TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_requested'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_status TEXT NOT NULL DEFAULT 'not_requested'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token_hash TEXT`,
  `
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'access_token'
      ) THEN
        UPDATE orders
        SET access_token_hash = encode(digest(access_token, 'sha256'), 'hex')
        WHERE access_token_hash IS NULL AND access_token IS NOT NULL AND access_token <> '';

        ALTER TABLE orders ALTER COLUMN access_token DROP DEFAULT;
        ALTER TABLE orders ALTER COLUMN access_token DROP NOT NULL;
        UPDATE orders SET access_token = NULL WHERE access_token IS NOT NULL;
      END IF;
    END $$;
  `,
  `UPDATE orders SET access_token_hash = encode(digest(gen_random_uuid()::text, 'sha256'), 'hex') WHERE access_token_hash IS NULL OR access_token_hash = ''`,
  `ALTER TABLE orders ALTER COLUMN access_token_hash SET NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS orders_access_token_hash_key ON orders(access_token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_restaurants_city_id ON restaurants(city_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id ON offers(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_restaurant_working_hours_restaurant_id ON restaurant_working_hours(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_email_failures_order_id ON order_email_failures(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_notification_logs_order_id ON order_notification_logs(order_id)`,
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
