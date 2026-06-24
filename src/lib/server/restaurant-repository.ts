import { getDbPool, query } from "@/lib/server/db";
import { fallbackCities, fallbackRestaurants } from "@/lib/server/fallback-data";
import type { CityAvailability, Product, Restaurant } from "@/lib/types/restaurant";

type RestaurantRow = {
  id: number;
  name: string;
  city: string;
  cuisine: string;
  rating: string | number;
  eta: string;
  cover: string;
  description: string;
  address: string;
  min_order_rsd: number;
  delivery_fee_rsd: number;
  offers: string[];
  products: Array<{
    id: number;
    name: string;
    image: string;
    price_rsd: number;
  }>;
};

type OrderProductRow = {
  id: number;
  price_rsd: number;
};

export type DataSource = "db" | "fallback";

export type DataResult<T> = {
  data: T;
  source: DataSource;
};

export type CreateOrderInput = {
  restaurantId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventAddress: string;
  eventDate: string;
  eventTime: string;
  note?: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
};

export type CreateOrderResult = {
  id: number;
  total: string;
  status: string;
};

function isExpectedDatabaseUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("could not connect") ||
    message.includes("the database system is starting up")
  );
}

function formatRsd(value: number): string {
  return `${new Intl.NumberFormat("sr-RS").format(value)} RSD`;
}

function mapRestaurant(row: RestaurantRow): Restaurant {
  const products: Product[] = row.products.map((product) => ({
    id: product.id,
    name: product.name,
    image: product.image,
    price: formatRsd(product.price_rsd),
  }));

  return {
    id: row.id,
    name: row.name,
    city: row.city,
    cuisine: row.cuisine,
    rating: String(row.rating),
    eta: row.eta,
    cover: row.cover,
    description: row.description,
    address: row.address,
    minOrder: formatRsd(row.min_order_rsd),
    deliveryFee: formatRsd(row.delivery_fee_rsd),
    offers: row.offers,
    products,
  };
}

export async function listCitiesWithSource(): Promise<DataResult<CityAvailability[]>> {
  try {
    const result = await query<{ name: string; service_available: boolean }>(
      `
        SELECT name, service_available
        FROM cities
        ORDER BY
          CASE
            WHEN name = 'Beograd' THEN 1
            WHEN name = 'Novi Sad' THEN 2
            WHEN name = 'Niš' THEN 3
            WHEN name = 'Kragujevac' THEN 4
            ELSE 5
          END,
          name ASC
      `,
    );

    return {
      data: result.rows.map((row) => ({
        name: row.name,
        isAvailable: row.service_available,
      })),
      source: "db",
    };
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("listCities fallback active", error);
    }
    return {
      data: fallbackCities,
      source: "fallback",
    };
  }
}

export async function listCities(): Promise<CityAvailability[]> {
  const result = await listCitiesWithSource();
  return result.data;
}

export async function listRestaurantsWithSource(city?: string): Promise<DataResult<Restaurant[]>> {
  try {
    const params: unknown[] = [];
    const where: string[] = ["c.service_available = TRUE"];

    if (city) {
      params.push(city);
      where.push(`c.name = $${params.length}`);
    }

    const result = await query<RestaurantRow>(
      `
        SELECT
          r.id,
          r.name,
          c.name AS city,
          r.cuisine,
          r.rating,
          r.eta,
          r.cover,
          r.description,
          r.address,
          r.min_order_rsd,
          r.delivery_fee_rsd,
          COALESCE(
            (
              SELECT json_agg(o.text ORDER BY o.sort_order, o.id)
              FROM offers o
              WHERE o.restaurant_id = r.id
            ),
            '[]'::json
          ) AS offers,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'image', p.image,
                  'price_rsd', p.price_rsd
                )
                ORDER BY p.sort_order, p.id
              )
              FROM products p
              WHERE p.restaurant_id = r.id
            ),
            '[]'::json
          ) AS products
        FROM restaurants r
        JOIN cities c ON c.id = r.city_id
        WHERE ${where.join(" AND ")}
        ORDER BY r.rating DESC, r.id ASC
      `,
      params,
    );

    return {
      data: result.rows.map(mapRestaurant),
      source: "db",
    };
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("listRestaurants fallback active", error);
    }

    const availableCityNames = new Set(
      fallbackCities.filter((entry) => entry.isAvailable).map((entry) => entry.name),
    );

    const availableRestaurants = fallbackRestaurants.filter((restaurant) =>
      availableCityNames.has(restaurant.city),
    );

    if (!city) {
      return {
        data: availableRestaurants,
        source: "fallback",
      };
    }

    return {
      data: availableRestaurants.filter((restaurant) => restaurant.city === city),
      source: "fallback",
    };
  }
}

