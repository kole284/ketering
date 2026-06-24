import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
};

export function getDbPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL nije definisan. Dodaj ga u .env.local ili .env fajl.");
  }

  if (globalForDb.pool) {
    return globalForDb.pool;
  }

  const pool = new Pool({
    connectionString,
    max: 12,
    idleTimeoutMillis: 30_000,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.pool = pool;
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getDbPool().query<T>(text, params);
}
