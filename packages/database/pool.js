import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DAYMARK_DB_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DAYMARK_DB_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DAYMARK_DB_CONNECT_TIMEOUT_MS ?? 5_000),
    });
  }

  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