export async function listRestaurants(city?: string): Promise<Restaurant[]> {
  const result = await listRestaurantsWithSource(city);
  return result.data;
}

export async function getRestaurantById(id: number): Promise<Restaurant | null> {
  try {
    const result = await query<RestaurantRow>(
      `
        SELECT
          r.id,
          r.name,
          c.name AS city,
          r.cuisine,
          r.rating,
          r.eta,
          r.cover,
          r.description,
          r.address,
          r.min_order_rsd,
          r.delivery_fee_rsd,
          COALESCE(
            (
              SELECT json_agg(o.text ORDER BY o.sort_order, o.id)
              FROM offers o
              WHERE o.restaurant_id = r.id
            ),
            '[]'::json
          ) AS offers,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'image', p.image,
                  'price_rsd', p.price_rsd
                )
                ORDER BY p.sort_order, p.id
              )
              FROM products p
              WHERE p.restaurant_id = r.id
            ),
            '[]'::json
          ) AS products
        FROM restaurants r
        JOIN cities c ON c.id = r.city_id
        WHERE r.id = $1 AND c.service_available = TRUE
        LIMIT 1
      `,
      [id],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapRestaurant(result.rows[0]);
  } catch (error) {
    if (!isExpectedDatabaseUnavailableError(error)) {
      console.warn("getRestaurantById fallback active", error);
    }

    const availableCityNames = new Set(
      fallbackCities.filter((entry) => entry.isAvailable).map((entry) => entry.name),
    );

    return (
      fallbackRestaurants.find(
        (restaurant) => restaurant.id === id && availableCityNames.has(restaurant.city),
      ) ?? null
    );
  }
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");

    const productsResult = await client.query<OrderProductRow>(
      `
        SELECT p.id, p.price_rsd
        FROM products p
        JOIN restaurants r ON r.id = p.restaurant_id
        WHERE r.id = $1 AND p.id = ANY($2::int[])
      `,
      [
        input.restaurantId,
        input.items.map((item) => item.productId),
      ],
    );

    const priceByProductId = new Map<number, number>(
      productsResult.rows.map((row) => [row.id, row.price_rsd]),
    );

    if (priceByProductId.size !== input.items.length) {
      throw new Error("Neki proizvodi nisu važeći za izabrani restoran.");
    }

    const subtotal = input.items.reduce((sum, item) => {
      const unitPrice = priceByProductId.get(item.productId) ?? 0;
      return sum + unitPrice * item.quantity;
    }, 0);

    const deliveryResult = await client.query<{ delivery_fee_rsd: number }>(
      "SELECT delivery_fee_rsd FROM restaurants WHERE id = $1 LIMIT 1",
      [input.restaurantId],
    );

    if (!deliveryResult.rowCount) {
      throw new Error("Restoran ne postoji.");
    }

    const deliveryFee = deliveryResult.rows[0].delivery_fee_rsd;
    const total = subtotal + deliveryFee;

    const orderResult = await client.query<{ id: number; status: string }>(
      `
        INSERT INTO orders (
          restaurant_id,
          customer_name,
          customer_email,
          customer_phone,
          event_address,
          event_date,
          event_time,
          note,
          subtotal_rsd,
          delivery_fee_rsd,
          total_rsd
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, status
      `,
      [
        input.restaurantId,
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.eventAddress,
        input.eventDate,
        input.eventTime,
        input.note ?? null,
        subtotal,
        deliveryFee,
        total,
      ],
    );

    for (const item of input.items) {
      await client.query(
        `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price_rsd)
          VALUES ($1, $2, $3, $4)
        `,
        [
          orderResult.rows[0].id,
          item.productId,
          item.quantity,
          priceByProductId.get(item.productId),
        ],
      );
    }

    await client.query("COMMIT");

    return {
      id: orderResult.rows[0].id,
      status: orderResult.rows[0].status,
      total: formatRsd(total),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
