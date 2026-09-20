import { getPool } from "@daymark/database/pool";

export async function handleHealth() {
  if (!process.env.DATABASE_URL) {
    return {
      status: 200,
      body: { ok: true, service: "daymark", database: "not_configured" },
    };
  }

  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return {
      status: 200,
      body: { ok: true, service: "daymark", database: "up" },
    };
  } catch (error) {
    console.error("Health check database probe failed:", error);
    return {
      status: 503,
      body: { ok: false, service: "daymark", database: "down" },
    };
  }
}
