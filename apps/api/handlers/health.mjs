import { getPool } from "@daymark/database/pool";
import { isProduction } from "../config.mjs";

async function probeDatabase() {
  if (!process.env.DATABASE_URL) {
    return { database: "not_configured", migrations: "not_configured" };
  }

  const pool = getPool();
  await pool.query("SELECT 1");

  const migrations = await pool.query(
    "SELECT COUNT(*)::INT AS count FROM schema_migrations",
  );

  return {
    database: "up",
    migrations: migrations.rows[0].count > 0 ? "ready" : "pending",
  };
}

export async function handleHealth() {
  try {
    const probe = await probeDatabase();
    const ok = probe.database !== "down";

    return {
      status: ok ? 200 : 503,
      body: {
        ok,
        service: "daymark",
        environment: isProduction() ? "production" : "development",
        ...probe,
      },
    };
  } catch (error) {
    console.error("Health check database probe failed:", error);
    return {
      status: 503,
      body: {
        ok: false,
        service: "daymark",
        environment: isProduction() ? "production" : "development",
        database: "down",
        migrations: "unknown",
      },
    };
  }
}

export async function handleReady() {
  try {
    const probe = await probeDatabase();
    const ready = probe.database === "up" && probe.migrations === "ready";

    return {
      status: ready ? 200 : 503,
      body: {
        ok: ready,
        service: "daymark",
        ...probe,
      },
    };
  } catch (error) {
    console.error("Readiness probe failed:", error);
    return {
      status: 503,
      body: {
        ok: false,
        service: "daymark",
        database: "down",
        migrations: "unknown",
      },
    };
  }
}
