import pg from "pg";

const { Pool } = pg;

let pool;

export function getPool(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }

  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
